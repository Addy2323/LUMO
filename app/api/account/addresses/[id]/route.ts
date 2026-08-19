import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { prisma } from '@/lib/db'
import { authorizeApiRequest } from '@/lib/auth/authorize'

const UpdateAddressSchema = z.object({
  fullName: z.string().min(2).optional(),
  phone: z.string().min(6).optional(),
  street: z.string().min(3).optional(),
  city: z.string().optional(),
  region: z.string().optional(),
  isDefault: z.boolean().optional(),
})

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const auth = await authorizeApiRequest(req)
  if (!auth.authorized) return auth.response!

  const { id } = await params

  try {
    const body = await req.json()
    const result = UpdateAddressSchema.safeParse(body)
    if (!result.success) {
      return NextResponse.json({ error: 'Invalid payload' }, { status: 400 })
    }

    // Verify address belongs to user
    const existing = await prisma.address.findUnique({
      where: { id },
    })

    if (!existing || existing.userId !== auth.user.id) {
      return NextResponse.json({ error: 'Address not found' }, { status: 404 })
    }

    if (result.data.isDefault) {
      await prisma.address.updateMany({
        where: { userId: auth.user.id },
        data: { isDefault: false },
      })
    }

    const updated = await prisma.address.update({
      where: { id },
      data: result.data,
    })

    return NextResponse.json(updated)
  } catch (error: any) {
    console.error('[API ACCOUNT ADDRESS PATCH ERROR]', error)
    return NextResponse.json({ error: 'Failed to update address' }, { status: 500 })
  }
}

export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const auth = await authorizeApiRequest(req)
  if (!auth.authorized) return auth.response!

  const { id } = await params

  try {
    const existing = await prisma.address.findUnique({
      where: { id },
    })

    if (!existing || existing.userId !== auth.user.id) {
      return NextResponse.json({ error: 'Address not found' }, { status: 404 })
    }

    await prisma.address.delete({
      where: { id },
    })

    return NextResponse.json({ success: true })
  } catch (error: any) {
    console.error('[API ACCOUNT ADDRESS DELETE ERROR]', error)
    return NextResponse.json({ error: 'Failed to delete address' }, { status: 500 })
  }
}
