import { NextRequest, NextResponse } from 'next/server'
import { WebAuthnService } from '@/lib/auth/webauthn-service'

export async function POST(req: NextRequest) {
  const body = await req.json().catch(() => ({}))
  const { userId } = body

  if (!userId) {
    return NextResponse.json({ error: 'User ID is required for WebAuthn login options.' }, { status: 400 })
  }

  const options = await WebAuthnService.generateLoginOptions(userId)
  return NextResponse.json(options)
}
