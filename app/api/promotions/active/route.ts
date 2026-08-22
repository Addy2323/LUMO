import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db'
import { PromotionStatus, PromotionPlacement, PromotionAudience } from '@/lib/promotions/types'
import { ensurePromotionsTable } from '@/lib/promotions/db-init'

export const dynamic = 'force-dynamic'

export async function GET(req: NextRequest) {
  try {
    await ensurePromotionsTable()

    const { searchParams } = new URL(req.url)
    const placementParam = searchParams.get('placement') || 'ALL'
    const audienceParam = searchParams.get('audience') || 'ALL_VISITORS'

    const now = new Date()
    // 2-minute clock tolerance so freshly created promotions display immediately
    const startThreshold = new Date(now.getTime() + 2 * 60 * 1000)

    const whereClause: any = {
      status: { in: [PromotionStatus.ACTIVE, PromotionStatus.SCHEDULED] },
      startAt: { lte: startThreshold },
      endAt: { gt: now },
    }

    if (placementParam !== 'ALL' && Object.values(PromotionPlacement).includes(placementParam as PromotionPlacement)) {
      whereClause.placement = { in: [placementParam as PromotionPlacement, PromotionPlacement.ENTRY_POPUP, PromotionPlacement.HOMEPAGE_BANNER] }
    }

    // Find active and scheduled promotions
    const candidates = await prisma.promotion.findMany({
      where: whereClause,
      orderBy: [
        { priority: 'desc' },
        { publishedAt: 'desc' },
        { createdAt: 'desc' },
      ],
      take: 10,
    })

    if (!candidates || candidates.length === 0) {
      return NextResponse.json({ promotion: null })
    }

    // Filter by audience if specified
    const matching = candidates.find((p: any) => {
      if (p.audience === PromotionAudience.ALL_VISITORS) return true
      if (audienceParam === 'LOGGED_IN' && (p.audience === PromotionAudience.LOGGED_IN_CUSTOMERS || p.audience === PromotionAudience.RETURNING_CUSTOMERS)) return true
      if (audienceParam === 'GUEST' && (p.audience === PromotionAudience.GUESTS_ONLY || p.audience === PromotionAudience.NEW_CUSTOMERS)) return true
      return p.audience === audienceParam
    }) || candidates[0]

    // Self-healing: if status was SCHEDULED and startAt <= now, update to ACTIVE
    if (matching.status === PromotionStatus.SCHEDULED) {
      prisma.promotion.update({
        where: { id: matching.id },
        data: { status: PromotionStatus.ACTIVE, publishedAt: matching.publishedAt || now },
      }).catch((err: unknown) => console.warn('[PROMOTION STATUS SYNC ERROR]', err))
    }

    // Return sanitized public customer fields only
    return NextResponse.json({
      promotion: {
        id: matching.id,
        title: matching.title,
        subtitle: matching.subtitle,
        description: matching.description,
        desktopImageUrl: matching.desktopImageUrl,
        mobileImageUrl: matching.mobileImageUrl,
        imageAltText: matching.imageAltText,
        buttonText: matching.buttonText,
        buttonUrl: matching.buttonUrl,
        secondaryButtonText: matching.secondaryButtonText,
        secondaryButtonUrl: matching.secondaryButtonUrl,
        backgroundColor: matching.backgroundColor,
        textColor: matching.textColor,
        buttonColor: matching.buttonColor,
        placement: matching.placement,
        audience: matching.audience,
        displayFrequency: matching.displayFrequency,
        delaySeconds: matching.delaySeconds,
        dismissible: matching.dismissible,
        openInNewTab: matching.openInNewTab,
        startAt: matching.startAt.toISOString(),
        endAt: matching.endAt.toISOString(),
        timezone: matching.timezone,
      },
    })
  } catch (err) {
    console.error('[PUBLIC PROMOTION ACTIVE API ERROR]', err)
    // Never fail website if promotion fetch encounters an error
    return NextResponse.json({ promotion: null }, { status: 200 })
  }
}
