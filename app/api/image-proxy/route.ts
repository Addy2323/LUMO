import { NextRequest, NextResponse } from 'next/server'

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url)
  let imageUrl = searchParams.get('url')

  if (!imageUrl) {
    return new NextResponse('Missing URL parameter', { status: 400 })
  }

  imageUrl = imageUrl.trim()
  if (imageUrl.startsWith('//')) {
    imageUrl = `https:${imageUrl}`
  } else if (imageUrl.startsWith('http://')) {
    imageUrl = imageUrl.replace('http://', 'https://')
  }

  try {
    const upstreamRes = await fetch(imageUrl, {
      headers: {
        'User-Agent':
          'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36',
        Accept: 'image/avif,image/webp,image/apng,image/svg+xml,image/*,*/*;q=0.8',
        Referer: 'https://www.alibaba.com/',
      },
      next: { revalidate: 86400 },
    })

    if (!upstreamRes.ok) {
      // If direct CDN fails, try with generic Referer
      const retryRes = await fetch(imageUrl, {
        headers: {
          'User-Agent':
            'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36',
          Accept: 'image/*,*/*',
        },
      })

      if (!retryRes.ok) {
        return new NextResponse('Failed to fetch upstream image', { status: upstreamRes.status })
      }

      const buffer = await retryRes.arrayBuffer()
      const contentType = retryRes.headers.get('content-type') || 'image/jpeg'

      return new NextResponse(buffer, {
        status: 200,
        headers: {
          'Content-Type': contentType,
          'Cache-Control': 'public, max-age=604800, s-maxage=604800, stale-while-revalidate=2592000',
          'Access-Control-Allow-Origin': '*',
        },
      })
    }

    const buffer = await upstreamRes.arrayBuffer()
    const contentType = upstreamRes.headers.get('content-type') || 'image/jpeg'

    return new NextResponse(buffer, {
      status: 200,
      headers: {
        'Content-Type': contentType,
        'Cache-Control': 'public, max-age=604800, s-maxage=604800, stale-while-revalidate=2592000',
        'Access-Control-Allow-Origin': '*',
      },
    })
  } catch (err) {
    console.error('Image proxy error for URL:', imageUrl, err)
    return new NextResponse('Internal server error proxying image', { status: 500 })
  }
}
