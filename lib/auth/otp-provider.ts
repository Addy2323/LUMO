import { env } from '@/lib/env'
import { MesejiSmsProvider } from '@/lib/sms/meseji-sms-provider'
import { renderSmsTemplate, SmsTemplateType } from '@/lib/sms/sms-template-service'
import { sanitizeSmsLogData } from '@/lib/sms/sms-redaction'

export interface OtpSendParams {
  recipient: string
  code: string
  purpose: string
}

export interface OtpSendResult {
  success: boolean
  messageId?: string
  error?: string
}

export interface OtpProvider {
  name: string
  sendOtp(params: OtpSendParams): Promise<OtpSendResult>
}

/**
 * Meseji Production OTP Provider
 */
export class MesejiSmsOtpProvider implements OtpProvider {
  name = 'meseji'
  private mesejiProvider: MesejiSmsProvider

  constructor() {
    this.mesejiProvider = new MesejiSmsProvider()
  }

  async sendOtp({ recipient, code, purpose }: OtpSendParams): Promise<OtpSendResult> {
    const isReset = purpose === 'PASSWORD_RESET' || purpose.toLowerCase().includes('reset')
    const templateType: SmsTemplateType = isReset ? 'PASSWORD_RESET_OTP' : 'REGISTRATION_OTP'

    const message = renderSmsTemplate(templateType, { code })

    try {
      const result = await this.mesejiProvider.send({
        senderId: env.MESEJI_SENDER_ID || 'LUMO',
        message,
        contacts: [recipient],
        correlationId: `otp_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
      })

      console.log('[MESEJI OTP DISPATCH] Successfully queued OTP SMS:', sanitizeSmsLogData({
        recipient,
        purpose,
        batchId: result.batchId,
      }))

      return {
        success: true,
        messageId: result.batchId,
      }
    } catch (err: any) {
      console.error('[MESEJI OTP ERROR] Failed to dispatch OTP SMS via Meseji:', sanitizeSmsLogData({
        recipient,
        purpose,
        error: err.message,
      }))

      return {
        success: false,
        error: err.message || 'Failed to dispatch SMS to device via Meseji provider.',
      }
    }
  }
}

/**
 * Development Logger OTP Provider
 * Throws a fatal initialization error in production to prevent accidental dev logger deployment.
 */
export class DevLoggerOtpProvider implements OtpProvider {
  name = 'dev_logger'

  constructor() {
    if (process.env.NODE_ENV === 'production') {
      throw new Error('[FATAL SECURITY RISK] DevLoggerOtpProvider initialized in production! Configure a production SMS provider (e.g. MESEJI).')
    }
  }

  async sendOtp({ recipient, code, purpose }: OtpSendParams): Promise<OtpSendResult> {
    if (process.env.NODE_ENV === 'production') {
      return {
        success: false,
        error: 'DevLoggerOtpProvider is strictly prohibited in production.',
      }
    }

    console.log(`[DEV OTP LOGGER] Recipient: ${recipient} | Code: ${code} | Purpose: ${purpose}`)
    return {
      success: true,
      messageId: `dev_${Date.now()}`,
    }
  }
}

/**
 * Beem Africa SMS OTP Provider (Tanzania SMS Gateway)
 */
export class BeemAfricaOtpProvider implements OtpProvider {
  name = 'beem_africa'

  async sendOtp({ recipient, code, purpose }: OtpSendParams): Promise<OtpSendResult> {
    if (!env.BEEM_AFRICA_API_KEY || !env.BEEM_AFRICA_SECRET_KEY) {
      console.error('[SMS ERROR] Missing Beem Africa API credentials in environment')
      return {
        success: false,
        error: 'SMS Gateway credentials not configured.',
      }
    }

    const message = `Your LUMO verification code is: ${code}. Valid for 5 minutes.`
    const authString = Buffer.from(`${env.BEEM_AFRICA_API_KEY}:${env.BEEM_AFRICA_SECRET_KEY}`).toString('base64')

    try {
      const response = await fetch('https://api.beem.africa/v1/send', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Basic ${authString}`,
        },
        body: JSON.stringify({
          source_addr: env.BEEM_AFRICA_SENDER_ID || 'LUMO',
          schedule_time: '',
          message,
          recipients: [{ recipient_id: 1, dest_addr: recipient.replace(/[^0-9+]/g, '') }],
        }),
      })

      const data = await response.json()
      if (response.ok && data.successful) {
        return { success: true, messageId: data.message_id || 'beem_ok' }
      }
      
      console.error('[SMS ERROR] Beem Africa dispatch failed. Will NOT fallback to dev logger.')
      return { success: false, error: data.message || 'Failed to dispatch SMS' }
    } catch (err: any) {
      console.error('[SMS ERROR] Beem Africa network request failed:', err?.message)
      return { success: false, error: err.message || 'SMS provider request failed' }
    }
  }
}

/**
 * Get active SMS OTP Provider based on configuration
 */
export function getOtpProvider(): OtpProvider {
  const provider = env.SMS_PROVIDER || env.SMS_OTP_PROVIDER || 'dev_logger'
  if (provider === 'meseji') {
    return new MesejiSmsOtpProvider()
  }
  if (provider === 'beem_africa') {
    return new BeemAfricaOtpProvider()
  }
  return new DevLoggerOtpProvider()
}
