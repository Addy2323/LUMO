/** Tanzanian Shilling is the only currency in Phase 1 — no currency selector. */
const tzs = new Intl.NumberFormat('en-TZ', {
  style: 'currency',
  currency: 'TZS',
  maximumFractionDigits: 0,
})

/** Formats an amount held in whole shillings, e.g. 1250000 -> "TZS 1,250,000". */
export function formatTZS(amount: number): string {
  return tzs.format(amount).replace('TSh', 'TZS')
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
