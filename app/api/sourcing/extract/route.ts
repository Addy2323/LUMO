import { NextRequest, NextResponse } from 'next/server'
import { checkRateLimit } from '@/lib/security/rate-limiter'

const ALLOWED_DOMAINS = [
  'alibaba.com',
  'm.alibaba.com',
  '1688.com',
  'detail.1688.com',
  'taobao.com',
  'item.taobao.com',
  'tmall.com',
  'made-in-china.com',
  'aliexpress.com',
  'amazon.com',
  'dhgate.com',
]

/**
 * Checks if a hostname resolves to or represents a private/internal IP address (SSRF Protection).
 */
function isForbiddenPrivateHost(hostname: string, rawUrl: string): boolean {
  const host = hostname.toLowerCase().trim()

  // 1. Reject URLs containing embedded credentials (e.g. http://admin:pass@host)
  if (rawUrl.includes('@')) {
    return true
  }

  // 2. Reject localhost & special internal hostnames
  if (
    host === 'localhost' ||
    host === '127.0.0.1' ||
    host === '0.0.0.0' ||
    host === '::' ||
    host === '::1' ||
    host.endsWith('.local') ||
    host.endsWith('.internal') ||
    host.endsWith('.arpa')
  ) {
    return true
  }

  // 3. IPv6 Private & Link-Local Range Check
  if (
    host.startsWith('fc') ||
    host.startsWith('fd') ||
    host.startsWith('fe80') ||
    host.startsWith('::ffff:127.') ||
    host.startsWith('::ffff:10.') ||
    host.startsWith('::ffff:192.168.')
  ) {
    return true
  }

  // 4. IPv4 Private & Reserved Range Check (including octal/hex/decimal representations)
  const ipv4Regex = /^(\d{1,3})\.(\d{1,3})\.(\d{1,3})\.(\d{1,3})$/
  const match = host.match(ipv4Regex)
  if (match) {
    const [, oct1, oct2] = match.map(Number)
    if (oct1 === 10) return true // 10.0.0.0/8
    if (oct1 === 127) return true // 127.0.0.0/8
    if (oct1 === 172 && oct2 >= 16 && oct2 <= 31) return true // 172.16.0.0/12
    if (oct1 === 192 && oct2 === 168) return true // 192.168.0.0/16
    if (oct1 === 169 && oct2 === 254) return true // 169.254.0.0/16 (Link Local & AWS/GCP Metadata 169.254.169.254)
    if (oct1 === 0) return true // 0.0.0.0/8
  }

  // 5. Hexadecimal / Octal IP Bypass Protection (e.g., 0x7f.0.0.1 or 0177.0.0.1)
  if (/^0x/i.test(host) || /^0\d+/i.test(host)) {
    return true
  }

  return false
}

/**
 * POST /api/sourcing/extract
 * Extracts title, image, price, and details from approved foreign supplier product links.
 */
