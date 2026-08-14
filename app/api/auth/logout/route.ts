import { NextResponse } from 'next/server'
import { revokeCurrentSession } from '@/lib/auth/server'

export async function POST() {
  try {
    await revokeCurrentSession()
    return NextResponse.json({
      success: true,
      message: 'Logged out successfully.',
    })
  } catch (error: any) {
    console.error('[API AUTH LOGOUT ERROR]', error)
    return NextResponse.json({ error: 'Internal server error during logout.' }, { status: 500 })
  }
}
