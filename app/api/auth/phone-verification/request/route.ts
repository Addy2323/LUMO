import { NextRequest, NextResponse } from 'next/server'
import { getAuthenticatedUser } from '@/lib/auth/server'
import { issueOtpChallenge } from '@/lib/auth/otp-service'
import { checkAuthAbuseGuard } from '@/lib/security/auth-abuse-guard'
import { OtpPurpose } from '@prisma/client'

export async function POST(req: NextRequest) {
  const guard = await checkAuthAbuseGuard(req, {
    endpoint: '/api/auth/phone-verification/request',
    isHighRiskEndpoint: true,
  })

  if (!guard.allowed && guard.response) {
    return guard.response
  }

  const auth = await getAuthenticatedUser(req)
  if (!auth || !auth.user.phone) {
    return NextResponse.json({ error: 'Unauthorized or missing phone number' }, { status: 401 })
  }

  const result = await issueOtpChallenge(auth.user.phone, OtpPurpose.PHONE_REGISTRATION, auth.user.id)

  if (!result.success) {
    return NextResponse.json({ error: result.error }, { status: 400 })
  }

  return NextResponse.json({
    success: true,
    message: 'Verification code sent to registered phone number.',
    resendCooldownSeconds: result.resendCooldownSeconds,
  })
}
