import { prisma } from '@/lib/db'
import { OrderStatus, Role } from '@prisma/client'
import { OutboxService } from '@/lib/notifications/outbox-service'
import { getSalesAndAdminRecipients } from '@/lib/notifications/recipient-resolver'
import { createInAppNotification } from '@/lib/notifications/in-app-service'
import { SmsTemplateType } from '@/lib/sms/sms-template-service'

// ──────────────────────────────────────────────
// Comprehensive Order State Machine Matrix
// ──────────────────────────────────────────────

export const PERMITTED_TRANSITIONS: Record<OrderStatus, OrderStatus[]> = {
  PAYMENT_PENDING: ['PAYMENT_VERIFICATION', 'PAID', 'PAYMENT_FAILED', 'CANCELLED'],
  PENDING_PAYMENT: ['PAYMENT_VERIFICATION', 'PAID', 'PAYMENT_FAILED', 'CANCELLED'], // Legacy alias
  PAYMENT_VERIFICATION: ['PAID', 'PAYMENT_FAILED', 'CANCELLED'],
  PAYMENT_FAILED: ['PAYMENT_PENDING', 'CANCELLED'],
  PAID: ['ORDER_CONFIRMED', 'PENDING_PROCESSING', 'PROCESSING', 'CANCELLED', 'REFUND_PENDING'],
  ORDER_CONFIRMED: ['PENDING_PROCESSING', 'PROCESSING', 'SOURCING', 'CANCELLED'],
  PENDING_PROCESSING: ['PROCESSING', 'SOURCING', 'CANCELLED'],
  PROCESSING: ['SOURCING', 'SUPPLIER_CONFIRMED', 'PROCUREMENT_IN_PROGRESS', 'QUALITY_INSPECTION', 'SHIPPED', 'CANCELLED'],
  SOURCING: ['SUPPLIER_CONFIRMED', 'PROCUREMENT_IN_PROGRESS', 'QUALITY_INSPECTION', 'CANCELLED'],
  SUPPLIER_CONFIRMED: ['PROCUREMENT_IN_PROGRESS', 'QUALITY_INSPECTION', 'PACKAGING', 'CANCELLED'],
  PROCUREMENT_IN_PROGRESS: ['QUALITY_INSPECTION', 'INSPECTION_PASSED', 'INSPECTION_FAILED', 'PACKAGING', 'CANCELLED'],
  QUALITY_INSPECTION: ['INSPECTION_PASSED', 'INSPECTION_FAILED', 'PACKAGING', 'CANCELLED'],
  INSPECTION_PASSED: ['PACKAGING', 'READY_TO_SHIP', 'SHIPPED'],
  INSPECTION_FAILED: ['QUALITY_INSPECTION', 'CANCELLED', 'REFUND_PENDING'],
  PACKAGING: ['READY_TO_SHIP', 'SHIPPED'],
  READY_TO_SHIP: ['SHIPPED', 'IN_TRANSIT'],
  SHIPPED: ['IN_TRANSIT', 'ARRIVED_IN_TANZANIA', 'CUSTOMS_CLEARANCE', 'DELIVERY_SELECTION_REQUIRED', 'DELIVERED'],
  IN_TRANSIT: ['ARRIVED_IN_TANZANIA', 'CUSTOMS_CLEARANCE', 'DELIVERY_SELECTION_REQUIRED'],
  ARRIVED_IN_TANZANIA: ['CUSTOMS_CLEARANCE', 'DELIVERY_SELECTION_REQUIRED', 'OUT_FOR_DELIVERY', 'READY_FOR_PICKUP'],
  CUSTOMS_CLEARANCE: ['DELIVERY_SELECTION_REQUIRED', 'OUT_FOR_DELIVERY', 'READY_FOR_PICKUP'],
  DELIVERY_SELECTION_REQUIRED: ['OUT_FOR_DELIVERY', 'READY_FOR_PICKUP'],
  OUT_FOR_DELIVERY: ['DELIVERED', 'READY_FOR_PICKUP', 'DISPUTED'],
  READY_FOR_PICKUP: ['DELIVERED', 'COMPLETED', 'DISPUTED'],
  DELIVERED: ['COMPLETED', 'DISPUTED'],
  COMPLETED: [],
  CANCELLED: ['REFUND_PENDING', 'REFUNDED'],
  REFUND_PENDING: ['REFUNDED'],
  REFUNDED: [],
  DISPUTED: ['COMPLETED', 'REFUND_PENDING', 'REFUNDED'],
  DRAFT: ['PAYMENT_PENDING', 'CANCELLED'],
}

