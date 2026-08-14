import type { Locale } from '@/lib/i18n/dictionaries'

/** Format currency in TZS e.g. TZS 125,000 */
export function formatCurrency(amount: number, locale: Locale = 'en'): string {
  const formattedNumber = new Intl.NumberFormat(locale === 'sw' ? 'sw-TZ' : 'en-TZ', {
    maximumFractionDigits: 0,
  }).format(amount)
  return `TZS ${formattedNumber}`
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
