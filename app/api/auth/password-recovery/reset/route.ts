import { NextRequest, NextResponse } from 'next/server'
import {
  verifyPasswordResetTokenCookie,
  clearPasswordResetTokenCookie,
  revokeAllUserSessions,
  hashPassword,
} from '@/lib/auth/server'
import { checkAuthAbuseGuard } from '@/lib/security/auth-abuse-guard'
import { logSecurityEvent } from '@/lib/security/security-event-service'
import { prisma } from '@/lib/db'

export async function POST(req: NextRequest) {
  try {
    const guard = await checkAuthAbuseGuard(req, {
      endpoint: '/api/auth/password-recovery/reset',
      isHighRiskEndpoint: true,
    })

    if (!guard.allowed && guard.response) {
      return guard.response
    }

    // Origin / CSRF protection
    const origin = req.headers.get('origin')
    const host = req.headers.get('host')
    if (origin && host && !origin.includes(host)) {
      return NextResponse.json({ error: 'Origin validation failed for security request.' }, { status: 403 })
    }

    const resetAuth = await verifyPasswordResetTokenCookie()
    if (!resetAuth) {
      return NextResponse.json(
        { error: 'Password reset authorization invalid or expired. Please request a new recovery code.' },
        { status: 401 }
      )
    }

    const body = await req.json().catch(() => ({}))
    const { newPassword } = body

    if (!newPassword || typeof newPassword !== 'string' || newPassword.length < 12) {
      return NextResponse.json(
        { error: 'New password must be at least 12 characters long.' },
        { status: 400 }
      )
    }

    const newHash = await hashPassword(newPassword)

    // Update password in DB
    await prisma.user.update({
      where: { id: resetAuth.userId },
      data: {
        passwordHash: newHash,
        passwordChangedAt: new Date(),
      },
    })

    // Security mandate: Revoke all existing sessions and refresh tokens
    await revokeAllUserSessions(resetAuth.userId)

    // Clear single-use reset authorization cookie
    await clearPasswordResetTokenCookie(resetAuth.authId)

    await logSecurityEvent({
      eventType: 'PASSWORD_RESET_SUCCESSFUL',
      userId: resetAuth.userId,
      endpoint: '/api/auth/password-recovery/reset',
      action: 'REVOKE_SESSIONS_AND_RESET',
      riskLevel: 'LOW',
      details: 'Password updated successfully. All user sessions revoked.',
    })

    return NextResponse.json({
      success: true,
      message: 'Your password has been reset successfully. Please sign in with your new password.',
      redirect: '/auth/login',
    })
  } catch (error: any) {
    console.error('[API AUTH PASSWORD RECOVERY RESET ERROR]', error)
    return NextResponse.json(
      { error: 'An error occurred while resetting your password. Please try again.' },
      { status: 500 }
    )
  }
}
