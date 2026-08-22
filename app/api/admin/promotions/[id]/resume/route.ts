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
    const targetStatus = existing.startAt <= now && existing.endAt > now ? PromotionStatus.ACTIVE : PromotionStatus.SCHEDULED

    const updated = await prisma.promotion.update({
      where: { id },
      data: { status: targetStatus },
    })

    await prisma.auditLog.create({
      data: {
        userId: auth.user?.id || null,
        userRole: 'ADMIN',
        action: 'RESUME_PROMOTION',
        targetResource: `Promotion:${id}`,
        details: JSON.stringify({ title: updated.title, newStatus: targetStatus }),
      },
    }).catch(() => {})

    return NextResponse.json({ success: true, promotion: updated })
  } catch (err) {
    console.error('[ADMIN RESUME PROMOTION ERROR]', err)
    return NextResponse.json({ error: 'Failed to resume promotion' }, { status: 500 })
  }
}