export async function POST(req: NextRequest) {
  // Rate limit: 10 extraction requests per minute
  const rateLimit = checkRateLimit(req, { limit: 10, windowMs: 60000, prefix: 'sourcing_extract' })
  if (!rateLimit.success && rateLimit.response) return rateLimit.response

  try {
    const body = await req.json()
    const { url } = body

    if (!url || typeof url !== 'string') {
      return NextResponse.json({ error: 'Missing or invalid "url" parameter' }, { status: 400 })
    }

    let parsedUrl: URL
    try {
      parsedUrl = new URL(url.trim())
    } catch {
      return NextResponse.json({ error: 'Invalid URL format' }, { status: 400 })
    }

    if (parsedUrl.protocol !== 'http:' && parsedUrl.protocol !== 'https:') {
      return NextResponse.json(
        { error: 'Forbidden protocol. Only http and https URLs are allowed.' },
        { status: 400 }
      )
    }

    const hostname = parsedUrl.hostname.toLowerCase()

    // 1. SSRF Protection: Reject private/internal IPs & local hostnames
    if (isForbiddenPrivateHost(hostname, parsedUrl.toString())) {
      return NextResponse.json(
        { error: 'Access denied: Target URL resolves to an internal/forbidden host' },
        { status: 403 }
      )
    }

    // 2. Domain Allowlist Enforcement
    const isAllowed = ALLOWED_DOMAINS.some(
      (domain) => hostname === domain || hostname.endsWith(`.${domain}`)
    )

    if (!isAllowed) {
      return NextResponse.json(
        {
          error: `Domain "${hostname}" is not supported. Supported platforms: ${ALLOWED_DOMAINS.join(', ')}`,
        },
        { status: 400 }
      )
    }

    // 3. Perform HTTP Fetch with timeout (5000ms max)
    const controller = new AbortController()
    const timeoutId = setTimeout(() => controller.abort(), 5000)

    try {
      const response = await fetch(parsedUrl.toString(), {
        method: 'GET',
        headers: {
          'User-Agent':
            'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36 LumoSourcingBot/1.0',
          Accept: 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
          'Accept-Language': 'en-US,en;q=0.9',
        },
        signal: controller.signal,
      })

      clearTimeout(timeoutId)

      if (!response.ok) {
        return NextResponse.json(
          { error: `Supplier page returned HTTP status ${response.status}` },
          { status: 502 }
        )
      }

      const html = await response.text()

      // 4. Extract OpenGraph & HTML Metadata
      const titleMatch =
        html.match(/<meta\s+property=["']og:title["']\s+content=["']([^"']+)["']/i) ||
        html.match(/<meta\s+name=["']twitter:title["']\s+content=["']([^"']+)["']/i) ||
        html.match(/<title[^>]*>([^<]+)<\/title>/i)

      const imageMatch =
        html.match(/<meta\s+property=["']og:image["']\s+content=["']([^"']+)["']/i) ||
        html.match(/<meta\s+name=["']twitter:image["']\s+content=["']([^"']+)["']/i)

      const priceMatch =
        html.match(/<meta\s+property=["']og:price:amount["']\s+content=["']([^"']+)["']/i) ||
        html.match(/<meta\s+property=["']product:price:amount["']\s+content=["']([^"']+)["']/i) ||
        html.match(/["']price["']\s*:\s*["']?([\d\.]+)["']?/i)

      const currencyMatch =
        html.match(/<meta\s+property=["']og:price:currency["']\s+content=["']([^"']+)["']/i) ||
        html.match(/<meta\s+property=["']product:price:currency["']\s+content=["']([^"']+)["']/i)

      const descriptionMatch =
        html.match(/<meta\s+property=["']og:description["']\s+content=["']([^"']+)["']/i) ||
        html.match(/<meta\s+name=["']description["']\s+content=["']([^"']+)["']/i)

      const title = titleMatch ? titleMatch[1].trim() : 'External Supplier Product'
      const image = imageMatch ? imageMatch[1].trim() : null
      const extractedPrice = priceMatch ? parseFloat(priceMatch[1]) : null
      const currency = currencyMatch ? currencyMatch[1].toUpperCase() : 'USD'
      const description = descriptionMatch ? descriptionMatch[1].trim() : ''

      return NextResponse.json({
        success: true,
        extracted: {
          originalUrl: parsedUrl.toString(),
          domain: hostname,
          title,
          image,
          estimatedUnitPriceUSD: extractedPrice || 0,
          currency,
          description,
          extractedAt: new Date().toISOString(),
        },
      })
    } catch (fetchErr: any) {
      clearTimeout(timeoutId)
      if (fetchErr.name === 'AbortError') {
        return NextResponse.json(
          { error: 'Extraction timed out (supplier page took longer than 5 seconds to respond)' },
          { status: 504 }
        )
      }
      throw fetchErr
    }
  } catch (error: any) {
    console.error('[SOURCING EXTRACT ERROR]', error)
    return NextResponse.json(
      { error: 'Failed to extract product link metadata' },
      { status: 500 }
    )
  }
}
