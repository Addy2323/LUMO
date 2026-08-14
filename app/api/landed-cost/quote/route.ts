import { NextRequest, NextResponse } from 'next/server'
import { calculateLandedCost } from '@/lib/landed-cost/calculator'
import { checkRateLimit } from '@/lib/security/rate-limiter'

/**
 * POST /api/landed-cost/quote
 * Calculate official landed cost, freight fees, TRA tariffs, and VAT.
 */
export async function POST(req: NextRequest) {
  const rateLimit = checkRateLimit(req, { limit: 30, windowMs: 60000, prefix: 'landed_cost_quote' })
  if (!rateLimit.success && rateLimit.response) return rateLimit.response

  try {
    const body = await req.json()
    const { itemValueUSD, weightKg, quantity, hsCode, originCountry, transportMode } = body

    if (itemValueUSD === undefined || isNaN(Number(itemValueUSD))) {
      return NextResponse.json(
        { error: 'Invalid or missing itemValueUSD' },
        { status: 400 }
      )
    }

    const breakdown = await calculateLandedCost({
      itemValueUSD: Number(itemValueUSD),
      weightKg: Number(weightKg || 1),
      quantity: Number(quantity || 1),
      hsCode,
      originCountry,
      transportMode,
    })

    return NextResponse.json(breakdown)
  } catch (error: any) {
    console.error('[LANDED COST API ERROR]', error)
    return NextResponse.json({ error: 'Failed to calculate landed cost' }, { status: 500 })
  }
}
