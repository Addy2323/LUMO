/**
 * Payment Idempotency & Authoritative Pricing Manager
 */

export interface IdempotencyRecord {
  key: string
  status: 'pending' | 'success' | 'failed'
  orderReference?: string
  transactionRef?: string
  amount: number
  timestamp: number
  error?: string
}

// In-memory idempotency cache for safety against rapid duplicate requests
const idempotencyCache = new Map<string, IdempotencyRecord>()

export function getOrCreateIdempotencyKey(existingKey?: string): string {
  if (existingKey && existingKey.trim().length > 8) {
    return existingKey.trim()
  }
  return `IDEMP-${Date.now()}-${Math.random().toString(36).substring(2, 9).toUpperCase()}`
}

export function checkIdempotency(key: string): IdempotencyRecord | null {
  const record = idempotencyCache.get(key)
  if (!record) return null
  // Expire after 30 minutes
  if (Date.now() - record.timestamp > 30 * 60 * 1000) {
    idempotencyCache.delete(key)
    return null
  }
  return record
}

export function registerPendingIdempotency(key: string, amount: number): IdempotencyRecord {
  const existing = checkIdempotency(key)
  if (existing) {
    return existing
  }
  const record: IdempotencyRecord = {
    key,
    status: 'pending',
    amount,
    timestamp: Date.now(),
  }
  idempotencyCache.set(key, record)
  return record
}

export function completeIdempotency(key: string, orderReference: string, transactionRef: string): IdempotencyRecord {
  const record: IdempotencyRecord = idempotencyCache.get(key) || {
    key,
    status: 'success',
    amount: 0,
    timestamp: Date.now(),
  }
  record.status = 'success'
  record.orderReference = orderReference
  record.transactionRef = transactionRef
  idempotencyCache.set(key, record)
  return record
}

export function failIdempotency(key: string, errorMsg: string): IdempotencyRecord {
  const record: IdempotencyRecord = idempotencyCache.get(key) || {
    key,
    status: 'failed',
    amount: 0,
    timestamp: Date.now(),
  }
  record.status = 'failed'
  record.error = errorMsg
  idempotencyCache.set(key, record)
  return record
}

/**
 * Recalculate authoritative total on server/store level
 */
export function calculateAuthoritativeTotal(input: {
  lines: { unitPrice: number; quantity: number }[]
  shippingFee: number
  couponDiscountPercentage?: number
}): { subtotal: number; shippingFee: number; couponDiscount: number; total: number } {
  const subtotal = input.lines.reduce((sum, line) => sum + Math.max(0, line.unitPrice) * Math.max(1, line.quantity), 0)
  const shippingFee = Math.max(0, input.shippingFee)
  const discountPct = input.couponDiscountPercentage ? Math.max(0, Math.min(100, input.couponDiscountPercentage)) : 0
  const couponDiscount = Math.round(subtotal * (discountPct / 100))
  const total = Math.max(0, subtotal + shippingFee - couponDiscount)

  return {
    subtotal,
    shippingFee,
    couponDiscount,
    total,
  }
}
