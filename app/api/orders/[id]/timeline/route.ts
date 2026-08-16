import { NextRequest, NextResponse } from 'next/server'
import { authorizeApiRequest } from '@/lib/auth/authorize'
import { prisma } from '@/lib/db'

/**
 * GET /api/orders/[id]/timeline
 * Returns a role-filtered timeline of events for an order (audit logs + assignment events).
 */
export async function GET(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const auth = await authorizeApiRequest(req)
  if (!auth.authorized) return auth.response!

  const { id: orderId } = await params
  const { user, activeRole } = auth

  // Verify order exists and user has access
  const order = await prisma.order.findUnique({
    where: { id: orderId },
    select: { id: true, buyerId: true, orderNumber: true, status: true, createdAt: true },
  })

  if (!order) {
    return NextResponse.json({ error: 'Order not found' }, { status: 404 })
  }

  // Ownership check: BUYER can only see their own orders
  if (activeRole === 'BUYER' && order.buyerId !== user.id) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }

  // Fetch audit logs for this order
  const auditLogs = await prisma.auditLog.findMany({
    where: { targetResource: { startsWith: `order:${orderId}` } },
    orderBy: { createdAt: 'asc' },
    select: {
      id: true,
      action: true,
      details: true,
      userRole: true,
      createdAt: true,
    },
  })

  // Fetch assignment events
  const assignments = await prisma.orderAssignment.findMany({
    where: { orderId },
    include: {
      events: {
        orderBy: { createdAt: 'asc' },
        select: {
          id: true,
          eventType: true,
          details: true,
          createdAt: true,
        },
      },
    },
  })

  // Build unified timeline
  const timeline: any[] = [
    // Order created event
    {
      type: 'ORDER_CREATED',
      timestamp: order.createdAt,
      description: `Order ${order.orderNumber} created`,
      visibility: 'CUSTOMER_VISIBLE',
    },
  ]

  // Add audit events (filter internal events for Buyer)
  for (const log of auditLogs) {
    const isInternal = ['ASSIGNMENT_OFFERED', 'ASSIGNMENT_REASSIGNED'].includes(log.action)
    if (activeRole === 'BUYER' && isInternal) continue

    timeline.push({
      type: log.action,
      timestamp: log.createdAt,
      description: activeRole === 'BUYER' ? sanitizeForCustomer(log.details, log.action) : log.details,
      visibility: isInternal ? 'LUMO_INTERNAL' : 'CUSTOMER_VISIBLE',
    })
  }

  // Add assignment events (hide internal assignment details from buyer)
  for (const assignment of assignments) {
    for (const event of assignment.events) {
      if (activeRole === 'BUYER' && ['OFFERED', 'REASSIGNED', 'EXPIRED'].includes(event.eventType)) continue

      timeline.push({
        type: `ASSIGNMENT_${event.eventType}`,
        timestamp: event.createdAt,
        description: activeRole === 'BUYER' ? sanitizeAssignmentForCustomer(event.eventType) : event.details,
        visibility: activeRole === 'BUYER' ? 'CUSTOMER_VISIBLE' : 'LUMO_INTERNAL',
        assignmentRole: assignment.assignmentRole,
      })
    }
  }

  // Sort by timestamp
  timeline.sort((a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime())

  return NextResponse.json({ orderId, timeline })
}

function sanitizeForCustomer(details: string | null, action: string): string {
  if (!details) return action.replace(/_/g, ' ').toLowerCase()
  // Remove internal references
  return details
    .replace(/assignment:\S+/g, '')
    .replace(/order:\S+/g, '')
    .replace(/\s+/g, ' ')
    .trim()
}

function sanitizeAssignmentForCustomer(eventType: string): string {
  switch (eventType) {
    case 'ACCEPTED': return 'A specialist has been assigned to your order'
    case 'COMPLETED': return 'Processing step completed'
    case 'REJECTED': return 'Your order is being routed to another specialist'
    default: return 'Order update'
  }
}
