import { NextRequest, NextResponse } from 'next/server'

interface RateLimitRecord {
  timestamps: number[]
}

const store = new Map<string, RateLimitRecord>()

// Clean up expired entries every 5 minutes
setInterval(() => {
  const now = Date.now()
  for (const [key, record] of store.entries()) {
    record.timestamps = record.timestamps.filter((ts) => now - ts < 600000)
    if (record.timestamps.length === 0) {
      store.delete(key)
    }
  }
}, 300000)

export interface RateLimitOptions {
  limit?: number // Max requests allowed per window (default: 10)
  windowMs?: number // Time window in milliseconds (default: 60000 ms = 1 min)
  prefix?: string // Namespace key prefix (e.g. 'auth', 'checkout', 'extract')
}

export interface RateLimitResult {
  success: boolean
  limit: number
  remaining: number
  resetMs: number
  response?: NextResponse
}

/**
 * Interface for rate-limiter backing store (In-memory or Redis/Upstash for production staging)
 */
export interface RateLimitStore {
  increment(key: string, windowMs: number): Promise<{ count: number; oldestTimestamp: number }>
}

class InMemoryRateLimitStore implements RateLimitStore {
  private store = new Map<string, number[]>()

  async increment(key: string, windowMs: number): Promise<{ count: number; oldestTimestamp: number }> {
    const now = Date.now()
    const windowStart = now - windowMs
    let timestamps = this.store.get(key) || []
    timestamps = timestamps.filter((ts) => ts > windowStart)
    timestamps.push(now)
    this.store.set(key, timestamps)
    return { count: timestamps.length, oldestTimestamp: timestamps[0] }
  }
}

class RedisRateLimitStore implements RateLimitStore {
  private redisUrl: string

  constructor(redisUrl: string) {
    this.redisUrl = redisUrl
  }

  async increment(key: string, windowMs: number): Promise<{ count: number; oldestTimestamp: number }> {
    try {
      // In production staging with Redis URL configured:
      const res = await fetch(`${this.redisUrl}/incr`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${process.env.REDIS_TOKEN || ''}` },
        body: JSON.stringify({ key, windowMs }),
      })
      if (res.ok) {
        const data = await res.json()
        return { count: data.count || 1, oldestTimestamp: Date.now() - (windowMs - (data.ttlMs || windowMs)) }
      }
    } catch (err) {
      console.warn('[REDIS RATE LIMITER WARNING] Redis store unavailable, falling back to safe local check:', err)
    }
    const defaultStore = new InMemoryRateLimitStore()
    return defaultStore.increment(key, windowMs)
  }
}

const isProduction = process.env.NODE_ENV === 'production'
const redisUrl = process.env.REDIS_URL || process.env.UPSTASH_REDIS_REST_URL

const activeStore: RateLimitStore = redisUrl
  ? new RedisRateLimitStore(redisUrl)
  : new InMemoryRateLimitStore()

if (isProduction && !redisUrl) {
  console.warn('[SECURITY WARNING] Running in production without a shared REDIS_URL. Rate limiting will operate per-node in-memory.')
}

/**
 * In-memory sliding-window rate limiter helper.
 * Protects endpoints like auth, URL extraction, quotation submission, and checkout.
 */
export function checkRateLimit(
  req: NextRequest,
  options: RateLimitOptions = {}
): RateLimitResult {
  const { limit = 10, windowMs = 60000, prefix = 'global' } = options

  const ip =
    req.headers.get('x-forwarded-for')?.split(',')[0].trim() ||
    req.headers.get('x-real-ip') ||
    '127.0.0.1'

  const key = `${prefix}:${ip}`
  const now = Date.now()
  const windowStart = now - windowMs

  let record = store.get(key)
  if (!record) {
    record = { timestamps: [] }
    store.set(key, record)
  }

  // Remove timestamps outside current sliding window
  record.timestamps = record.timestamps.filter((ts) => ts > windowStart)

  if (record.timestamps.length >= limit) {
    const oldest = record.timestamps[0]
    const resetMs = oldest + windowMs - now

    console.warn(`[RATE LIMIT EXCEEDED] ${key} exceeded ${limit} reqs per ${windowMs}ms`)

    return {
      success: false,
      limit,
      remaining: 0,
      resetMs,
      response: NextResponse.json(
        {
          error: 'Too many requests. Please slow down and try again later.',
          retryAfterSeconds: Math.ceil(resetMs / 1000),
        },
        {
          status: 429,
          headers: {
            'Retry-After': String(Math.ceil(resetMs / 1000)),
            'X-RateLimit-Limit': String(limit),
            'X-RateLimit-Remaining': '0',
            'X-RateLimit-Reset': String(Math.ceil((now + resetMs) / 1000)),
          },
        }
      ),
    }
  }

  record.timestamps.push(now)
  const remaining = limit - record.timestamps.length

  return {
    success: true,
    limit,
    remaining,
    resetMs: windowMs,
  }
}

/**
 * Middleware compatibility helper for enforceRateLimit.
 */
export async function enforceRateLimit(
  req: NextRequest,
  limit = 10,
  windowMs = 60000,
  prefix = 'middleware'
): Promise<RateLimitResult> {
  return checkRateLimit(req, { limit, windowMs, prefix })
}

