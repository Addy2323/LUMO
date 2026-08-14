import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db'
import { authorizeApiRequest } from '@/lib/auth/authorize'
import { checkRateLimit } from '@/lib/security/rate-limiter'
import { OrderStatus, PaymentStatus } from '@prisma/client'

/**
 * POST /api/rfq/[id]/award
 * Accept a quotation for an RFQ and atomically create a purchase Order.
 */
export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const rateLimit = checkRateLimit(req, { limit: 10, windowMs: 60000, prefix: 'rfq_award' })
  if (!rateLimit.success && rateLimit.response) return rateLimit.response

  const auth = await authorizeApiRequest(req)
  if (!auth.authorized) return auth.response!

  const { user } = auth
  const { id: rfqId } = await params

  try {
    const body = await req.json()
    const { quotationId } = body

    if (!quotationId) {
      return NextResponse.json({ error: 'Missing quotationId in request body' }, { status: 400 })
    }

    const rfq = await (prisma as any).rFQ.findUnique({
      where: { id: rfqId },
      include: { buyer: true },
    })

    if (!rfq) {
      return NextResponse.json({ error: 'RFQ not found' }, { status: 404 })
    }

    if (rfq.buyerId !== user.id && user.role !== 'ADMIN') {
      return NextResponse.json(
        { error: 'Forbidden: Only the RFQ buyer or an admin can award a quotation' },
        { status: 403 }
      )
    }

    if (rfq.status === 'AWARDED') {
      return NextResponse.json(
        { error: 'RFQ has already been awarded to a quotation' },
        { status: 400 }
      )
    }

    const quotation = await (prisma as any).supplierQuotation.findUnique({
      where: { id: quotationId },
      include: {
        items: true,
        charges: true,
        supplierUser: {
          include: { supplierProfile: true },
        },
      },
    })

    if (!quotation || quotation.rfqId !== rfqId) {
      return NextResponse.json(
        { error: 'Quotation not found or does not belong to this RFQ' },
        { status: 404 }
      )
    }

    if (quotation.status === 'EXPIRED' || quotation.status === 'REJECTED' || quotation.status === 'CANCELLED') {
      return NextResponse.json(
        { error: `Cannot award quotation with status ${quotation.status}` },
        { status: 400 }
      )
    }

    let createdOrder: any

    // Execute atomic transaction for RFQ status update, Quotation acceptance, and Order creation
    await prisma.$transaction(async (tx: any) => {
      // 1. Update RFQ status to AWARDED
      await tx.rFQ.update({
        where: { id: rfqId },
        data: { status: 'AWARDED' },
      })

      // 2. Mark this quotation ACCEPTED
      await tx.supplierQuotation.update({
        where: { id: quotationId },
        data: { status: 'ACCEPTED' },
      })

      // 3. Mark other quotations on this RFQ as REJECTED
      await tx.supplierQuotation.updateMany({
        where: {
          rfqId,
          id: { not: quotationId },
        },
        data: { status: 'REJECTED' },
      })

      // 4. Generate order reference
      const orderCount = await tx.order.count()
      const orderNumber = `LUM-${new Date().getFullYear()}-${String(orderCount + 10001).padStart(6, '0')}`

      const totalAmountTZS = Number(quotation.totalAmount)

      // Find or attach supplier
      const supplierRecord = await tx.supplier.findFirst({
        where: { userId: quotation.supplierId },
      })

      // 5. Create Order record
      createdOrder = await tx.order.create({
        data: {
          orderNumber,
          buyerId: user.id,
          supplierId: supplierRecord?.id || null,
          status: OrderStatus.PENDING_PAYMENT,
          totalAmountTZS,
          depositAmountTZS: Math.round(totalAmountTZS * 0.3), // 30% upfront deposit requirement
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
              paymentMethod: 'MOBILE_MONEY',
              status: PaymentStatus.PENDING,
            },
          },
        },
        include: {
          orderItems: true,
          paymentRecords: true,
        },
      })

      // Record status history for quotation
      await tx.quotationStatusHistory.create({
        data: {
          quotationId: quotation.id,
          previousStatus: quotation.status,
          newStatus: 'ACCEPTED',
          changedById: user.id,
          reason: `Awarded by buyer. Generated Order ${createdOrder.orderNumber}`,
        },
      })
    })

    return NextResponse.json({
      success: true,
      message: `Quotation accepted! Order ${createdOrder.orderNumber} created.`,
      orderId: createdOrder.id,
      orderNumber: createdOrder.orderNumber,
      totalAmountTZS: createdOrder.totalAmountTZS,
    })
  } catch (error: any) {
    console.error('[RFQ AWARD ERROR]', error)
    return NextResponse.json({ error: 'Failed to award quotation and create order' }, { status: 500 })
  }
}