/** Role authorization matrix per transition */
const TRANSITION_ROLE_PERMISSIONS: Record<string, Role[]> = {
  'PAYMENT_PENDING->PAID': ['BUYER', 'ADMIN', 'SALES'],
  'PAYMENT_PENDING->PAYMENT_VERIFICATION': ['BUYER', 'ADMIN', 'SALES'],
  'PAYMENT_VERIFICATION->PAID': ['ADMIN', 'SALES'],
  'PAID->ORDER_CONFIRMED': ['SALES', 'ADMIN'],
  'PAID->PROCESSING': ['SUPPLIER', 'SALES', 'ADMIN'],
  'PROCESSING->SOURCING': ['SUPPLIER', 'SALES', 'ADMIN'],
  'SOURCING->SUPPLIER_CONFIRMED': ['SUPPLIER', 'SALES', 'ADMIN'],
  'SUPPLIER_CONFIRMED->PROCUREMENT_IN_PROGRESS': ['SUPPLIER', 'SALES', 'ADMIN'],
  'PROCUREMENT_IN_PROGRESS->QUALITY_INSPECTION': ['SUPPLIER', 'AGENT', 'SALES', 'ADMIN'],
  'QUALITY_INSPECTION->INSPECTION_PASSED': ['AGENT', 'SALES', 'ADMIN'],
  'QUALITY_INSPECTION->INSPECTION_FAILED': ['AGENT', 'SALES', 'ADMIN'],
  'INSPECTION_PASSED->PACKAGING': ['SUPPLIER', 'LOGISTICS', 'ADMIN'],
  'PACKAGING->READY_TO_SHIP': ['LOGISTICS', 'ADMIN'],
  'READY_TO_SHIP->SHIPPED': ['LOGISTICS', 'ADMIN'],
  'SHIPPED->IN_TRANSIT': ['LOGISTICS', 'ADMIN'],
  'IN_TRANSIT->ARRIVED_IN_TANZANIA': ['LOGISTICS', 'ADMIN'],
  'ARRIVED_IN_TANZANIA->CUSTOMS_CLEARANCE': ['LOGISTICS', 'ADMIN'],
  'CUSTOMS_CLEARANCE->DELIVERY_SELECTION_REQUIRED': ['LOGISTICS', 'SALES', 'ADMIN'],
  'DELIVERY_SELECTION_REQUIRED->OUT_FOR_DELIVERY': ['BUYER', 'LOGISTICS', 'SALES', 'ADMIN'],
  'DELIVERY_SELECTION_REQUIRED->READY_FOR_PICKUP': ['BUYER', 'LOGISTICS', 'SALES', 'ADMIN'],
  'OUT_FOR_DELIVERY->DELIVERED': ['LOGISTICS', 'BUYER', 'ADMIN'],
  'READY_FOR_PICKUP->DELIVERED': ['LOGISTICS', 'BUYER', 'SALES', 'ADMIN'],
  'DELIVERED->COMPLETED': ['BUYER', 'SALES', 'ADMIN'],
  'DELIVERED->DISPUTED': ['BUYER', 'ADMIN'],
  'CANCELLED->REFUND_PENDING': ['ADMIN', 'SALES'],
  'REFUND_PENDING->REFUNDED': ['ADMIN'],
  'DISPUTED->COMPLETED': ['SALES', 'ADMIN'],
  'DISPUTED->REFUNDED': ['ADMIN'],
}

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
  // If specific role permission defined, enforce it. Otherwise default to ADMIN or SALES.
  if (allowedRoles && !allowedRoles.includes(userRole) && userRole !== 'ADMIN') {
    return {
      valid: false,
      error: `Role ${userRole} is not authorized for transition ${currentStatus} → ${targetStatus}.`,
    }
  }

  return { valid: true }
}

