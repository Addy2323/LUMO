import { z } from 'zod'

/**
 * Zod schema for client payment initiation input
 */
export const initiatePaymentInputSchema = z.object({
  orderId: z.string().min(1, 'Order ID is required'),
  buyerPhone: z.string().min(8, 'Buyer phone number is required'),
  feePayer: z.enum(['MERCHANT', 'BUYER']).default('MERCHANT'),
})

export type InitiatePaymentInput = z.infer<typeof initiatePaymentInputSchema>

/**
 * Zod schema for Mongike API Initiation Response
 */
export const mongikeInitiationResponseSchema = z.object({
  status: z.string().optional(),
  success: z.boolean().optional(),
  message: z.string().optional(),
  code: z.string().optional(),
  error: z.string().optional(),
  id: z.string().optional(),
  payment_id: z.string().optional(),
  gateway_reference: z.string().optional(),
  reference: z.string().optional(),
  expires_at: z.string().optional(),
  data: z
    .object({
      id: z.string().optional(),
      payment_id: z.string().optional(),
      order_id: z.string().optional(),
      gateway_ref: z.string().optional(),
      gateway_reference: z.string().optional(),
      amount: z.number().optional(),
    })
    .optional(),
})

export type MongikeInitiationResponse = z.infer<typeof mongikeInitiationResponseSchema>

/**
 * Normalizes Tanzanian phone numbers to 255XXXXXXXXX format without plus sign or leading 0.
 * Examples:
 *   "+255 711 788 830" -> "255711788830"
 *   "0711788830"       -> "255711788830"
 *   "255711788830"     -> "255711788830"
 */
export function normalizeTanzanianPhone(phone: string): string {
  let cleaned = phone.replace(/\D/g, '')

  if (cleaned.startsWith('0')) {
    cleaned = '255' + cleaned.slice(1)
  }

  if (!cleaned.startsWith('255')) {
    cleaned = '255' + cleaned
  }

  if (cleaned.length !== 12) {
    throw new Error(`Invalid Tanzanian phone number length: expected 12 digits (255XXXXXXXXX), got ${cleaned.length} digits`)
  }

  return cleaned
}

/**
 * Redacts phone numbers, API keys, and sensitive fields from logs.
 */
export function redactSensitiveData(data: Record<string, any>): Record<string, any> {
  const redacted = { ...data }

  for (const key of Object.keys(redacted)) {
    const lower = key.toLowerCase()
    if (lower.includes('key') || lower.includes('secret') || lower.includes('auth') || lower.includes('token')) {
      redacted[key] = '[REDACTED_SECRET]'
    } else if (lower.includes('phone') && typeof redacted[key] === 'string') {
      const p = redacted[key] as string
      redacted[key] = p.length > 5 ? `${p.slice(0, 3)}****${p.slice(-4)}` : '[REDACTED_PHONE]'
    } else if (typeof redacted[key] === 'object' && redacted[key] !== null) {
      redacted[key] = redactSensitiveData(redacted[key])
    }
  }

  return redacted
}

export interface InitiateMongikeRequestParams {
  orderId: string
  orderNumber: string
  amountTZS: number
  buyerPhone: string
  feePayer?: string
  buyerName?: string
  buyerEmail?: string
  customerId?: string
}

export interface MongikeApiResult {
  success: boolean
  providerPaymentId?: string
  gatewayReference?: string
  status: 'PENDING' | 'CREATED' | 'SUCCEEDED' | 'FAILED' | 'EXPIRED' | 'CANCELLED'
  expiresAt?: Date
  failureCode?: string
  failureMessage?: string
  rawResponse: Record<string, any>
}

/**
 * Server-side Mongike Mobile Money Payment Dispatcher
 * Endpoint: POST https://mongike.com/api/v1/payments/mobile-money/tanzania
 */
export async function initiateMongikeMobileMoneyPayment(
  params: InitiateMongikeRequestParams
): Promise<MongikeApiResult> {
  const apiKey = process.env.MONGIKE_API_KEY || 'mk_e30f8cc15b26d1b37fd2743be7c3e49810ff8e5df7a2584d'
  const baseUrl = process.env.MONGIKE_BASE_URL || 'https://mongike.com/api/v1'
  const endpoint = `${baseUrl}/payments/mobile-money/tanzania`

  if (!apiKey) {
    throw new Error('MONGIKE_API_KEY environment variable is missing')
  }

  const normalizedPhone = normalizeTanzanianPhone(params.buyerPhone)
  const feePayer = params.feePayer || process.env.MONGIKE_FEE_PAYER || 'MERCHANT'

  const uniqueOrderId = `${params.orderNumber || params.orderId}-${Date.now().toString().slice(-6)}`

  const requestBody = {
    order_id: uniqueOrderId,
    amount: Math.round(params.amountTZS),
    buyer_phone: normalizedPhone,
    fee_payer: feePayer,
    buyer_name: params.buyerName || 'Lumo Customer',
    buyer_email: params.buyerEmail || 'customer@lumo.co.tz',
    metadata: {
      lumoOrderId: params.orderId,
      customerId: params.customerId || '',
    },
  }

  console.log('[MONGIKE INITIATE DISPATCH]', redactSensitiveData(requestBody))

  const controller = new AbortController()
  const timeoutId = setTimeout(() => controller.abort(), 10000)

  try {
    const res = await fetch(endpoint, {
      method: 'POST',
      headers: {
        'x-api-key': apiKey,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(requestBody),
      signal: controller.signal,
    })

    clearTimeout(timeoutId)

    const responseJson = await res.json().catch(() => ({}))
    console.log('[MONGIKE INITIATE RESPONSE]', redactSensitiveData(responseJson))

    const parsed = mongikeInitiationResponseSchema.parse(responseJson)

    const providerPaymentId =
      parsed.data?.id ||
      parsed.data?.payment_id ||
      parsed.id ||
      parsed.payment_id ||
      parsed.reference ||
      `MNG-${Date.now()}`

    const gatewayReference =
      parsed.data?.gateway_ref ||
      parsed.data?.gateway_reference ||
      parsed.gateway_reference ||
      parsed.reference ||
      providerPaymentId

    let status: MongikeApiResult['status'] = 'PENDING'
    if (res.ok || res.status === 201 || res.status === 200) {
      status = 'PENDING'
    } else {
      status = 'FAILED'
    }

    return {
      success: res.ok || res.status === 201,
      providerPaymentId,
      gatewayReference,
      status,
      expiresAt: parsed.expires_at ? new Date(parsed.expires_at) : new Date(Date.now() + 15 * 60 * 1000),
      failureCode: parsed.code,
      failureMessage: parsed.message || parsed.error,
      rawResponse: responseJson,
    }
  } catch (error: any) {
    clearTimeout(timeoutId)

    const isAbort = error.name === 'AbortError'
    console.error('[MONGIKE INITIATE ERROR]', isAbort ? 'Request timed out after 10s' : error.message)

    return {
      success: false,
      status: 'PENDING', // Timed out or network error stays PENDING for status lookup, avoiding duplicate submissions
      failureCode: isAbort ? 'TIMEOUT' : 'NETWORK_ERROR',
      failureMessage: isAbort ? 'Mongike request timed out' : error.message || 'Payment initiation failed',
      rawResponse: { error: error.message || 'Network error' },
    }
  }
}
