import { NextRequest, NextResponse } from 'next/server'
import { getActiveSmsProvider } from '@/lib/sms/sms-service'
import { prisma } from '@/lib/db'

export async function GET(req: NextRequest) {
  try {
    const provider = getActiveSmsProvider()
    const stats = await provider.getAccountStats()

    // Query DB totals from SmsBatch
    const dbBatches = await prisma.smsBatch.aggregate({
      _sum: {
        totalRecipients: true,
        successfulCount: true,
        failedCount: true,
      },
      _count: {
        id: true,
      },
    })

    const totalSubmitted = dbBatches._sum.totalRecipients || stats.totalMessagesSent || 0
    const successfulDeliveries = dbBatches._sum.successfulCount || stats.successfulDeliveries || 0
    const failedDeliveries = dbBatches._sum.failedCount || stats.failedDeliveries || 0
    const successRate = totalSubmitted > 0 ? Math.round((successfulDeliveries / totalSubmitted) * 100) : 100

    return NextResponse.json({
      success: true,
      provider: provider.name,
      balance: stats.balance ?? 150000.00, // TZS balance fallback
      totalSubmitted,
      successfulDeliveries,
      failedDeliveries,
      successRate,
      activeCampaignsCount: await prisma.smsCampaign.count({ where: { status: { in: ['SCHEDULED', 'QUEUED', 'SENDING'] } } }),
    })
  } catch (error: any) {
    console.error('[ADMIN SMS ACCOUNT STATS ERROR]', error)
    return NextResponse.json({ error: error.message || 'Failed to fetch SMS account stats' }, { status: 500 })
  }
}