export function canRolePerformTransition(
  userRole: Role,
  currentStatus: OrderStatus,
  targetStatus: OrderStatus
): boolean {
  return validateOrderTransition(currentStatus, targetStatus, userRole).valid
}

export const ALLOWED_TRANSITIONS: Record<string, Record<string, Role[]>> = (() => {
  const result: Record<string, Record<string, Role[]>> = {}
  for (const [key, roles] of Object.entries(TRANSITION_ROLE_PERMISSIONS)) {
    const [from, to] = key.split('->')
    if (!result[from]) result[from] = {}
    result[from][to] = roles
  }
  return result
})()


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
 * Executes Order update, Status History creation, AuditLog, and NotificationOutbox enqueuing
 * in a SINGLE Prisma transaction.
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
    include: {
      buyer: {
        select: {
          id: true,
          name: true,
          phone: true,
        },
      },
    },
  })

  if (!order) {
    return { success: false, orderId, previousStatus: 'PAYMENT_PENDING', newStatus: targetStatus, error: 'Order not found' }
  }

  const currentStatus = order.status

  // 1. Idempotency Check
  if (currentStatus === targetStatus) {
    return { success: true, orderId, previousStatus: currentStatus, newStatus: targetStatus, idempotentDuplicate: true }
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

  // 2. Fetch staff recipients for notifications
  const staffRecipients = await getSalesAndAdminRecipients()

  // 3. Single Prisma Transaction
  await prisma.$transaction(async (tx) => {
    // Optimistic Concurrency Check
    const freshOrder = await tx.order.findUnique({
      where: { id: orderId },
      select: { status: true },
    })

    if (freshOrder?.status !== currentStatus) {
      throw new Error(`Concurrent modification: order status changed to ${freshOrder?.status}`)
    }

    // A. Update Order Status
    await tx.order.update({
      where: { id: orderId },
      data: { status: targetStatus },
    })

    // B. Create Order Status History Record
    await tx.orderStatusHistory.create({
      data: {
        orderId,
        previousStatus: currentStatus,
        newStatus: targetStatus,
        actorId,
        actorRole,
        reason: reason || null,
      },
    })

    // C. Write Audit Log
    await tx.auditLog.create({
      data: {
        userId: actorId,
        userRole: actorRole,
        action: 'ORDER_TRANSITION',
        targetResource: `order:${orderId}`,
        details: `${currentStatus} → ${targetStatus}${reason ? ` (${reason})` : ''}`,
      },
    })

    // D. Map targetStatus to SMS Template Key
    const templateKey = mapStatusToTemplateKey(targetStatus)
    const customerPhone = order.buyer.phone || (order.shippingAddress as any)?.phone || '0712345678'
    const appUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://lumo.co.tz'

    const customerPayload = {
      firstName: order.buyer.name || 'Customer',
      customerName: order.buyer.name || 'Customer',
      orderReference: order.orderNumber,
      trackingUrl: `${appUrl}/orders/${order.orderNumber}`,
      deliverySelectionUrl: `${appUrl}/orders/${order.orderNumber}/delivery-selection`,
      currency: 'TZS',
      amount: String(order.totalAmountTZS),
    }

    // E. Enqueue Customer Notification in Outbox
    if (templateKey) {
      await OutboxService.enqueue(
        {
          eventType: `ORDER_${targetStatus}`,
          aggregateId: orderId,
          recipientId: order.buyer.id,
          recipientPhone: customerPhone,
          templateKey: templateKey as SmsTemplateType,
          payloadJson: customerPayload,
        },
        tx
      )

      // Also create In-App Notification directly
      await createInAppNotification(
        {
          userId: order.buyer.id,
          eventType: `ORDER_${targetStatus}`,
          title: `Order Update: ${targetStatus.replace(/_/g, ' ')}`,
          body: `Order ${order.orderNumber} status updated to ${targetStatus.replace(/_/g, ' ')}.`,
          resourceType: 'ORDER',
          resourceId: orderId,
        },
        tx
      )
    }

    // F. Enqueue Staff Notifications for operational milestones
    const alertStatuses: OrderStatus[] = [
      'PAID',
      'ORDER_CONFIRMED',
      'QUALITY_INSPECTION',
      'INSPECTION_FAILED',
      'DELIVERY_SELECTION_REQUIRED',
      'DISPUTED',
      'CANCELLED',
    ]

    if (alertStatuses.includes(targetStatus)) {
      for (const staff of staffRecipients) {
        await OutboxService.enqueue(
          {
            eventType: `ORDER_${targetStatus}_STAFF`,
            aggregateId: orderId,
            recipientId: staff.userId,
            recipientPhone: staff.e164,
            templateKey: 'ORDER_PAID_INTERNAL',
            payloadJson: {
              orderReference: order.orderNumber,
              customerName: order.buyer.name || 'Customer',
              currency: 'TZS',
              amount: String(order.totalAmountTZS),
              staffOrderUrl: `${appUrl}/admin/orders/${order.id}`,
            },
          },
          tx
        )
      }
    }
  })

  return { success: true, orderId, previousStatus: currentStatus, newStatus: targetStatus }
}

