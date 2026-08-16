import { prisma } from '@/lib/db'
import { Role } from '@prisma/client'

// ──────────────────────────────────────────────
// Domain Event Service — Outbox + In-App Notifications
// ──────────────────────────────────────────────

export type DomainEventType =
  | 'ORDER_PAID'
  | 'ORDER_PROCESSING'
  | 'ORDER_SHIPPED'
  | 'ORDER_DELIVERED'
  | 'ASSIGNMENT_OFFERED'
  | 'ASSIGNMENT_ACCEPTED'
  | 'ASSIGNMENT_REJECTED'
  | 'MESSAGE_RECEIVED'
  | 'DISPUTE_RAISED'

export type PublishDomainEventInput = {
  eventType: DomainEventType
  aggregateId: string // e.g. orderId, assignmentId
  actorId?: string
  recipients: { userId: string; role: Role; phone?: string }[]
  title: string
  body: string
  resourceType: 'ORDER' | 'ASSIGNMENT' | 'SOURCING_REQUEST' | 'CONVERSATION'
  resourceId: string
  templateKey?: string
  payload?: Record<string, any>
}

/**
 * Publish a domain event.
 * Creates InAppNotification records for each recipient AND NotificationOutbox records
 * for external channels (SMS) in a single database transaction.
 */
export async function publishDomainEvent(input: PublishDomainEventInput): Promise<{ count: number }> {
  const now = new Date()

  return prisma.$transaction(async (tx) => {
    let createdCount = 0

    for (const recipient of input.recipients) {
      // 1. Create InAppNotification
      await tx.inAppNotification.create({
        data: {
          userId: recipient.userId,
          eventType: input.eventType,
          title: input.title,
          body: input.body,
          resourceType: input.resourceType,
          resourceId: input.resourceId,
          isRead: false,
        },
      })
      createdCount++

      // 2. Create NotificationOutbox if SMS phone is provided and templateKey exists
      if (recipient.phone && input.templateKey) {
        const payloadJson = JSON.stringify(input.payload || { title: input.title, body: input.body })

        await tx.notificationOutbox.upsert({
          where: {
            outbox_idempotency_idx: {
              eventType: input.eventType,
              aggregateId: input.aggregateId,
              recipientId: recipient.userId,
              templateVersion: 1,
            },
          },
          create: {
            eventType: input.eventType,
            aggregateId: input.aggregateId,
            recipientId: recipient.userId,
            recipientPhone: recipient.phone,
            channel: 'SMS',
            templateKey: input.templateKey,
            templateVersion: 1,
            payloadJson,
            status: 'PENDING',
          },
          update: {}, // Idempotent: ignore duplicate event publish attempts
        }).catch((err) => {
          console.warn(`[OUTBOX IDEMPOTENCY] Duplicate outbox event ignored: ${input.eventType}:${input.aggregateId}`)
        })
      }
    }

    // Write AuditLog
    await tx.auditLog.create({
      data: {
        userId: input.actorId || null,
        action: `EVENT_${input.eventType}`,
        targetResource: `${input.resourceType.toLowerCase()}:${input.resourceId}`,
        details: `Published event ${input.eventType} to ${input.recipients.length} recipients`,
      },
    })

    return { count: createdCount }
  })
}
