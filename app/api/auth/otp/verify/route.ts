import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { prisma } from '@/lib/db'
import { verifyOtpCode } from '@/lib/auth/otp-service'
import { createSession } from '@/lib/auth/server'

const OtpVerifySchema = z.object({
  identifier: z.string().min(3, 'Phone or email is required'),
  code: z.string().length(6, 'Verification code must be 6 digits'),
  purpose: z.string().default('LOGIN_OR_REGISTER'),
})

export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    const result = OtpVerifySchema.safeParse(body)

    if (!result.success) {
      return NextResponse.json({ error: 'Invalid verification payload' }, { status: 400 })
    }

    const { identifier, code, purpose } = result.data
    const outcome = await verifyOtpCode(identifier, code, purpose)

    if (!outcome.success) {
      return NextResponse.json({ error: outcome.error }, { status: 400 })
    }

    // Try to find matching user by phone or email
    const cleanId = identifier.trim().toLowerCase()
    let user = await prisma.user.findFirst({
      where: {
        OR: [{ email: cleanId }, { phone: cleanId }],
      },
    })

    // Auto-create basic BUYER profile if user registered via phone OTP
    if (!user) {
      user = await prisma.user.create({
        data: {
          name: `User ${cleanId.slice(-4)}`,
          email: cleanId.includes('@') ? cleanId : `${cleanId.replace(/[^0-9]/g, '')}@lumo.co.tz`,
          phone: cleanId.includes('@') ? null : cleanId,
          role: 'BUYER',
          kycStatus: 'VERIFIED',
        },
      })
    }

    // Create session & set cookie
    const userAgent = req.headers.get('user-agent') || undefined
    const ipAddress = req.headers.get('x-forwarded-for')?.split(',')[0] || undefined

    await createSession(user.id, user.role, user.email, userAgent, ipAddress)

    return NextResponse.json({
      success: true,
      message: 'OTP verification successful.',
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        role: user.role,
        kycStatus: user.kycStatus,
      },
    })
  } catch (error: any) {
    console.error('[API AUTH OTP VERIFY ERROR]', error)
    return NextResponse.json({ error: 'Internal server error verifying OTP' }, { status: 500 })
  }
}
