import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db'
import { authorizeApiRequest } from '@/lib/auth/authorize'
import { checkRateLimit } from '@/lib/security/rate-limiter'
import { OrderStatus, PaymentStatus } from '@prisma/client'

/**
 * POST /api/rfq/[id]/quotations/[quotationId]/award
 * Dedicated RESTful route to award a specific supplier quotation and convert it into a purchase Order.
 */
export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string; quotationId: string }> }
) {
  const rateLimit = checkRateLimit(req, { limit: 10, windowMs: 60000, prefix: 'rfq_award' })
  if (!rateLimit.success && rateLimit.response) return rateLimit.response

  const auth = await authorizeApiRequest(req)
  if (!auth.authorized) return auth.response!

  const { user } = auth
  const { id: rfqId, quotationId } = await params

  try {
    const body = await req.json().catch(() => ({}))
    const idempotencyKey = req.headers.get('x-idempotency-key') || body.idempotencyKey

    const rfq = await (prisma as any).rFQ.findUnique({
      where: { id: rfqId },
      include: { buyer: true },
    })

    if (!rfq) {
      return NextResponse.json({ error: 'RFQ not found' }, { status: 404 })
    }

    if (rfq.buyerId !== user.id && user.role !== 'ADMIN') {
      return NextResponse.json(
        { error: 'Forbidden: Only the RFQ owner or an administrator can award a quotation' },
        { status: 403 }
      )
    }

    if (rfq.status === 'AWARDED') {
      return NextResponse.json(
        { error: 'Conflict: This RFQ has already been awarded to a supplier quotation' },
        { status: 409 }
      )
    }

    const quotation = await (prisma as any).supplierQuotation.findUnique({
      where: { id: quotationId },
      include: {
        items: true,
        charges: true,
        supplierUser: true,
      },
    })

    if (!quotation || quotation.rfqId !== rfqId) {
      return NextResponse.json(
        { error: 'Quotation not found or does not belong to specified RFQ' },
        { status: 404 }
      )
    }

    // Strict Quotation Eligibility Validation
    if (quotation.status === 'EXPIRED') {
      return NextResponse.json({ error: 'Cannot award an expired quotation' }, { status: 400 })
    }

    if (new Date(quotation.validUntil) < new Date()) {
      return NextResponse.json({ error: 'Quotation validity period has elapsed' }, { status: 400 })
    }

    if (['REJECTED', 'CANCELLED', 'WITHDRAWN'].includes(quotation.status)) {
      return NextResponse.json(
        { error: `Cannot award quotation with status ${quotation.status}` },
        { status: 400 }
      )
    }

    // Check supplier account status
    if (quotation.supplierUser?.status === 'SUSPENDED') {
      return NextResponse.json(
        { error: 'Cannot award quotation to a suspended supplier account' },
        { status: 403 }
      )
    }

    let createdOrder: any

    // Atomic transaction for RFQ award & Order conversion
    await prisma.$transaction(async (tx: any) => {
      // 1. Mark RFQ as AWARDED
      await tx.rFQ.update({
        where: { id: rfqId },
        data: { status: 'AWARDED' },
      })

      // 2. Mark target quotation ACCEPTED
      await tx.supplierQuotation.update({
        where: { id: quotationId },
        data: { status: 'ACCEPTED' },
      })

      // 3. Mark competing quotations REJECTED
      await tx.supplierQuotation.updateMany({
        where: {
          rfqId,
          id: { not: quotationId },
        },
        data: { status: 'REJECTED' },
      })

      // 4. Generate unique Order number
      const orderCount = await tx.order.count()
      const orderNumber = `LUM-${new Date().getFullYear()}-${String(orderCount + 10001).padStart(6, '0')}`

      const totalAmountTZS = Number(quotation.totalAmount)

      const supplierRecord = await tx.supplier.findFirst({
        where: { userId: quotation.supplierId },
      })

      // 5. Create Order with snapshot items
      createdOrder = await tx.order.create({
        data: {
          orderNumber,
          buyerId: user.id,
          supplierId: supplierRecord?.id || null,
          status: OrderStatus.PENDING_PAYMENT,
          totalAmountTZS,
          depositAmountTZS: Math.round(totalAmountTZS * 0.3),
          shippingFeeTZS: Number(quotation.freightAmount),
          customsFeeTZS: Number(quotation.taxAmount),
          incoterms: quotation.incoterm || 'FOB',
          orderItems: {
            create: quotation.items.map((item: any) => ({
              productTitle: item.itemDescription,
              quantity: item.quantity,
              unitPriceTZS: Number(item.unitPrice),
              subtotalTZS: Number(item.subtotal),
            })),
          },
          paymentRecords: {
            create: {
              amountTZS: totalAmountTZS,
              paymentMethod: 'AzamPay Escrow',
              status: PaymentStatus.PENDING,
            },
          },
        },
        include: {
          orderItems: true,
          paymentRecords: true,
        },
      })

      // Record status audit history
      await tx.quotationStatusHistory.create({
        data: {
          quotationId: quotation.id,
          previousStatus: quotation.status,
          newStatus: 'ACCEPTED',
          changedById: user.id,
          reason: `Awarded via dedicated API route. Generated Order ${createdOrder.orderNumber} (IdempotencyKey: ${idempotencyKey || 'N/A'})`,
        },
      })
    })

    return NextResponse.json({
      success: true,
      message: `Quotation ${quotation.quotationNumber} successfully awarded! Order ${createdOrder.orderNumber} generated.`,
      orderId: createdOrder.id,
      orderNumber: createdOrder.orderNumber,
      totalAmountTZS: createdOrder.totalAmountTZS,
      idempotencyKey: idempotencyKey || null,
    })
  } catch (error: any) {
    console.error('[RFQ AWARD ROUTE ERROR]', error)
    return NextResponse.json({ error: 'Failed to process quotation award' }, { status: 500 })
  }
}
