import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { Prisma, TicketStatus } from '@prisma/client'
import { prisma } from '@/lib/db'
import { authorizeApiRequest } from '@/lib/auth/authorize'

const CreateTicketSchema = z.object({
  subject: z.string().min(3),
  message: z.string().min(5),
  orderId: z.string().optional(),
})

export async function GET(req: NextRequest) {
  const auth = await authorizeApiRequest(req)
  if (!auth.authorized) return auth.response!

  const { user } = auth
  const where: Prisma.DisputeWhereInput = {}
  if (user.role !== 'ADMIN' && user.role !== 'SALES') {
    where.buyerId = user.id
  }

  const disputes = await prisma.dispute.findMany({
    where,
    orderBy: { createdAt: 'desc' },
  })

  return NextResponse.json(disputes)
}

export async function POST(req: NextRequest) {
  const auth = await authorizeApiRequest(req)
  if (!auth.authorized) return auth.response!

  try {
    const body = await req.json()
    const result = CreateTicketSchema.safeParse(body)

    if (!result.success) {
      return NextResponse.json({ error: 'Invalid support ticket payload' }, { status: 400 })
    }

    const ticketNumber = `TCK-${Date.now().toString().slice(-6)}`

    // Link to order if provided, or default fallback order if available
    let orderId = result.data.orderId
    if (!orderId) {
      const firstOrder = await prisma.order.findFirst({ where: { buyerId: auth.user.id } })
      if (!firstOrder) {
        return NextResponse.json({ error: 'Order reference is required to open a dispute ticket.' }, { status: 400 })
      }
      orderId = firstOrder.id
    }

    const dispute = await prisma.dispute.create({
      data: {
        ticketNumber,
        buyerId: auth.user.id,
        orderId,
        reason: `${result.data.subject}: ${result.data.message}`,
        status: TicketStatus.OPEN,
      },
    })

    return NextResponse.json(dispute, { status: 201 })
  } catch (error: any) {
    console.error('[API SUPPORT TICKETS POST ERROR]', error)
    return NextResponse.json({ error: 'Failed to create support ticket' }, { status: 500 })
  }
}
