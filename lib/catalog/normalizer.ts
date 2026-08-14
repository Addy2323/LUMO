/**
 * Product Data Normalization Engine.
 * Normalizes raw title keyword stuffing, standardizes currency to TZS/USD based on configurable FX rate engine,
 * cleans up HTML, and generates LUMO product codes.
 */

import { convertToTZS, convertTZSToUSD, CurrencyCode } from './currency'

export function normalizeTitle(rawTitle: string): string {
  if (!rawTitle) return ''
  let cleaned = rawTitle
    .replace(/\s+/g, ' ')
    .replace(
      /(free shipping|hot sale|2026 new|2025 new|best quality|wholesale|dropshipping|top sale|high quality|factory price|direct from factory)/gi,
      '',
    )
    .trim()
  if (cleaned.length > 0) {
    cleaned = cleaned.charAt(0).toUpperCase() + cleaned.slice(1)
  }
  return cleaned || rawTitle
}

export function normalizeCurrencyAndPrice(
  priceAmount: number,
  currencyCode: string,
): { priceUSD: number; priceTZS: number } {
  const code = (currencyCode || 'USD').toUpperCase() as CurrencyCode
  const priceTZS = convertToTZS(priceAmount, code)
  const priceUSD = convertTZSToUSD(priceTZS)

  return { priceUSD, priceTZS }
}

export function generateProductCode(categorySlug: string, sequenceNumber: number): string {
  const prefix = categorySlug.substring(0, 2).toUpperCase() || 'PR'
  const seqStr = String(sequenceNumber).padStart(6, '0')
  return `LUMO-${prefix}-${seqStr}`
}

export function generateSlug(title: string, sequenceNumber?: number): string {
  const base = title
    .toLowerCase()
    .replace(/[^a-z0-9\s-]/g, '')
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-')
    .substring(0, 60)
  return sequenceNumber ? `${base}-${sequenceNumber}` : base
}
