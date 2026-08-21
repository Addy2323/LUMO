import { NextResponse, NextRequest } from 'next/server'
import { db } from '@/lib/db'
import { getAuthenticatedUser } from '@/lib/auth/server'

export async function GET(req: NextRequest) {
  try {
    const auth = await getAuthenticatedUser(req)
    if (!auth || !auth.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }
    const user = auth.user

    const { searchParams } = new URL(req.url)
    const attemptId = searchParams.get('attemptId')
    const orderId = searchParams.get('orderId')

    if (!attemptId && !orderId) {
      return NextResponse.json({ error: 'Missing attemptId or orderId query parameter' }, { status: 400 })
    }

    let attempt = null

    if (attemptId) {
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

    if (!attempt) {
      return NextResponse.json({ error: 'Payment attempt not found' }, { status: 404 })
    }

    // Authorization check: buyer owns the order or admin
    if (attempt.order.buyerId !== user.id && user.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    // Check if attempt has expired while in PENDING status
    let currentStatus = attempt.status
    if (currentStatus === 'PENDING' && attempt.expiresAt && attempt.expiresAt < new Date()) {
      currentStatus = 'EXPIRED'
      await (db as any).paymentAttempt.update({
        where: { id: attempt.id },
        data: { status: 'EXPIRED', failureMessage: 'Payment request expired. Please try again.' },
      })
    }

    return NextResponse.json({
      paymentAttemptId: attempt.id,
      orderId: attempt.orderId,
      orderNumber: attempt.order.orderNumber,
      status: currentStatus,
      orderStatus: attempt.order.status,
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
