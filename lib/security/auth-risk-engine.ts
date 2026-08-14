/**
 * Risk evaluation engine for authentication attempts
 */
export interface RiskScoreResult {
  riskScore: number // 0 to 100
  progressiveDelayMs: number // Server delay up to 2000ms max
  requireBotChallenge: boolean
  requireStepUpPhone: boolean
  shouldThrottle: boolean
  retryAfterSeconds: number
}

export function evaluateAttemptRisk(failedAttemptCount: number, isSpraySuspected: boolean = false): RiskScoreResult {
  let riskScore = 0
  let progressiveDelayMs = 0
  let requireBotChallenge = false
  let requireStepUpPhone = false
  let shouldThrottle = false
  let retryAfterSeconds = 0

  if (failedAttemptCount >= 1 && failedAttemptCount <= 3) {
    riskScore = 10 * failedAttemptCount
  } else if (failedAttemptCount === 4) {
    riskScore = 50
    // Controlled server-side delay (up to 2s)
    progressiveDelayMs = 2000
  } else if (failedAttemptCount === 5) {
    riskScore = 75
    requireBotChallenge = true
    shouldThrottle = true
    retryAfterSeconds = 5
  } else if (failedAttemptCount >= 6 && failedAttemptCount <= 7) {
    riskScore = 85
    requireBotChallenge = true
    shouldThrottle = true
    retryAfterSeconds = 15 + (failedAttemptCount - 6) * 15 // 15s to 30s
  } else if (failedAttemptCount >= 8) {
    riskScore = 95
    shouldThrottle = true
    retryAfterSeconds = 900 // 15 mins temporary hold
  }

  if (failedAttemptCount >= 12) {
    requireStepUpPhone = true
    retryAfterSeconds = 3600 // 1 hour hold
  }

  if (isSpraySuspected) {
    riskScore = Math.max(riskScore, 90)
    requireBotChallenge = true
    shouldThrottle = true
    retryAfterSeconds = Math.max(retryAfterSeconds, 600)
  }

  // Add subtle server jitter (0-250ms) to prevent timing side-channels
  if (progressiveDelayMs > 0) {
    progressiveDelayMs += Math.floor(Math.random() * 250)
  }

  return {
    riskScore,
    progressiveDelayMs,
    requireBotChallenge,
    requireStepUpPhone,
    shouldThrottle,
    retryAfterSeconds,
  }
}
