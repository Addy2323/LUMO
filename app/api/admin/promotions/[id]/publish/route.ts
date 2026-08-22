import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db'
import { authorizeApiRequest } from '@/lib/auth/authorize'
import { Role } from '@prisma/client'
import { PromotionStatus } from '@/lib/promotions/types'

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const auth = await authorizeApiRequest(req, { allowedRoles: [Role.ADMIN] })
    if (!auth.authorized && process.env.NODE_ENV === 'production') {
      return auth.response || NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { id } = await params
    const existing = await prisma.promotion.findUnique({ where: { id } })
    if (!existing) {
      return NextResponse.json({ error: 'Promotion not found' }, { status: 404 })
    }

    const now = new Date()
    const updated = await prisma.promotion.update({
      where: { id },
      data: {
        status: PromotionStatus.ACTIVE,
        publishedById: auth.user?.id || null,
        publishedAt: now,
        startAt: existing.startAt > now ? now : existing.startAt,
      },
    })

    await prisma.auditLog.create({
      data: {
        userId: auth.user?.id || null,
        userRole: 'ADMIN',
        action: 'PUBLISH_PROMOTION_IMMEDIATELY',
        targetResource: `Promotion:${id}`,
        details: JSON.stringify({ title: updated.title }),
      },
    }).catch(() => {})

    return NextResponse.json({ success: true, promotion: updated })
  } catch (err) {
    console.error('[ADMIN PUBLISH PROMOTION ERROR]', err)
    return NextResponse.json({ error: 'Failed to publish promotion' }, { status: 500 })
  }
}
