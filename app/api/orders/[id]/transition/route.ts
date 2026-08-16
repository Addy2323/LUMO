import { NextRequest, NextResponse } from 'next/server'
import { authorizeApiRequest } from '@/lib/auth/authorize'
import { transitionOrder } from '@/lib/orders/state-machine'
import { OrderStatus } from '@prisma/client'

/**
 * POST /api/orders/[id]/transition
 * Server-validated order state transition with role authorization.
 */
export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const auth = await authorizeApiRequest(req)
  if (!auth.authorized) return auth.response!

  const { id: orderId } = await params
  const { user, activeRole } = auth

  let body: { targetStatus?: string; reason?: string }
  try {
    body = await req.json()
  } catch {
    return NextResponse.json({ error: 'Invalid request body' }, { status: 400 })
  }

  if (!body.targetStatus) {
    return NextResponse.json({ error: 'targetStatus is required' }, { status: 400 })
  }

  const targetStatus = body.targetStatus.toUpperCase() as OrderStatus
  if (!Object.values(OrderStatus).includes(targetStatus)) {
    return NextResponse.json({ error: `Invalid status: ${body.targetStatus}` }, { status: 400 })
  }

  try {
    const result = await transitionOrder(orderId, targetStatus, user.id, activeRole!, body.reason)
    if (!result.success) {
      return NextResponse.json({ error: result.error }, { status: 409 })
    }
    return NextResponse.json(result)
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 })
  }
}
