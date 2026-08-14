import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { prisma } from '@/lib/db'
import { verifyOtpChallenge, verifyOtpCode } from '@/lib/auth/otp-service'
import { createSession } from '@/lib/auth/server'
import { normalizeTanzanianPhone } from '@/lib/sms/phone-normalizer'

const VerifyOtpSchema = z.object({
  identifier: z.string().min(1, 'Phone or email identifier is required'),
  code: z.string().length(6, 'OTP code must be 6 digits'),
  challengeId: z.string().optional(),
})

export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    const result = VerifyOtpSchema.safeParse(body)

    if (!result.success) {
      return NextResponse.json(
        { error: 'Validation failed', details: result.error.flatten().fieldErrors },
        { status: 400 }
      )
    }

    const { identifier, code, challengeId } = result.data
    const norm = normalizeTanzanianPhone(identifier)
    const normalizedPhone = norm.isValid ? norm.e164 : identifier.trim()

    // Find registered user by phone or email
    const user = await prisma.user.findFirst({
      where: {
        OR: [
          { email: identifier.trim().toLowerCase() },
          { phone: normalizedPhone },
          { phone: `+${normalizedPhone}` },
          { phone: `0${normalizedPhone.slice(3)}` },
        ],
      },
    })

    // Verify challenge HMAC code
    let otpResult = await verifyOtpChallenge(
      normalizedPhone,
      code,
      'PHONE_REGISTRATION' as any,
      user?.id
    )

    if (!otpResult.success) {
      // Fallback verification
      const fallback = await verifyOtpCode(identifier, code, 'REGISTER')
      if (!fallback.success) {
        return NextResponse.json(
          { error: otpResult.error || fallback.error || 'Invalid or expired verification code. Please check and try again.' },
          { status: 400 }
        )
      }
    }

    if (user) {
      await prisma.user.update({
        where: { id: user.id },
        data: {
          phoneVerifiedAt: new Date(),
          accountStatus: 'ACTIVE' as any,
        },
      }).catch((err) => console.warn('[API VERIFY OTP WARN] Could not update user status:', err))
    }

    // Create session and set httpOnly authentication cookie
    const userAgent = req.headers.get('user-agent') || undefined
    const ipAddress = req.headers.get('x-forwarded-for')?.split(',')[0] || undefined

    const userId = user?.id || `usr_${crypto.randomUUID().slice(0, 8)}`
    const userRole = user?.role || 'CUSTOMER'
    const userEmail = user?.email || `${normalizedPhone}@lumo.co.tz`

    await createSession(userId, userRole as any, userEmail, userAgent, ipAddress)

    return NextResponse.json({
      success: true,
      message: 'Account verified and session activated.',
      redirect: '/marketplace',
      user: {
        id: userId,
        name: user?.name || 'Customer',
        email: userEmail,
        phone: normalizedPhone,
        role: userRole,
      },
    })
  } catch (error: unknown) {
    console.error('[API VERIFY OTP ERROR]', error)
    return NextResponse.json(
      { error: 'An unexpected error occurred during verification.' },
      { status: 500 }
    )
  }
}

