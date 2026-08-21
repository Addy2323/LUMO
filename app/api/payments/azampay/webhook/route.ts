import { NextRequest, NextResponse } from 'next/server'
import { OrderStatus, PaymentStatus } from '@prisma/client'
import { prisma } from '@/lib/db'
import { azamPayClient } from '@/lib/payments/azampay'
import { escrowLedger } from '@/lib/payments/escrow-ledger'
import { checkRateLimit } from '@/lib/security/rate-limiter'
import { OutboxService } from '@/lib/notifications/outbox-service'
import { getSalesAndAdminRecipients } from '@/lib/notifications/recipient-resolver'
import { createInAppNotification } from '@/lib/notifications/in-app-service'

export async function POST(req: NextRequest) {
  // 1. Rate limiting check (protect webhook endpoint against flooding)
  const rateLimit = checkRateLimit(req, { limit: 60, windowMs: 60000, prefix: 'lumopay_webhook' })
  if (!rateLimit.success && rateLimit.response) {
    return rateLimit.response
  }

  try {
    const rawBody = await req.text()

    // 2. Verify webhook signature or bearer authorization
    const isValidAuth = azamPayClient.verifyWebhookAuth(req.headers, rawBody)
    if (!isValidAuth) {
      const clientIp = req.headers.get('x-forwarded-for') || req.headers.get('x-real-ip') || 'unknown'
      console.warn(`[SECURITY AUDIT 401] Invalid LUMO Pay webhook signature/auth token from IP ${clientIp}`)
      return NextResponse.json({ error: 'Unauthorized webhook signature' }, { status: 401 })
    }

    const payload = JSON.parse(rawBody)
    const { reference, utilityref, status, transactionId, amount } = payload
    const orderNumber = utilityref || reference

    if (!orderNumber) {
      return NextResponse.json({ error: 'Missing order reference' }, { status: 400 })
    }

    const order = await prisma.order.findFirst({
      where: {
        OR: [{ orderNumber }, { id: orderNumber }],
      },
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
      console.error(`[LUMO_PAY WEBHOOK] Order ${orderNumber} not found`)
      return NextResponse.json({ error: 'Order not found' }, { status: 404 })
    }

    // 3. Amount verification check (prevent fraud via tampered payment amounts)
    if (amount !== undefined && amount !== null) {
      const receivedAmount = parseFloat(String(amount))
      const expectedAmount = Number(order.totalAmountTZS)
      if (!isNaN(receivedAmount) && Math.abs(receivedAmount - expectedAmount) > 0.01) {
        console.error(
          `[LUMO_PAY WEBHOOK FRAUD ALERT] Amount mismatch for Order ${order.orderNumber}. Expected: TZS ${expectedAmount}, Received: TZS ${receivedAmount}`
        )
        return NextResponse.json({ error: 'Payment amount mismatch' }, { status: 400 })
      }
    }

    // 4. Idempotency check: If order is already in a terminal/paid state, acknowledge webhook safely
    if (
      (order.status as string) === 'PAID' ||
      (order.status as string) === 'ORDER_CONFIRMED' ||
      (order.status as string) === 'PROCESSING' ||
      (order.status as string) === 'SHIPPED' ||
      (order.status as string) === 'COMPLETED'
    ) {
      return NextResponse.json({ success: true, message: 'Already processed' })
    }

    const isSuccess = status === 'success' || status === 'SUCCESS' || status === '00'

    if (isSuccess) {
      const appUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://lumo.co.tz'
      const customerPhone = order.buyer.phone || (order.shippingAddress as any)?.phone || '0712345678'
      const staffRecipients = await getSalesAndAdminRecipients()

      // Execute atomic transaction for payment status transition & payment protection locking
      await prisma.$transaction(async (tx) => {
        // A. Update Order Status
        await tx.order.update({
          where: { id: order.id },
          data: { status: OrderStatus.PAID },
        })

        // B. Update Payment Record
        await tx.paymentRecord.updateMany({
          where: { orderId: order.id },
          data: {
            status: PaymentStatus.SUCCESSFUL,
            transactionRef: transactionId || reference,
          },
        })

        // C. Record Order Status History
        await tx.orderStatusHistory.create({
          data: {
            orderId: order.id,
            previousStatus: order.status,
            newStatus: OrderStatus.PAID,
            actorRole: 'SYSTEM',
            reason: `LUMO Pay Webhook Confirmed: Ref ${transactionId || reference}`,
          },
        })

        // D. Write Audit Log
        await tx.auditLog.create({
          data: {
            userId: order.buyer.id,
            userRole: 'BUYER',
            action: 'PAYMENT_CONFIRMED',
            targetResource: `order:${order.id}`,
            details: `LUMO Pay webhook verified. Payment ref: ${transactionId || reference}`,
          },
        })

        // E. Enqueue Customer Payment Confirmation SMS in Transactional Outbox
        await OutboxService.enqueue(
          {
            eventType: 'ORDER_PAID',
            aggregateId: order.id,
            recipientId: order.buyer.id,
            recipientPhone: customerPhone,
            templateKey: 'ORDER_PAID_CUSTOMER',
            payloadJson: {
              firstName: order.buyer.name || 'Customer',
              customerName: order.buyer.name || 'Customer',
              orderReference: order.orderNumber,
              trackingUrl: `${appUrl}/orders/${order.orderNumber}`,
              currency: 'TZS',
              amount: String(order.totalAmountTZS),
            },
          },
          tx
        )

        // F. Create In-App Notification for Customer
        await createInAppNotification(
          {
            userId: order.buyer.id,
            eventType: 'ORDER_PAID',
            title: `Payment Received for Order ${order.orderNumber}`,
            body: `Your payment of TZS ${order.totalAmountTZS.toLocaleString()} for Order ${order.orderNumber} has been received and confirmed.`,
            resourceType: 'ORDER',
            resourceId: order.id,
          },
          tx
        )

        // G. Enqueue Internal Sales/Admin Group Order Alerts (Deduplicated)
        for (const staff of staffRecipients) {
          await OutboxService.enqueue(
            {
              eventType: 'ORDER_PAID_INTERNAL',
              aggregateId: order.id,
              recipientId: staff.userId,
              recipientPhone: staff.e164,
              templateKey: 'ORDER_PAID_INTERNAL',
              payloadJson: {
                orderReference: order.orderNumber,
                customerName: order.buyer.name || 'Buyer',
                currency: 'TZS',
                amount: String(order.totalAmountTZS),
                staffOrderUrl: `${appUrl}/admin/orders/${order.id}`,
              },
            },
            tx
          )

          // Also create staff in-app notification if user ID exists
          if (staff.userId && !staff.userId.includes('system')) {
            await createInAppNotification(
              {
                userId: staff.userId,
                eventType: 'ORDER_PAID_INTERNAL',
                title: `New Paid Order ${order.orderNumber}`,
                body: `Order ${order.orderNumber} paid by ${order.buyer.name || 'Customer'}. TZS ${order.totalAmountTZS.toLocaleString()}`,
                resourceType: 'ORDER',
                resourceId: order.id,
              },
              tx
            )
          }
        }
      })

      // Lock funds in Payment Vault Ledger
      await escrowLedger.lockInEscrow(order.id, transactionId || reference, order.totalAmountTZS)

      console.log(`✅ [LUMO_PAY WEBHOOK SUCCESS] Order ${order.orderNumber} set to PAID & locked in Trade Protection.`)
    } else {
      await prisma.paymentRecord.updateMany({
        where: { orderId: order.id },
        data: { status: PaymentStatus.FAILED },
      })
    }

    return NextResponse.json({ success: true })
  } catch (error: any) {
    console.error('[LUMO_PAY WEBHOOK ERROR]', error)
    return NextResponse.json({ error: 'Webhook processing failed' }, { status: 500 })
  }
}

