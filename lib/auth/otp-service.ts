import crypto from 'crypto'
import { prisma } from '@/lib/db'
import { getOtpProvider } from '@/lib/auth/otp-provider'
import { OtpPurpose } from '@prisma/client'
import { hashPhone } from '@/lib/security/secure-identifiers'

const OTP_SECRET = process.env.OTP_HMAC_SECRET || process.env.JWT_SECRET || 'lumo-otp-secret-key-2026'
const OTP_TTL_MS = 5 * 60 * 1000 // 5 minutes
const COOLDOWN_MS = 60 * 1000 // 60 seconds
const MAX_ATTEMPTS = 5

/**
 * Keyed OTP HMAC calculation:
 * HMAC-SHA-256(OTP_HMAC_SECRET, challengeId + ":" + purpose + ":" + userIdOrPhoneTargetHash + ":" + normalizedOtp)
 */
export function computeOtpHmac(
  challengeId: string,
  purpose: OtpPurpose,
  targetHash: string,
  normalizedOtp: string
): string {
  const payload = `${challengeId}:${purpose}:${targetHash}:${normalizedOtp.trim()}`
  return crypto.createHmac('sha256', OTP_SECRET).update(payload).digest('hex')
}

/**
 * Generate cryptographically secure 6-digit numeric OTP
 */
export function generateNumericOtp(): string {
  const buf = crypto.randomBytes(4)
  const num = (buf.readUInt32BE(0) % 900000) + 100000
  return num.toString()
}

/**
 * Request and issue a single-use OTP.
 * Invalidates previous active codes while preserving cumulative attempt/resend counters.
 */
export async function issueOtpChallenge(
  phone: string,
  purpose: OtpPurpose,
  userId?: string
): Promise<{ success: boolean; challengeId?: string; error?: string; resendCooldownSeconds?: number }> {
  const cleanPhone = phone.trim().replace(/[^0-9+]/g, '')
  const phoneTargetHash = hashPhone(cleanPhone)

  // Check recent challenges for cooldown
  const recentChallenge = await prisma.otpChallenge.findFirst({
    where: {
      phoneTargetHash,
      purpose,
      invalidatedAt: null,
      consumedAt: null,
    },
    orderBy: { createdAt: 'desc' },
  })

  if (recentChallenge && recentChallenge.resendAvailableAt > new Date()) {
    const secondsRemaining = Math.ceil((recentChallenge.resendAvailableAt.getTime() - Date.now()) / 1000)
    return {
      success: false,
      error: `Please wait ${secondsRemaining} seconds before requesting a new verification code.`,
      resendCooldownSeconds: secondsRemaining,
    }
  }

  // Preserve cumulative attempt and resend counts across resends
  let accumulatedAttempts = 0
  let accumulatedResends = 0

  if (recentChallenge) {
    accumulatedAttempts = recentChallenge.attemptCount
    accumulatedResends = recentChallenge.resendCount + 1

    // Invalidate old challenge code
    await prisma.otpChallenge.update({
      where: { id: recentChallenge.id },
      data: { invalidatedAt: new Date() },
    }).catch(() => {})
  }

  const challengeId = `ch_${crypto.randomUUID()}`
  const plainOtp = generateNumericOtp()
  const codeHash = computeOtpHmac(challengeId, purpose, phoneTargetHash, plainOtp)

  const now = new Date()
  const expiresAt = new Date(now.getTime() + OTP_TTL_MS)
  const resendAvailableAt = new Date(now.getTime() + COOLDOWN_MS)

  // Verify userId exists if provided to prevent FK violation
  let validUserId: string | null = null
  if (userId) {
    const u = await prisma.user.findUnique({ where: { id: userId }, select: { id: true } }).catch(() => null)
    if (u) validUserId = u.id
  }

  await prisma.otpChallenge.create({
    data: {
      id: challengeId,
      userId: validUserId,
      phoneTargetHash,
      purpose,
      codeHash,
      expiresAt,
      resendAvailableAt,
      attemptCount: accumulatedAttempts,
      resendCount: accumulatedResends,
    },
  })

  // Dispatch via SMS Provider
  const provider = getOtpProvider()
  const sendResult = await provider.sendOtp({
    recipient: cleanPhone,
    code: plainOtp,
    purpose,
  })

  if (!sendResult.success) {
    return { success: false, error: sendResult.error || 'Failed to dispatch verification SMS.' }
  }

  return {
    success: true,
    challengeId,
    resendCooldownSeconds: 60,
  }
}

