import { NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { getSessionUser } from '@/lib/auth'
import {
  initiatePaymentInputSchema,
  normalizeTanzanianPhone,
  initiateMongikeMobileMoneyPayment,
  redactSensitiveData,
} from '@/lib/payments/mongike-service'

export async function POST(req: Request) {
  try {
    // 1. Authenticate customer
    const user = await getSessionUser(req)
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized. Please sign in to complete payment.' }, { status: 401 })
    }

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
    const order = await db.order.findUnique({
      where: { id: orderId },
      include: { buyer: true },
    })

    if (!order) {
      return NextResponse.json({ error: 'Order not found' }, { status: 404 })
    }

    // 5. Verify order ownership
    if (order.buyerId !== user.id && user.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Forbidden. You do not own this order.' }, { status: 403 })
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
    const existingActiveAttempt = await (db as any).paymentAttempt.findFirst({
      where: {
        orderId: order.id,
        status: 'PENDING',
        expiresAt: { gt: new Date() },
      },
    })

    if (existingActiveAttempt) {
      return NextResponse.json({
        paymentAttemptId: existingActiveAttempt.id,
        orderId: order.id,
        status: 'PENDING',
        expiresAt: existingActiveAttempt.expiresAt,
        message: 'A payment authorization request is already active on your phone. Please authorize it.',
      })
    }

    // 9. Create PaymentAttempt record in CREATED state
    const paymentAttempt = await (db as any).paymentAttempt.create({
      data: {
        orderId: order.id,
        provider: 'MONGIKE',
        amount: amountTZS,
        currency: 'TZS',
        buyerPhone: normalizedPhone,
        feePayer: feePayer || 'MERCHANT',
        status: 'CREATED',
        expiresAt: new Date(Date.now() + 15 * 60 * 1000), // 15 minutes default TTL
      },
    })

    // 10. Dispatch server-side request to Mongike (Use unique reference per attempt to prevent provider duplicate errors)
    const attemptCount = await (db as any).paymentAttempt.count({ where: { orderId: order.id } })
    const uniqueAttemptReference = attemptCount > 1 ? `${order.orderNumber}-A${attemptCount}` : order.orderNumber

    const apiResult = await initiateMongikeMobileMoneyPayment({
      orderId: order.id,
      orderNumber: uniqueAttemptReference,
      amountTZS,
      buyerPhone: normalizedPhone,
      feePayer,
      buyerName: user.name || order.buyer.name,
      buyerEmail: user.email || order.buyer.email,
      customerId: user.id,
    })

    // 11. Update PaymentAttempt with Mongike provider details
    const updatedAttempt = await (db as any).paymentAttempt.update({
      where: { id: paymentAttempt.id },
      data: {
        providerPaymentId: apiResult.providerPaymentId,
        gatewayReference: apiResult.gatewayReference,
        status: apiResult.status,
        expiresAt: apiResult.expiresAt || paymentAttempt.expiresAt,
        failureCode: apiResult.failureCode,
        failureMessage: apiResult.failureMessage,
        providerResponse: JSON.stringify(redactSensitiveData(apiResult.rawResponse)),
      },
    })

    // 12. Return safe response to browser
    return NextResponse.json({
      paymentAttemptId: updatedAttempt.id,
      orderId: order.id,
      status: updatedAttempt.status,
      expiresAt: updatedAttempt.expiresAt,
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
