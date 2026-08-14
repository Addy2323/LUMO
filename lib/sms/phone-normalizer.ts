/**
 * Tanzanian Phone Normalizer Utility for Meseji SMS Integration
 * Normalizes phone numbers to provider-compatible E.164 digits without leading '+':
 * e.g. 0712 345 678 -> 255712345678
 *      +255 712 345 678 -> 255712345678
 */

export interface PhoneNormalizationResult {
  isValid: boolean
  e164: string // e.g. "255712345678"
  formattedDisplay: string // e.g. "+255 712 345 678"
  carrier?: string
  error?: string
}

export function normalizeTanzanianPhone(input: string): PhoneNormalizationResult {
  if (!input || typeof input !== 'string') {
    return { isValid: false, e164: '', formattedDisplay: '', error: 'Phone number is required.' }
  }

  // Remove all non-digit characters
  const rawDigits = input.trim().replace(/[^0-9]/g, '')

  let e164 = ''

  if (rawDigits.startsWith('255') && rawDigits.length === 12) {
    e164 = rawDigits
  } else if (rawDigits.startsWith('0') && (rawDigits.length === 10)) {
    e164 = `255${rawDigits.slice(1)}`
  } else if ((rawDigits.startsWith('7') || rawDigits.startsWith('6')) && rawDigits.length === 9) {
    e164 = `255${rawDigits}`
  } else {
    return {
      isValid: false,
      e164: '',
      formattedDisplay: '',
      error: 'Invalid Tanzanian phone number format. Expected format: 07XXXXXXXX or 06XXXXXXXX',
    }
  }

  // Validate carrier prefix (Tanzanian mobile prefixes: 71, 74, 75, 76, 77, 78, 62, 65, 67, 68, 69)
  const subscriberPrefix = e164.slice(3, 5)
  const validPrefixes = ['61', '62', '65', '67', '68', '69', '71', '73', '74', '75', '76', '77', '78', '79']
  if (!validPrefixes.includes(subscriberPrefix)) {
    return {
      isValid: false,
      e164: '',
      formattedDisplay: '',
      error: 'Invalid Tanzanian mobile carrier prefix.',
    }
  }

  const formattedDisplay = `+255 ${e164.slice(3, 6)} ${e164.slice(6, 9)} ${e164.slice(9)}`

  return {
    isValid: true,
    e164,
    formattedDisplay,
  }
}

/**
 * Mask Tanzanian phone number for secure UI display (e.g. 255712345678 -> +255 7** *** 678)
 */
export function maskPhoneNumber(phone: string): string {
  const norm = normalizeTanzanianPhone(phone)
  if (!norm.isValid) {
    const clean = phone.replace(/[^\d]/g, '')
    if (clean.length >= 6) {
      return `+${clean.slice(0, 3)} ${clean.slice(3, 4)}** *** ${clean.slice(-3)}`
    }
    return phone
  }

  const e164 = norm.e164
  // Format: +255 7** *** 678
  return `+255 ${e164.slice(3, 4)}** *** ${e164.slice(9)}`
}

