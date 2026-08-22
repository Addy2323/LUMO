import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db'
import { PromotionInteractionEvent } from '@/lib/promotions/types'

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    if (!id) {
      return NextResponse.json({ error: 'Promotion ID is required' }, { status: 400 })
    }

    let body: any = {}
    try {
      body = await req.json()
    } catch {
      // Empty body allowed
    }

    const { userId, anonymousSessionId, deviceType = 'DESKTOP', metadata } = body

    // Atomically increment click counter and record interaction
    await prisma.$transaction([
      prisma.promotion.update({
        where: { id },
        data: {
          clicks: { increment: 1 },
        },
      }),
      prisma.promotionInteraction.create({
        data: {
          promotionId: id,
          userId: userId || null,
          anonymousSessionId: anonymousSessionId || null,
          event: PromotionInteractionEvent.CLICK,
          deviceType: String(deviceType).toUpperCase(),
          metadata: metadata || null,
        },
      }),
    ])

    return NextResponse.json({ success: true })
  } catch (err) {
    console.error('[PROMOTION CLICK TELEMETRY ERROR]', err)
    return NextResponse.json({ success: false }, { status: 200 })
  }
}
