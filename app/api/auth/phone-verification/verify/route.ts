import { NextRequest, NextResponse } from 'next/server'
import { getAuthenticatedUser, rotateSession } from '@/lib/auth/server'
import { verifyOtpChallenge } from '@/lib/auth/otp-service'
import { checkAuthAbuseGuard } from '@/lib/security/auth-abuse-guard'
import { logSecurityEvent } from '@/lib/security/security-event-service'
import { prisma } from '@/lib/db'
import { OtpPurpose, AccountStatus } from '@prisma/client'

export async function POST(req: NextRequest) {
  const guard = await checkAuthAbuseGuard(req, {
    endpoint: '/api/auth/phone-verification/verify',
    isHighRiskEndpoint: true,
  })

  if (!guard.allowed && guard.response) {
    return guard.response
  }

  const auth = await getAuthenticatedUser(req)
  if (!auth || !auth.user.phone) {
    return NextResponse.json({ error: 'Unauthorized or missing phone number' }, { status: 401 })
  }

  const body = await req.json().catch(() => ({}))
  const { code } = body

  if (!code || typeof code !== 'string' || code.trim().length !== 6) {
    return NextResponse.json({ error: 'Valid 6-digit verification code is required.' }, { status: 400 })
  }

  const verifyResult = await verifyOtpChallenge(
    auth.user.phone,
    code,
    OtpPurpose.PHONE_REGISTRATION,
    auth.user.id
  )

  if (!verifyResult.success) {
    await logSecurityEvent({
      eventType: 'PHONE_VERIFICATION_FAILED',
      userId: auth.user.id,
      endpoint: '/api/auth/phone-verification/verify',
      purpose: OtpPurpose.PHONE_REGISTRATION,
      action: 'REJECT',
      riskLevel: 'MEDIUM',
      details: verifyResult.error,
    })
    return NextResponse.json({ error: verifyResult.error }, { status: 400 })
  }

  // Update User state
  await prisma.user.update({
    where: { id: auth.user.id },
    data: {
      phoneVerifiedAt: new Date(),
      accountStatus: AccountStatus.ACTIVE,
    },
  })

  // Rotate session ID to prevent session fixation
  await rotateSession(auth.user.id, auth.user.role, auth.user.email, auth.sessionToken)

  await logSecurityEvent({
    eventType: 'PHONE_VERIFIED',
    userId: auth.user.id,
    endpoint: '/api/auth/phone-verification/verify',
    purpose: OtpPurpose.PHONE_REGISTRATION,
    action: 'ALLOW',
    riskLevel: 'LOW',
    details: 'Phone number verified successfully. Account activated.',
  })

  return NextResponse.json({
    success: true,
    message: 'Phone number verified successfully. Your account is now active.',
  })
}
