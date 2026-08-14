/**
 * LUMO Dynamic FX Rate & Landed Cost Calculation Engine.
 * Manages exchange rates from global sourcing currencies (USD, CNY, AED, TRY, EUR, GBP) to TZS.
 * Provides transparent cost breakdown: Supplier Cost -> FX Conversion -> Freight -> Customs -> Margin = Final Price.
 */

export type CurrencyCode = 'USD' | 'TZS' | 'CNY' | 'AED' | 'TRY' | 'EUR' | 'GBP'

export type FxRateConfig = {
  currency: CurrencyCode
  rateToTZS: number
  source: string
  updatedAt: string
}

/**
 * Configurable FX Exchange Rates against Tanzanian Shilling (TZS).
 * Admin can update these rates dynamically in the governance console.
 */
export const DEFAULT_FX_RATES: Record<CurrencyCode, FxRateConfig> = {
  USD: { currency: 'USD', rateToTZS: 2600, source: 'Bank of Tanzania / Live FX', updatedAt: '2026-08-07' },
  TZS: { currency: 'TZS', rateToTZS: 1, source: 'Base Currency', updatedAt: '2026-08-07' },
  CNY: { currency: 'CNY', rateToTZS: 361.11, source: 'Yiwu Market / People Bank of China', updatedAt: '2026-08-07' },
  AED: { currency: 'AED', rateToTZS: 708.45, source: 'Dubai Dragon Mart / UAE Central Bank', updatedAt: '2026-08-07' },
  TRY: { currency: 'TRY', rateToTZS: 78.78, source: 'Istanbul Grand Bazaar / CBRT', updatedAt: '2026-08-07' },
  EUR: { currency: 'EUR', rateToTZS: 2835.0, source: 'European Central Bank', updatedAt: '2026-08-07' },
  GBP: { currency: 'GBP', rateToTZS: 3310.0, source: 'Bank of England', updatedAt: '2026-08-07' },
}

export type LandedCostBreakdown = {
  supplierCostOriginal: number
  supplierCurrency: CurrencyCode
  fxRateUsed: number
  supplierCostTZS: number
  supplierCostUSD: number
  estimatedFreightTZS: number
  estimatedCustomsTZS: number
  lumoMarginTZS: number
  finalSellingPriceTZS: number
  finalSellingPriceUSD: number
}

/**
 * Converts any currency amount to TZS using active FX rate configuration.
 */
export function convertToTZS(amount: number, fromCurrency: CurrencyCode = 'USD', customRates?: Record<CurrencyCode, FxRateConfig>): number {
  const rates = customRates || DEFAULT_FX_RATES
  const config = rates[fromCurrency] || rates.USD
  return Math.round(amount * config.rateToTZS)
}

/**
 * Converts TZS amount to USD.
 */
export function convertTZSToUSD(amountTZS: number, customRates?: Record<CurrencyCode, FxRateConfig>): number {
  const rates = customRates || DEFAULT_FX_RATES
  const usdRate = rates.USD.rateToTZS
  return Math.round((amountTZS / usdRate) * 100) / 100
}

/**
 * Computes full landed cost breakdown for a product.
 */
export function calculateLandedCost(params: {
  supplierCost: number
  currency: CurrencyCode
  weightKg?: number
  marginPercent?: number
  customRates?: Record<CurrencyCode, FxRateConfig>
}): LandedCostBreakdown {
  const { supplierCost, currency, weightKg = 0.5, marginPercent = 25, customRates } = params
  const rates = customRates || DEFAULT_FX_RATES
  const fxConfig = rates[currency] || rates.USD

  // 1. Supplier Cost in TZS
  const supplierCostTZS = Math.round(supplierCost * fxConfig.rateToTZS)
  const supplierCostUSD = convertTZSToUSD(supplierCostTZS, rates)

  // 2. Estimated Shipping & Freight ($6/kg average air freight into Dar es Salaam)
  const freightRatePerKgUSD = 6.0
  const freightUSD = weightKg * freightRatePerKgUSD
  const estimatedFreightTZS = convertToTZS(freightUSD, 'USD', rates)

  // 3. Estimated Duty & Port Customs (average 15% tariff)
  const estimatedCustomsTZS = Math.round((supplierCostTZS + estimatedFreightTZS) * 0.15)

  // 4. Landed Base Cost
  const landedBaseCostTZS = supplierCostTZS + estimatedFreightTZS + estimatedCustomsTZS

  // 5. LUMO Margin
  const lumoMarginTZS = Math.round(landedBaseCostTZS * (marginPercent / 100))

  // 6. Final Selling Price
  const finalSellingPriceTZS = landedBaseCostTZS + lumoMarginTZS
  const finalSellingPriceUSD = convertTZSToUSD(finalSellingPriceTZS, rates)

  return {
    supplierCostOriginal: supplierCost,
    supplierCurrency: currency,
    fxRateUsed: fxConfig.rateToTZS,
    supplierCostTZS,
    supplierCostUSD,
    estimatedFreightTZS,
    estimatedCustomsTZS,
    lumoMarginTZS,
    finalSellingPriceTZS,
    finalSellingPriceUSD,
  }
}
