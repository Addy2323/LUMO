import { NextRequest, NextResponse } from 'next/server'
import { getAuthenticatedUser } from '@/lib/auth/server'
import { WebAuthnService } from '@/lib/auth/webauthn-service'
import { Role } from '@prisma/client'

export async function POST(req: NextRequest) {
  const auth = await getAuthenticatedUser(req)
  if (!auth || auth.user.role !== Role.ADMIN) {
    return NextResponse.json({ error: 'WebAuthn passkey registration requires ADMIN role privileges.' }, { status: 403 })
  }

  const body = await req.json().catch(() => ({}))
  const { challenge, credentialId, publicKey, deviceLabel } = body

  if (!challenge || !credentialId || !publicKey) {
    return NextResponse.json({ error: 'Missing WebAuthn registration parameters.' }, { status: 400 })
  }

  const result = await WebAuthnService.verifyRegistration(
    auth.user.id,
    challenge,
    credentialId,
    publicKey,
    deviceLabel
  )

  if (!result.success) {
    return NextResponse.json({ error: result.error }, { status: 400 })
  }

  return NextResponse.json({ success: true, message: 'Passkey registered successfully.' })
}
