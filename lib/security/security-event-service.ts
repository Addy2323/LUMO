import { prisma } from '@/lib/db'

export interface SecurityEventData {
  eventType: string
  userId?: string
  accountTargetHash?: string
  ipHash?: string
  deviceHash?: string
  endpoint: string
  purpose?: string
  action: string
  riskLevel?: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL'
  correlationId?: string
  details?: string
}

/**
 * Record structured security events to database and audit logs
 * Automatically redacts sensitive fields
 */
export async function logSecurityEvent(event: SecurityEventData): Promise<void> {
  try {
    // Sanitize details if present
    let sanitizedDetails = event.details
    if (sanitizedDetails) {
      sanitizedDetails = sanitizedDetails
        .replace(/("password"|"otp"|"code"|"token")\s*:\s*"[^"]+"/gi, '$1:"[REDACTED]"')
        .replace(/\b\d{6}\b/g, '[REDACTED_OTP]')
    }

    await prisma.authSecurityEvent.create({
      data: {
        eventType: event.eventType,
        userId: event.userId || null,
        accountTargetHash: event.accountTargetHash || null,
        ipHash: event.ipHash || null,
        deviceHash: event.deviceHash || null,
        endpoint: event.endpoint,
        purpose: event.purpose || null,
        action: event.action,
        riskLevel: event.riskLevel || 'LOW',
        correlationId: event.correlationId || `evt_${Date.now()}`,
        details: sanitizedDetails || null,
      },
    })
  } catch (err) {
    console.error('[SECURITY EVENT LOGGER ERROR] Failed to record security event:', err)
  }
}
