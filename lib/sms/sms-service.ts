import { env } from '@/lib/env'
import { SmsProvider, SmsSendInput, SmsSendResult } from './sms-provider'
import { MesejiSmsProvider } from './meseji-sms-provider'
import { DevLoggerOtpProvider, BeemAfricaOtpProvider } from '@/lib/auth/otp-provider'
import { normalizeTanzanianPhone } from './phone-normalizer'
import { sanitizeSmsLogData } from './sms-redaction'
import { renderSmsTemplate, SmsTemplateType, SmsTemplateRenderParams } from './sms-template-service'
import { prisma } from '@/lib/db'

/**
 * Get active SMS Provider based on environment configuration
 */
export function getActiveSmsProvider(): SmsProvider {
  const providerType = env.SMS_PROVIDER || env.SMS_OTP_PROVIDER || 'dev_logger'

  if (providerType === 'meseji') {
    return new MesejiSmsProvider()
  }

  // Wrapper for Beem Africa
  if (providerType === 'beem_africa') {
    const beem = new BeemAfricaOtpProvider()
    return {
      name: 'beem_africa',
      send: async (input) => {
        const result = await beem.sendOtp({
          recipient: input.contacts[0] || '',
          code: '',
          purpose: input.message,
        })
        return {
          provider: 'beem_africa',
          batchId: result.messageId || `beem_${Date.now()}`,
          totalRecipients: input.contacts.length,
          status: result.success ? 'queued' : 'unknown',
        }
      },
      getBatchStats: async (batchId) => ({ batchId, totalSent: 1, successful: 1, failed: 0, successRate: 100 }),
      getAccountStats: async () => ({ totalMessagesSent: 0, successfulDeliveries: 0, failedDeliveries: 0, successRate: 100 }),
      validateSenderId: async () => true,
      getSenderIds: async () => ['LUMO'],
    }
  }

  // Fallback / Dev Logger
  const devLogger = new DevLoggerOtpProvider()
  return {
    name: 'dev_logger',
    send: async (input) => {
      await devLogger.sendOtp({
        recipient: input.contacts.join(','),
        code: '[SMS_BODY]',
        purpose: input.message,
      })
      return {
        provider: 'dev_logger',
        batchId: `dev_${Date.now()}`,
        totalRecipients: input.contacts.length,
        status: 'queued',
      }
    },
    getBatchStats: async (batchId) => ({ batchId, totalSent: 1, successful: 1, failed: 0, successRate: 100 }),
    getAccountStats: async () => ({ totalMessagesSent: 0, successfulDeliveries: 0, failedDeliveries: 0, successRate: 100 }),
    validateSenderId: async () => true,
    getSenderIds: async () => ['LUMO'],
  }
}

/**
 * Check if the current time falls within Africa/Dar_es_Salaam Quiet Hours (22:00 - 07:00)
 */
export function isQuietHours(): boolean {
  try {
    const now = new Date()
    const tzString = now.toLocaleString('en-US', { timeZone: 'Africa/Dar_es_Salaam', hour12: false, hour: '2-digit' })
    const hour = parseInt(tzString, 10)
    return hour >= 22 || hour < 7
  } catch {
    const hour = new Date().getUTCHours() + 3 // East Africa Time = UTC+3
    const eatHour = (hour % 24 + 24) % 24
    return eatHour >= 22 || eatHour < 7
  }
}

/**
 * High-level SMS Dispatcher Service
 */
export class SmsService {
  /**
   * Dispatch a transactional SMS immediately (OTPs, order confirmations, security alerts)
   */
  static async sendTransactional(options: {
    templateType: SmsTemplateType
    params: SmsTemplateRenderParams
    recipientPhone: string
    correlationId?: string
    senderId?: string
  }): Promise<SmsSendResult> {
    const norm = normalizeTanzanianPhone(options.recipientPhone)
    if (!norm.isValid) {
      throw new Error(`Invalid recipient phone for SMS dispatch: ${options.recipientPhone}`)
    }

    const message = renderSmsTemplate(options.templateType, options.params)
    const provider = getActiveSmsProvider()
    const senderId = options.senderId || env.MESEJI_SENDER_ID || 'LUMO'
    const correlationId = options.correlationId || `tx_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`

    console.log('[SMS SERVICE] Dispatching transactional SMS:', sanitizeSmsLogData({
      templateType: options.templateType,
      recipient: norm.e164,
      correlationId,
      provider: provider.name,
    }))

    return provider.send({
      senderId,
      message,
      contacts: [norm.e164],
      correlationId,
    })
  }

  /**
   * Dispatch a marketing or broadcast SMS with consent and quiet-hours enforcement
   */
  static async sendMarketing(options: {
    templateType: SmsTemplateType
    params: SmsTemplateRenderParams
    recipients: { userId?: string; phone: string }[]
    campaignId?: string
    senderId?: string
    bypassQuietHours?: boolean
  }): Promise<{ totalQueued: number; skippedOptOuts: number; batchResult?: SmsSendResult }> {
    // Quiet hours enforcement for marketing
    if (isQuietHours() && !options.bypassQuietHours) {
      throw new Error('Marketing SMS dispatch is restricted during quiet hours (22:00 - 07:00 EAT). Use bypassQuietHours override if urgent.')
    }

    // Filter recipients against marketing consent preferences
    const validPhones: string[] = []
    let skippedOptOuts = 0

    for (const r of options.recipients) {
      const norm = normalizeTanzanianPhone(r.phone)
      if (!norm.isValid) continue

      if (r.userId) {
        // Check NotificationPreference model if present in DB
        try {
          const pref = await (prisma as any).notificationPreference?.findUnique({
            where: { userId: r.userId },
          })
          if (pref && pref.marketingSmsEnabled === false) {
            skippedOptOuts++
            continue
          }
        } catch {}
      }

      validPhones.push(norm.e164)
    }

    if (validPhones.length === 0) {
      return { totalQueued: 0, skippedOptOuts }
    }

    const message = renderSmsTemplate(options.templateType, options.params)
    const provider = getActiveSmsProvider()
    const senderId = options.senderId || env.MESEJI_SENDER_ID || 'LUMO'
    const correlationId = options.campaignId || `mkt_${Date.now()}`

    const batchResult = await provider.send({
      senderId,
      message,
      contacts: validPhones,
      correlationId,
    })

    return {
      totalQueued: validPhones.length,
      skippedOptOuts,
      batchResult,
    }
  }
}
