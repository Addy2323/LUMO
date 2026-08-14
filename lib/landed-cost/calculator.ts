import { prisma } from '@/lib/db'

export interface LandedCostInput {
  itemValueUSD: number
  weightKg: number
  quantity?: number
  hsCode?: string
  originCountry?: string
  transportMode?: 'AIR' | 'SEA_FCL' | 'SEA_LCL'
}

export interface LandedCostBreakdown {
  available: boolean
  requiresManualReview: boolean
  disclaimer: string
  calculationVersion: string
  approvalStatus: string
  currency: string
  exchangeRateUSD_TZS: number
  itemValueUSD: number
  itemValueTZS: number
  weightKg: number
  quantity: number
  freightCostUSD: number
  freightCostTZS: number
  cifUSD: number
  cifTZS: number
  importDutyTZS: number
  vatTZS: number
  railwayLevyTZS: number
  whidLevyTZS: number
  exciseTZS: number
  totalTaxesAndDutiesTZS: number
  totalLandedCostTZS: number
  totalLandedCostUSD: number
  estimatedDeliveryDays: { min: number; max: number }
  tariffsApplied?: {
    hsCode: string
    importDutyPercent: number
    vatPercent: number
    railwayLevyPercent: number
    whidLevyPercent: number
    effectiveFrom: string
  }
}

/**
 * Calculates landed-cost for cross-border shipments to Tanzania.
 * Computes estimated CIF value, TRA customs duties, freight rates, and VAT based on verified tariff rules.
 */
