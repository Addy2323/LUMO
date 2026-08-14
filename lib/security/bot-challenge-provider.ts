import crypto from 'crypto'

export interface BotChallengePayload {
  challengeId: string
  puzzleToken: string
  expiresAt: number
}

/**
 * Server-side bot challenge provider (Cryptographic proof-of-work / token challenge)
 */
export class BotChallengeProvider {
  private static SECRET = process.env.JWT_SECRET || 'lumo-bot-challenge-secret'

  static createChallenge(sessionId: string, action: string): BotChallengePayload {
    const challengeId = `bot_${crypto.randomUUID()}`
    const expiresAt = Date.now() + 5 * 60 * 1000 // 5 minutes
    const rawString = `${challengeId}:${sessionId}:${action}:${expiresAt}`

    const puzzleToken = crypto
      .createHmac('sha256', BotChallengeProvider.SECRET)
      .update(rawString)
      .digest('hex')

    return { challengeId, puzzleToken, expiresAt }
  }

  static verifyResponse(
    challengeId: string,
    sessionId: string,
    action: string,
    expiresAt: number,
    solutionToken: string
  ): boolean {
    if (Date.now() > expiresAt) return false

    const rawString = `${challengeId}:${sessionId}:${action}:${expiresAt}`
    const expected = crypto
      .createHmac('sha256', BotChallengeProvider.SECRET)
      .update(rawString)
      .digest('hex')

    try {
      return crypto.timingSafeEqual(Buffer.from(expected), Buffer.from(solutionToken))
    } catch {
      return false
    }
  }
}
