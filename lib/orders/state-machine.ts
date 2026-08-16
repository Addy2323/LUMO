import { prisma } from '@/lib/db'
import { OrderStatus, Role } from '@prisma/client'

// ──────────────────────────────────────────────
// Order State Machine — server-authoritative
// ──────────────────────────────────────────────

/** Permitted order state transitions matrix */
export const PERMITTED_TRANSITIONS: Record<OrderStatus, OrderStatus[]> = {
  DRAFT: ['PENDING_PAYMENT', 'CANCELLED'],
  PENDING_PAYMENT: ['PAID', 'CANCELLED'],
  PAID: ['PROCESSING', 'CANCELLED', 'REFUNDED'],
  PROCESSING: ['SHIPPED', 'CANCELLED'],
  SHIPPED: ['DELIVERED'],
  DELIVERED: ['COMPLETED', 'DISPUTED'],
  COMPLETED: [],
  CANCELLED: ['REFUNDED'],
  REFUNDED: [],
  DISPUTED: ['COMPLETED', 'REFUNDED'],
}

/**
 * Which roles are allowed to trigger each specific transition (from→to).
 */
const TRANSITION_ROLE_PERMISSIONS: Record<string, Role[]> = {
  'DRAFT->PENDING_PAYMENT': ['BUYER', 'SALES', 'ADMIN'],
  'DRAFT->CANCELLED': ['BUYER', 'SALES', 'ADMIN'],
  'PENDING_PAYMENT->PAID': ['BUYER', 'ADMIN'],
  'PENDING_PAYMENT->CANCELLED': ['BUYER', 'SALES', 'ADMIN'],
  'PAID->PROCESSING': ['SUPPLIER', 'SALES', 'ADMIN'],
  'PAID->CANCELLED': ['ADMIN'],
  'PAID->REFUNDED': ['ADMIN'],
  'PROCESSING->SHIPPED': ['SUPPLIER', 'LOGISTICS', 'ADMIN'],
  'PROCESSING->CANCELLED': ['ADMIN'],
  'SHIPPED->DELIVERED': ['LOGISTICS', 'BUYER', 'ADMIN'],
  'DELIVERED->COMPLETED': ['BUYER', 'SALES', 'ADMIN'],
  'DELIVERED->DISPUTED': ['BUYER', 'ADMIN'],
  'CANCELLED->REFUNDED': ['ADMIN'],
  'DISPUTED->COMPLETED': ['SALES', 'ADMIN'],
  'DISPUTED->REFUNDED': ['ADMIN'],
}

/** Legacy role-per-target-status permissions (backward compat) */
export const ROLE_TRANSITION_PERMISSIONS: Record<OrderStatus, Role[]> = {
  DRAFT: ['BUYER', 'ADMIN'],
  PENDING_PAYMENT: ['BUYER', 'ADMIN'],
  PAID: ['ADMIN'],
  PROCESSING: ['SUPPLIER', 'SALES', 'ADMIN'],
  SHIPPED: ['LOGISTICS', 'ADMIN'],
  DELIVERED: ['LOGISTICS', 'ADMIN'],
  COMPLETED: ['BUYER', 'ADMIN'],
  CANCELLED: ['BUYER', 'ADMIN'],
  REFUNDED: ['ADMIN'],
  DISPUTED: ['BUYER', 'ADMIN'],
}

/**
 * Validates if an order status transition is permitted for the given role
 */
export function validateOrderTransition(
  currentStatus: OrderStatus,
  targetStatus: OrderStatus,
  userRole: Role
): { valid: boolean; error?: string } {
  if (currentStatus === targetStatus) return { valid: true }

  const allowedTargets = PERMITTED_TRANSITIONS[currentStatus] || []
  if (!allowedTargets.includes(targetStatus)) {
    return {
      valid: false,
      error: `Invalid transition from ${currentStatus} to ${targetStatus}.`,
    }
  }

  const transitionKey = `${currentStatus}->${targetStatus}`
  const allowedRoles = TRANSITION_ROLE_PERMISSIONS[transitionKey]
  if (allowedRoles && !allowedRoles.includes(userRole)) {
    return {
      valid: false,
      error: `Role ${userRole} is not authorized for transition ${currentStatus} → ${targetStatus}.`,
    }
  }

  return { valid: true }
}

// ──────────────────────────────────────────────
// Transactional State Transition with Outbox & Idempotency
// ──────────────────────────────────────────────

