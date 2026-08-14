/**
 * Tanzanian Phone Number Validation & Normalization Utility
 * Supports formats: 0712445908, 712445908, 255712445908, +255 712 445 908
 * Normalizes to standard +255XXXXXXXXX format.
 */

export interface PhoneValidationResult {
  valid: boolean
  normalized: string
  formattedDisplay: string
  error?: string
}

export function normalizeTanzaniaPhone(input: string): PhoneValidationResult {
  if (!input || typeof input !== 'string') {
    return {
      valid: false,
      normalized: '',
      formattedDisplay: '',
      error: 'Phone number is required.',
    }
  }

  // Remove spaces, dashes, parentheses
  const cleaned = input.trim().replace(/[\s\-\(\)]/g, '')

  let digitsOnly = cleaned
  if (cleaned.startsWith('+')) {
    digitsOnly = cleaned.substring(1)
  }

  // Check if non-numeric characters exist
  if (!/^\d+$/.test(digitsOnly)) {
    return {
      valid: false,
      normalized: '',
      formattedDisplay: cleaned,
      error: 'Phone number must contain numbers only.',
    }
  }

  let localNumber = ''

  if (digitsOnly.startsWith('255') && digitsOnly.length === 12) {
    localNumber = digitsOnly.substring(3)
  } else if (digitsOnly.startsWith('0') && digitsOnly.length === 10) {
    localNumber = digitsOnly.substring(1)
  } else if (digitsOnly.length === 9) {
    localNumber = digitsOnly
  } else {
    return {
      valid: false,
      normalized: cleaned,
      formattedDisplay: cleaned,
      error: 'Invalid Tanzanian mobile number length. Expected 9 or 10 digits (e.g. 0712445908 or +255712445908).',
    }
  }

  // Check if prefix starts with valid mobile prefix (6 or 7)
  if (!/^[67]/.test(localNumber)) {
    return {
      valid: false,
      normalized: cleaned,
      formattedDisplay: cleaned,
      error: 'Invalid carrier code. Tanzanian mobile numbers start with 6 or 7 (e.g. 0712 XXX XXX).',
    }
  }

  const normalized = `+255${localNumber}`
  const formattedDisplay = `+255 ${localNumber.substring(0, 3)} ${localNumber.substring(3, 6)} ${localNumber.substring(6)}`

  return {
    valid: true,
    normalized,
    formattedDisplay,
  }
}
