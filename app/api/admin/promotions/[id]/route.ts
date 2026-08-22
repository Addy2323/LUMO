import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { prisma } from '@/lib/db'
import { authorizeApiRequest } from '@/lib/auth/authorize'
import { Role } from '@prisma/client'
import {
  PromotionStatus,
  PromotionPlacement,
  PromotionAudience,
  DisplayFrequency,
} from '@/lib/promotions/types'
import { ensurePromotionsTable } from '@/lib/promotions/db-init'

const UpdatePromotionSchema = z.object({
  title: z.string().min(2, 'Title must be at least 2 characters').optional(),
  subtitle: z.string().optional().nullable(),
  description: z.string().min(5, 'Description must be at least 5 characters').optional(),
  desktopImageUrl: z.string().min(1, 'Desktop image URL is required').optional(),
  mobileImageUrl: z.string().optional().nullable(),
  imageAltText: z.string().optional().nullable(),
  buttonText: z.string().min(1, 'Primary button text is required').optional(),
  buttonUrl: z.string().min(1, 'Primary destination URL is required').optional(),
  secondaryButtonText: z.string().optional().nullable(),
  secondaryButtonUrl: z.string().optional().nullable(),
  backgroundColor: z.string().optional(),
  textColor: z.string().optional(),
  buttonColor: z.string().optional(),
  placement: z.nativeEnum(PromotionPlacement).optional(),
  status: z.nativeEnum(PromotionStatus).optional(),
  priority: z.number().int().min(0).max(100).optional(),
  audience: z.nativeEnum(PromotionAudience).optional(),
  displayFrequency: z.nativeEnum(DisplayFrequency).optional(),
  delaySeconds: z.number().int().min(0).max(60).optional(),
  startAt: z.string().or(z.date()).optional(),
  endAt: z.string().or(z.date()).optional(),
  timezone: z.string().optional(),
  dismissible: z.boolean().optional(),
  openInNewTab: z.boolean().optional(),
})

function validateSafeUrl(url?: string | null): boolean {
  if (!url) return true
  const trimmed = url.trim()
  return trimmed.startsWith('/') || trimmed.startsWith('https://')
}

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    await ensurePromotionsTable()

    const auth = await authorizeApiRequest(req, { allowedRoles: [Role.ADMIN] })
    if (!auth.authorized && process.env.NODE_ENV === 'production') {
      return auth.response || NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { id } = await params
    const promotion = await prisma.promotion.findUnique({
      where: { id },
      include: {
        createdBy: { select: { id: true, name: true, email: true } },
        publishedBy: { select: { id: true, name: true, email: true } },
        interactions: {
          orderBy: { occurredAt: 'desc' },
          take: 100,
        },
      },
    })

    if (!promotion) {
      return NextResponse.json({ error: 'Promotion not found' }, { status: 404 })
    }

    // Aggregate interactions by device
    const deviceCounts = await prisma.promotionInteraction.groupBy({
      by: ['deviceType', 'event'],
      where: { promotionId: id },
      _count: { _all: true },
    })

    // Calculate CTR
    const ctr = promotion.impressions > 0
      ? ((promotion.clicks / promotion.impressions) * 100).toFixed(2)
      : '0.00'

    return NextResponse.json({
      promotion,
      analytics: {
        ctr: `${ctr}%`,
        impressions: promotion.impressions,
        clicks: promotion.clicks,
        dismissals: promotion.dismissals,
        deviceBreakdown: deviceCounts,
      },
    })
  } catch (err) {
    console.error('[ADMIN GET PROMOTION DETAIL ERROR]', err)
    return NextResponse.json({ error: 'Failed to load promotion' }, { status: 500 })
  }
}

export async function PUT(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    await ensurePromotionsTable()

    const auth = await authorizeApiRequest(req, { allowedRoles: [Role.ADMIN] })
    if (!auth.authorized && process.env.NODE_ENV === 'production') {
      return auth.response || NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { id } = await params
    const existing = await prisma.promotion.findUnique({ where: { id } })
    if (!existing) {
      return NextResponse.json({ error: 'Promotion not found' }, { status: 404 })
    }

    const body = await req.json()
    const parsed = UpdatePromotionSchema.safeParse(body)

    if (!parsed.success) {
      return NextResponse.json(
        { error: 'Invalid promotion data', details: parsed.error.format() },
        { status: 400 }
      )
    }

    const data = parsed.data

    if (data.buttonUrl && !validateSafeUrl(data.buttonUrl)) {
      return NextResponse.json(
        { error: 'Primary button URL must start with "/" or "https://".' },
        { status: 400 }
      )
    }

    if (data.secondaryButtonUrl && !validateSafeUrl(data.secondaryButtonUrl)) {
      return NextResponse.json(
        { error: 'Secondary button URL must start with "/" or "https://".' },
        { status: 400 }
      )
    }

    const startDate = data.startAt ? new Date(data.startAt) : existing.startAt
    const endDate = data.endAt ? new Date(data.endAt) : existing.endAt

    if (endDate <= startDate) {
      return NextResponse.json({ error: 'Campaign end time must be later than start time.' }, { status: 400 })
    }

    const updateData: any = {
      ...data,
      startAt: startDate,
      endAt: endDate,
    }

    // If publishing now
    if (data.status === PromotionStatus.ACTIVE && existing.status !== PromotionStatus.ACTIVE) {
      updateData.publishedById = auth.user?.id || null
      updateData.publishedAt = new Date()
    }

    const updated = await prisma.promotion.update({
      where: { id },
      data: updateData,
    })

    // Log in AuditLog
    await prisma.auditLog.create({
      data: {
        userId: auth.user?.id || null,
        userRole: 'ADMIN',
        action: 'UPDATE_PROMOTION',
        targetResource: `Promotion:${id}`,
        details: JSON.stringify({ title: updated.title, status: updated.status }),
      },
    }).catch(() => {})

    return NextResponse.json({ success: true, promotion: updated })
  } catch (err) {
    console.error('[ADMIN UPDATE PROMOTION ERROR]', err)
    return NextResponse.json({ error: 'Failed to update promotion' }, { status: 500 })
  }
}

export async function DELETE(
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

    // If draft, delete record. If published/active, archive.
    if (existing.status === PromotionStatus.DRAFT) {
      await prisma.promotion.delete({ where: { id } })
    } else {
      await prisma.promotion.update({
        where: { id },
        data: { status: PromotionStatus.ARCHIVED },
      })
    }

    await prisma.auditLog.create({
      data: {
        userId: auth.user?.id || null,
        userRole: 'ADMIN',
        action: existing.status === PromotionStatus.DRAFT ? 'DELETE_PROMOTION_DRAFT' : 'ARCHIVE_PROMOTION',
        targetResource: `Promotion:${id}`,
        details: JSON.stringify({ title: existing.title }),
      },
    }).catch(() => {})

    return NextResponse.json({ success: true })
  } catch (err) {
    console.error('[ADMIN DELETE PROMOTION ERROR]', err)
    return NextResponse.json({ error: 'Failed to delete/archive promotion' }, { status: 500 })
  }
}
