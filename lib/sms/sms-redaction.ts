/**
 * SMS & Security Redaction Utility for Lumo Commerce
 * Ensures API keys, OTP codes, reset tokens, passwords, raw phone numbers,
 * and complete SMS message bodies are strictly redacted from logs and errors.
 */

export function redactApiKey(apiKey?: string): string {
  if (!apiKey) return '[REDACTED_MISSING_KEY]'
  if (apiKey.startsWith('zs_')) {
    return `zs_${'*'.repeat(Math.max(4, apiKey.length - 7))}${apiKey.slice(-4)}`
  }
  return '[REDACTED_API_KEY]'
}

export function redactPhoneNumber(phone?: string): string {
  if (!phone) return '[REDACTED_PHONE]'
  const clean = phone.trim().replace(/[^0-9+]/g, '')
  if (clean.length >= 9) {
    return `${clean.slice(0, 4)}****${clean.slice(-3)}`
  }
  return '***REDACTED_PHONE***'
}

export function redactOtpCode(code?: string): string {
  if (!code) return '[REDACTED_OTP]'
  return '[REDACTED_OTP_6DIGIT]'
}

export function redactSmsBody(body?: string): string {
  if (!body) return '[REDACTED_BODY]'
  // Preserve template type indicator if present, otherwise redact full payload
  const len = body.length
  return `[REDACTED_SMS_BODY (${len} chars)]`
}

/**
 * Sanitizes arbitrary log objects or JSON strings, redacting sensitive fields
 */
export function sanitizeSmsLogData(data: Record<string, any>): Record<string, any> {
  const sanitized: Record<string, any> = {}

  for (const [key, value] of Object.entries(data)) {
    const lowerKey = key.toLowerCase()

    if (lowerKey.includes('apikey') || lowerKey.includes('secret') || lowerKey.includes('token') || lowerKey.includes('password')) {
      sanitized[key] = typeof value === 'string' && value.startsWith('zs_') ? redactApiKey(value) : '[REDACTED]'
    } else if (lowerKey.includes('phone') || lowerKey.includes('recipient') || lowerKey.includes('contact')) {
      if (Array.isArray(value)) {
        sanitized[key] = value.map((p: any) => (typeof p === 'string' ? redactPhoneNumber(p) : '[REDACTED_PHONE]'))
      } else if (typeof value === 'string') {
        sanitized[key] = redactPhoneNumber(value)
      } else {
        sanitized[key] = '[REDACTED_PHONE]'
      }
    } else if (lowerKey.includes('otp') || lowerKey.includes('code')) {
      sanitized[key] = redactOtpCode(String(value))
    } else if (lowerKey.includes('body') || lowerKey.includes('message') || lowerKey.includes('text')) {
      sanitized[key] = typeof value === 'string' ? redactSmsBody(value) : '[REDACTED_BODY]'
    } else if (typeof value === 'object' && value !== null && !Array.isArray(value)) {
      sanitized[key] = sanitizeSmsLogData(value)
    } else {
      sanitized[key] = value
    }
  }

  return sanitized
}
