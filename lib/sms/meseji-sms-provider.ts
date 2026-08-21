import { env } from '@/lib/env'
import { SmsProvider, SmsSendInput, SmsSendResult, BatchStatsResult, AccountStatsResult } from './sms-provider'
import { normalizeTanzanianPhone } from './phone-normalizer'
import { redactApiKey, sanitizeSmsLogData } from './sms-redaction'
import {
  MesejiAuthError,
  MesejiSenderIdError,
  MesejiRateLimitError,
  MesejiNetworkError,
  MesejiLowBalanceError,
  SmsError,
} from './sms-errors'

/**
 * Meseji SMS Adapter for Tanzania (https://meseji.co.tz/api/v1)
 */
export class MesejiSmsProvider implements SmsProvider {
  name = 'meseji'

  private baseUrl: string
  private apiKey: string
  private timeoutMs: number

  constructor() {
    this.baseUrl = (env.MESEJI_BASE_URL || 'https://meseji.co.tz/api/v1').replace(/\/$/, '')
    this.apiKey = env.MESEJI_API_KEY || ''
    this.timeoutMs = env.MESEJI_REQUEST_TIMEOUT_MS || 5000

    if (env.NODE_ENV === 'production') {
      if (!this.apiKey) {
        throw new MesejiAuthError('MESEJI_API_KEY missing in production environment.')
      }
      if (!this.apiKey.startsWith('zs_')) {
        throw new MesejiAuthError(`MESEJI_API_KEY must start with "zs_" prefix (provided: ${redactApiKey(this.apiKey)}).`)
      }
    }
  }

  private async makeRequest<T>(endpoint: string, options: RequestInit = {}): Promise<T> {
    const url = `${this.baseUrl}${endpoint.startsWith('/') ? endpoint : `/${endpoint}`}`
    
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
      'x-api-key': this.apiKey,
      ...(options.headers as Record<string, string> || {}),
    }

    const controller = new AbortController()
    const timeoutId = setTimeout(() => controller.abort(), this.timeoutMs)

