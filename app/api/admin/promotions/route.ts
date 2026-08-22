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

const CreatePromotionSchema = z.object({
  title: z.string().min(2, 'Title must be at least 2 characters'),
  subtitle: z.string().optional().nullable(),
  description: z.string().min(5, 'Description must be at least 5 characters'),
  desktopImageUrl: z.string().min(1, 'Desktop image URL is required'),
  mobileImageUrl: z.string().optional().nullable(),
  imageAltText: z.string().optional().nullable(),
  buttonText: z.string().min(1, 'Primary button text is required').default('Explore the Offer'),
  buttonUrl: z.string().min(1, 'Primary destination URL is required').default('/marketplace'),
  secondaryButtonText: z.string().optional().nullable(),
  secondaryButtonUrl: z.string().optional().nullable(),
  backgroundColor: z.string().default('#FFF8F2'),
  textColor: z.string().default('#0B1F3A'),
  buttonColor: z.string().default('#FF6B00'),
  placement: z.nativeEnum(PromotionPlacement).default(PromotionPlacement.ENTRY_POPUP),
  status: z.nativeEnum(PromotionStatus).default(PromotionStatus.DRAFT),
  priority: z.number().int().min(0).max(100).default(0),
  audience: z.nativeEnum(PromotionAudience).default(PromotionAudience.ALL_VISITORS),
  displayFrequency: z.nativeEnum(DisplayFrequency).default(DisplayFrequency.EVERY_VISIT),
  delaySeconds: z.number().int().min(0).max(60).default(2),
  startAt: z.string().or(z.date()),
  endAt: z.string().or(z.date()),
  timezone: z.string().default('Africa/Dar_es_Salaam'),
  dismissible: z.boolean().default(true),
  openInNewTab: z.boolean().default(false),
})

function validateSafeUrl(url?: string | null): boolean {
  if (!url) return true
  const trimmed = url.trim()
  return trimmed.startsWith('/') || trimmed.startsWith('https://')
}

export async function GET(req: NextRequest) {
  try {
    const auth = await authorizeApiRequest(req, { allowedRoles: [Role.ADMIN] })
    if (!auth.authorized && process.env.NODE_ENV === 'production') {
      return auth.response || NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { searchParams } = new URL(req.url)
    const search = searchParams.get('search') || ''
    const statusParam = searchParams.get('status')
    const placementParam = searchParams.get('placement')

    const where: any = {}

    if (statusParam && Object.values(PromotionStatus).includes(statusParam as PromotionStatus)) {
      where.status = statusParam as PromotionStatus
    }

    if (placementParam && Object.values(PromotionPlacement).includes(placementParam as PromotionPlacement)) {
      where.placement = placementParam as PromotionPlacement
    }

    if (search.trim()) {
      where.OR = [
        { title: { contains: search, mode: 'insensitive' } },
        { subtitle: { contains: search, mode: 'insensitive' } },
        { description: { contains: search, mode: 'insensitive' } },
      ]
    }

    const now = new Date()

    const [promotions, totalCount, activeCount, stats] = await Promise.all([
      prisma.promotion.findMany({
        where,
        include: {
          createdBy: { select: { id: true, name: true, email: true } },
          publishedBy: { select: { id: true, name: true, email: true } },
        },
        orderBy: [{ priority: 'desc' }, { createdAt: 'desc' }],
      }),
      prisma.promotion.count(),
      prisma.promotion.count({
        where: {
          status: PromotionStatus.ACTIVE,
          startAt: { lte: now },
          endAt: { gt: now },
        },
      }),
      prisma.promotion.aggregate({
        _sum: {
          impressions: true,
          clicks: true,
          dismissals: true,
        },
      }),
    ])

    const totalImpressions = stats._sum.impressions || 0
    const totalClicks = stats._sum.clicks || 0
    const totalDismissals = stats._sum.dismissals || 0
    const overallCtr = totalImpressions > 0 ? ((totalClicks / totalImpressions) * 100).toFixed(2) : '0.00'

    return NextResponse.json({
      promotions,
      metrics: {
        total: totalCount,
        active: activeCount,
        totalImpressions,
        totalClicks,
        totalDismissals,
        overallCtr: `${overallCtr}%`,
      },
    })
  } catch (err) {
    console.error('[ADMIN PROMOTIONS GET ERROR]', err)
    return NextResponse.json({ error: 'Failed to fetch promotions' }, { status: 500 })
  }
}

export async function POST(req: NextRequest) {
  try {
    const auth = await authorizeApiRequest(req, { allowedRoles: [Role.ADMIN] })
    if (!auth.authorized && process.env.NODE_ENV === 'production') {
      return auth.response || NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await req.json()
    const parsed = CreatePromotionSchema.safeParse(body)

    if (!parsed.success) {
      return NextResponse.json(
        { error: 'Invalid promotion data', details: parsed.error.format() },
        { status: 400 }
      )
    }

    const data = parsed.data

    if (!validateSafeUrl(data.buttonUrl)) {
      return NextResponse.json(
        { error: 'Primary button URL must start with "/" for internal routes or "https://" for external destinations.' },
        { status: 400 }
      )
    }

    if (data.secondaryButtonUrl && !validateSafeUrl(data.secondaryButtonUrl)) {
      return NextResponse.json(
        { error: 'Secondary button URL must start with "/" or "https://".' },
        { status: 400 }
      )
    }

    const startDate = new Date(data.startAt)
    const endDate = new Date(data.endAt)

    if (isNaN(startDate.getTime()) || isNaN(endDate.getTime())) {
      return NextResponse.json({ error: 'Invalid start or end date format.' }, { status: 400 })
    }

    if (endDate <= startDate) {
      return NextResponse.json({ error: 'Campaign end time must be later than start time.' }, { status: 400 })
    }

    const userId = auth.user?.id || null
    const isPublishingNow = data.status === PromotionStatus.ACTIVE

    const promotion = await prisma.promotion.create({
      data: {
        title: data.title,
        subtitle: data.subtitle || null,
        description: data.description,
        desktopImageUrl: data.desktopImageUrl,
        mobileImageUrl: data.mobileImageUrl || null,
        imageAltText: data.imageAltText || null,
        buttonText: data.buttonText,
        buttonUrl: data.buttonUrl,
        secondaryButtonText: data.secondaryButtonText || null,
        secondaryButtonUrl: data.secondaryButtonUrl || null,
        backgroundColor: data.backgroundColor,
        textColor: data.textColor,
        buttonColor: data.buttonColor,
        placement: data.placement,
        status: data.status,
        priority: data.priority,
        audience: data.audience,
        displayFrequency: data.displayFrequency,
        delaySeconds: data.delaySeconds,
        startAt: startDate,
        endAt: endDate,
        timezone: data.timezone,
        dismissible: data.dismissible,
        openInNewTab: data.openInNewTab,
        createdById: userId,
        publishedById: isPublishingNow ? userId : null,
        publishedAt: isPublishingNow ? new Date() : null,
      },
    })

    // Log in AuditLog
    await prisma.auditLog.create({
      data: {
        userId,
        userRole: 'ADMIN',
        action: 'CREATE_PROMOTION',
        targetResource: `Promotion:${promotion.id}`,
        details: JSON.stringify({ title: promotion.title, status: promotion.status, placement: promotion.placement }),
      },
    }).catch(() => {})

    return NextResponse.json({ success: true, promotion })
  } catch (err) {
    console.error('[ADMIN CREATE PROMOTION ERROR]', err)
    return NextResponse.json({ error: 'Failed to create promotion' }, { status: 500 })
  }
}