/**
 * Verify single-use OTP challenge atomically using timing-safe comparison
 */
export async function verifyOtpChallenge(
  phone: string,
  inputCode: string,
  purpose: OtpPurpose,
  userId?: string
): Promise<{ success: boolean; challengeId?: string; userId?: string; error?: string }> {
  const cleanPhone = phone.trim().replace(/[^0-9+]/g, '')
  const phoneTargetHash = hashPhone(cleanPhone)
  const cleanCode = inputCode.trim()

  const challenge = await prisma.otpChallenge.findFirst({
    where: {
      phoneTargetHash,
      purpose,
      invalidatedAt: null,
      consumedAt: null,
    },
    orderBy: { createdAt: 'desc' },
  })

  if (!challenge) {
    return { success: false, error: 'Verification code not found or expired. Please request a new code.' }
  }

  if (challenge.expiresAt < new Date()) {
    await prisma.otpChallenge.update({
      where: { id: challenge.id },
      data: { invalidatedAt: new Date() },
    }).catch(() => {})
    return { success: false, error: 'Verification code has expired. Please request a new code.' }
  }

  if (challenge.attemptCount >= MAX_ATTEMPTS) {
    await prisma.otpChallenge.update({
      where: { id: challenge.id },
      data: { invalidatedAt: new Date() },
    }).catch(() => {})
    return { success: false, error: 'Maximum verification attempts exceeded. Please request a new code.' }
  }

  const expectedHmac = computeOtpHmac(challenge.id, purpose, phoneTargetHash, cleanCode)

  let isMatch = false
  try {
    isMatch = crypto.timingSafeEqual(Buffer.from(challenge.codeHash), Buffer.from(expectedHmac))
  } catch {
    isMatch = false
  }

  if (!isMatch) {
    const updated = await prisma.otpChallenge.update({
      where: { id: challenge.id },
      data: { attemptCount: { increment: 1 } },
    })

    const remaining = MAX_ATTEMPTS - updated.attemptCount
    if (remaining <= 0) {
      await prisma.otpChallenge.update({
        where: { id: challenge.id },
        data: { invalidatedAt: new Date() },
      }).catch(() => {})
      return { success: false, error: 'Maximum verification attempts exceeded. Please request a new code.' }
    }

    return {
      success: false,
      error: `Invalid verification code. ${remaining} attempts remaining.`,
    }
  }

  // Atomic single-use consumption
  await prisma.otpChallenge.update({
    where: { id: challenge.id },
    data: { consumedAt: new Date() },
  })

  return {
    success: true,
    challengeId: challenge.id,
    userId: challenge.userId || userId,
  }
}

/**
 * Backward compatibility helpers for legacy auth routes
 */
export async function issueOtp(phone: string, purpose: string = 'PHONE_REGISTRATION') {
  const enumPurpose = purpose === 'PASSWORD_RESET' ? OtpPurpose.PASSWORD_RESET : OtpPurpose.PHONE_REGISTRATION
  return issueOtpChallenge(phone, enumPurpose)
}

export async function verifyOtpCode(phone: string, code: string, purpose: string = 'PHONE_REGISTRATION') {
  const enumPurpose = purpose === 'PASSWORD_RESET' ? OtpPurpose.PASSWORD_RESET : OtpPurpose.PHONE_REGISTRATION
  return verifyOtpChallenge(phone, code, enumPurpose)
}