export function getAvailableTransitions(currentStatus: OrderStatus, role: Role): OrderStatus[] {
  const validNext = PERMITTED_TRANSITIONS[currentStatus] || []
  return validNext.filter((target) => {
    const key = `${currentStatus}->${target}`
    const allowed = TRANSITION_ROLE_PERMISSIONS[key]
    return !allowed || allowed.includes(role) || role === 'ADMIN'
  })
}

function mapStatusToTemplateKey(status: OrderStatus): SmsTemplateType | null {
  switch (status) {
    case 'PAID':
      return 'ORDER_PAID_CUSTOMER'
    case 'PROCESSING':
    case 'PENDING_PROCESSING':
      return 'ORDER_PROCESSING'
    case 'SOURCING':
      return 'ORDER_SOURCING'
    case 'SUPPLIER_CONFIRMED':
      return 'SUPPLIER_CONFIRMED'
    case 'QUALITY_INSPECTION':
      return 'QUALITY_INSPECTION_STARTED'
    case 'INSPECTION_PASSED':
      return 'QUALITY_INSPECTION_PASSED'
    case 'INSPECTION_FAILED':
      return 'INSPECTION_PROBLEM'
    case 'PACKAGING':
      return 'PACKAGING'
    case 'SHIPPED':
    case 'READY_TO_SHIP':
      return 'SHIPPED'
    case 'IN_TRANSIT':
      return 'IN_TRANSIT'
    case 'ARRIVED_IN_TANZANIA':
      return 'ARRIVED_IN_TANZANIA'
    case 'CUSTOMS_CLEARANCE':
      return 'CUSTOMS_CLEARANCE'
    case 'DELIVERY_SELECTION_REQUIRED':
      return 'DELIVERY_SELECTION_REQUIRED'
    case 'OUT_FOR_DELIVERY':
      return 'OUT_FOR_DELIVERY'
    case 'READY_FOR_PICKUP':
      return 'READY_FOR_PICKUP'
    case 'DELIVERED':
      return 'DELIVERED'
    case 'COMPLETED':
      return 'COMPLETED'
    case 'PAYMENT_FAILED':
      return 'PAYMENT_FAILED'
    case 'PAYMENT_VERIFICATION':
      return 'PAYMENT_VERIFYING'
    case 'REFUND_PENDING':
      return 'REFUND_INITIATED'
    case 'REFUNDED':
      return 'REFUND_COMPLETED'
    case 'CANCELLED':
      return 'ORDER_CANCELLED'
    default:
      return null
  }
}

