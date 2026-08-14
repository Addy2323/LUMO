import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { prisma } from '@/lib/db'
import { authorizeApiRequest } from '@/lib/auth/authorize'

const AddressSchema = z.object({
  fullName: z.string().min(2),
  phone: z.string().min(6),
  street: z.string().min(3),
  city: z.string().default('Dar es Salaam'),
  region: z.string().default('Dar es Salaam'),
  isDefault: z.boolean().default(false),
})

export async function GET(req: NextRequest) {
  const auth = await authorizeApiRequest(req)
  if (!auth.authorized) return auth.response!

  const addresses = await prisma.address.findMany({
    where: { userId: auth.user.id },
    orderBy: { createdAt: 'desc' },
  })

  return NextResponse.json(addresses)
}

export async function POST(req: NextRequest) {
  const auth = await authorizeApiRequest(req)
  if (!auth.authorized) return auth.response!

  try {
    const body = await req.json()
    const result = AddressSchema.safeParse(body)
    if (!result.success) {
      return NextResponse.json({ error: 'Invalid address payload' }, { status: 400 })
    }

    if (result.data.isDefault) {
      await prisma.address.updateMany({
        where: { userId: auth.user.id },
        data: { isDefault: false },
      })
    }

    const address = await prisma.address.create({
      data: {
        userId: auth.user.id,
        ...result.data,
      },
    })

    return NextResponse.json(address, { status: 201 })
  } catch (error: any) {
    console.error('[API ACCOUNT ADDRESSES POST ERROR]', error)
    return NextResponse.json({ error: 'Failed to create address' }, { status: 500 })
  }
}
