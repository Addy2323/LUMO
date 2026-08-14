import { NextRequest, NextResponse } from 'next/server'
import { getAuthenticatedUser } from '@/lib/auth/server'
import { WebAuthnService } from '@/lib/auth/webauthn-service'
import { Role } from '@prisma/client'

export async function POST(req: NextRequest) {
  const auth = await getAuthenticatedUser(req)
  if (!auth || auth.user.role !== Role.ADMIN) {
    return NextResponse.json({ error: 'WebAuthn passkey registration requires ADMIN role privileges.' }, { status: 403 })
  }

  const options = await WebAuthnService.generateRegistrationOptions(auth.user.id)
  return NextResponse.json(options)
}
