import { db } from '@/lib/db'
import { OutboxService } from '@/lib/notifications/outbox-service'
import { processOutboxBatch } from '@/lib/notifications/outbox-worker'
import { OrderStatus, PaymentStatus } from '@prisma/client'

export interface ProcessPaymentSuccessParams {
  paymentAttemptId: string
  providerPaymentId?: string
  gatewayReference?: string
  paidAt?: Date
  rawResponse?: Record<string, any>
}

/**
 * Idempotent payment verification and order status transition engine.
 * Executed inside a single atomic Prisma transaction.
 */
export async function processPaymentSuccess(params: ProcessPaymentSuccessParams) {
  const { paymentAttemptId, providerPaymentId, gatewayReference, paidAt = new Date(), rawResponse } = params

  return await db.$transaction(async (tx) => {
    // 1. Fetch payment attempt with order and buyer details
    const attempt = await tx.paymentAttempt.findUnique({
      where: { id: paymentAttemptId },
      include: {
        order: {
          include: {
            buyer: true,
            items: {
              include: { product: true },
            },
          },
        },
      },
    })

    if (!attempt) {
      throw new Error(`Payment attempt ${paymentAttemptId} not found`)
    }

    // 2. Prevent duplicate processing (Idempotency Check)
    if (attempt.status === 'SUCCEEDED') {
      console.log(`[PAYMENT VERIFICATION] Payment attempt ${paymentAttemptId} already processed as SUCCEEDED. Skipping.`)
      return { success: true, alreadyProcessed: true, order: attempt.order }
    }

    const order = attempt.order
    const previousOrderStatus = order.status

    // 3. Update PaymentAttempt model
    const updatedAttempt = await tx.paymentAttempt.update({
      where: { id: paymentAttemptId },
      data: {
        status: 'SUCCEEDED',
        paidAt,
        providerPaymentId: providerPaymentId || attempt.providerPaymentId,
        gatewayReference: gatewayReference || attempt.gatewayReference,
        providerResponse: rawResponse ? JSON.stringify(rawResponse) : attempt.providerResponse,
      },
    })

    // 4. Update Order model
    const updatedOrder = await tx.order.update({
      where: { id: order.id },
      data: {
        status: OrderStatus.PAID,
        paymentMethod: 'Mongike Tanzania Mobile Money',
      },
    })

    // 5. Create OrderStatusHistory record
    await tx.orderStatusHistory.create({
      data: {
        orderId: order.id,
        previousStatus,
        newStatus: OrderStatus.PAID,
        reason: `Paid via Mongike Mobile Money (${updatedAttempt.buyerPhone}). Ref: ${providerPaymentId || gatewayReference}`,
      },
    })

    // 6. Create PaymentRecord
    await tx.paymentRecord.create({
      data: {
        orderId: order.id,
        provider: 'Mongike Mobile Money',
        transactionRef: providerPaymentId || gatewayReference || `MNG-${order.orderNumber}-${Date.now()}`,
        amountTZS: attempt.amount,
        status: PaymentStatus.SUCCESSFUL,
        channel: 'MOBILE_MONEY',
        rawPayload: rawResponse ? JSON.stringify(rawResponse) : undefined,
      },
    })

    // 7. Queue Customer Notification Outbox Event
    const formattedAmount = Number(attempt.amount).toLocaleString('en-US')
    const trackingUrl = `${process.env.NEXT_PUBLIC_APP_URL || 'https://lumo.co.tz'}/orders/${order.orderNumber}`

    await OutboxService.enqueue(
      {
        eventType: 'ORDER_PAID',
        aggregateId: order.id,
        recipientId: order.buyerId,
        recipientPhone: order.buyer.phone || attempt.buyerPhone,
        templateKey: 'ORDER_PAID_CUSTOMER',
        templateVersion: 1,
        renderParams: {
          customerName: order.buyer.name || 'Valued Customer',
          orderNumber: order.orderNumber,
          amount: formattedAmount,
          trackingUrl,
        },
      },
      tx
    )

    // 8. Queue Admin / Sales Notification Outbox Event
    const adminUrl = `${process.env.NEXT_PUBLIC_APP_URL || 'https://lumo.co.tz'}/admin/orders/${order.id}`
    await OutboxService.enqueue(
      {
        eventType: 'ORDER_PAID_ADMIN',
        aggregateId: order.id,
        recipientId: 'ADMIN_NOTIFY',
        recipientPhone: '+255711788830',
        templateKey: 'ORDER_PAID_ADMIN',
        templateVersion: 1,
        renderParams: {
          orderNumber: order.orderNumber,
          customerName: order.buyer.name || 'Customer',
          amount: formattedAmount,
          adminOrderUrl: adminUrl,
        },
      },
      tx
    )

    // 9. Create In-App Notification for Buyer
    await tx.inAppNotification.create({
      data: {
        userId: order.buyerId,
        eventType: 'ORDER_PAID',
        title: 'Payment Confirmed! 🎉',
        body: `We have received your payment of TZS ${formattedAmount} for Order #${order.orderNumber}. Processing has begun.`,
        resourceType: 'ORDER',
        resourceId: order.id,
      },
    })

    // Trigger immediate outbox dispatch asynchronously after transaction
    setTimeout(() => {
      processOutboxBatch().catch((err) => console.error('[OUTBOX WORKER ERROR]', err))
    }, 100)

    return { success: true, alreadyProcessed: false, order: updatedOrder, attempt: updatedAttempt }
  })
}

export interface ProcessPaymentFailureParams {
  paymentAttemptId: string
  failureCode?: string
  failureMessage?: string
  rawResponse?: Record<string, any>
}

/**
 * Handles failed or expired payment attempt. Keeps order unpaid and allows retry.
 */
export async function processPaymentFailure(params: ProcessPaymentFailureParams) {
  const { paymentAttemptId, failureCode, failureMessage, rawResponse } = params

  return await db.paymentAttempt.update({
    where: { id: paymentAttemptId },
    data: {
      status: 'FAILED',
      failureCode: failureCode || 'PAYMENT_FAILED',
      failureMessage: failureMessage || 'Mobile money payment failed or was cancelled by user',
      providerResponse: rawResponse ? JSON.stringify(rawResponse) : undefined,
    },
  })
}
