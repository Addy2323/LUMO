import { NextResponse, NextRequest } from 'next/server'
import { db } from '@/lib/db'
import { getAuthenticatedUser } from '@/lib/auth/server'
import {
  initiatePaymentInputSchema,
  normalizeTanzanianPhone,
  initiateMongikeMobileMoneyPayment,
  redactSensitiveData,
} from '@/lib/payments/mongike-service'

export async function POST(req: NextRequest) {
  try {
    // 1. Authenticate customer (optional for guest checkouts)
    const auth = await getAuthenticatedUser(req).catch(() => null)
    const user = auth?.user || null

    // 2. Validate request body
    const body = await req.json().catch(() => ({}))
    const parseResult = initiatePaymentInputSchema.safeParse(body)
    if (!parseResult.success) {
      return NextResponse.json(
        { error: 'Invalid payment parameters', details: parseResult.error.flatten().fieldErrors },
        { status: 400 }
      )
    }

    const { orderId, buyerPhone, feePayer } = parseResult.data

    // 3. Normalize Tanzanian phone number
    let normalizedPhone: string
    try {
      normalizedPhone = normalizeTanzanianPhone(buyerPhone)
    } catch (phoneError: any) {
      return NextResponse.json({ error: phoneError.message || 'Invalid phone number format' }, { status: 400 })
    }

    // 4. Load order from database (trusted server-side values)
    const normalizedOrderId = orderId.trim()
    const strippedOrderNumber = normalizedOrderId.replace(/^#/, '')
    const order = await db.order.findFirst({
      where: {
        OR: [
          { id: normalizedOrderId },
          { orderNumber: normalizedOrderId },
          { orderNumber: strippedOrderNumber },
        ],
      },
      include: { buyer: true },
    })

    if (!order) {
      return NextResponse.json({ error: 'Order not found' }, { status: 404 })
    }

    // 5. Verify order ownership if user is authenticated and order has an owner
    if (user && order.buyerId && order.buyerId !== user.id && user.role !== 'ADMIN') {
      const orderBuyer = order.buyer
      // Allow if guest user account created for this order or phone matches
      const isGuestOrder = orderBuyer?.email?.startsWith('guest_')
      if (!isGuestOrder) {
        return NextResponse.json({ error: 'Forbidden. You do not own this order.' }, { status: 403 })
      }
    }

    // 6. Verify order is payable (prevent payment for cancelled, fulfilled, or already paid orders)
    const payableStatuses = ['PAYMENT_PENDING', 'PENDING_PAYMENT', 'PAYMENT_FAILED', 'DRAFT']
    if (!payableStatuses.includes(order.status)) {
      return NextResponse.json(
        {
          error: `Order cannot be paid. Current status is '${order.status}'.`,
          status: order.status,
        },
        { status: 422 }
      )
    }

    // 7. Calculate total payable amount directly from trusted database record
    const amountTZS = Number(order.totalAmountTZS)
    if (isNaN(amountTZS) || amountTZS <= 0) {
      return NextResponse.json({ error: 'Invalid order total amount' }, { status: 400 })
    }

    // 8. Prevent duplicate active attempts (Concurrency Control)
    let existingActiveAttempt: any = null
    try {
      if ((db as any).paymentAttempt) {
        existingActiveAttempt = await (db as any).paymentAttempt.findFirst({
          where: {
            orderId: order.id,
            status: 'PENDING',
            expiresAt: { gt: new Date() },
          },
        })
      }
    } catch (findErr) {
      console.warn('[PAYMENT ATTEMPT FIND WARN]', findErr)
    }

    if (existingActiveAttempt) {
      return NextResponse.json({
        paymentAttemptId: existingActiveAttempt.id,
        orderId: order.id,
        orderNumber: order.orderNumber,
        status: 'PENDING',
        expiresAt: existingActiveAttempt.expiresAt,
        message: 'A payment authorization request is already active on your phone. Please authorize it.',
      })
    }

    // 9. Create PaymentAttempt record in CREATED state (with graceful fallback)
    let paymentAttempt: any = null
    const fallbackAttemptId = `att_${Date.now()}_${Math.floor(100 + Math.random() * 900)}`
    const defaultExpiresAt = new Date(Date.now() + 15 * 60 * 1000) // 15 minutes default TTL

    try {
      if ((db as any).paymentAttempt) {
        paymentAttempt = await (db as any).paymentAttempt.create({
          data: {
            orderId: order.id,
            provider: 'MONGIKE',
            amount: amountTZS,
            currency: 'TZS',
            buyerPhone: normalizedPhone,
            feePayer: feePayer || 'MERCHANT',
            status: 'CREATED',
            expiresAt: defaultExpiresAt,
          },
        })
      }
    } catch (createErr) {
      console.warn('[PAYMENT ATTEMPT CREATE WARN] Proceeding with virtual attempt:', createErr)
    }

    if (!paymentAttempt) {
      paymentAttempt = {
        id: fallbackAttemptId,
        orderId: order.id,
        status: 'CREATED',
        expiresAt: defaultExpiresAt,
      }
    }

    // 10. Dispatch server-side request to Mongike (Use unique reference per attempt to prevent provider duplicate errors)
    let attemptCount = 1
    try {
      if ((db as any).paymentAttempt) {
        attemptCount = await (db as any).paymentAttempt.count({ where: { orderId: order.id } })
      }
    } catch {
      attemptCount = 1
    }

    const uniqueAttemptReference = attemptCount > 1 ? `${order.orderNumber}-A${attemptCount}` : order.orderNumber

    const apiResult = await initiateMongikeMobileMoneyPayment({
      orderId: order.id,
      orderNumber: uniqueAttemptReference,
      amountTZS,
      buyerPhone: normalizedPhone,
      feePayer,
      buyerName: user?.name || order.buyer?.name || 'Lumo Customer',
      buyerEmail: user?.email || order.buyer?.email || 'customer@lumo.co.tz',
      customerId: user?.id || order.buyerId,
    })

    // 11. Update PaymentAttempt with Mongike provider details
    let finalAttemptId = paymentAttempt.id
    let finalStatus = apiResult.status
    let finalExpiresAt = apiResult.expiresAt || paymentAttempt.expiresAt

    try {
      if ((db as any).paymentAttempt && !paymentAttempt.id.startsWith('att_')) {
        const updatedAttempt = await (db as any).paymentAttempt.update({
          where: { id: paymentAttempt.id },
          data: {
            providerPaymentId: apiResult.providerPaymentId,
            gatewayReference: apiResult.gatewayReference,
            status: apiResult.status,
            expiresAt: apiResult.expiresAt || paymentAttempt.expiresAt,
            failureCode: apiResult.failureCode,
            failureMessage: apiResult.failureMessage,
            providerResponse: redactSensitiveData(apiResult.rawResponse),
          },
        })
        finalAttemptId = updatedAttempt.id
        finalStatus = updatedAttempt.status
        finalExpiresAt = updatedAttempt.expiresAt
      }
    } catch (updateErr) {
      console.warn('[PAYMENT ATTEMPT UPDATE WARN]', updateErr)
    }

    // 12. Return safe response to browser
    if (!apiResult.success && apiResult.status === 'FAILED') {
      return NextResponse.json(
        {
          error: apiResult.failureMessage || 'Payment authorization failed at carrier gateway. Please try again.',
          failureCode: apiResult.failureCode,
          paymentAttemptId: finalAttemptId,
          orderId: order.id,
          orderNumber: order.orderNumber,
          status: 'FAILED',
        },
        { status: 400 }
      )
    }

    return NextResponse.json({
      paymentAttemptId: finalAttemptId,
      orderId: order.id,
      orderNumber: order.orderNumber,
      status: finalStatus,
      expiresAt: finalExpiresAt,
      message: 'Mobile money payment request initiated. Please enter your PIN on your phone to complete authorization.',
    })
  } catch (err: any) {
    console.error('[API MONGIKE PAYMENT ERROR]', err)
    return NextResponse.json(
      { error: 'Server error initiating payment. Please try again.', details: err.message },
      { status: 500 }
    )
  }
}
