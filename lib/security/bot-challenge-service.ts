import { env } from '@/lib/env'

export interface TurnstileSiteverifyResponse {
  success: boolean
  'error-codes': string[]
  challenge_ts?: string
  hostname?: string
  action?: string
  cdata?: string
}

/**
 * Server-Side Cloudflare Turnstile / Managed Bot Challenge Verification Service
 * Documentation: https://developers.cloudflare.com/turnstile/get-started/server-side-validation/
 */
export class BotChallengeService {
  private static TURNSTILE_SECRET_KEY = process.env.TURNSTILE_SECRET_KEY || '1x0000000000000000000000000000000AA' // Testing secret key
  private static SITEVERIFY_URL = 'https://challenges.cloudflare.com/turnstile/v0/siteverify'
  private static MAX_TOKEN_LENGTH = 2048

  /**
   * Validate Turnstile response token with Cloudflare siteverify endpoint (/v0/siteverify)
   */
  static async verifyTurnstileToken(
    token: string,
    remoteIp: string,
    expectedAction: string = 'auth',
    expectedHostname?: string,
    idempotencyKey?: string
  ): Promise<{ success: boolean; error?: string }> {
    if (!token || token.trim().length === 0) {
      return { success: false, error: 'Missing bot challenge verification token.' }
    }

    if (token.length > this.MAX_TOKEN_LENGTH) {
      return { success: false, error: 'Bot challenge token exceeds size limit.' }
    }

    // Dev mode fallback or local testing mock
    if (env.NODE_ENV !== 'production' && token.startsWith('pow_token_')) {
      return { success: true }
    }

    const controller = new AbortController()
    const timeoutId = setTimeout(() => controller.abort(), 5000)

    try {
      const formData = new URLSearchParams()
      formData.append('secret', this.TURNSTILE_SECRET_KEY)
      formData.append('response', token)
      formData.append('remoteip', remoteIp)
      if (idempotencyKey) {
        formData.append('idempotency_key', idempotencyKey)
      }

      const response = await fetch(this.SITEVERIFY_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
        body: formData,
        signal: controller.signal,
      })

      clearTimeout(timeoutId)

      if (!response.ok) {
        return { success: false, error: `Turnstile verification service error (${response.status}).` }
      }

      const outcome: TurnstileSiteverifyResponse = await response.json()

      if (!outcome.success) {
        const errorCodes = outcome['error-codes'] || []
        if (errorCodes.includes('timeout-or-duplicate')) {
          return { success: false, error: 'Bot challenge token expired or already used.' }
        }
        const errorDetails = errorCodes.join(', ') || 'invalid-input-response'
        return { success: false, error: `Managed bot challenge failed (${errorDetails}).` }
      }

      // Action binding validation
      if (outcome.action && outcome.action !== expectedAction) {
        return { success: false, error: `Bot challenge action mismatch. Expected '${expectedAction}', got '${outcome.action}'.` }
      }

      // Hostname validation
      if (expectedHostname && outcome.hostname && outcome.hostname !== expectedHostname) {
        return { success: false, error: `Bot challenge hostname mismatch.` }
      }

      return { success: true }
    } catch (err: any) {
      clearTimeout(timeoutId)
      // Fail closed without logging raw tokens or secret keys
      console.error('[TURNSTILE SITEVERIFY ERROR] Verification failed or timed out. Failing closed.')
      return { success: false, error: 'Failed to verify bot challenge token with provider.' }
    }
  }
}
