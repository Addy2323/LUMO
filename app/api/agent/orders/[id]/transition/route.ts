import { NextRequest, NextResponse } from 'next/server'
import { authorizeApiRequest } from '@/lib/auth/authorize'
import { transitionOrderStatus, AgentOrderStatus } from '@/lib/services/workflow-service'

export async function POST(req: NextRequest, context: { params: Promise<{ id: string }> }) {
  const auth = await authorizeApiRequest(req)
  if (!auth.authorized) return auth.response!

  const { user } = auth
  const orderId = (await context.params).id
  const body = await req.json()
  const { currentStatus, nextStatus, reason, notes } = body

  if (!nextStatus) {
    return NextResponse.json({ error: 'Missing required nextStatus parameter' }, { status: 400 })
  }

  try {
    const result = await transitionOrderStatus({
      orderId,
      currentStatus: currentStatus || 'New',
      nextStatus: nextStatus as AgentOrderStatus,
      actorId: user.id,
      actorName: user.name,
      reason,
      notes,
    })

    return NextResponse.json(result)
  } catch (error: any) {
    return NextResponse.json({ error: error.message || 'Failed to transition order status' }, { status: 400 })
  }
}
