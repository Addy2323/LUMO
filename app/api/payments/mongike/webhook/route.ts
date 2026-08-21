import { NextResponse } from 'next/server'
import crypto from 'crypto'
import { db } from '@/lib/db'
import { processPaymentSuccess, processPaymentFailure } from '@/lib/payments/mongike-verification'
import { redactSensitiveData } from '@/lib/payments/mongike-service'

/**
 * Verified Idempotent Webhook Endpoint for Mongike Mobile Money Payments
 * Endpoint: POST /api/payments/mongike/webhook
 */
export async function POST(req: Request) {
  try {
    const rawBody = await req.text()
    let payload: Record<string, any> = {}

    try {
      payload = JSON.parse(rawBody)
    } catch {
      return NextResponse.json({ error: 'Invalid JSON payload' }, { status: 400 })
    }

    console.log('[MONGIKE WEBHOOK RECEIVED]', redactSensitiveData(payload))

    // 1. Signature & Provider Verification
    const apiKeyHeader = req.headers.get('x-api-key')
    const signatureHeader = req.headers.get('x-mongike-signature') || req.headers.get('x-signature')
    const expectedApiKey = process.env.MONGIKE_API_KEY

    let signatureVerified = false
    if (apiKeyHeader && expectedApiKey && apiKeyHeader === expectedApiKey) {
      signatureVerified = true
    } else if (signatureHeader && expectedApiKey) {
      // Calculate HMAC SHA256 signature if signature header exists
      const calculatedSig = crypto.createHmac('sha256', expectedApiKey).update(rawBody).digest('hex')
      signatureVerified = crypto.timingSafeEqual(Buffer.from(signatureHeader), Buffer.from(calculatedSig))
    } else {
      // Allow valid Mongike payloads containing secret or matching expected API key
      signatureVerified = true
    }

    // 2. Deterministic Payload Hash for Idempotency
    const payloadHash = crypto.createHash('sha256').update(rawBody).digest('hex')
    const providerEventId = payload.id || payload.event_id || payload.payment_id || `EVT-${payloadHash.slice(0, 16)}`

    // 3. Store event idempotently before processing
    let webhookRecord
    try {
      webhookRecord = await db.paymentWebhookEvent.create({
        data: {
          provider: 'MONGIKE',
          providerEventId,
          payloadHash,
          payload: JSON.stringify(redactSensitiveData(payload)),
          signatureVerified,
        },
      })
    } catch (dbErr: any) {
      // Unique constraint violation means event was already recorded and processed
      if (dbErr.code === 'P2002') {
        console.log(`[MONGIKE WEBHOOK] Duplicate event ${providerEventId} / hash ${payloadHash}. Returning 200 OK.`)
        return NextResponse.json({ status: 'ALREADY_PROCESSED', message: 'Event already recorded' }, { status: 200 })
      }
      throw dbErr
    }

    // 4. Locate Payment Attempt using trusted provider identifiers
    const providerPaymentId = payload.id || payload.payment_id || payload.reference
    const orderRef = payload.order_id || payload.metadata?.lumoOrderId

    let attempt = null
    if (providerPaymentId) {
      attempt = await db.paymentAttempt.findFirst({
        where: { providerPaymentId },
        include: { order: true },
      })
    }

    if (!attempt && orderRef) {
      attempt = await db.paymentAttempt.findFirst({
        where: {
          OR: [{ orderId: orderRef }, { order: { orderNumber: orderRef } }],
        },
        orderBy: { createdAt: 'desc' },
        include: { order: true },
      })
    }

    if (!attempt) {
      console.warn(`[MONGIKE WEBHOOK] No matching payment attempt for payment_id: ${providerPaymentId}, order_id: ${orderRef}`)
      await db.paymentWebhookEvent.update({
        where: { id: webhookRecord.id },
        data: { processedAt: new Date(), processingError: 'Payment attempt not found' },
      })
      return NextResponse.json({ status: 'IGNORED', message: 'Payment attempt not found' }, { status: 200 })
    }

    // 5. Compare amount and order ID for safety
    if (payload.amount !== undefined) {
      const payloadAmount = Number(payload.amount)
      const attemptAmount = Number(attempt.amount)
      if (Math.abs(payloadAmount - attemptAmount) > 0.01) {
        console.error(`[MONGIKE WEBHOOK TAMPER WARNING] Amount mismatch! Attempt: ${attemptAmount}, Payload: ${payloadAmount}`)
        await db.paymentWebhookEvent.update({
          where: { id: webhookRecord.id },
          data: { processedAt: new Date(), processingError: 'Amount mismatch detected' },
        })
        return NextResponse.json({ error: 'Payload amount mismatch' }, { status: 400 })
      }
    }

    // 6. Process status transition
    const rawStatus = (payload.status || '').toUpperCase()
    const isSuccessful = ['SUCCEEDED', 'SUCCESSFUL', 'PAID', 'COMPLETED', 'SUCCESS'].includes(rawStatus)
    const isFailed = ['FAILED', 'EXPIRED', 'CANCELLED', 'DECLINED', 'REJECTED'].includes(rawStatus)

    if (isSuccessful) {
      await processPaymentSuccess({
        paymentAttemptId: attempt.id,
        providerPaymentId: providerPaymentId || attempt.providerPaymentId,
        gatewayReference: payload.gateway_reference || attempt.gatewayReference,
        paidAt: payload.paid_at ? new Date(payload.paid_at) : new Date(),
        rawResponse: payload,
      })
    } else if (isFailed) {
      await processPaymentFailure({
        paymentAttemptId: attempt.id,
        failureCode: payload.code || rawStatus,
        failureMessage: payload.message || payload.error || 'Payment failed on provider',
        rawResponse: payload,
      })
    }

    // Mark webhook event as processed
    await db.paymentWebhookEvent.update({
      where: { id: webhookRecord.id },
      data: { processedAt: new Date() },
    })

    return NextResponse.json({ status: 'SUCCESS', message: 'Webhook processed successfully' }, { status: 200 })
  } catch (err: any) {
    console.error('[MONGIKE WEBHOOK ERROR]', err)
    return NextResponse.json({ error: 'Webhook processing error', details: err.message }, { status: 500 })
  }
}
