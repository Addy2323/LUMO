import { NextResponse } from 'next/server'

export function applySecurityHeaders(response: NextResponse): NextResponse {
  const headers = response.headers

  // Content Security Policy
  const cspHeader = [
    "default-src 'self'",
    "script-src 'self' 'unsafe-inline' 'unsafe-eval' https://sandbox.azampay.co.tz https://checkout.azampay.co.tz",
    "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com",
    "font-src 'self' https://fonts.gstatic.com data:",
    "img-src 'self' data: blob: https://images.unsplash.com https://cdn.lumo.co.tz",
    "connect-src 'self' https://sandbox.azampay.co.tz https://checkout.azampay.co.tz https://api.beem.africa",
    "frame-ancestors 'none'",
    "base-uri 'self'",
    "form-action 'self'",
  ].join('; ')

  headers.set('Content-Security-Policy', cspHeader)
  headers.set('X-Frame-Options', 'DENY')
  headers.set('X-Content-Type-Options', 'nosniff')
  headers.set('Referrer-Policy', 'strict-origin-when-cross-origin')
  headers.set('Permissions-Policy', 'camera=(), microphone=(), geolocation=(), payment=(self "https://checkout.azampay.co.tz")')
  headers.set('X-XSS-Protection', '1; mode=block')

  if (process.env.NODE_ENV === 'production') {
    headers.set('Strict-Transport-Security', 'max-age=63072000; includeSubDomains; preload')
  }

  return response
}
