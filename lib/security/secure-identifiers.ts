import crypto from 'crypto'
import { env } from '@/lib/env'

const HMAC_SECRET = env.JWT_SECRET || 'lumo-security-hmac-secret-2026'

/**
 * Compute server-side HMAC-SHA-256 for sensitive identifiers
 * Prevents raw PII / IP addresses from being stored plain in Redis / logs
 */
export function hashIdentifier(value: string, salt: string = 'global'): string {
  if (!value) return 'anonymous'
  return crypto
    .createHmac('sha256', HMAC_SECRET)
    .update(`${salt}:${value.trim().toLowerCase()}`)
    .digest('hex')
}

export function hashPhone(phone: string): string {
  return hashIdentifier(phone, 'phone')
}

export function hashAccount(accountIdOrEmail: string): string {
  return hashIdentifier(accountIdOrEmail, 'account')
}

export function hashIp(ip: string): string {
  return hashIdentifier(ip, 'ip')
}

export function hashDevice(deviceId: string): string {
  return hashIdentifier(deviceId, 'device')
}

/**
 * Normalizes IP to IPv4 /24 subnet or IPv6 /48 subnet prefix and computes HMAC
 */
export function hashSubnet(ip: string): string {
  if (!ip) return hashIdentifier('unknown', 'subnet')
  const cleanIp = ip.trim()

  if (cleanIp.includes('.')) {
    // IPv4: Extract /24 subnet (e.g., 196.201.216.45 -> 196.201.216.0/24)
    const parts = cleanIp.split('.')
    if (parts.length >= 3) {
      const subnetPrefix = `${parts[0]}.${parts[1]}.${parts[2]}.0/24`
      return hashIdentifier(subnetPrefix, 'subnet')
    }
  } else if (cleanIp.includes(':')) {
    // IPv6: Extract /48 subnet (first 3 hextets)
    const hextets = cleanIp.split(':')
    if (hextets.length >= 3) {
      const subnetPrefix = `${hextets[0]}:${hextets[1]}:${hextets[2]}::/48`
      return hashIdentifier(subnetPrefix, 'subnet')
    }
  }

  return hashIdentifier(cleanIp, 'subnet')
}
