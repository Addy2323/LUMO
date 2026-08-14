import { OutboxService } from '@/lib/notifications/outbox-service'
import { SmsService } from '@/lib/sms/sms-service'
import { SmsTemplateType } from '@/lib/sms/sms-template-service'
import { sanitizeSmsLogData } from '@/lib/sms/sms-redaction'

export interface ProcessOutboxResult {
  processedCount: number
  successCount: number
  failedCount: number
}

/**
 * Worker logic to process pending SMS outbox queue
 */
export async function processOutboxBatch(batchSize: number = 20): Promise<ProcessOutboxResult> {
  const pendingRecords = await OutboxService.fetchPendingBatch(batchSize)
  
  let successCount = 0
  let failedCount = 0

  for (const record of pendingRecords) {
    try {
      await OutboxService.markProcessing(record.id)

      const payload = JSON.parse(record.payloadJson || '{}')
      const templateKey = record.templateKey as SmsTemplateType

      const result = await SmsService.sendTransactional({
        templateType: templateKey,
        params: payload,
        recipientPhone: record.recipientPhone,
        correlationId: `outbox_${record.id}`,
      })

      await OutboxService.markCompleted(record.id, result.batchId)
      successCount++
    } catch (err: any) {
      console.error('[SMS DISPATCH WORKER ERROR] Outbox item failed:', sanitizeSmsLogData({
        outboxId: record.id,
        eventType: record.eventType,
        error: err.message,
      }))

      await OutboxService.markFailed(record.id, err.message || 'Dispatch failed', record.retryCount, record.maxRetries)
      failedCount++
    }
  }

  return {
    processedCount: pendingRecords.length,
    successCount,
    failedCount,
  }
}
