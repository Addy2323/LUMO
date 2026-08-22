import { NextResponse, NextRequest } from 'next/server'
import { db } from '@/lib/db'
import { getAuthenticatedUser } from '@/lib/auth/server'

export async function GET(req: NextRequest) {
  try {
    const auth = await getAuthenticatedUser(req).catch(() => null)
    const user = auth?.user || null

    const { searchParams } = new URL(req.url)
    const attemptId = searchParams.get('attemptId')
    const orderId = searchParams.get('orderId')

    if (!attemptId && !orderId) {
      return NextResponse.json({ error: 'Missing attemptId or orderId query parameter' }, { status: 400 })
    }

    let attempt: any = null

    try {
      if ((db as any).paymentAttempt) {
        if (attemptId && !attemptId.startsWith('att_')) {
          attempt = await (db as any).paymentAttempt.findUnique({
            where: { id: attemptId },
            include: { order: true },
          })
        } else if (orderId) {
          attempt = await (db as any).paymentAttempt.findFirst({
            where: { orderId },
            orderBy: { createdAt: 'desc' },
            include: { order: true },
          })
        }
      }
    } catch (dbErr) {
      console.warn('[STATUS DB WARN]', dbErr)
    }

    // Fallback directly to Order table if attempt record not found
    if (!attempt && (orderId || attemptId)) {
      const targetOrderId = orderId || ''
      const order = await db.order.findFirst({
        where: {
          OR: [
            { id: targetOrderId },
            { orderNumber: targetOrderId },
          ],
        },
      })

      if (order) {
        const isPaid = order.status === 'PAID'
        return NextResponse.json({
          paymentAttemptId: attemptId || `att_${order.id}`,
          orderId: order.id,
          orderNumber: order.orderNumber,
          status: isPaid ? 'SUCCEEDED' : 'PENDING',
          orderStatus: order.status,
          expiresAt: new Date(Date.now() + 15 * 60 * 1000),
        })
      }
    }

    if (!attempt) {
      return NextResponse.json({
        paymentAttemptId: attemptId,
        status: 'PENDING',
        message: 'Payment verification in progress',
      })
    }

    // Authorization check if user is logged in
    if (user && attempt.order?.buyerId && attempt.order.buyerId !== user.id && user.role !== 'ADMIN') {
      const isGuest = attempt.order.buyer?.email?.startsWith('guest_')
      if (!isGuest) {
        return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
      }
    }

    // Check if attempt has expired while in PENDING status
    let currentStatus = attempt.status
    if (currentStatus === 'PENDING' && attempt.expiresAt && attempt.expiresAt < new Date()) {
      currentStatus = 'EXPIRED'
      try {
        if ((db as any).paymentAttempt) {
          await (db as any).paymentAttempt.update({
            where: { id: attempt.id },
            data: { status: 'EXPIRED', failureMessage: 'Payment request expired. Please try again.' },
          })
        }
      } catch {}
    }

    return NextResponse.json({
      paymentAttemptId: attempt.id,
      orderId: attempt.orderId,
      orderNumber: attempt.order?.orderNumber || '',
      status: currentStatus,
      orderStatus: attempt.order?.status || 'PENDING_PAYMENT',
      expiresAt: attempt.expiresAt,
      paidAt: attempt.paidAt,
      failureCode: attempt.failureCode,
      failureMessage: attempt.failureMessage,
    })
  } catch (err: any) {
    console.error('[API MONGIKE STATUS ERROR]', err)
    return NextResponse.json({ error: 'Failed to retrieve payment status', details: err.message }, { status: 500 })
  }
}
