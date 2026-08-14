import { NextRequest, NextResponse } from 'next/server'
import { OrderStatus, PaymentStatus } from '@prisma/client'
import { prisma } from '@/lib/db'
import { azamPayClient } from '@/lib/payments/azampay'
import { escrowLedger } from '@/lib/payments/escrow-ledger'
import { checkRateLimit } from '@/lib/security/rate-limiter'

export async function POST(req: NextRequest) {
  // 1. Rate limiting check (protect webhook endpoint against flooding)
  const rateLimit = checkRateLimit(req, { limit: 60, windowMs: 60000, prefix: 'azampay_webhook' })
  if (!rateLimit.success && rateLimit.response) {
    return rateLimit.response
  }

  try {
    const rawBody = await req.text()

    // 2. Verify webhook signature or bearer authorization
    const isValidAuth = azamPayClient.verifyWebhookAuth(req.headers, rawBody)
    if (!isValidAuth) {
      const clientIp = req.headers.get('x-forwarded-for') || req.headers.get('x-real-ip') || 'unknown'
      console.warn(`[SECURITY AUDIT 401] Invalid AzamPay webhook signature/auth token from IP ${clientIp}`)
      return NextResponse.json({ error: 'Unauthorized webhook signature' }, { status: 401 })
    }

    const payload = JSON.parse(rawBody)
    const { reference, utilityref, status, transactionId, amount } = payload
    const orderNumber = utilityref || reference

    if (!orderNumber) {
      return NextResponse.json({ error: 'Missing order reference' }, { status: 400 })
    }

    const order = await prisma.order.findFirst({
      where: {
        OR: [{ orderNumber }, { id: orderNumber }],
      },
    })

    if (!order) {
      console.error(`[AZAMPAY WEBHOOK] Order ${orderNumber} not found`)
      return NextResponse.json({ error: 'Order not found' }, { status: 404 })
    }

    // 3. Amount verification check (prevent fraud via tampered payment amounts)
    if (amount !== undefined && amount !== null) {
      const receivedAmount = parseFloat(String(amount))
      const expectedAmount = Number(order.totalAmountTZS)
      if (!isNaN(receivedAmount) && Math.abs(receivedAmount - expectedAmount) > 0.01) {
        console.error(
          `[AZAMPAY WEBHOOK FRAUD ALERT] Amount mismatch for Order ${order.orderNumber}. Expected: TZS ${expectedAmount}, Received: TZS ${receivedAmount}`
        )
        return NextResponse.json({ error: 'Payment amount mismatch' }, { status: 400 })
      }
    }

    // 4. Idempotency check: If order is already in a terminal/paid state, acknowledge webhook safely
    if (
      order.status === OrderStatus.PAID ||
      order.status === OrderStatus.PROCESSING ||
      order.status === OrderStatus.SHIPPED ||
      order.status === OrderStatus.COMPLETED
    ) {
      return NextResponse.json({ success: true, message: 'Already processed' })
    }

    const isSuccess = status === 'success' || status === 'SUCCESS' || status === '00'

    if (isSuccess) {
      // Execute atomic transaction for payment status transition & escrow locking
      await prisma.$transaction(async (tx) => {
        await tx.order.update({
          where: { id: order.id },
          data: { status: OrderStatus.PAID },
        })

        await tx.paymentRecord.updateMany({
          where: { orderId: order.id },
          data: {
            status: PaymentStatus.SUCCESSFUL,
            transactionRef: transactionId || reference,
          },
        })

        // Enqueue Customer Payment Confirmation SMS in Transactional Outbox
        const customerPhone = (order as any).phone || (order as any).shippingAddressPhone || (order as any).customerPhone || '0712345678'
        await (tx as any).notificationOutbox.create({
          data: {
            eventType: 'ORDER_PAID',
            aggregateId: order.id,
            recipientId: (order as any).buyerId || customerPhone,
            recipientPhone: customerPhone,
            channel: 'SMS',
            templateKey: 'ORDER_PAID_CUSTOMER',
            templateVersion: 1,
            payloadJson: JSON.stringify({
              firstName: (order as any).customerName || 'Customer',
              orderReference: order.orderNumber,
              trackingUrl: `${process.env.NEXT_PUBLIC_APP_URL || 'https://lumo.co.tz'}/orders/${order.orderNumber}`,
            }),
            status: 'PENDING',
          },
        }).catch((err: any) => console.log('[OUTBOX DUP] ORDER_PAID customer notification already enqueued:', err.message))

        // Enqueue Internal Sales/Duty Group Order Alert
        const dutyGroupPhone = process.env.INTERNAL_SALES_DUTY_PHONE || '255768828247'
        await (tx as any).notificationOutbox.create({
          data: {
            eventType: 'ORDER_PAID_INTERNAL',
            aggregateId: order.id,
            recipientId: 'sales_duty_group',
            recipientPhone: dutyGroupPhone,
            channel: 'SMS',
            templateKey: 'ORDER_PAID_INTERNAL',
            templateVersion: 1,
            payloadJson: JSON.stringify({
              orderReference: order.orderNumber,
              customerDisplayName: (order as any).customerName || 'Buyer',
              internalOrderUrl: `${process.env.NEXT_PUBLIC_APP_URL || 'https://lumo.co.tz'}/admin/orders/${order.id}`,
            }),
            status: 'PENDING',
          },
        }).catch((err: any) => console.log('[OUTBOX DUP] ORDER_PAID_INTERNAL notification already enqueued:', err.message))
      })

      // Lock funds in Escrow Ledger
      await escrowLedger.lockInEscrow(order.id, transactionId || reference, order.totalAmountTZS)

      console.log(`✅ [AZAMPAY WEBHOOK SUCCESS] Order ${order.orderNumber} set to PAID & locked in Escrow.`)
    } else {
      await prisma.paymentRecord.updateMany({
        where: { orderId: order.id },
        data: { status: PaymentStatus.FAILED },
      })
    }

    return NextResponse.json({ success: true })
  } catch (error: any) {
    console.error('[AZAMPAY WEBHOOK ERROR]', error)
    return NextResponse.json({ error: 'Webhook processing failed' }, { status: 500 })
  }
}
