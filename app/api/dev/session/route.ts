import { NextRequest, NextResponse } from 'next/server'
import { createSession } from '@/lib/auth/server'
import { Role } from '@prisma/client'

export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    const roleInput = (body.role || 'ADMIN').toUpperCase()

    let mappedRole: Role = Role.BUYER
    if (roleInput === 'ADMIN') mappedRole = Role.ADMIN
    else if (roleInput === 'SUPPLIER') mappedRole = Role.SUPPLIER
    else if (roleInput === 'SALES') mappedRole = Role.SALES
    else if (roleInput === 'LOGISTICS') mappedRole = Role.LOGISTICS
    else if (roleInput === 'AGENT') mappedRole = Role.SALES

    const email = body.email || `${mappedRole.toLowerCase()}@lumo.co.tz`
    const userId = body.userId || `dev_${mappedRole.toLowerCase()}_001`
    const userAgent = req.headers.get('user-agent') || undefined
    const ipAddress = req.headers.get('x-forwarded-for')?.split(',')[0] || undefined

    const session = await createSession(userId, mappedRole, email, userAgent, ipAddress)

    return NextResponse.json({
      success: true,
      message: `Dev session established for role: ${mappedRole}`,
      role: mappedRole,
      token: session.token,
    })
  } catch (error) {
    console.error('[DEV SESSION ERROR]', error)
    return NextResponse.json({ error: 'Failed to issue dev session cookie' }, { status: 500 })
  }
}
