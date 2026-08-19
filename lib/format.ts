import { formatCurrency } from '@/lib/i18n/format'

/** Formats an amount held in whole shillings (base TZS) into active selected currency string */
export function formatTZS(amount: number): string {
  return formatCurrency(amount)
}

export function formatDate(value?: string | Date | null): string {
  if (!value) return 'N/A'
  const d = new Date(value)
  if (isNaN(d.getTime())) return 'N/A'
  return new Intl.DateTimeFormat('en-GB', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  }).format(d)
}

export function formatDateTime(value?: string | Date | null): string {
  if (!value) return 'N/A'
  const d = new Date(value)
  if (isNaN(d.getTime())) return 'N/A'
  return new Intl.DateTimeFormat('en-GB', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  }).format(d)
}


/** Masks a phone number for OTP screens: +255 712 445 908 -> +255 7•• ••5 908 */
export function maskPhone(phone: string): string {
  const trimmed = phone.replace(/\s+/g, '')
  if (trimmed.length < 6) return phone
  return `${trimmed.slice(0, 5)} ••• ••${trimmed.slice(-3)}`
}

/** Cleans scraped marketplace product titles (strips ratings, reviews, sold count suffix) */
export function cleanProductTitle(title?: string | null): string {
  if (!title) return 'Wholesale B2B Goods'
  return title
    .replace(/\s*\d+\.\d+\s+\d+\s*(?:Review|Reviews|sold)\s*\|?\s*\d*\s*(?:sold|reviews)?/gi, '')
    .replace(/\s*\|\s*\d+\s*sold/gi, '')
    .replace(/\s*\d+\.\d+\s+reviews?/gi, '')
    .trim() || 'Wholesale B2B Goods'
}

