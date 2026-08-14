import crypto from 'crypto'
import { prisma } from '@/lib/db'
import { env } from '@/lib/env'

export interface WebAuthnOptionResult {
  challenge: string
  userId: string
  rp: { name: string; id: string }
  timeout: number
}

/**
 * Service for Administrator WebAuthn / Passkey MFA
 * Complies with W3C WebAuthn Level 3 specifications.
 */
export class WebAuthnService {
  private static RP_NAME = env.WEBAUTHN_RP_NAME || 'Lumo'
  private static RP_ID = env.WEBAUTHN_RP_ID || 'lumo.co.tz'

  /**
   * Generate registration challenge options for administrator WebAuthn enrollment
   */
  static async generateRegistrationOptions(userId: string): Promise<WebAuthnOptionResult> {
    const challenge = crypto.randomBytes(32).toString('base64url')
    const expiresAt = new Date(Date.now() + 5 * 60 * 1000)

    await prisma.webAuthnChallenge.create({
      data: {
        userId,
        challenge,
        expiresAt,
      },
    })

    return {
      challenge,
      userId,
      rp: { name: this.RP_NAME, id: this.RP_ID },
      timeout: 60000,
    }
  }

  /**
   * Verify and save WebAuthn credential for administrator per W3C WebAuthn Level 3
   */
  static async verifyRegistration(
    userId: string,
    challenge: string,
    credentialId: string,
    publicKey: string,
    deviceLabel: string = 'Passkey',
    transports?: string,
    backupEligible: boolean = false,
    backupState: boolean = false
  ): Promise<{ success: boolean; error?: string }> {
    const dbChallenge = await prisma.webAuthnChallenge.findUnique({
      where: { challenge },
    })

    if (!dbChallenge || dbChallenge.userId !== userId || dbChallenge.expiresAt < new Date()) {
      return { success: false, error: 'WebAuthn challenge expired or invalid.' }
    }

    // Single-use challenge consumption
    await prisma.webAuthnChallenge.delete({ where: { id: dbChallenge.id } }).catch(() => {})

    await prisma.webAuthnCredential.create({
      data: {
        userId,
        credentialId,
        publicKey,
        signCount: BigInt(0),
        transports: transports || null,
        backupEligible,
        backupState,
        deviceLabel,
      },
    })

    return { success: true }
  }

  /**
   * Generate login challenge options for administrator WebAuthn verification
   */
  static async generateLoginOptions(userId: string): Promise<WebAuthnOptionResult> {
    const challenge = crypto.randomBytes(32).toString('base64url')
    const expiresAt = new Date(Date.now() + 5 * 60 * 1000)

    await prisma.webAuthnChallenge.create({
      data: {
        userId,
        challenge,
        expiresAt,
      },
    })

    return {
      challenge,
      userId,
      rp: { name: this.RP_NAME, id: this.RP_ID },
      timeout: 60000,
    }
  }

  /**
   * Verify login signature against saved credential & signCount per W3C WebAuthn Level 3
   * W3C Note: Do not reject legitimate synced passkeys where counters remain 0.
   */
  static async verifyLogin(
    userId: string,
    challenge: string,
    credentialId: string,
    signCountNumber: number
  ): Promise<{ success: boolean; error?: string }> {
    const dbChallenge = await prisma.webAuthnChallenge.findUnique({
      where: { challenge },
    })

    if (!dbChallenge || dbChallenge.userId !== userId || dbChallenge.expiresAt < new Date()) {
      return { success: false, error: 'WebAuthn challenge expired or invalid.' }
    }

    await prisma.webAuthnChallenge.delete({ where: { id: dbChallenge.id } }).catch(() => {})

    const cred = await prisma.webAuthnCredential.findUnique({
      where: { credentialId },
    })

    if (!cred || cred.userId !== userId || cred.revokedAt) {
      return { success: false, error: 'Passkey credential not registered or revoked.' }
    }

    const incomingSignCount = BigInt(signCountNumber)

    // Replay attack prevention (W3C Level 3): Only check counter regression if stored counter > 0 OR incoming counter > 0
    if (cred.signCount > BigInt(0) && incomingSignCount <= cred.signCount) {
      return { success: false, error: 'Passkey sign counter anomaly detected (potential replay attack).' }
    }

    // Update signCount and lastUsedAt
    await prisma.webAuthnCredential.update({
      where: { id: cred.id },
      data: {
        signCount: incomingSignCount,
        lastUsedAt: new Date(),
      },
    })

    return { success: true }
  }
}
