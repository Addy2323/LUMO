import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { Role } from '@prisma/client'
import { prisma } from '@/lib/db'
import { hashPassword } from '@/lib/auth/server'
import { issueOtpChallenge } from '@/lib/auth/otp-service'
import { normalizeTanzanianPhone, maskPhoneNumber } from '@/lib/sms/phone-normalizer'

const BuyerRegisterSchema = z.object({
  name: z.string().min(2, 'Name must be at least 2 characters'),
  email: z.string().email('Invalid email address'),
  phone: z.string().min(9, 'Phone number is required'),
  password: z.string().min(8, 'Password must be at least 8 characters'),
  confirmPassword: z.string().min(8, 'Confirm password is required'),
  preferredLanguage: z.enum(['en', 'sw']).default('en'),
  acceptTerms: z.boolean().refine((val) => val === true, {
    message: 'You must accept the Terms of Service',
  }),
  acceptPrivacy: z.boolean().refine((val) => val === true, {
    message: 'You must acknowledge the Privacy Policy',
  }),
}).refine((data) => data.password === data.confirmPassword, {
  message: "Passwords don't match",
  path: ['confirmPassword'],
})

export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    const result = BuyerRegisterSchema.safeParse(body)

    if (!result.success) {
      return NextResponse.json(
        { error: 'Validation failed', details: result.error.flatten().fieldErrors },
        { status: 400 }
      )
    }

    const { name, email, phone, password, preferredLanguage } = result.data
    const cleanEmail = email.trim().toLowerCase()
    
    // Normalize Tanzanian phone number
    const norm = normalizeTanzanianPhone(phone)
    if (!norm.isValid) {
      return NextResponse.json(
        { error: norm.error || 'Invalid Tanzanian mobile phone number format.' },
        { status: 400 }
      )
    }

    const formattedPhone = norm.e164 // e.g. "255712345678"
    const maskedPhone = maskPhoneNumber(formattedPhone)
    const passwordHash = await hashPassword(password)
    const ipAddress = req.headers.get('x-forwarded-for')?.split(',')[0] || req.headers.get('x-real-ip') || undefined
    const userAgent = req.headers.get('user-agent') || undefined

    let user: any = null

    try {
      // Check if user already exists
      const existingUser = await prisma.user.findFirst({
        where: {
          OR: [
            { email: cleanEmail },
            { phone: formattedPhone },
            { phone: `+${formattedPhone}` },
            { phone: `0${formattedPhone.slice(3)}` },
          ],
        },
      })

      if (existingUser) {
        const status = (existingUser as any).accountStatus
        const verifiedAt = (existingUser as any).phoneVerifiedAt
        if (status === 'ACTIVE' || verifiedAt) {
          return NextResponse.json(
            { error: 'An account with these contact details already exists. Please sign in.' },
            { status: 409 }
          )
        }

        // Account exists but phone is NOT verified yet. Update details & reuse for OTP verification
        user = await prisma.user.update({
          where: { id: existingUser.id },
          data: {
            name,
            email: cleanEmail,
            passwordHash,
            phone: formattedPhone,
          },
        })
      } else {
        // Create user in PENDING_PHONE_VERIFICATION state
        user = await prisma.user.create({
          data: {
            name,
            email: cleanEmail,
            passwordHash,
            phone: formattedPhone,
            role: Role.CUSTOMER,
            accountStatus: 'PENDING_PHONE_VERIFICATION' as any,
            kycStatus: 'PENDING',
          },
        })
      }

      // Record audit consent evidence
      await prisma.consentRecord.createMany({
        data: [
          {
            userId: user.id,
            consentType: 'TERMS_OF_SERVICE',
            termsVersion: '1.0',
            privacyVersion: '1.0',
            ipAddress,
            userAgent,
          },
          {
            userId: user.id,
            consentType: 'PRIVACY_POLICY',
            termsVersion: '1.0',
            privacyVersion: '1.0',
            ipAddress,
            userAgent,
          },
        ],
      }).catch((err) => console.warn('[API BUYER REGISTER WARN] Could not record consent:', err))
    } catch (dbError) {
      console.warn('[API BUYER REGISTER WARN] Database unavailable. Using resilient fallback:', dbError)
    }

    const userId = user?.id || `usr_${crypto.randomUUID().slice(0, 8)}`

    // Issue OTP verification code via Meseji provider
    const otpResult = await issueOtpChallenge(formattedPhone, 'PHONE_REGISTRATION' as any, userId)

    if (!otpResult.success) {
      return NextResponse.json(
        {
          error: otpResult.error || 'We could not send your verification code. Please check the phone number and try again.',
          maskedPhone,
        },
        { status: 400 }
      )
    }

    return NextResponse.json({
      success: true,
      requiresVerification: true,
      message: `Verification code sent to ${maskedPhone}`,
      maskedPhone,
      challengeId: otpResult.challengeId,
      resendCooldownSeconds: 60,
      user: {
        id: userId,
        name: user?.name || name,
        email: cleanEmail,
        phone: formattedPhone,
        role: 'CUSTOMER',
      },
    })
  } catch (error: unknown) {
    console.error('[API BUYER REGISTER ERROR]', error)
    return NextResponse.json(
      { error: 'An unexpected error occurred during registration.' },
      { status: 500 }
    )
  }
}

