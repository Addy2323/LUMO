import { NextRequest, NextResponse } from 'next/server'
import { jwtVerify } from 'jose'
import { env } from '@/lib/env'
import { applySecurityHeaders } from '@/lib/security/headers'
import { enforceRateLimit } from '@/lib/security/rate-limiter'

const JWT_SECRET_BYTES = new TextEncoder().encode(env.JWT_SECRET)
const COOKIE_NAME = 'lumo_session'

// Protected route role requirements
const ROLE_PROTECTED_ROUTES: { prefix: string; allowedRoles: string[] }[] = [
  { prefix: '/admin', allowedRoles: ['ADMIN'] },
  { prefix: '/supplier', allowedRoles: ['SUPPLIER', 'ADMIN'] },
  { prefix: '/sales', allowedRoles: ['SALES', 'ADMIN'] },
  { prefix: '/logistics', allowedRoles: ['LOGISTICS', 'ADMIN'] },
  { prefix: '/agent', allowedRoles: ['AGENT', 'ADMIN'] },
  { prefix: '/account', allowedRoles: ['BUYER', 'SUPPLIER', 'SALES', 'LOGISTICS', 'AGENT', 'ADMIN'] },
  { prefix: '/checkout', allowedRoles: ['BUYER', 'SUPPLIER', 'SALES', 'LOGISTICS', 'AGENT', 'ADMIN'] },
]

export async function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl
  const method = req.method

  // 1. CSRF Origin & Host Validation for state-changing requests (POST, PUT, PATCH, DELETE)
  if (['POST', 'PUT', 'PATCH', 'DELETE'].includes(method) && pathname.startsWith('/api/')) {
    const origin = req.headers.get('origin')
    const host = req.headers.get('host')

    // Exempt public webhooks (e.g. AzamPay Webhook)
    if (pathname !== '/api/payments/azampay/webhook' && origin && host) {
      const originHost = origin.replace(/^https?:\/\//, '')
      if (originHost !== host) {
        return applySecurityHeaders(
          NextResponse.json({ error: 'CSRF verification failed: Origin mismatch' }, { status: 403 })
        )
      }
    }
  }

  // 2. Strict Rate Limiting for Auth and Payment endpoints
  if (pathname.startsWith('/api/auth/') || pathname.startsWith('/api/payments/')) {
    const rateCheck = await enforceRateLimit(req, 10, 60000) // 10 requests per minute
    if (!rateCheck.success) {
      return applySecurityHeaders(rateCheck.response!)
    }
  }

  // 3. RBAC Route Protection
  const rule = ROLE_PROTECTED_ROUTES.find((r) => pathname.startsWith(r.prefix))
  if (rule) {
    const token = req.cookies.get(COOKIE_NAME)?.value

    if (!token) {
      if (pathname.startsWith('/api/')) {
        return applySecurityHeaders(NextResponse.json({ error: 'Authentication required' }, { status: 401 }))
      }
      const loginUrl = new URL('/login', req.url)
      loginUrl.searchParams.set('from', pathname)
      return applySecurityHeaders(NextResponse.redirect(loginUrl))
    }

    try {
      const verified = await jwtVerify(token, JWT_SECRET_BYTES)
      const payload = verified.payload as { role?: string; userId?: string }
      const userRole = (payload?.role || '').toUpperCase()

      if (!userRole || !rule.allowedRoles.includes(userRole)) {
        if (pathname.startsWith('/api/')) {
          return applySecurityHeaders(
            NextResponse.json({ error: 'Access forbidden: Insufficient role permissions' }, { status: 403 })
          )
        }
        return applySecurityHeaders(NextResponse.redirect(new URL('/', req.url)))
      }
    } catch {
      if (pathname.startsWith('/api/')) {
        return applySecurityHeaders(NextResponse.json({ error: 'Invalid or expired session token' }, { status: 401 }))
      }
      const loginUrl = new URL('/login', req.url)
      loginUrl.searchParams.set('from', pathname)
      return applySecurityHeaders(NextResponse.redirect(loginUrl))
    }
  }

  const response = NextResponse.next()
  return applySecurityHeaders(response)
}

export const config = {
  matcher: [
    '/admin/:path*',
    '/supplier/:path*',
    '/sales/:path*',
    '/logistics/:path*',
    '/agent/:path*',
    '/account/:path*',
    '/checkout/:path*',
    '/api/:path*',
  ],
}
