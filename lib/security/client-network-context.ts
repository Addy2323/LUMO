import { NextRequest, NextResponse } from 'next/server'
import crypto from 'crypto'

export const DEVICE_COOKIE_NAME = 'lumo_did'

export interface ClientNetworkContext {
  ip: string
  ipv4Subnet?: string
  ipv6Subnet?: string
  subnetKey: string
  deviceId: string
  userAgent: string
}

/**
 * Extract IPv4 /24 or IPv6 /48 subnet for risk scoring
 */
export function extractSubnet(ip: string): { ipv4Subnet?: string; ipv6Subnet?: string; subnetKey: string } {
  const cleanIp = ip.trim()

  // IPv4 check
  if (cleanIp.includes('.')) {
    const parts = cleanIp.split('.')
    if (parts.length === 4) {
      const ipv4Subnet = `${parts[0]}.${parts[1]}.${parts[2]}.0/24`
      return { ipv4Subnet, subnetKey: ipv4Subnet }
    }
  }

  // IPv6 check
  if (cleanIp.includes(':')) {
    const parts = cleanIp.split(':').filter(Boolean)
    if (parts.length >= 3) {
      const ipv6Subnet = `${parts.slice(0, 3).join(':')}::/48`
      return { ipv6Subnet, subnetKey: ipv6Subnet }
    }
  }

  return { subnetKey: cleanIp }
}

/**
 * Extract and validate network context from NextRequest
 * Only trusts X-Forwarded-For if request originates from trusted proxies
 */
export function getClientNetworkContext(req: NextRequest): ClientNetworkContext {
  const trustedProxies = (process.env.TRUSTED_PROXIES || '').split(',').map((p) => p.trim()).filter(Boolean)

  let ip = '127.0.0.1'

  const forwardedFor = req.headers.get('x-forwarded-for')
  const realIp = req.headers.get('x-real-ip')

  if (trustedProxies.length > 0 && forwardedFor) {
    const hops = forwardedFor.split(',').map((h) => h.trim())
    ip = hops[0] || '127.0.0.1'
  } else if (realIp) {
    ip = realIp.trim()
  } else if (forwardedFor) {
    ip = forwardedFor.split(',')[0].trim()
  }

  const { ipv4Subnet, ipv6Subnet, subnetKey } = extractSubnet(ip)

  let deviceId = req.cookies.get(DEVICE_COOKIE_NAME)?.value
  if (!deviceId || deviceId.length < 16) {
    deviceId = `did_${crypto.randomUUID()}`
  }

  const userAgent = req.headers.get('user-agent') || 'Unknown'

  return {
    ip,
    ipv4Subnet,
    ipv6Subnet,
    subnetKey,
    deviceId,
    userAgent,
  }
}

/**
 * Attach or refresh the anonymous device cookie on response
 */
export function attachDeviceCookie(res: NextResponse, deviceId: string): NextResponse {
  res.cookies.set(DEVICE_COOKIE_NAME, deviceId, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    path: '/',
    maxAge: 365 * 24 * 60 * 60, // 1 year
  })
  return res
}
