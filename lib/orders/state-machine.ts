import { OrderStatus, Role } from '@prisma/client'

/** Permitted order state transitions matrix */
export const PERMITTED_TRANSITIONS: Record<OrderStatus, OrderStatus[]> = {
  DRAFT: ['PENDING_PAYMENT', 'CANCELLED'],
  PENDING_PAYMENT: ['PAID', 'CANCELLED'],
  PAID: ['PROCESSING', 'REFUNDED', 'DISPUTED', 'CANCELLED'],
  PROCESSING: ['SHIPPED', 'CANCELLED', 'DISPUTED'],
  SHIPPED: ['DELIVERED', 'DISPUTED'],
  DELIVERED: ['COMPLETED', 'DISPUTED', 'REFUNDED'],
  COMPLETED: ['DISPUTED'],
  CANCELLED: [],
  REFUNDED: [],
  DISPUTED: ['COMPLETED', 'REFUNDED'],
}

/** Role permissions for executing state transitions */
export const ROLE_TRANSITION_PERMISSIONS: Record<OrderStatus, Role[]> = {
  DRAFT: ['BUYER', 'ADMIN'],
  PENDING_PAYMENT: ['BUYER', 'ADMIN'],
  PAID: ['ADMIN'], // Triggered by payment gateway webhook
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

  const allowedRoles = ROLE_TRANSITION_PERMISSIONS[targetStatus] || ['ADMIN']
  if (userRole !== 'ADMIN' && !allowedRoles.includes(userRole)) {
    return {
      valid: false,
      error: `Role ${userRole} is not authorized to transition order status to ${targetStatus}.`,
    }
  }

  return { valid: true }
}
