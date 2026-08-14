import { NextRequest, NextResponse } from 'next/server'
import { verifyOtpChallenge } from '@/lib/auth/otp-service'
import { issuePasswordResetTokenCookie } from '@/lib/auth/server'
import { checkAuthAbuseGuard } from '@/lib/security/auth-abuse-guard'
import { logSecurityEvent } from '@/lib/security/security-event-service'
import { OtpPurpose } from '@prisma/client'

export async function POST(req: NextRequest) {
  try {
    const guard = await checkAuthAbuseGuard(req, {
      endpoint: '/api/auth/password-recovery/verify',
      isHighRiskEndpoint: true,
    })

    if (!guard.allowed && guard.response) {
      return guard.response
    }

    const body = await req.json().catch(() => ({}))
    const { phone, code } = body

    if (!phone || !code || typeof code !== 'string' || code.trim().length !== 6) {
      return NextResponse.json({ error: 'Valid phone number and 6-digit verification code are required.' }, { status: 400 })
    }

    const verifyResult = await verifyOtpChallenge(phone, code, OtpPurpose.PASSWORD_RESET)

    if (!verifyResult.success || !verifyResult.userId) {
      await logSecurityEvent({
        eventType: 'PASSWORD_RECOVERY_OTP_FAILED',
        endpoint: '/api/auth/password-recovery/verify',
        purpose: OtpPurpose.PASSWORD_RESET,
        action: 'REJECT',
        riskLevel: 'MEDIUM',
        details: verifyResult.error || 'OTP verification failed.',
      })
      return NextResponse.json({ error: verifyResult.error || 'Verification failed.' }, { status: 400 })
    }

    // Issue short-lived HttpOnly reset authorization cookie
    await issuePasswordResetTokenCookie(verifyResult.userId, verifyResult.challengeId!)

    await logSecurityEvent({
      eventType: 'PASSWORD_RECOVERY_OTP_VERIFIED',
      userId: verifyResult.userId,
      endpoint: '/api/auth/password-recovery/verify',
      purpose: OtpPurpose.PASSWORD_RESET,
      action: 'ALLOW',
      riskLevel: 'LOW',
      details: 'Password reset OTP verified. Issued HttpOnly reset authorization token.',
    })

    return NextResponse.json({
      success: true,
      message: 'Code verified. Proceed to set your new password.',
      redirect: '/auth/reset-password',
    })
  } catch (error: any) {
    console.error('[API AUTH PASSWORD RECOVERY VERIFY ERROR]', error)
    return NextResponse.json(
      { error: 'An error occurred while verifying the recovery code. Please try again.' },
      { status: 500 }
    )
  }
}
