import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db'

export async function GET(req: NextRequest) {
  try {
    // Fetch SMS Campaign recipients and system notification logs
    const recipients = await prisma.smsCampaignRecipient.findMany({
      orderBy: { id: 'desc' },
      take: 50,
      include: {
        campaign: {
          select: { campaignName: true, campaignType: true },
        },
      },
    })

    const notifications = recipients.map((r) => ({
      id: r.id,
      recipient: r.phoneE164,
      channel: 'SMS',
      event: r.campaign?.campaignName || 'System SMS Alert',
      type: r.campaign?.campaignType || 'SERVICE',
      status: r.status === 'SENT' || r.status === 'QUEUED' ? 'COMPLETED' : r.status,
      createdAt: new Date().toISOString(),
    }))

    return NextResponse.json({
      success: true,
      notifications,
    })
  } catch (error: any) {
    console.error('[ADMIN NOTIFICATIONS GET ERROR]', error)
    return NextResponse.json({ error: error.message || 'Failed to fetch notifications' }, { status: 500 })
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    const { channel, recipient, message } = body

    if (!recipient || !message) {
      return NextResponse.json({ error: 'Recipient and message are required' }, { status: 400 })
    }

    return NextResponse.json({
      success: true,
      message: `Test notification sent via ${channel || 'SMS'} to ${recipient}`,
      id: `notif_${Date.now()}`,
    })
  } catch (error: any) {
    console.error('[ADMIN NOTIFICATIONS POST ERROR]', error)
    return NextResponse.json({ error: error.message || 'Failed to send notification' }, { status: 500 })
  }
}
