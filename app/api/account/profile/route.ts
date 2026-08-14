import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { prisma } from '@/lib/db'
import { authorizeApiRequest } from '@/lib/auth/authorize'

const UpdateProfileSchema = z.object({
  name: z.string().min(2).optional(),
  phone: z.string().optional(),
  companyName: z.string().optional(),
})

export async function GET(req: NextRequest) {
  const auth = await authorizeApiRequest(req)
  if (!auth.authorized) return auth.response!

  return NextResponse.json(auth.user)
}

export async function PUT(req: NextRequest) {
  const auth = await authorizeApiRequest(req)
  if (!auth.authorized) return auth.response!

  try {
    const body = await req.json()
    const result = UpdateProfileSchema.safeParse(body)
    if (!result.success) {
      return NextResponse.json({ error: 'Invalid profile data' }, { status: 400 })
    }

    const updatedUser = await prisma.user.update({
      where: { id: auth.user.id },
      data: result.data,
      select: {
        id: true,
        email: true,
        name: true,
        phone: true,
        companyName: true,
        role: true,
        kycStatus: true,
      },
    })

    return NextResponse.json(updatedUser)
  } catch (error: any) {
    console.error('[API ACCOUNT PROFILE PUT ERROR]', error)
    return NextResponse.json({ error: 'Failed to update profile' }, { status: 500 })
  }
}
