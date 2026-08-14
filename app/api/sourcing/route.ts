import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { Prisma, SourcingStatus } from '@prisma/client'
import { prisma } from '@/lib/db'
import { authorizeApiRequest } from '@/lib/auth/authorize'

const SourcingRequestSchema = z.object({
  productUrl: z.string().url('Invalid product link'),
  targetPriceUSD: z.number().optional(),
  targetQuantity: z.number().int().positive().default(10),
  notes: z.string().optional(),
})

export async function GET(req: NextRequest) {
  const auth = await authorizeApiRequest(req)
  if (!auth.authorized) return auth.response!

  const { user } = auth
  const where: Prisma.SourcingRequestWhereInput = {}
  if (user.role !== 'ADMIN' && user.role !== 'SALES') {
    where.buyerId = user.id
  }

  const requests = await prisma.sourcingRequest.findMany({
    where,
    orderBy: { createdAt: 'desc' },
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

    return NextResponse.json(request, { status: 201 })
  } catch (error: any) {
    console.error('[API SOURCING POST ERROR]', error)
    return NextResponse.json({ error: 'Failed to submit sourcing request' }, { status: 500 })
  }
}
