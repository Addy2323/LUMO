import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { Prisma, OrderStatus, PaymentStatus, EscrowStatus } from '@prisma/client'
import { prisma } from '@/lib/db'
import { authorizeApiRequest } from '@/lib/auth/authorize'

const PayOrderSchema = z.object({
  paymentMethod: z.string().default('AzamPay Mobile Money'),
  network: z.string().optional(), // M-Pesa, Mix by Yas, Airtel Money, CRDB Bank, NMB Bank
  phoneNumber: z.string().optional(),
  cardNumber: z.string().optional(),
  cardExpiry: z.string().optional(),
  cardCvv: z.string().optional(),
  cardHolder: z.string().optional(),
})

export async function POST(req: NextRequest, { params }: { params: { id: string } }) {
  const auth = await authorizeApiRequest(req)
  if (!auth.authorized) return auth.response!

  try {
    const body = await req.json()
    const result = PayOrderSchema.safeParse(body)
    if (!result.success) {
      return NextResponse.json({ error: 'Invalid payment parameters', details: result.error.flatten() }, { status: 400 })
    }

    const { paymentMethod, phoneNumber, network, cardNumber, cardExpiry, cardHolder } = result.data

    const order = await prisma.order.findUnique({
      where: { id: params.id },
    })

    if (!order) {
      return NextResponse.json({ error: 'Order not found' }, { status: 404 })
    }

    const isBankCard = network === 'CRDB Bank' || network === 'NMB Bank' || paymentMethod.includes('Card')
    const providerName = isBankCard ? `AzamPay Direct (${network || 'Bank Card'})` : `AzamPay Mobile Money (${network || 'M-Pesa'})`
    const transactionRef = `AZM-${Date.now()}-${Math.floor(100 + Math.random() * 900)}`

    // Execute state update inside transaction
    const [updatedOrder, paymentRecord] = await prisma.$transaction([
      prisma.order.update({
        where: { id: params.id },
        data: {
          status: OrderStatus.PAID,
          paymentMethod: providerName,
        },
      }),
      prisma.paymentRecord.create({
        data: {
          orderId: order.id,
          provider: providerName,
          transactionRef,
          amountTZS: order.totalAmountTZS,
          status: PaymentStatus.SUCCESSFUL,
        },
      }),
      prisma.escrowLedger.upsert({
        where: { orderId: order.id },
        update: {
          status: EscrowStatus.HELD_IN_ESCROW,
          amountTZS: order.totalAmountTZS,
        },
        create: {
          orderId: order.id,
          buyerId: auth.user.id,
          amountTZS: order.totalAmountTZS,
          status: EscrowStatus.HELD_IN_ESCROW,
        },
      }),
    ])

    return NextResponse.json({
      success: true,
      message: `Payment received successfully via ${providerName} Escrow.`,
      order: updatedOrder,
      transactionRef,
    })
  } catch (error: any) {
    console.error('[ORDER PAY API ERROR]', error)
    return NextResponse.json({ error: 'Failed to process order payment', details: error?.message }, { status: 500 })
  }
}
