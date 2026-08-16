import { prisma } from '@/lib/db'
import { AssignmentStatus, AssignmentRole, Role } from '@prisma/client'

// ──────────────────────────────────────────────
// Assignment Service — server-authoritative
// ──────────────────────────────────────────────

export type OfferAssignmentInput = {
  orderId: string
  sourcingRequestId?: string
  assignmentRole: AssignmentRole
  assigneeId?: string
  assigneeOrganizationId?: string
  assignedById: string
  priority?: string
  reason?: string
  instructions?: string
  expiresInMinutes?: number
  slaDueInHours?: number
  idempotencyKey?: string
}

export type AssignmentActionResult = {
  success: boolean
  assignmentId: string
  status: AssignmentStatus
  error?: string
  idempotentDuplicate?: boolean
}

/**
 * Offer an assignment to a user or organization.
 * Creates assignment + AssignmentEvent + AuditLog + NotificationOutbox in a SINGLE transaction.
 */
export async function offerAssignment(input: OfferAssignmentInput): Promise<AssignmentActionResult> {
  if (!input.assigneeId && !input.assigneeOrganizationId) {
    return { success: false, assignmentId: '', status: 'UNASSIGNED', error: 'Either assigneeId or assigneeOrganizationId required' }
  }

  // Idempotency check
  if (input.idempotencyKey) {
    const existingOutbox = await prisma.notificationOutbox.findUnique({
      where: { idempotencyKey: input.idempotencyKey },
    })
    if (existingOutbox) {
      const payload = JSON.parse(existingOutbox.payloadJson)
      return { success: true, assignmentId: payload.assignmentId, status: 'OFFERED', idempotentDuplicate: true }
    }
  }

  const now = new Date()
  const expiresAt = input.expiresInMinutes
    ? new Date(now.getTime() + input.expiresInMinutes * 60 * 1000)
    : new Date(now.getTime() + 24 * 60 * 60 * 1000) // 24h default

  const slaDueAt = input.slaDueInHours
    ? new Date(now.getTime() + input.slaDueInHours * 60 * 60 * 1000)
    : undefined

  const result = await prisma.$transaction(async (tx) => {
    // Check for existing active assignment for same order + role
    const existing = await tx.orderAssignment.findFirst({
      where: {
        orderId: input.orderId,
        assignmentRole: input.assignmentRole,
        status: { in: ['OFFERED', 'ACCEPTED', 'IN_PROGRESS'] },
      },
    })

    if (existing) {
      throw new Error(`Active ${input.assignmentRole} assignment already exists for this order`)
    }

    const assignment = await tx.orderAssignment.create({
      data: {
        orderId: input.orderId,
        sourcingRequestId: input.sourcingRequestId,
        assignmentRole: input.assignmentRole,
        assigneeId: input.assigneeId,
        assigneeOrganizationId: input.assigneeOrganizationId,
        assignedById: input.assignedById,
        status: 'OFFERED',
        priority: input.priority || 'NORMAL',
        reason: input.reason,
        instructions: input.instructions,
        offeredAt: now,
        expiresAt,
        slaDueAt,
      },
    })

    await tx.assignmentEvent.create({
      data: {
        assignmentId: assignment.id,
        eventType: 'OFFERED',
        actorId: input.assignedById,
        details: `Offered ${input.assignmentRole} assignment to ${input.assigneeId || input.assigneeOrganizationId}`,
      },
    })

    await tx.auditLog.create({
      data: {
        userId: input.assignedById,
        action: 'ASSIGNMENT_OFFERED',
        targetResource: `order:${input.orderId}:assignment:${assignment.id}`,
        details: `Offered ${input.assignmentRole} role for order ${input.orderId}`,
      },
    })

    // Write atomic NotificationOutbox entry
    const outboxKey = input.idempotencyKey || `assignment-offer-${assignment.id}-${Date.now()}`
    await tx.notificationOutbox.create({
      data: {
        idempotencyKey: outboxKey,
        eventType: 'ASSIGNMENT_OFFERED',
        payloadJson: JSON.stringify({
          assignmentId: assignment.id,
          orderId: input.orderId,
          assignmentRole: input.assignmentRole,
          assigneeId: input.assigneeId,
          assigneeOrganizationId: input.assigneeOrganizationId,
          assignedById: input.assignedById,
        }),
      },
    })

    return assignment
  })

  return { success: true, assignmentId: result.id, status: result.status }
}

/**
 * Accept an assignment. Validates actor = assignee.
 * Updates assignment + AssignmentEvent + AuditLog + NotificationOutbox in a SINGLE transaction.
 */
export async function acceptAssignment(assignmentId: string, actorId: string, idempotencyKey?: string): Promise<AssignmentActionResult> {
  if (idempotencyKey) {
    const existingOutbox = await prisma.notificationOutbox.findUnique({
      where: { idempotencyKey },
    })
    if (existingOutbox) {
      return { success: true, assignmentId, status: 'ACCEPTED', idempotentDuplicate: true }
    }
  }

  const now = new Date()

  const result = await prisma.$transaction(async (tx) => {
    const assignment = await tx.orderAssignment.findUnique({ where: { id: assignmentId } })
    if (!assignment) throw new Error('Assignment not found')
    if (assignment.status !== 'OFFERED') throw new Error(`Cannot accept assignment in status ${assignment.status}`)
    if (assignment.assigneeId && assignment.assigneeId !== actorId) throw new Error('Not authorized to accept this assignment')
    if (assignment.expiresAt && assignment.expiresAt < now) throw new Error('Assignment has expired')

    const updated = await tx.orderAssignment.update({
      where: { id: assignmentId, version: assignment.version },
      data: {
        status: 'ACCEPTED',
        acceptedAt: now,
        version: { increment: 1 },
      },
    })

    await tx.assignmentEvent.create({
      data: {
        assignmentId,
        eventType: 'ACCEPTED',
        actorId,
        details: `Assignment accepted`,
      },
    })

    await tx.auditLog.create({
      data: {
        userId: actorId,
        action: 'ASSIGNMENT_ACCEPTED',
        targetResource: `assignment:${assignmentId}`,
        details: `Accepted ${assignment.assignmentRole} assignment for order ${assignment.orderId}`,
      },
    })

    const outboxKey = idempotencyKey || `assignment-accept-${assignmentId}-${Date.now()}`
    await tx.notificationOutbox.create({
      data: {
        idempotencyKey: outboxKey,
        eventType: 'ASSIGNMENT_ACCEPTED',
        payloadJson: JSON.stringify({
          assignmentId,
          orderId: assignment.orderId,
          assignmentRole: assignment.assignmentRole,
          actorId,
        }),
      },
    })

    return updated
  })

  return { success: true, assignmentId: result.id, status: result.status }
}

