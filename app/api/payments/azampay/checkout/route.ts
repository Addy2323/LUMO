import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { prisma } from '@/lib/db'
import { authorizeApiRequest } from '@/lib/auth/authorize'
import { azamPayClient } from '@/lib/payments/azampay'

const AzamCheckoutSchema = z.object({
  orderId: z.string().min(1),
  accountNumber: z.string().min(8, 'Mobile number required (e.g. 0712345678)'),
  providerName: z.enum(['M-PESA', 'HALOPESA', 'AIRTEL', 'LUMO_PAY']).default('M-PESA'),
})

export async function POST(req: NextRequest) {
  const auth = await authorizeApiRequest(req)
  if (!auth.authorized) return auth.response!

  try {
    const body = await req.json()
    const result = AzamCheckoutSchema.safeParse(body)

    if (!result.success) {
      return NextResponse.json({ error: 'Invalid checkout parameters', details: result.error.flatten() }, { status: 400 })
    }

    const { orderId, accountNumber, providerName } = result.data

    const order = await prisma.order.findUnique({ where: { id: orderId } })
    if (!order) {
      return NextResponse.json({ error: 'Order not found' }, { status: 404 })
    }

    if (order.buyerId !== auth.user.id && auth.user.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Forbidden: You do not own this order' }, { status: 403 })
    }

    const checkoutResult = await azamPayClient.checkout({
      orderId: order.id,
      orderNumber: order.orderNumber,
      amountTZS: Number(order.totalAmountTZS),
      accountNumber,
      providerName,
    })

    if (checkoutResult.success) {
      // Update PaymentRecord in database
      await prisma.paymentRecord.updateMany({
        where: { orderId: order.id },
        data: {
          transactionRef: checkoutResult.transactionRef,
          status: 'PENDING',
        },
      })
    }

    return NextResponse.json(checkoutResult)
  } catch (error: any) {
    console.error('[API LUMO_PAY CHECKOUT ERROR]', error)
    return NextResponse.json({ error: 'Failed to process checkout' }, { status: 500 })
  }
}
