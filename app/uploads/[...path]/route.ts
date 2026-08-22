import { NextRequest, NextResponse } from 'next/server'
import { promises as fs } from 'fs'
import path from 'path'

export const dynamic = 'force-dynamic'

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ path: string[] }> }
) {
  try {
    const { path: pathSegments } = await params
    const safePath = path.join(process.cwd(), 'public', 'uploads', ...pathSegments)

    try {
      const fileBuffer = await fs.readFile(safePath)
      const ext = path.extname(safePath).toLowerCase()
      const contentType =
        ext === '.png'
          ? 'image/png'
          : ext === '.webp'
          ? 'image/webp'
          : ext === '.avif'
          ? 'image/avif'
          : 'image/jpeg'

      return new NextResponse(fileBuffer, {
        headers: {
          'Content-Type': contentType,
          'Cache-Control': 'public, max-age=31536000, immutable',
        },
      })
    } catch {
      // If file not found on disk (e.g. serverless container recreation), redirect to fallback banner
      return NextResponse.redirect(
        'https://images.unsplash.com/photo-1607082348824-0a96f2a4b9da?auto=format&fit=crop&w=900&q=80',
        307
      )
    }
  } catch (err) {
    console.error('[UPLOADS FALLBACK ROUTE ERROR]', err)
    return new NextResponse('Not found', { status: 404 })
  }
}