export type TransitionResult = {
  success: boolean
  orderId: string
  previousStatus: OrderStatus
  newStatus: OrderStatus
  error?: string
  idempotentDuplicate?: boolean
}

/**
 * Server-authoritative order transition.
 * Executes Order transition, Assignment update, AuditLog, and NotificationOutbox
 * in a SINGLE Prisma transaction with request idempotency.
 */
export async function transitionOrder(
  orderId: string,
  targetStatus: OrderStatus,
  actorId: string,
  actorRole: Role,
  reason?: string,
  idempotencyKey?: string
): Promise<TransitionResult> {
  const order = await prisma.order.findUnique({
    where: { id: orderId },
    select: { id: true, orderNumber: true, status: true, buyerId: true },
  })

  if (!order) {
    return { success: false, orderId, previousStatus: 'DRAFT', newStatus: targetStatus, error: 'Order not found' }
  }

  const currentStatus = order.status

  // 1. Idempotency Check: If idempotencyKey provided and already processed in outbox
  if (idempotencyKey) {
    const existingOutbox = await prisma.notificationOutbox.findUnique({
      where: { idempotencyKey },
    })
    if (existingOutbox) {
      return {
        success: true,
        orderId,
        previousStatus: currentStatus,
        newStatus: targetStatus,
        idempotentDuplicate: true,
      }
    }
  }

  const validation = validateOrderTransition(currentStatus, targetStatus, actorRole)
  if (!validation.valid) {
    return {
      success: false,
      orderId,
      previousStatus: currentStatus,
      newStatus: targetStatus,
      error: validation.error,
    }
  }

  // Idempotent: already in target status
  if (currentStatus === targetStatus) {
    return { success: true, orderId, previousStatus: currentStatus, newStatus: targetStatus }
  }

  // Single Prisma Transaction executing Order update, Assignment update, AuditLog, and NotificationOutbox
  await prisma.$transaction(async (tx) => {
    // Optimistic Concurrency Check
    const freshOrder = await tx.order.findUnique({
      where: { id: orderId },
      select: { status: true },
    })

    if (freshOrder?.status !== currentStatus) {
      throw new Error(`Concurrent modification: order status changed to ${freshOrder?.status}`)
    }

    // 1. Update Order Status
    await tx.order.update({
      where: { id: orderId },
      data: { status: targetStatus },
    })

    // 2. Update Order Assignment status if applicable
    if (targetStatus === 'COMPLETED' || targetStatus === 'DELIVERED') {
      await tx.orderAssignment.updateMany({
        where: { orderId, status: { in: ['ACCEPTED', 'IN_PROGRESS'] } },
        data: { status: 'COMPLETED', completedAt: new Date() },
      })
    } else if (targetStatus === 'PROCESSING') {
      await tx.orderAssignment.updateMany({
        where: { orderId, status: 'ACCEPTED' },
        data: { status: 'IN_PROGRESS', startedAt: new Date() },
      })
    }

    // 3. Write AuditLog
    await tx.auditLog.create({
      data: {
        userId: actorId,
        userRole: actorRole,
        action: 'ORDER_TRANSITION',
        targetResource: `order:${orderId}`,
        details: `${currentStatus} → ${targetStatus}${reason ? ` (${reason})` : ''}`,
      },
    })

    // 4. Write NotificationOutbox (Atomic Single Outbox Pattern)
    const outboxIdempotency = idempotencyKey || `order-transition-${orderId}-${currentStatus}-${targetStatus}-${Date.now()}`
    await tx.notificationOutbox.create({
      data: {
        idempotencyKey: outboxIdempotency,
        eventType: `ORDER_${targetStatus}`,
        payloadJson: JSON.stringify({
          orderId,
          orderNumber: order.orderNumber,
          previousStatus: currentStatus,
          newStatus: targetStatus,
          actorId,
          actorRole,
          buyerId: order.buyerId,
        }),
      },
    })
  })

  return { success: true, orderId, previousStatus: currentStatus, newStatus: targetStatus }
}

/**
 * Returns the valid transitions from the current order status for a given role.
 */
export function getAvailableTransitions(currentStatus: OrderStatus, role: Role): OrderStatus[] {
  const validNext = PERMITTED_TRANSITIONS[currentStatus] || []
  return validNext.filter((target) => {
    const key = `${currentStatus}->${target}`
    const allowed = TRANSITION_ROLE_PERMISSIONS[key]
    return !allowed || allowed.includes(role)
  })
}