export async function calculateLandedCost(
  input: LandedCostInput
): Promise<LandedCostBreakdown> {
  const itemValueUSD = Math.max(0, input.itemValueUSD)
  const weightKg = Math.max(0.1, input.weightKg)
  const quantity = Math.max(1, input.quantity || 1)
  const originCountry = input.originCountry || 'China'
  const transportMode = input.transportMode || 'AIR'
  const hsCode = input.hsCode || '8517.12.00' // Mobile/electronics HS code

  // 1. Fetch Exchange Rate (USD -> TZS) & Freight Cards with try-catch DB fallback
  let exchangeRateUSD_TZS = 2650
  let pricePerKgUSD = transportMode === 'AIR' ? 9.5 : 2.5
  let baseHandlingFeeUSD = 20.0
  let estimatedDaysMin = transportMode === 'AIR' ? 5 : 20
  let estimatedDaysMax = transportMode === 'AIR' ? 10 : 35
  let tariffCode: any = null

  try {
    const rateRecord = await (prisma as any).exchangeRate.findFirst({
      where: { baseCurrency: 'USD', targetCurrency: 'TZS' },
      orderBy: { effectiveAt: 'desc' },
    })
    if (rateRecord) exchangeRateUSD_TZS = Number(rateRecord.rate)

    const freightCard = await (prisma as any).freightRateCard.findFirst({
      where: { originCountry, transportMode, isActive: true },
    })
    if (freightCard) {
      pricePerKgUSD = Number(freightCard.pricePerKgUSD)
      baseHandlingFeeUSD = Number(freightCard.baseHandlingFeeUSD)
      estimatedDaysMin = freightCard.estimatedDaysMin
      estimatedDaysMax = freightCard.estimatedDaysMax
    }

    const now = new Date()
    tariffCode = await (prisma as any).tariffCode.findFirst({
      where: { hsCode },
      include: {
        dutyRates: {
          where: {
            effectiveFrom: { lte: now },
          },
          orderBy: { effectiveFrom: 'desc' },
        },
      },
    })
  } catch (dbErr) {
    console.warn('[LANDED COST DB WARNING] Database offline or unreachable, falling back to manual review requirement:', dbErr)
  }

  const totalWeightKg = weightKg * quantity
  const freightCostUSD = baseHandlingFeeUSD + totalWeightKg * pricePerKgUSD
  const freightCostTZS = Math.round(freightCostUSD * exchangeRateUSD_TZS)

  const itemValueTZS = Math.round(itemValueUSD * quantity * exchangeRateUSD_TZS)
  const cifUSD = itemValueUSD * quantity + freightCostUSD
  const cifTZS = itemValueTZS + freightCostTZS

  const activeDuty = tariffCode?.dutyRates?.[0]

  if (!tariffCode || !activeDuty) {
    return {
      available: false,
      requiresManualReview: true,
      disclaimer: 'A reliable customs estimate is unavailable. Lumo will request a reviewed quotation.',
      calculationVersion: '2026.1-STAGING',
      approvalStatus: 'UNAVAILABLE_MANUAL_REVIEW_REQUIRED',
      currency: 'TZS',
      exchangeRateUSD_TZS,
      itemValueUSD,
      itemValueTZS,
      weightKg: totalWeightKg,
      quantity,
      freightCostUSD,
      freightCostTZS,
      cifUSD,
      cifTZS,
      importDutyTZS: 0,
      vatTZS: 0,
      railwayLevyTZS: 0,
      whidLevyTZS: 0,
      exciseTZS: 0,
      totalTaxesAndDutiesTZS: 0,
      totalLandedCostTZS: cifTZS,
      totalLandedCostUSD: cifUSD,
      estimatedDeliveryDays: { min: estimatedDaysMin, max: estimatedDaysMax },
    }
  }

  const importDutyPercent = Number(activeDuty.importDutyPercent)
  const vatPercent = Number(activeDuty.vatPercent)
  const railwayLevyPercent = Number(activeDuty.railwayLevyPercent)
  const whidLevyPercent = Number(activeDuty.whidLevyPercent)
  const excisePercent = Number(activeDuty.excisePercent || 0)
  const effectiveFromStr = activeDuty.effectiveFrom ? new Date(activeDuty.effectiveFrom).toISOString() : new Date().toISOString()

  // 4. Calculate Duties & Taxes (TRA Formula)
  const importDutyTZS = Math.round(cifTZS * (importDutyPercent / 100))
  const railwayLevyTZS = Math.round(cifTZS * (railwayLevyPercent / 100))
  const whidLevyTZS = Math.round(cifTZS * (whidLevyPercent / 100))
  const exciseTZS = Math.round((cifTZS + importDutyTZS) * (excisePercent / 100))

  const vatTaxableBaseTZS = cifTZS + importDutyTZS + railwayLevyTZS + exciseTZS
  const vatTZS = Math.round(vatTaxableBaseTZS * (vatPercent / 100))

  const totalTaxesAndDutiesTZS = importDutyTZS + railwayLevyTZS + whidLevyTZS + exciseTZS + vatTZS
  const totalLandedCostTZS = cifTZS + totalTaxesAndDutiesTZS
  const totalLandedCostUSD = Number((totalLandedCostTZS / exchangeRateUSD_TZS).toFixed(2))

  return {
    available: true,
    requiresManualReview: false,
    disclaimer:
      'This is an estimated landed cost calculated by the Lumo Estimated Landed-Cost Calculator and does not constitute an official TRA customs tax assessment.',
    calculationVersion: '2026.1-STAGING',
    approvalStatus: 'VERIFIED_RULE_APPLIED',
    currency: 'TZS',
    exchangeRateUSD_TZS,
    itemValueUSD,
    itemValueTZS,
    weightKg: totalWeightKg,
    quantity,
    freightCostUSD,
    freightCostTZS,
    cifUSD,
    cifTZS,
    importDutyTZS,
    vatTZS,
    railwayLevyTZS,
    whidLevyTZS,
    exciseTZS,
    totalTaxesAndDutiesTZS,
    totalLandedCostTZS,
    totalLandedCostUSD,
    estimatedDeliveryDays: { min: estimatedDaysMin, max: estimatedDaysMax },
    tariffsApplied: {
      hsCode,
      importDutyPercent,
      vatPercent,
      railwayLevyPercent,
      whidLevyPercent,
      effectiveFrom: effectiveFromStr,
    },
  }
}
