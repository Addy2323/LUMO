import { NextRequest, NextResponse } from 'next/server'
import { processOutboxBatch } from '@/lib/notifications/outbox-worker'
import { checkRateLimit } from '@/lib/security/rate-limiter'

export async function POST(req: NextRequest) {
  // 1. Protection rate-limit check
  const rateLimit = checkRateLimit(req, { limit: 120, windowMs: 60000, prefix: 'outbox_process' })
  if (!rateLimit.success && rateLimit.response) {
    return rateLimit.response
  }

  try {
    const { searchParams } = new URL(req.url)
    const limit = parseInt(searchParams.get('limit') || '50', 10)

    const stats = await processOutboxBatch(limit)

    return NextResponse.json({
      success: true,
      timestamp: new Date().toISOString(),
      stats,
    })
  } catch (error: any) {
    console.error('[OUTBOX PROCESS ROUTE ERROR]', error)
    return NextResponse.json(
      { success: false, error: error.message || 'Outbox batch processing failed' },
      { status: 500 }
    )
  }
}

export async function GET(req: NextRequest) {
  return POST(req)
}
