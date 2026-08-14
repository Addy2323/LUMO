import { prisma } from '@/lib/db'
import { SmsTemplateType, renderSmsTemplate } from '@/lib/sms/sms-template-service'
import { normalizeTanzanianPhone } from '@/lib/sms/phone-normalizer'

export interface EnqueueOutboxParams {
  eventType: string // e.g. "ORDER_PAID", "ORDER_DELIVERED", "REGISTRATION_OTP"
  aggregateId: string // e.g. orderId, userId, challengeId
  recipientId: string // userId or phoneE164
  recipientPhone: string
  templateKey: SmsTemplateType
  templateVersion?: number
  payloadJson: Record<string, any>
  maxRetries?: number
}

/**
 * Transactional Outbox Service
 * Ensures atomic insertion of notifications alongside domain state changes
 */
export class OutboxService {
  /**
   * Enqueue a notification in the outbox table.
   * Uses unique idempotency constraint [eventType, aggregateId, recipientId, templateVersion]
   * to guarantee zero duplicate SMS dispatches.
   */
  static async enqueue(params: EnqueueOutboxParams, tx?: any): Promise<{ success: boolean; outboxId?: string; isDuplicate?: boolean }> {
    const db = tx || prisma
    const norm = normalizeTanzanianPhone(params.recipientPhone)
    
    if (!norm.isValid) {
      console.warn(`[OUTBOX SERVICE] Invalid phone number skipped: ${params.recipientPhone}`)
      return { success: false, isDuplicate: false }
    }

    const templateVersion = params.templateVersion || 1

    try {
      const record = await db.notificationOutbox.create({
        data: {
          eventType: params.eventType,
          aggregateId: params.aggregateId,
          recipientId: params.recipientId,
          recipientPhone: norm.e164,
          channel: 'SMS',
          templateKey: params.templateKey,
          templateVersion,
          payloadJson: JSON.stringify(params.payloadJson),
          status: 'PENDING',
          retryCount: 0,
          maxRetries: params.maxRetries || 5,
          nextAttemptAt: new Date(),
        },
      })

      return { success: true, outboxId: record.id }
    } catch (err: any) {
      // Check for Prisma P2002 unique constraint violation (idempotency key match)
      if (err.code === 'P2002' || err.message?.includes('outbox_idempotency_idx')) {
        console.log(`[OUTBOX SERVICE] Duplicate notification prevented by idempotency constraint: ${params.eventType}:${params.aggregateId}:${params.recipientId}`)
        return { success: true, isDuplicate: true }
      }
      console.error('[OUTBOX SERVICE] Failed to enqueue notification outbox item:', err)
      throw err
    }
  }

  /**
   * Fetch pending outbox records ready for processing by background worker
   */
  static async fetchPendingBatch(limit: number = 50): Promise<any[]> {
    return prisma.notificationOutbox.findMany({
      where: {
        status: { in: ['PENDING', 'FAILED'] },
        nextAttemptAt: { lte: new Date() },
        retryCount: { lt: 5 },
      },
      orderBy: { createdAt: 'asc' },
      take: limit,
    })
  }

  /**
   * Mark outbox record as processing
   */
  static async markProcessing(outboxId: string): Promise<void> {
    await prisma.notificationOutbox.update({
      where: { id: outboxId },
      data: { status: 'PROCESSING', updatedAt: new Date() },
    })
  }

  /**
   * Mark outbox record as completed with provider batch ID
   */
  static async markCompleted(outboxId: string, providerBatchId: string): Promise<void> {
    await prisma.notificationOutbox.update({
      where: { id: outboxId },
      data: {
        status: 'COMPLETED',
        providerBatchId,
        processedAt: new Date(),
        updatedAt: new Date(),
      },
    })
  }

  /**
   * Record failure and schedule next attempt with exponential backoff
   */
  static async markFailed(outboxId: string, errorMessage: string, currentRetryCount: number, maxRetries: number = 5): Promise<void> {
    const nextRetry = currentRetryCount + 1
    const isDeadLetter = nextRetry >= maxRetries
    
    // Exponential backoff: 30s, 2m, 8m, 32m, 2h
    const backoffSeconds = Math.pow(4, nextRetry) * 10
    const nextAttemptAt = new Date(Date.now() + backoffSeconds * 1000)

    await prisma.notificationOutbox.update({
      where: { id: outboxId },
      data: {
        status: isDeadLetter ? 'DEAD_LETTER' : 'FAILED',
        retryCount: nextRetry,
        nextAttemptAt: isDeadLetter ? new Date(Date.now() + 365 * 86400 * 1000) : nextAttemptAt,
        errorMessage: errorMessage.substring(0, 500),
        updatedAt: new Date(),
      },
    })
  }
}
