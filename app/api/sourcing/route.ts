import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { Prisma, SourcingStatus } from '@prisma/client'
import { prisma } from '@/lib/db'
import { authorizeApiRequest } from '@/lib/auth/authorize'
import { createConversation } from '@/lib/conversations/conversation-service'

const SourcingRequestSchema = z.object({
  productUrl: z.string().min(1, 'Product link or description required'),
  targetPriceUSD: z.number().optional(),
  targetQuantity: z.number().int().positive().default(10),
  notes: z.string().optional(),
})

export async function GET(req: NextRequest) {
  const auth = await authorizeApiRequest(req)
  if (!auth.authorized) return auth.response!

  const { user, activeRole } = auth
  const role = activeRole || user.role

  const where: Prisma.SourcingRequestWhereInput = {}
  if (role !== 'ADMIN' && role !== 'SALES') {
    where.buyerId = user.id
  }

  const requests = await prisma.sourcingRequest.findMany({
    where,
    orderBy: { createdAt: 'desc' },
    include: {
      buyer: {
        select: {
          id: true,
          name: true,
          email: true,
          phone: true,
        },
      },
    },
  })

  return NextResponse.json(requests)
}

export async function POST(req: NextRequest) {
  const auth = await authorizeApiRequest(req)
  if (!auth.authorized) return auth.response!

  try {
    const body = await req.json()
    const result = SourcingRequestSchema.safeParse(body)
    if (!result.success) {
      return NextResponse.json({ error: 'Invalid sourcing request', details: result.error.flatten() }, { status: 400 })
    }

    const { productUrl, targetPriceUSD, targetQuantity, notes } = result.data
    const targetPriceTZS = targetPriceUSD ? new Prisma.Decimal((targetPriceUSD * 2600).toString()) : undefined

    const request = await prisma.sourcingRequest.create({
      data: {
        buyerId: auth.user.id,
        productUrl,
        targetQuantity,
        targetPriceTZS,
        description: notes,
        status: SourcingStatus.SUBMITTED,
      },
    })

    // Automatically create a linked conversation for Customer - Sales communication
    try {
      await createConversation({
        sourcingRequestId: request.id,
        visibility: 'CUSTOMER_VISIBLE',
        title: `Sourcing Discussion - SRC-${request.id.slice(0, 8).toUpperCase()}`,
        initialParticipants: [
          { userId: auth.user.id, role: auth.activeRole || auth.user.role },
        ],
      })
    } catch (convError) {
      console.warn('[SOURCING POST CONVERSATION INIT WARNING]', convError)
    }

    return NextResponse.json(request, { status: 201 })
  } catch (error: any) {
    console.error('[API SOURCING POST ERROR]', error)
    return NextResponse.json({ error: 'Failed to submit sourcing request' }, { status: 500 })
  }
}
