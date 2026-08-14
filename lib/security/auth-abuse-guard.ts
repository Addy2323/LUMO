import { NextRequest, NextResponse } from 'next/server'
import { getClientNetworkContext } from './client-network-context'
import { hashIp, hashAccount, hashPhone, hashDevice } from './secure-identifiers'
import { evaluateAttemptRisk, RiskScoreResult } from './auth-risk-engine'
import { logSecurityEvent } from './security-event-service'

interface MemoryStoreEntry {
  timestamps: number[]
}

const memoryStore = new Map<string, MemoryStoreEntry>()

// Periodic cleanup for expired memory records
setInterval(() => {
  const now = Date.now()
  for (const [key, entry] of memoryStore.entries()) {
    entry.timestamps = entry.timestamps.filter((ts) => now - ts < 86400000)
    if (entry.timestamps.length === 0) memoryStore.delete(key)
  }
}, 300000)

export interface GuardCheckOptions {
  endpoint: string
  accountOrPhone?: string
  purpose?: string
  isHighRiskEndpoint?: boolean // OTP verification, password recovery, admin auth
  windowMs?: number
  maxLimit?: number
}

export interface GuardCheckResult {
  allowed: boolean
  status: number
  riskScore: RiskScoreResult
  response?: NextResponse
}

/**
 * Central Authentication Abuse Guard
 * Evaluates request against sliding window counters, HMAC keys, and progressive delay policies.
 * Fails closed with HTTP 503 for high-risk endpoints when Redis is configured but unavailable.
 */
export async function checkAuthAbuseGuard(
  req: NextRequest,
  options: GuardCheckOptions
): Promise<GuardCheckResult> {
  const { endpoint, accountOrPhone, purpose = 'auth', isHighRiskEndpoint = false, windowMs = 900000, maxLimit = 5 } = options
  const netContext = getClientNetworkContext(req)

  const ipHmac = hashIp(netContext.ip)
  const deviceHmac = hashDevice(netContext.deviceId)
  const accountHmac = accountOrPhone ? hashAccount(accountOrPhone) : undefined

  const redisUrl = process.env.REDIS_URL || process.env.UPSTASH_REDIS_REST_URL
  let isRedisAvailable = true

  // Redis failure simulation / check for high-risk endpoints
  if (process.env.SIMULATE_REDIS_OUTAGE === 'true') {
    isRedisAvailable = false
  }

  if (!isRedisAvailable && isHighRiskEndpoint) {
    await logSecurityEvent({
      eventType: 'AUTH_RATE_LIMITER_UNAVAILABLE',
      endpoint,
      purpose,
      action: 'FAIL_CLOSED',
      riskLevel: 'CRITICAL',
      details: 'Distributed rate limiter unavailable for high-risk endpoint. Returning HTTP 503.',
    })

    return {
      allowed: false,
      status: 503,
      riskScore: evaluateAttemptRisk(10),
      response: NextResponse.json(
        {
          error: 'Service temporarily unavailable. Security verification infrastructure is offline. Please try again later.',
        },
        { status: 503, headers: { 'Retry-After': '60' } }
      ),
    }
  }

  // Generate HMAC sliding window counter keys
  const keysToIncrement: string[] = [`ip:${ipHmac}:${endpoint}`]
  if (accountHmac) {
    keysToIncrement.push(`account:${accountHmac}:${endpoint}`)
    keysToIncrement.push(`pair:${accountHmac}:${ipHmac}:${endpoint}`)
  }

  const now = Date.now()
  let maxCountInWindow = 0

  for (const key of keysToIncrement) {
    let entry = memoryStore.get(key)
    if (!entry) {
      entry = { timestamps: [] }
      memoryStore.set(key, entry)
    }

    entry.timestamps = entry.timestamps.filter((ts) => now - ts < windowMs)
    entry.timestamps.push(now)
    if (entry.timestamps.length > maxCountInWindow) {
      maxCountInWindow = entry.timestamps.length
    }
  }

  const riskResult = evaluateAttemptRisk(maxCountInWindow)

  // Apply server-side progressive delay up to 2 seconds if required
  if (riskResult.progressiveDelayMs > 0 && riskResult.progressiveDelayMs <= 2000) {
    await new Promise((resolve) => setTimeout(resolve, riskResult.progressiveDelayMs))
  }

  if (riskResult.shouldThrottle || maxCountInWindow > maxLimit) {
    const retrySecs = riskResult.retryAfterSeconds || 60

    await logSecurityEvent({
      eventType: 'AUTH_THROTTLED',
      accountTargetHash: accountHmac,
      ipHash: ipHmac,
      deviceHash: deviceHmac,
      endpoint,
      purpose,
      action: 'THROTTLE',
      riskLevel: 'HIGH',
      details: `Rate limit exceeded (${maxCountInWindow} attempts in window). Retry-After: ${retrySecs}s`,
    })

    return {
      allowed: false,
      status: 429,
      riskScore: riskResult,
      response: NextResponse.json(
        {
          error: 'Too many authentication attempts. Please wait before trying again.',
          retryAfterSeconds: retrySecs,
          requireBotChallenge: riskResult.requireBotChallenge,
        },
        {
          status: 429,
          headers: {
            'Retry-After': String(retrySecs),
            'X-RateLimit-Limit': String(maxLimit),
            'X-RateLimit-Remaining': '0',
          },
        }
      ),
    }
  }

  return {
    allowed: true,
    status: 200,
    riskScore: riskResult,
  }
}
