import { NextRequest, NextResponse } from 'next/server'
import { authorizeApiRequest } from '@/lib/auth/authorize'
import { prisma } from '@/lib/db'
import { createConversation } from '@/lib/conversations/conversation-service'

/**
 * GET /api/conversations — returns conversations accessible to the current active role/user
 */
export async function GET(req: NextRequest) {
  const auth = await authorizeApiRequest(req)
  if (!auth.authorized) return auth.response!

  const { user, activeRole } = auth
  const { searchParams } = req.nextUrl
  const orderId = searchParams.get('orderId')
  const sourcingRequestId = searchParams.get('sourcingRequestId')

  const where: any = {}

  if (orderId) where.orderId = orderId
  if (sourcingRequestId) where.sourcingRequestId = sourcingRequestId

  // Filter visibility based on role
  if (activeRole === 'BUYER' || activeRole === 'CUSTOMER') {
    where.visibility = { in: ['CUSTOMER_VISIBLE', 'ASSIGNED_PARTICIPANTS'] }
    where.participants = {
      some: { userId: user.id },
    }
  } else if (activeRole === 'SUPPLIER') {
    where.visibility = { in: ['CUSTOMER_VISIBLE', 'ASSIGNED_PARTICIPANTS'] }
    where.participants = {
      some: { userId: user.id },
    }
  } else {
    // Internal roles (SALES, AGENT, LOGISTICS, ADMIN) can see LUMO_INTERNAL + CUSTOMER_VISIBLE + ASSIGNED_PARTICIPANTS
    where.visibility = { in: ['CUSTOMER_VISIBLE', 'LUMO_INTERNAL', 'ASSIGNED_PARTICIPANTS'] }
  }

  const conversations = await prisma.conversation.findMany({
    where,
    orderBy: { updatedAt: 'desc' },
    include: {
      participants: {
        include: {
          user: {
            select: { id: true, name: true, role: true, email: true },
          },
        },
      },
      messages: {
        orderBy: { createdAt: 'desc' },
        take: 1,
      },
    },
  })

  return NextResponse.json({ conversations })
}

/**
 * POST /api/conversations — create a conversation
 */
export async function POST(req: NextRequest) {
  const auth = await authorizeApiRequest(req)
  if (!auth.authorized) return auth.response!

  const { user, activeRole } = auth

  let body: any
  try {
    body = await req.json()
  } catch {
    return NextResponse.json({ error: 'Invalid request body' }, { status: 400 })
  }

  const { orderId, sourcingRequestId, disputeId, visibility, title, participantUserIds } = body

  const participants = Array.isArray(participantUserIds) ? participantUserIds : []
  if (!participants.includes(user.id)) {
    participants.push(user.id)
  }

  // Fetch roles for all participants
  const users = await prisma.user.findMany({
    where: { id: { in: participants } },
    select: { id: true, role: true },
  })

  const initialParticipants = users.map((u) => ({
    userId: u.id,
    role: u.id === user.id ? activeRole! : u.role,
  }))

  try {
    const conversation = await createConversation({
      orderId,
      sourcingRequestId,
      disputeId,
      visibility,
      title,
      initialParticipants,
    })

    return NextResponse.json({ conversation }, { status: 201 })
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 400 })
  }
}
