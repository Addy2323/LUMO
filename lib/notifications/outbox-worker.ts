import { OutboxService } from '@/lib/notifications/outbox-service'
import { mesejiSmsProvider } from '@/lib/sms/meseji-sms-provider'
import { renderSmsTemplate, SmsTemplateType } from '@/lib/sms/sms-template-service'
import { createInAppNotification } from '@/lib/notifications/in-app-service'

export interface OutboxProcessingStats {
  processed: number
  succeeded: number
  failed: number
  skipped: number
  errors: string[]
}

/**
 * Executes a single batch pass over pending NotificationOutbox records.
 * Ensures zero duplicate dispatches via DB state locking and Meseji SMS provider batch tracking.
 */
export async function processOutboxBatch(batchSize: number = 50): Promise<OutboxProcessingStats> {
  const stats: OutboxProcessingStats = {
    processed: 0,
    succeeded: 0,
    failed: 0,
    skipped: 0,
    errors: [],
  }

  const pendingRecords = await OutboxService.fetchPendingBatch(batchSize)
  if (pendingRecords.length === 0) {
    return stats
  }

  for (const record of pendingRecords) {
    stats.processed++

    try {
      // 1. Mark as processing
      await OutboxService.markProcessing(record.id)

      // 2. Parse payload & render SMS content
      let payload = {}
      try {
        payload = JSON.parse(record.payloadJson)
      } catch (e) {
        payload = {}
      }

      const messageContent = renderSmsTemplate(record.templateKey as SmsTemplateType, payload)

      // 3. Dispatch SMS via Meseji Provider
      const smsResult = await mesejiSmsProvider.sendTransactionalSms({
        recipientPhone: record.recipientPhone,
        message: messageContent,
        senderId: 'Lumo',
        referenceId: `outbox-${record.id}`,
      })

      if (smsResult.success) {
        // 4. Mark Outbox Completed
        await OutboxService.markCompleted(record.id, smsResult.batchId || `meseji-${Date.now()}`)
        stats.succeeded++

        // 5. Create matching In-App Notification if recipientId is a valid user ID
        if (record.recipientId && record.recipientId !== record.recipientPhone && !record.recipientId.includes('_group')) {
          const title = getNotificationTitle(record.eventType, payload)
          await createInAppNotification({
            userId: record.recipientId,
            eventType: record.eventType,
            title,
            body: messageContent,
            resourceType: 'ORDER',
            resourceId: record.aggregateId,
          })
        }
      } else {
        const errorMsg = smsResult.error || 'SMS provider dispatch failed'
        await OutboxService.markFailed(record.id, errorMsg, record.retryCount, record.maxRetries)
        stats.failed++
        stats.errors.push(`[Outbox ${record.id}] ${errorMsg}`)
      }
    } catch (err: any) {
      const errorMsg = err.message || 'Unknown processing error'
      await OutboxService.markFailed(record.id, errorMsg, record.retryCount, record.maxRetries)
      stats.failed++
      stats.errors.push(`[Outbox ${record.id}] ${errorMsg}`)
    }
  }

  return stats
}

/**
 * Helper to generate human-friendly notification titles for in-app feeds
 */
function getNotificationTitle(eventType: string, payload: any): string {
  const ref = payload.orderReference || payload.orderNumber || ''
  switch (eventType) {
    case 'ORDER_PAID':
    case 'ORDER_PAID_CUSTOMER':
      return `Payment Received for Order ${ref}`
    case 'ORDER_PAID_INTERNAL':
      return `New Paid Order ${ref} Requires Action`
    case 'ORDER_PROCESSING':
      return `Order ${ref} Processing Started`
    case 'ORDER_SOURCING':
      return `Procurement Started for Order ${ref}`
    case 'SUPPLIER_CONFIRMED':
      return `Supplier Confirmed for Order ${ref}`
    case 'QUALITY_INSPECTION_STARTED':
      return `Quality Inspection Underway for Order ${ref}`
    case 'QUALITY_INSPECTION_PASSED':
      return `Inspection Passed for Order ${ref}`
    case 'INSPECTION_PROBLEM':
      return `Inspection Notice for Order ${ref}`
    case 'PACKAGING':
      return `Order ${ref} Packed & Ready`
    case 'SHIPPED':
      return `Order ${ref} Shipped`
    case 'IN_TRANSIT':
      return `Order ${ref} In Transit`
    case 'ARRIVED_IN_TANZANIA':
      return `Order ${ref} Arrived in Tanzania`
    case 'CUSTOMS_CLEARANCE':
      return `Order ${ref} Undergoing Customs Clearance`
    case 'DELIVERY_SELECTION_REQUIRED':
      return `Choose Delivery Method for Order ${ref}`
    case 'OUT_FOR_DELIVERY':
      return `Order ${ref} Out for Delivery`
    case 'READY_FOR_PICKUP':
      return `Order ${ref} Ready for Pickup`
    case 'DELIVERED':
      return `Order ${ref} Delivered`
    case 'COMPLETED':
      return `Order ${ref} Completed`
    case 'PAYMENT_FAILED':
      return `Payment Failed for Order ${ref}`
    case 'REFUND_INITIATED':
      return `Refund Initiated for Order ${ref}`
    case 'REFUND_COMPLETED':
      return `Refund Completed for Order ${ref}`
    default:
      return `Order Update: ${ref}`
  }
}
