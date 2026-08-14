import crypto from 'crypto'
import { env } from '@/lib/env'

export interface AzamPayCheckoutParams {
  orderId: string
  orderNumber: string
  amountTZS: number
  accountNumber: string // Customer mobile number (e.g. 0712345678)
  providerName: 'M-PESA' | 'HALOPESA' | 'AIRTEL' | 'AZAMPAY'
}

export interface AzamPayCheckoutResult {
  success: boolean
  transactionRef: string
  message: string
  rawResponse?: Record<string, unknown>
}

/**
 * AzamPay Server Integration Client for Tanzania Mobile Money
 */
export class AzamPayClient {
  private baseUrl: string

  constructor() {
    this.baseUrl =
      env.AZAMPAY_ENVIRONMENT === 'production'
        ? 'https://checkout.azampay.co.tz'
        : 'https://sandbox.azampay.co.tz'
  }

  /**
   * Request OAuth Token from AzamPay API
   */
  async getAuthToken(): Promise<string | null> {
    const clientId = env.AZAMPAY_CLIENT_ID
    const clientSecret = env.AZAMPAY_CLIENT_SECRET
    const appName = 'LUMO'

    if (!clientId || !clientSecret) {
      if (env.NODE_ENV === 'production') {
        console.error('[CRITICAL] Missing AzamPay production credentials!')
        return null
      }
      // Dev mock token
      return `azm_dev_token_${Date.now()}`
    }

    try {
      const response = await fetch(`${this.baseUrl}/Applink/GetToken`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          appName,
          clientId,
          clientSecret,
        }),
      })

      const data = await response.json()
      if (response.ok && data.data?.accessToken) {
        return data.data.accessToken
      }
      return null
    } catch (error) {
      console.error('[AZAMPAY AUTH TOKEN ERROR]', error)
      return null
    }
  }

  /**
   * Initiate Mobile Money M-Pesa / Tigo Pesa / Airtel Money Checkout
   */
  async checkout(params: AzamPayCheckoutParams): Promise<AzamPayCheckoutResult> {
    const token = await this.getAuthToken()
    const clientId = env.AZAMPAY_CLIENT_ID

    if (!token && env.NODE_ENV === 'production') {
      return {
        success: false,
        transactionRef: '',
        message: 'Payment gateway configuration error in production.',
      }
    }

    const transactionRef = `AZM-${Date.now()}-${Math.floor(100 + Math.random() * 900)}`

    // Development sandbox simulation
    if (env.NODE_ENV === 'development' && (!clientId || token?.startsWith('azm_dev_token_'))) {
      console.log(`[DEV AZAMPAY CHECKOUT] Order ${params.orderNumber} | Amount: TZS ${params.amountTZS} | Mobile: ${params.accountNumber} | Channel: ${params.providerName}`)
      return {
        success: true,
        transactionRef,
        message: `Payment request initialized for ${params.accountNumber}. Please confirm PIN prompt on your phone.`,
      }
    }

    try {
      const response = await fetch(`${this.baseUrl}/azampay/mmo/checkout`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          accountNumber: params.accountNumber,
          amount: params.amountTZS.toString(),
          currency: 'TZS',
          externalId: params.orderNumber,
          provider: params.providerName,
          additionalProperties: {},
        }),
      })

      const data = await response.json()
      if (response.ok && data.success) {
        return {
          success: true,
          transactionRef: data.transactionId || transactionRef,
          message: data.message || 'Payment initialized.',
          rawResponse: data,
        }
      }

      return {
        success: false,
        transactionRef,
        message: data.message || 'Payment request rejected by carrier.',
      }
    } catch (err: unknown) {
      const errorMessage = err instanceof Error ? err.message : 'AzamPay server request failed.'
      return {
        success: false,
        transactionRef,
        message: errorMessage,
      }
    }
  }

  /**
   * Verify official AzamPay Webhook signature / bearer token
   */
  verifyWebhookAuth(reqHeaders: Headers, bodyString: string): boolean {
    const webhookSecret = env.AZAMPAY_WEBHOOK_SECRET
    if (!webhookSecret) {
      if (env.NODE_ENV === 'development') return true
      return false // Fail closed in production
    }

    const authHeader = reqHeaders.get('authorization')
    const signature = reqHeaders.get('x-azampay-signature')

    if (signature) {
      try {
        const computedHash = crypto.createHmac('sha256', webhookSecret).update(bodyString).digest('hex')
        const sigBuffer = Buffer.from(signature)
        const hashBuffer = Buffer.from(computedHash)

        if (sigBuffer.length !== hashBuffer.length) {
          return false
        }
        return crypto.timingSafeEqual(sigBuffer, hashBuffer)
      } catch {
        return false
      }
    }

    if (authHeader) {
      return authHeader === `Bearer ${webhookSecret}`
    }

    return false
  }
}

export const azamPayClient = new AzamPayClient()
