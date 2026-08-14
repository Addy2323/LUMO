import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import crypto from 'crypto'
import { prisma } from '@/lib/db'
import { issueOtp } from '@/lib/auth/otp-service'

const ForgotSchema = z.object({
  email: z.string().email('Invalid email address'),
})

export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    const result = ForgotSchema.safeParse(body)

    if (!result.success) {
      return NextResponse.json({ error: 'Invalid email address' }, { status: 400 })
    }

    const { email } = result.data
    const cleanEmail = email.trim().toLowerCase()

    const user = await prisma.user.findUnique({
      where: { email: cleanEmail },
    })

    // To prevent email enumeration, return success response even if user is not found
    if (!user) {
      return NextResponse.json({
        success: true,
        message: 'If an account with that email exists, password reset instructions have been sent.',
      })
    }

    // Issue OTP or reset token
    if (user.phone) {
      await issueOtp(user.phone, 'RESET').catch(() => {})
    } else {
      await issueOtp(user.email, 'RESET').catch(() => {})
    }

    return NextResponse.json({
      success: true,
      message: 'If an account with that email exists, password reset instructions have been sent.',
    })
  } catch (error: any) {
    console.error('[API AUTH FORGOT PASSWORD ERROR]', error)
    return NextResponse.json({ error: 'Internal server error requesting password reset' }, { status: 500 })
  }
}