/**
 * Reject an assignment with a reason.
 */
export async function rejectAssignment(assignmentId: string, actorId: string, reason: string): Promise<AssignmentActionResult> {
  const now = new Date()

  const result = await prisma.$transaction(async (tx) => {
    const assignment = await tx.orderAssignment.findUnique({ where: { id: assignmentId } })
    if (!assignment) throw new Error('Assignment not found')
    if (!['OFFERED', 'ACCEPTED'].includes(assignment.status)) throw new Error(`Cannot reject assignment in status ${assignment.status}`)

    const updated = await tx.orderAssignment.update({
      where: { id: assignmentId, version: assignment.version },
      data: {
        status: 'REJECTED',
        rejectedAt: now,
        rejectionReason: reason,
        version: { increment: 1 },
      },
    })

    await tx.assignmentEvent.create({
      data: {
        assignmentId,
        eventType: 'REJECTED',
        actorId,
        details: `Assignment rejected: ${reason}`,
      },
    })

    await tx.auditLog.create({
      data: {
        userId: actorId,
        action: 'ASSIGNMENT_REJECTED',
        targetResource: `assignment:${assignmentId}`,
        details: `Rejected ${assignment.assignmentRole} assignment: ${reason}`,
      },
    })

    return updated
  })

  return { success: true, assignmentId: result.id, status: result.status }
}

/**
 * Reassign to a different user/org. Marks old assignment REASSIGNED, creates new OFFERED assignment.
 */
export async function reassignAssignment(
  assignmentId: string,
  actorId: string,
  newAssigneeId?: string,
  newAssigneeOrganizationId?: string,
  reassignmentReason?: string
): Promise<AssignmentActionResult> {
  const now = new Date()

  const result = await prisma.$transaction(async (tx) => {
    const assignment = await tx.orderAssignment.findUnique({ where: { id: assignmentId } })
    if (!assignment) throw new Error('Assignment not found')
    if (['COMPLETED', 'CANCELLED'].includes(assignment.status)) throw new Error(`Cannot reassign a ${assignment.status} assignment`)

    await tx.orderAssignment.update({
      where: { id: assignmentId, version: assignment.version },
      data: {
        status: 'REASSIGNED',
        reassignmentReason: reassignmentReason || 'Reassigned by coordinator',
        version: { increment: 1 },
      },
    })

    await tx.assignmentEvent.create({
      data: {
        assignmentId,
        eventType: 'REASSIGNED',
        actorId,
        details: `Reassigned: ${reassignmentReason || 'Reassigned by coordinator'}`,
      },
    })

    const newAssignment = await tx.orderAssignment.create({
      data: {
        orderId: assignment.orderId,
        sourcingRequestId: assignment.sourcingRequestId,
        assignmentRole: assignment.assignmentRole,
        assigneeId: newAssigneeId,
        assigneeOrganizationId: newAssigneeOrganizationId,
        assignedById: actorId,
        status: 'OFFERED',
        priority: assignment.priority,
        reason: `Reassigned from ${assignment.id}`,
        instructions: assignment.instructions,
        offeredAt: now,
        expiresAt: new Date(now.getTime() + 24 * 60 * 60 * 1000),
        slaDueAt: assignment.slaDueAt,
      },
    })

    await tx.assignmentEvent.create({
      data: {
        assignmentId: newAssignment.id,
        eventType: 'OFFERED',
        actorId,
        details: `Reassignment offer (from assignment ${assignment.id})`,
      },
    })

    await tx.auditLog.create({
      data: {
        userId: actorId,
        action: 'ASSIGNMENT_REASSIGNED',
        targetResource: `assignment:${assignmentId}`,
        details: `Reassigned ${assignment.assignmentRole} to ${newAssigneeId || newAssigneeOrganizationId}`,
      },
    })

    return newAssignment
  })

  return { success: true, assignmentId: result.id, status: result.status }
}

/**
 * Expire all stale OFFERED assignments whose expiresAt has passed.
 */
export async function expireStaleAssignments(): Promise<number> {
  const now = new Date()
  const expired = await prisma.orderAssignment.findMany({
    where: { status: 'OFFERED', expiresAt: { lte: now } },
  })

  for (const assignment of expired) {
    await prisma.$transaction(async (tx) => {
      await tx.orderAssignment.update({
        where: { id: assignment.id },
        data: { status: 'EXPIRED' },
      })

      await tx.assignmentEvent.create({
        data: {
          assignmentId: assignment.id,
          eventType: 'EXPIRED',
          details: `Assignment expired (was offered at ${assignment.offeredAt?.toISOString()})`,
        },
      })
    }).catch((err) => {
      console.error(`[ASSIGNMENT] Failed to expire assignment ${assignment.id}:`, err)
    })
  }

  return expired.length
}
