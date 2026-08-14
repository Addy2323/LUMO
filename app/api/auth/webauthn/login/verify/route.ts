import { NextRequest, NextResponse } from 'next/server'
import { WebAuthnService } from '@/lib/auth/webauthn-service'
import { createSession } from '@/lib/auth/server'
import { prisma } from '@/lib/db'
import { Role } from '@prisma/client'

export async function POST(req: NextRequest) {
  const body = await req.json().catch(() => ({}))
  const { userId, challenge, credentialId, signCounter } = body

  if (!userId || !challenge || !credentialId) {
    return NextResponse.json({ error: 'Missing WebAuthn verification parameters.' }, { status: 400 })
  }

  const result = await WebAuthnService.verifyLogin(
    userId,
    challenge,
    credentialId,
    Number(signCounter || 0)
  )

  if (!result.success) {
    return NextResponse.json({ error: result.error }, { status: 401 })
  }

  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { id: true, email: true, role: true },
  })

  if (!user || user.role !== Role.ADMIN) {
    return NextResponse.json({ error: 'Passkey login valid only for ADMIN users.' }, { status: 403 })
  }

  // Create session for admin
  await createSession(user.id, user.role, user.email)

  return NextResponse.json({
    success: true,
    message: 'Passkey MFA authentication successful.',
    redirect: '/admin',
  })
}
