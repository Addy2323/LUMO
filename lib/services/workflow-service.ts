import { prisma } from '@/lib/prisma'

export type AgentOrderStatus =
  | 'New'
  | 'Accepted'
  | 'Rejected'
  | 'Sourcing'
  | 'Supplier Selected'
  | 'Awaiting Customer Approval'
  | 'Approved'
  | 'Collection Scheduled'
  | 'Collected'
  | 'Under Inspection'
  | 'Inspection Failed'
  | 'Inspection Passed'
  | 'Packaging'
  | 'Ready to Ship'
  | 'Shipped'
  | 'Delivered'
  | 'Cancelled'
  | 'Disputed'

const ALLOWED_TRANSITIONS: Record<string, string[]> = {
  New: ['Accepted', 'Rejected', 'Cancelled'],
  Accepted: ['Sourcing', 'Cancelled'],
  Sourcing: ['Supplier Selected', 'Cancelled'],
  'Supplier Selected': ['Awaiting Customer Approval', 'Cancelled'],
  'Awaiting Customer Approval': ['Approved', 'Rejected', 'Cancelled'],
  Approved: ['Collection Scheduled', 'Under Inspection', 'Cancelled'],
  'Collection Scheduled': ['Collected', 'Cancelled'],
  Collected: ['Under Inspection', 'Packaging', 'Cancelled'],
  'Under Inspection': ['Inspection Passed', 'Inspection Failed', 'Cancelled'],
  'Inspection Failed': ['Under Inspection', 'Cancelled', 'Disputed'],
  'Inspection Passed': ['Packaging', 'Ready to Ship', 'Cancelled'],
  Packaging: ['Ready to Ship', 'Cancelled'],
  'Ready to Ship': ['Shipped', 'Cancelled'],
  Shipped: ['Delivered', 'Disputed'],
  Delivered: ['Disputed'],
  Cancelled: [],
  Disputed: ['Resolved', 'Cancelled'],
}

export function isValidTransition(currentStatus: string, nextStatus: string): boolean {
  const allowed = ALLOWED_TRANSITIONS[currentStatus] || Object.keys(ALLOWED_TRANSITIONS)
  return allowed.includes(nextStatus)
}

export async function transitionOrderStatus({
  orderId,
  currentStatus,
  nextStatus,
  actorId,
  actorName,
  reason,
  notes,
}: {
  orderId: string
  currentStatus: string
  nextStatus: AgentOrderStatus
  actorId: string
  actorName: string
  reason?: string
  notes?: string
}) {
  if (!isValidTransition(currentStatus, nextStatus)) {
    throw new Error(`Invalid status transition from '${currentStatus}' to '${nextStatus}'.`)
  }

  // Record audit log
  await prisma.auditLog.create({
    data: {
      userId: actorId,
      userRole: 'AGENT',
      action: `ORDER_STATUS_TRANSITION_${nextStatus.toUpperCase().replace(/\s+/g, '_')}`,
      targetResource: `Order:${orderId}`,
      details: JSON.stringify({
        fromStatus: currentStatus,
        toStatus: nextStatus,
        actorName,
        reason: reason || null,
        notes: notes || null,
        timestamp: new Date().toISOString(),
      }),
    },
  })

  // Update order assignment status if exists
  const assignment = await prisma.orderAssignment.findFirst({
    where: { orderId },
  })

  if (assignment) {
    let assignmentStatus = assignment.status
    if (nextStatus === 'Accepted') assignmentStatus = 'ACCEPTED'
    if (nextStatus === 'Sourcing' || nextStatus === 'Under Inspection') assignmentStatus = 'IN_PROGRESS'
    if (nextStatus === 'Shipped' || nextStatus === 'Delivered') assignmentStatus = 'COMPLETED'
    if (nextStatus === 'Rejected') assignmentStatus = 'REJECTED'
    if (nextStatus === 'Cancelled') assignmentStatus = 'CANCELLED'

    await prisma.orderAssignment.update({
      where: { id: assignment.id },
      data: {
        status: assignmentStatus,
        updatedAt: new Date(),
      },
    })
  }

  return { success: true, newStatus: nextStatus }
}
