import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { issueOtpChallenge } from '@/lib/auth/otp-service'
import { normalizeTanzanianPhone, maskPhoneNumber } from '@/lib/sms/phone-normalizer'
import { prisma } from '@/lib/db'

const ResendOtpSchema = z.object({
  phone: z.string().min(9, 'Phone number is required'),
})

export async function POST(req: NextRequest) {
  try {
    const body = await req.json().catch(() => ({}))
    const parsed = ResendOtpSchema.safeParse(body)

    if (!parsed.success) {
      return NextResponse.json(
        { error: 'Valid Tanzanian phone number is required.' },
        { status: 400 }
      )
    }

    const { phone } = parsed.data
    const norm = normalizeTanzanianPhone(phone)

    if (!norm.isValid) {
      return NextResponse.json(
        { error: norm.error || 'Invalid Tanzanian mobile phone number format.' },
        { status: 400 }
      )
    }

    const e164 = norm.e164
    const maskedPhone = maskPhoneNumber(e164)

    // Lookup matching pending or registered user
    const user = await prisma.user.findFirst({
      where: {
        OR: [
          { phone: e164 },
          { phone: `+${e164}` },
          { phone: `0${e164.slice(3)}` },
        ],
      },
    })

    const result = await issueOtpChallenge(e164, 'PHONE_REGISTRATION' as any, user?.id)

    if (!result.success) {
      if (result.resendCooldownSeconds) {
        return NextResponse.json(
          {
            error: result.error,
            resendCooldownSeconds: result.resendCooldownSeconds,
            maskedPhone,
          },
          { status: 429 }
        )
      }

      return NextResponse.json(
        {
          error: 'We could not send your verification code. Please check the phone number and try again.',
          maskedPhone,
        },
        { status: 400 }
      )
    }

    return NextResponse.json({
      success: true,
      message: `Verification code sent to ${maskedPhone}`,
      maskedPhone,
      challengeId: result.challengeId,
      resendCooldownSeconds: 60,
    })
  } catch (error: any) {
    console.error('[API RESEND OTP ERROR]', error?.stack || error)
    return NextResponse.json(
      { error: 'We could not send your verification code. Please try again later.' },
      { status: 500 }
    )
  }
}
