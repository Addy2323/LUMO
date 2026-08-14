import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { Role, AccountStatus, OtpPurpose } from '@prisma/client'
import { prisma } from '@/lib/db'
import { hashPassword, createSession } from '@/lib/auth/server'
import { issueOtpChallenge } from '@/lib/auth/otp-service'
import { checkAuthAbuseGuard } from '@/lib/security/auth-abuse-guard'
import { logSecurityEvent } from '@/lib/security/security-event-service'

const RegisterSchema = z.object({
  name: z.string().min(2, 'Name must be at least 2 characters'),
  email: z.string().email('Invalid email address'),
  password: z.string().min(8, 'Password must be at least 8 characters'),
  phone: z.string().optional(),
  companyName: z.string().optional(),
  role: z.enum(['BUYER', 'SUPPLIER', 'SALES', 'LOGISTICS', 'AGENT']).default('BUYER'),
})

export async function POST(req: NextRequest) {
  try {
    const guard = await checkAuthAbuseGuard(req, {
      endpoint: '/api/auth/register',
      isHighRiskEndpoint: false,
    })

    if (!guard.allowed && guard.response) {
      return guard.response
    }

    const body = await req.json()
    const result = RegisterSchema.safeParse(body)

    if (!result.success) {
      return NextResponse.json(
        { error: 'Validation failed', details: result.error.flatten().fieldErrors },
        { status: 400 }
      )
    }

    const { name, email, password, phone, companyName, role } = result.data
    const cleanEmail = email.trim().toLowerCase()
    const cleanPhone = phone ? phone.trim().replace(/[^0-9+]/g, '') : null

    const passwordHash = await hashPassword(password)
    const userRole = role as Role
    let user: any = null

    const existingUser = await prisma.user.findFirst({
      where: {
        OR: [
          { email: cleanEmail },
          ...(cleanPhone ? [{ phone: cleanPhone }] : []),
        ],
      },
    })

    if (existingUser) {
      const status = (existingUser as any).accountStatus
      const verifiedAt = (existingUser as any).phoneVerifiedAt
      if (status === 'ACTIVE' || verifiedAt) {
        return NextResponse.json(
          { error: 'An account with this email or phone number already exists. Please sign in.' },
          { status: 409 }
        )
      }

      // Unverified account exists: update password & details to allow OTP completion
      user = await prisma.user.update({
        where: { id: existingUser.id },
        data: {
          name,
          email: cleanEmail,
          passwordHash,
          phone: cleanPhone,
          companyName: companyName || null,
        },
      })
    } else {
      // Create account in PENDING_PHONE_VERIFICATION state
      user = await prisma.user.create({
        data: {
          name,
          email: cleanEmail,
          passwordHash,
          phone: cleanPhone,
          companyName: companyName || null,
          role: userRole,
          accountStatus: AccountStatus.PENDING_PHONE_VERIFICATION,
          kycStatus: (role === 'SUPPLIER' || role === 'LOGISTICS') ? 'PENDING' : 'VERIFIED',
        },
      })
    }

    if (role === 'SUPPLIER' || role === 'LOGISTICS') {
      await prisma.partnerApplication.create({
        data: {
          userId: user.id,
          applicationType: role === 'SUPPLIER' ? 'SUPPLIER' : 'LOGISTICS',
          status: 'SUBMITTED',
          draftData: {
            name,
            email: cleanEmail,
            phone: cleanPhone,
            companyName: companyName || name,
          },
        },
      }).catch((err) => console.warn('[API AUTH REGISTER WARN] Could not create partnerApplication:', err))

      if (role === 'SUPPLIER') {
        await prisma.supplier.create({
          data: {
            userId: user.id,
            companyName: companyName || name,
            country: 'Tanzania',
            verified: false,
          },
        }).catch((err) => console.warn('[API AUTH REGISTER WARN] Could not create supplier profile record:', err))
      }
    }

    const userAgent = req.headers.get('user-agent') || undefined
    const ipAddress = req.headers.get('x-forwarded-for')?.split(',')[0] || undefined

    await createSession(user.id, userRole, cleanEmail, userAgent, ipAddress)

    // Issue phone verification OTP if phone provided
    if (cleanPhone) {
      await issueOtpChallenge(cleanPhone, OtpPurpose.PHONE_REGISTRATION, user.id).catch(() => {})
    }

    await logSecurityEvent({
      eventType: 'ACCOUNT_REGISTERED',
      userId: user.id,
      endpoint: '/api/auth/register',
      action: 'ALLOW',
      riskLevel: 'LOW',
      details: 'User account created in PENDING_PHONE_VERIFICATION state.',
    })

    return NextResponse.json({
      success: true,
      message: 'Account created. Please verify your phone number.',
      requirePhoneVerification: true,
      redirect: '/auth/verify-phone',
      user: {
        id: user.id,
        name: user.name,
        email: cleanEmail,
        role: userRole,
        phone: cleanPhone,
      },
    })
  } catch (error: unknown) {
    console.error('[API AUTH REGISTER ERROR]', error)
    return NextResponse.json({ error: 'Internal server error during registration.' }, { status: 500 })
  }
}
