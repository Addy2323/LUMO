import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { issueOtp } from '@/lib/auth/otp-service'

const OtpRequestSchema = z.object({
  identifier: z.string().min(3, 'Phone or email is required'),
  purpose: z.string().default('LOGIN_OR_REGISTER'),
})

export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    const result = OtpRequestSchema.safeParse(body)

    if (!result.success) {
      return NextResponse.json({ error: 'Invalid recipient identifier' }, { status: 400 })
    }

    const { identifier, purpose } = result.data
    const outcome = await issueOtp(identifier, purpose)

    if (!outcome.success) {
      return NextResponse.json({ error: outcome.error }, { status: 429 })
    }

    return NextResponse.json({
      success: true,
      message: 'Verification code dispatched successfully.',
      resendCooldownSeconds: outcome.resendCooldownSeconds,
    })
  } catch (error: any) {
    console.error('[API AUTH OTP REQUEST ERROR]', error)
    return NextResponse.json({ error: 'Internal server error requesting OTP' }, { status: 500 })
  }
}
