import { prisma } from '@/lib/db'
import { getActiveSmsProvider } from '@/lib/sms/sms-service'

export interface PollBatchStatsResult {
  batchesPolled: number
  updatedCount: number
}

/**
 * Polling worker logic for reconciling Meseji batch stats
 */
export async function pollActiveBatchStats(limit: number = 20): Promise<PollBatchStatsResult> {
  const activeBatches = await prisma.smsBatch.findMany({
    where: {
      status: { in: ['queued', 'sending', 'unknown'] },
    },
    orderBy: { createdAt: 'desc' },
    take: limit,
  })

  const provider = getActiveSmsProvider()
  let updatedCount = 0

  for (const b of activeBatches) {
    try {
      const stats = await provider.getBatchStats(b.batchId)

      await prisma.smsBatch.update({
        where: { id: b.id },
        data: {
          totalRecipients: stats.totalSent || b.totalRecipients,
          successfulCount: stats.successful,
          failedCount: stats.failed,
          successRate: stats.successRate,
          status: stats.status || 'completed',
          lastPolledAt: new Date(),
          ...(stats.status === 'completed' || stats.status === 'partially_failed' ? { completedAt: new Date() } : {}),
        },
      })

      updatedCount++
    } catch (err) {
      console.warn(`[SMS STATUS WORKER WARNING] Batch stats poll failed for ${b.batchId}:`, err)
    }
  }

  return {
    batchesPolled: activeBatches.length,
    updatedCount,
  }
}
