import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { prisma } from '@/lib/db'
import { hashPassword } from '@/lib/auth/server'
import { verifyOtpCode } from '@/lib/auth/otp-service'

const ResetPasswordSchema = z.object({
  identifier: z.string().min(3, 'Email or phone is required'),
  code: z.string().length(6, 'Verification code must be 6 digits'),
  newPassword: z.string().min(8, 'New password must be at least 8 characters'),
})

export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    const result = ResetPasswordSchema.safeParse(body)

    if (!result.success) {
      return NextResponse.json({ error: 'Validation failed', details: result.error.flatten() }, { status: 400 })
    }

    const { identifier, code, newPassword } = result.data
    const outcome = await verifyOtpCode(identifier, code, 'RESET')

    if (!outcome.success) {
      return NextResponse.json({ error: outcome.error }, { status: 400 })
    }

    const cleanId = identifier.trim().toLowerCase()
    const user = await prisma.user.findFirst({
      where: {
        OR: [{ email: cleanId }, { phone: cleanId }],
      },
    })

    if (!user) {
      return NextResponse.json({ error: 'Account not found.' }, { status: 404 })
    }

    const newPasswordHash = await hashPassword(newPassword)

    await prisma.user.update({
      where: { id: user.id },
      data: { passwordHash: newPasswordHash },
    })

    // Invalidate all existing sessions for this user for security
    await prisma.session.deleteMany({
      where: { userId: user.id },
    }).catch(() => {})

    return NextResponse.json({
      success: true,
      message: 'Password reset successfully. Please sign in with your new password.',
    })
  } catch (error: unknown) {
    console.error('[API AUTH RESET PASSWORD ERROR]', error)
    return NextResponse.json({ error: 'Internal server error resetting password' }, { status: 500 })
  }
}
