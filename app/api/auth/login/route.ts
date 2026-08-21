import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { prisma } from '@/lib/db'
import { verifyPassword, createSession, DUMMY_PASSWORD_HASH, rotateSession } from '@/lib/auth/server'
import { checkAuthAbuseGuard } from '@/lib/security/auth-abuse-guard'
import { logSecurityEvent } from '@/lib/security/security-event-service'
import { AccountStatus, Role } from '@prisma/client'

const LoginSchema = z.object({
  email: z.string().email('Invalid email address'),
  password: z.string().min(1, 'Password is required'),
})

export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    const parseResult = LoginSchema.safeParse(body)

    if (!parseResult.success) {
      return NextResponse.json({ error: 'Invalid login credentials format' }, { status: 400 })
    }

    const { email, password } = parseResult.data
    const cleanEmail = email.trim().toLowerCase()

    // 1. Abuse & Rate Limit Guard
    const guard = await checkAuthAbuseGuard(req, {
      endpoint: '/api/auth/login',
      accountOrPhone: cleanEmail,
      isHighRiskEndpoint: false,
    })

    if (!guard.allowed && guard.response) {
      return guard.response
    }

    const userAgent = req.headers.get('user-agent') || undefined
    const ipAddress = req.headers.get('x-forwarded-for')?.split(',')[0] || undefined

    const user = await prisma.user.findUnique({
      where: { email: cleanEmail },
      include: {
        webAuthnCredentials: {
          where: { revokedAt: null },
        },
      },
    })

    // Check account hold until
    if (user?.authenticationHoldUntil && user.authenticationHoldUntil > new Date()) {
      const holdSeconds = Math.ceil((user.authenticationHoldUntil.getTime() - Date.now()) / 1000)
      return NextResponse.json(
        { error: `Account security hold active. Please try again in ${holdSeconds} seconds.` },
        { status: 429, headers: { 'Retry-After': String(holdSeconds) } }
      )
    }

    let isValid = false

    if (user && user.passwordHash) {
      isValid = await verifyPassword(password, user.passwordHash)
    } else {
      // Dummy verification using the central function & fixed server dummy hash to normalize timing
      await verifyPassword(password, DUMMY_PASSWORD_HASH)
    }

    if (!user || !isValid) {
      await logSecurityEvent({
        eventType: 'LOGIN_FAILED',
        endpoint: '/api/auth/login',
        action: 'REJECT',
        riskLevel: 'LOW',
        details: 'Invalid credentials submitted.',
      })
      return NextResponse.json({ error: 'Invalid email or password.' }, { status: 401 })
    }

    // Account Status & Phone Verification check
    if (user.accountStatus === AccountStatus.SUSPENDED) {
      return NextResponse.json({ error: 'Account suspended. Please contact support.' }, { status: 403 })
    }

    // Role-specific verification check
    if (user.role === Role.SUPPLIER || user.role === Role.LOGISTICS) {
      if (user.kycStatus === 'PENDING') {
        return NextResponse.json(
          { error: 'Your application is under review. You will be able to sign in once verified by an administrator.' },
          { status: 403 }
        )
      }
    }

    // WebAuthn MFA check for ADMIN role
    if (user.role === Role.ADMIN && user.webAuthnCredentials.length > 0) {
      return NextResponse.json({
        success: true,
        requirePasskeyMfa: true,
        userId: user.id,
        message: 'Passkey MFA required for administrator access.',
      })
    }

    // Check if phone verification is pending
    if (user.accountStatus === AccountStatus.PENDING_PHONE_VERIFICATION || !user.phoneVerifiedAt) {
      await createSession(user.id, user.role, user.email, userAgent, ipAddress)
      return NextResponse.json({
        success: true,
        requirePhoneVerification: true,
        redirect: '/auth/verify-phone',
        message: 'Phone verification required before accessing dashboard.',
        user: {
          id: user.id,
          name: user.name,
          email: user.email,
          role: user.role,
          kycStatus: user.kycStatus,
          phone: user.phone || '',
          companyName: user.companyName || '',
        },
      })
    }

    // Create session & update last login timestamp
    await createSession(user.id, user.role, user.email, userAgent, ipAddress)
    await prisma.user.update({
      where: { id: user.id },
      data: { lastSuccessfulLoginAt: new Date() },
    })

    await logSecurityEvent({
      eventType: 'LOGIN_SUCCESSFUL',
      userId: user.id,
      endpoint: '/api/auth/login',
      action: 'ALLOW',
      riskLevel: 'LOW',
      details: 'User authenticated successfully.',
    })

    return NextResponse.json({
      success: true,
      message: 'Logged in successfully.',
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        role: user.role,
        kycStatus: user.kycStatus,
        phone: user.phone || '',
        companyName: user.companyName || '',
      },
    })
  } catch (error: any) {
    console.error('[API AUTH LOGIN ERROR]', error)
    return NextResponse.json({ error: 'Internal server error during login.' }, { status: 500 })
  }
}
