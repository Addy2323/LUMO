import type { Locale } from '@/lib/i18n/dictionaries'

import { useCurrencyStore, SUPPORTED_CURRENCIES, type CurrencyCode } from '@/lib/stores/currency-store'

/** Format currency amount (held in base TZS) into active store currency */
export function formatCurrency(amount: number, locale: Locale = 'en', currencyCode?: CurrencyCode): string {
  const activeCode = currencyCode || (typeof window !== 'undefined' ? useCurrencyStore.getState().currency : 'TZS')
  const config = SUPPORTED_CURRENCIES[activeCode] || SUPPORTED_CURRENCIES.TZS
  const converted = config.rateToTZS === 1 ? amount : amount / config.rateToTZS

  const formattedNumber = new Intl.NumberFormat('en-US', {
    minimumFractionDigits: config.fractionDigits,
    maximumFractionDigits: config.fractionDigits,
  }).format(converted)

  if (config.code === 'TZS') {
    return `TZS ${formattedNumber}`
  }
  if (['USD', 'EUR', 'GBP', 'CNY'].includes(config.code)) {
    return `${config.symbol}${formattedNumber}`
  }
  return `${config.symbol} ${formattedNumber}`
}

/** Format date e.g. 8 August 2026 (EN) / 8 Agosti 2026 (SW) */
export function formatDate(dateInput: Date | string | number, locale: Locale = 'en'): string {
  const date = new Date(dateInput)
  if (isNaN(date.getTime())) return ''

  return new Intl.DateTimeFormat(locale === 'sw' ? 'sw-TZ' : 'en-TZ', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  }).format(date)
}

/** Format item count e.g. 3 items (EN) / bidhaa 3 (SW) */
export function formatItemCount(count: number, locale: Locale = 'en'): string {
  if (locale === 'sw') {
    return `bidhaa ${count}`
  }
  return `${count} ${count === 1 ? 'item' : 'items'}`
}