    try {
      const response = await fetch(url, {
        ...options,
        headers,
        signal: controller.signal,
      })

      clearTimeout(timeoutId)

      let data: any = {}
      try {
        const text = await response.text()
        if (text) data = JSON.parse(text)
      } catch {}

      if (!response.ok) {
        const status = response.status
        const errorMessage = data.message || data.error || `Meseji HTTP request failed with status ${status}`

        if (status === 401 || status === 403) {
          throw new MesejiAuthError(`Meseji API auth failed (${status}): ${errorMessage}`)
        }
        if (status === 429) {
          const retryAfter = parseInt(response.headers.get('retry-after') || '60', 10)
          throw new MesejiRateLimitError(retryAfter)
        }
        if (status === 402 || errorMessage.toLowerCase().includes('balance')) {
          throw new MesejiLowBalanceError()
        }

        throw new SmsError(errorMessage, `MESEJI_HTTP_${status}`, status)
      }

      return data as T
    } catch (err: any) {
      clearTimeout(timeoutId)
      if (err.name === 'AbortError') {
        throw new MesejiNetworkError(`Meseji request timed out after ${this.timeoutMs}ms`)
      }
      if (err instanceof SmsError) {
        throw err
      }
      throw new MesejiNetworkError(err.message || 'Failed to connect to Meseji SMS API')
    }
  }

  async validateSenderId(senderId: string): Promise<boolean> {
    try {
      const senderIds = await this.getSenderIds()
      return senderIds.includes(senderId)
    } catch (err) {
      console.error('[MESEJI PROVIDER] Failed to validate sender ID:', sanitizeSmsLogData({ senderId, err }))
      return false
    }
  }

  async getSenderIds(): Promise<string[]> {
    try {
      const data = await this.makeRequest<any>('/sms/sender-ids', { method: 'GET' })
      if (Array.isArray(data)) {
        return data.map(s => (typeof s === 'string' ? s : s.sender_id || s.name))
      }
      if (data && Array.isArray(data.sender_ids)) {
        return data.sender_ids.map((s: any) => (typeof s === 'string' ? s : s.sender_id || s.name))
      }
      if (data && Array.isArray(data.data)) {
        return data.data.map((s: any) => (typeof s === 'string' ? s : s.sender_id || s.name))
      }
      // Fallback: return configured sender ID if list is structurally wrapped
      return [env.MESEJI_SENDER_ID || 'LUMO']
    } catch (err) {
      console.warn('[MESEJI PROVIDER] Sender IDs query failed, using configured default:', env.MESEJI_SENDER_ID)
      return [env.MESEJI_SENDER_ID || 'LUMO']
    }
  }

  async send(input: SmsSendInput): Promise<SmsSendResult> {
    const { senderId, message, contacts, correlationId } = input

    if (!contacts || contacts.length === 0) {
      throw new SmsError('No valid contacts provided for SMS dispatch.', 'MESEJI_NO_CONTACTS', 400)
    }

    // Normalize contacts to 255XXXXXXXXX format
    const normalizedContacts: string[] = []
    for (const c of contacts) {
      const norm = normalizeTanzanianPhone(c)
      if (norm.isValid) {
        normalizedContacts.push(norm.e164)
      }
    }

    if (normalizedContacts.length === 0) {
      throw new SmsError('All provided contacts failed phone normalization.', 'MESEJI_INVALID_CONTACTS', 400)
    }

    const payload = {
      sender_id: senderId || env.MESEJI_SENDER_ID || 'LUMO',
      message,
      contacts: normalizedContacts.join(','),
      correlation_id: correlationId || `corr_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
      ...(input.callbackUrl ? { callback_url: input.callbackUrl } : {}),
    }

    const data = await this.makeRequest<any>('/sms/send', {
      method: 'POST',
      body: JSON.stringify(payload),
    })

    const batchId = data.batch_id || data.batchId || data.id || `batch_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`
    const totalRecipients = data.total_recipients || data.count || normalizedContacts.length

    return {
      provider: 'meseji',
      batchId,
      totalRecipients,
      estimatedCost: data.estimated_cost || data.cost || totalRecipients * 18, // 18 TZS approx per SMS segment
      status: 'queued',
      messageId: data.message_id || batchId,
      rawResponse: data,
    }
  }

  async getBatchStats(batchId: string): Promise<BatchStatsResult> {
    const data = await this.makeRequest<any>(`/sms/stats/${encodeURIComponent(batchId)}`, { method: 'GET' })

    const totalSent = data.total_sent || data.totalSent || data.total || 0
    const successful = data.successful || data.delivered || 0
    const failed = data.failed || data.undelivered || 0
    const successRate = totalSent > 0 ? Math.round((successful / totalSent) * 100) : 100

    return {
      batchId,
      totalSent,
      successful,
      failed,
      successRate,
      status: data.status || (failed === 0 ? 'completed' : 'partially_failed'),
      rawResponse: data,
    }
  }

  async getAccountStats(): Promise<AccountStatsResult> {
    const data = await this.makeRequest<any>('/sms/user-stats', { method: 'GET' })

    const totalMessagesSent = data.total_sent || data.totalMessagesSent || data.sent || 0
    const successfulDeliveries = data.successful || data.delivered || 0
    const failedDeliveries = data.failed || 0
    const successRate = totalMessagesSent > 0 ? Math.round((successfulDeliveries / totalMessagesSent) * 100) : 100
    const balance = data.balance !== undefined ? parseFloat(data.balance) : undefined

    return {
      totalMessagesSent,
      successfulDeliveries,
      failedDeliveries,
      successRate,
      balance,
      rawResponse: data,
    }
  }

  /**
   * Send a single transactional SMS and return a status result.
   */
  async sendTransactionalSms(input: {
    recipientPhone: string
    message: string
    senderId?: string
    referenceId?: string
  }): Promise<{ success: boolean; batchId?: string; error?: string }> {
    try {
      const result = await this.send({
        senderId: input.senderId || env.MESEJI_SENDER_ID || 'LUMO',
        message: input.message,
        contacts: [input.recipientPhone],
        correlationId: input.referenceId || `tx_${Date.now()}`,
      })
      return {
        success: true,
        batchId: result.batchId,
      }
    } catch (err: any) {
      return {
        success: false,
        error: err.message || 'SMS send failed',
      }
    }
  }
}

export const mesejiSmsProvider = new MesejiSmsProvider()

