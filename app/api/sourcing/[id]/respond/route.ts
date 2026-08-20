import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { Prisma, SourcingStatus, OrderStatus, PaymentStatus } from '@prisma/client'
import { prisma } from '@/lib/db'
import { authorizeApiRequest } from '@/lib/auth/authorize'

const RespondSchema = z.object({
  action: z.enum(['APPROVE', 'REJECT']),
  notes: z.string().optional(),
})

export async function POST(req: NextRequest, { params }: { params: { id: string } }) {
  const auth = await authorizeApiRequest(req)
  if (!auth.authorized) return auth.response!

  try {
    const body = await req.json()
    const result = RespondSchema.safeParse(body)
    if (!result.success) {
      return NextResponse.json({ error: 'Invalid response action', details: result.error.flatten() }, { status: 400 })
    }

    const { action, notes } = result.data

    const sourcingReq = await prisma.sourcingRequest.findUnique({
      where: { id: params.id },
    })

    if (!sourcingReq) {
      return NextResponse.json({ error: 'Sourcing request not found' }, { status: 404 })
    }

    if (action === 'REJECT') {
      const updated = await prisma.sourcingRequest.update({
        where: { id: params.id },
        data: {
          status: SourcingStatus.CANCELLED,
          notes: notes ? `Customer Rejected: ${notes}` : 'Customer Rejected Quotation',
        },
      })
      return NextResponse.json({ success: true, sourcingRequest: updated })
    }

    // APPROVE QUOTATION -> Transition sourcing request and convert to an Order
    const landedTotal = sourcingReq.targetPriceTZS
      ? Number(sourcingReq.targetPriceTZS) * sourcingReq.targetQuantity
      : 250000

    const orderNumber = `LUMO-${Date.now().toString().slice(-6)}-${Math.floor(100 + Math.random() * 900)}`

    const [updatedSourcing, createdOrder] = await prisma.$transaction([
      prisma.sourcingRequest.update({
        where: { id: params.id },
        data: {
          status: SourcingStatus.FULFILLED,
        },
      }),
      prisma.order.create({
        data: {
          orderNumber,
          buyerId: auth.user.id,
          subtotalTZS: new Prisma.Decimal(landedTotal * 0.8),
          shippingFeeTZS: new Prisma.Decimal(landedTotal * 0.1),
          taxAmountTZS: new Prisma.Decimal(landedTotal * 0.1),
          totalAmountTZS: new Prisma.Decimal(landedTotal),
          status: OrderStatus.PENDING_PAYMENT,
          paymentMethod: 'LUMO Payment Protection',
          shippingAddress: {
            fullName: auth.user.name || 'Valued Buyer',
            phone: auth.user.phone || '+255700000000',
            city: 'Dar es Salaam',
            street: 'Kinondoni B2B Hub',
          },
        },
      }),
    ])

    return NextResponse.json({
      success: true,
      message: 'Quotation approved successfully. Order created awaiting LUMO Pay deposit.',
      sourcingRequest: updatedSourcing,
      order: createdOrder,
    })
  } catch (error: any) {
    console.error('[SOURCING RESPOND API ERROR]', error)
    return NextResponse.json({ error: 'Failed to process quotation response' }, { status: 500 })
  }
}
