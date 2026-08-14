import { NextRequest, NextResponse } from 'next/server'
import { getAuthenticatedUser } from '@/lib/auth/server'

export async function GET(req: NextRequest) {
  try {
    const session = await getAuthenticatedUser(req)

    if (!session) {
      return NextResponse.json({ authenticated: false, user: null }, { status: 401 })
    }

    return NextResponse.json({
      authenticated: true,
      user: session.user,
    })
  } catch (error: any) {
    console.error('[API AUTH SESSION ERROR]', error)
    return NextResponse.json({ error: 'Internal server error checking session.' }, { status: 500 })
  }
}
