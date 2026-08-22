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
    const tomorrow = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000)

    const duplicated = await prisma.promotion.create({
      data: {
        title: `[Copy] ${existing.title}`,
        subtitle: existing.subtitle,
        description: existing.description,
        desktopImageUrl: existing.desktopImageUrl,
        mobileImageUrl: existing.mobileImageUrl,
        imageAltText: existing.imageAltText,
        buttonText: existing.buttonText,
        buttonUrl: existing.buttonUrl,
        secondaryButtonText: existing.secondaryButtonText,
        secondaryButtonUrl: existing.secondaryButtonUrl,
        backgroundColor: existing.backgroundColor,
        textColor: existing.textColor,
        buttonColor: existing.buttonColor,
        placement: existing.placement,
        status: PromotionStatus.DRAFT,
        priority: existing.priority,
        audience: existing.audience,
        displayFrequency: existing.displayFrequency,
        delaySeconds: existing.delaySeconds,
        startAt: now,
        endAt: tomorrow,
        timezone: existing.timezone,
        dismissible: existing.dismissible,
        openInNewTab: existing.openInNewTab,
        createdById: auth.user?.id || null,
      },
    })

    await prisma.auditLog.create({
      data: {
        userId: auth.user?.id || null,
        userRole: 'ADMIN',
        action: 'DUPLICATE_PROMOTION',
        targetResource: `Promotion:${duplicated.id}`,
        details: JSON.stringify({ originalId: id, newTitle: duplicated.title }),
      },
    }).catch(() => {})

    return NextResponse.json({ success: true, promotion: duplicated })
  } catch (err) {
    console.error('[ADMIN DUPLICATE PROMOTION ERROR]', err)
    return NextResponse.json({ error: 'Failed to duplicate promotion' }, { status: 500 })
  }
}
