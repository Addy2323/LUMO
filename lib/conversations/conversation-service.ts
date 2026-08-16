import { prisma } from '@/lib/db'
import { ConversationVisibility, Role } from '@prisma/client'

// ──────────────────────────────────────────────
// Conversation Service — Participant & Role Visibility Enforcement
// ──────────────────────────────────────────────

/**
 * Check whether a user can access a conversation.
 * Requires BOTH valid role AND active assignment / conversation membership.
 */
export async function canAccessConversation(
  conversationId: string,
  userId: string,
  userRole: Role
): Promise<boolean> {
  const conversation = await prisma.conversation.findUnique({
    where: { id: conversationId },
    select: {
      id: true,
      orderId: true,
      sourcingRequestId: true,
      visibility: true,
      participants: {
        where: { userId },
      },
    },
  })

  if (!conversation) return false

  // 1. Admin Security: Strict ADMIN role only
  if (conversation.visibility === ('ADMIN_SECURITY' as any)) {
    return userRole === 'ADMIN'
  }

  // 2. Direct Participant Check: If explicit conversation participant, grant access
  if (conversation.participants.length > 0) {
    return true
  }

  // 3. Admin & Internal Sourcing Team access
  if (userRole === 'ADMIN') return true

  if (conversation.sourcingRequestId && ['SALES', 'AGENT'].includes(userRole)) {
    return true
  }

  // 4. Tightened Visibility Rules based on Order/Assignment ownership
  if (conversation.orderId) {
    // Check if user is the buyer on the order
    const order = await prisma.order.findUnique({
      where: { id: conversation.orderId },
      select: { buyerId: true },
    })

    if (order?.buyerId === userId) {
      // Buyer can only access CUSTOMER_VISIBLE conversations
      return conversation.visibility === 'CUSTOMER_VISIBLE'
    }

    // Check if user is an active assignee on the order
    const assignment = await prisma.orderAssignment.findFirst({
      where: {
        orderId: conversation.orderId,
        assigneeId: userId,
        status: { in: ['OFFERED', 'ACCEPTED', 'IN_PROGRESS', 'COMPLETED'] },
      },
    })

    if (assignment) {
      // LOGISTICS role must be assigned to the order to view assigned/internal conversations
      if (userRole === 'LOGISTICS') {
        return conversation.visibility === 'CUSTOMER_VISIBLE' || conversation.visibility === ('ASSIGNED_PARTICIPANTS' as any)
      }
      // Internal roles (SALES, AGENT) assigned to the order can access LUMO_INTERNAL
      if (['SALES', 'AGENT'].includes(userRole)) {
        return conversation.visibility !== ('ADMIN_SECURITY' as any)
      }
    }
  }

  // 5. Default fallback: Reject if not explicit participant or assigned staff
  return false
}

/**
 * Create a conversation for an order, sourcing request, or support ticket.
 */
export async function createConversation(input: {
  orderId?: string
  sourcingRequestId?: string
  supportTicketId?: string
  disputeId?: string
  visibility?: ConversationVisibility
  title?: string
  initialParticipants: { userId: string; role: Role }[]
}) {
  return prisma.conversation.create({
    data: {
      orderId: input.orderId,
      sourcingRequestId: input.sourcingRequestId,
      supportTicketId: input.supportTicketId,
      disputeId: input.disputeId,
      visibility: input.visibility || 'CUSTOMER_VISIBLE',
      title: input.title,
      participants: {
        create: input.initialParticipants.map((p) => ({
          userId: p.userId,
          role: p.role,
        })),
      },
    },
    include: { participants: true },
  })
}

/**
 * Post a message to a conversation.
 * Validates participant access and internal-note gating.
 */
export async function postMessage(input: {
  conversationId: string
  senderId: string
  senderRole: Role
  content: string
  isInternal?: boolean
}) {
  // Check access first
  const hasAccess = await canAccessConversation(input.conversationId, input.senderId, input.senderRole)
  if (!hasAccess) {
    throw new Error('Forbidden: You do not have access to this conversation')
  }

  // Internal notes can only be posted by internal roles
  if (input.isInternal) {
    const internalRoles: Role[] = ['SALES', 'AGENT', 'ADMIN']
    if (!internalRoles.includes(input.senderRole)) {
      throw new Error('Only internal sales/agent/admin roles can post internal notes')
    }
  }

  const message = await prisma.message.create({
    data: {
      conversationId: input.conversationId,
      senderId: input.senderId,
      senderRole: input.senderRole,
      content: input.content,
      isInternal: input.isInternal || false,
    },
  })

  // Touch conversation updatedAt
  await prisma.conversation.update({
    where: { id: input.conversationId },
    data: { updatedAt: new Date() },
  }).catch(() => {})

  return message
}

/**
 * Get messages for a conversation with visibility filtering.
 * Buyers cannot see internal notes.
 */
export async function getMessages(
  conversationId: string,
  userId: string,
  userRole: Role,
  page: number = 1,
  limit: number = 50
) {
  const hasAccess = await canAccessConversation(conversationId, userId, userRole)
  if (!hasAccess) {
    throw new Error('Forbidden: You do not have access to this conversation')
  }

  const skip = (page - 1) * limit
  const where: any = { conversationId }

  // Buyers, Suppliers, and Logistics cannot see internal notes unless internal team
  if (['BUYER', 'CUSTOMER', 'SUPPLIER', 'LOGISTICS'].includes(userRole)) {
    where.isInternal = false
  }

  const [messages, total] = await Promise.all([
    prisma.message.findMany({
      where,
      orderBy: { createdAt: 'asc' },
      skip,
      take: limit,
      include: {
        sender: {
          select: { id: true, name: true, role: true },
        },
        attachments: true,
      },
    }),
    prisma.message.count({ where }),
  ])

  // Mark as read for this participant
  await prisma.conversationParticipant.updateMany({
    where: { conversationId, userId },
    data: { lastReadAt: new Date() },
  }).catch(() => {})

  return { messages, pagination: { page, limit, total, pages: Math.ceil(total / limit) } }
}
