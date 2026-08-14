import { NextRequest, NextResponse } from 'next/server'
import { issueOtpChallenge } from '@/lib/auth/otp-service'
import { checkAuthAbuseGuard } from '@/lib/security/auth-abuse-guard'
import { logSecurityEvent } from '@/lib/security/security-event-service'
import { prisma } from '@/lib/db'
import { OtpPurpose } from '@prisma/client'

export async function POST(req: NextRequest) {
  try {
    const guard = await checkAuthAbuseGuard(req, {
      endpoint: '/api/auth/password-recovery/request',
      isHighRiskEndpoint: true,
    })

    if (!guard.allowed && guard.response) {
      return guard.response
    }

    const body = await req.json().catch(() => ({}))
    const { phone } = body

    const cleanPhone = (phone || '').trim().replace(/[^0-9+]/g, '')

    // Anti-enumeration uniform message
    const UNIFORM_MESSAGE = 'If an eligible Lumo account is linked to that number, a verification code will be sent.'

    if (cleanPhone.length >= 9) {
      // Find user using normalized Tanzanian phone matching
      const user = await prisma.user.findFirst({
        where: {
          OR: [
            { phone: cleanPhone },
            { phone: `+${cleanPhone}` },
            { phone: cleanPhone.replace(/^255/, '0') },
            { phone: cleanPhone.replace(/^0/, '255') },
            { phone: `+${cleanPhone.replace(/^0/, '255')}` },
          ],
        },
      })

      if (user && (user as any).accountStatus !== 'SUSPENDED') {
        const result = await issueOtpChallenge(cleanPhone, OtpPurpose.PASSWORD_RESET, user.id)

        await logSecurityEvent({
          eventType: 'PASSWORD_RECOVERY_REQUESTED',
          userId: user.id,
          endpoint: '/api/auth/password-recovery/request',
          purpose: OtpPurpose.PASSWORD_RESET,
          action: 'ALLOW',
          riskLevel: 'LOW',
          details: 'Password recovery OTP dispatched for eligible account.',
        })

        if (!result.success && result.error) {
          return NextResponse.json({ error: result.error, resendCooldownSeconds: result.resendCooldownSeconds || 60 }, { status: 400 })
        }

        return NextResponse.json({
          success: true,
          message: UNIFORM_MESSAGE,
          resendCooldownSeconds: result.resendCooldownSeconds || 60,
        })
      } else {
        await logSecurityEvent({
          eventType: 'PASSWORD_RECOVERY_UNKNOWN_TARGET',
          endpoint: '/api/auth/password-recovery/request',
          purpose: OtpPurpose.PASSWORD_RESET,
          action: 'UNIFORM_RESPONSE',
          riskLevel: 'LOW',
          details: 'Password recovery requested for unregistered target.',
        })
      }
    }

    return NextResponse.json({
      success: true,
      message: UNIFORM_MESSAGE,
      resendCooldownSeconds: 60,
    })
  } catch (error: any) {
    console.error('[API AUTH PASSWORD RECOVERY REQUEST ERROR]', error?.stack || error)
    return NextResponse.json(
      { error: error?.message || 'An error occurred while requesting password reset code. Please try again.' },
      { status: 500 }
    )
  }
}
