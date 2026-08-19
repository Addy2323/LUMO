import { NextRequest, NextResponse } from 'next/server'
import { authorizeApiRequest } from '@/lib/auth/authorize'
import { prisma } from '@/lib/prisma'

export async function GET(req: NextRequest) {
  const auth = await authorizeApiRequest(req)
  if (!auth.authorized) return auth.response!

  const { user } = auth

  let profile = await (prisma as any).agentProfile?.findUnique({
    where: { userId: user.id },
  })

  if (!profile) {
    profile = {
      id: `agent-${user.id.slice(-6)}`,
      userId: user.id,
      agentCode: `AG-${user.name.slice(0, 3).toUpperCase()}-01`,
      fullName: user.name,
      phone: user.phone || '+255 700 000 000',
      activeHub: 'China',
      allowedHubs: ['China', 'Dubai', 'Turkey', 'India'],
      status: 'APPROVED',
      gpsLocation: 'Guangzhou Sourcing Center (23.1291° N, 113.2644° E)',
    }
  }

  return NextResponse.json({ success: true, profile })
}

export async function POST(req: NextRequest) {
  const auth = await authorizeApiRequest(req)
  if (!auth.authorized) return auth.response!

  const { user } = auth
  const body = await req.json()
  const { activeHub } = body

  if (!['China', 'Dubai', 'Turkey', 'India'].includes(activeHub)) {
    return NextResponse.json({ error: 'Unauthorized or invalid country hub' }, { status: 400 })
  }

  let profile = null
  try {
    profile = await (prisma as any).agentProfile?.upsert({
      where: { userId: user.id },
      update: { activeHub },
      create: {
        userId: user.id,
        agentCode: `AG-${user.name.slice(0, 3).toUpperCase()}-01`,
        fullName: user.name,
        activeHub,
        allowedHubs: ['China', 'Dubai', 'Turkey', 'India'],
      },
    })
  } catch (e) {
    profile = { activeHub }
  }

  return NextResponse.json({ success: true, activeHub, profile })
}
