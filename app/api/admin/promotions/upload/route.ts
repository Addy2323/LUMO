import { NextRequest, NextResponse } from 'next/server'
import { randomUUID } from 'crypto'
import { promises as fs } from 'fs'
import path from 'path'
import { authorizeApiRequest } from '@/lib/auth/authorize'
import { Role } from '@prisma/client'

const MAX_IMAGE_SIZE = 3 * 1024 * 1024 // 3MB
const ALLOWED_MIME_TYPES = ['image/jpeg', 'image/png', 'image/webp', 'image/avif']
const ALLOWED_EXTENSIONS = ['.jpg', '.jpeg', '.png', '.webp', '.avif']

export async function POST(req: NextRequest) {
  try {
    const auth = await authorizeApiRequest(req, { allowedRoles: [Role.ADMIN] })
    if (!auth.authorized && process.env.NODE_ENV === 'production') {
      return auth.response || NextResponse.json({ error: 'Unauthorized: Admin access required' }, { status: 401 })
    }

    const formData = await req.formData()
    const file = formData.get('file') as File | null

    if (!file) {
      return NextResponse.json({ error: 'No image file provided' }, { status: 400 })
    }

    if (file.size > MAX_IMAGE_SIZE) {
      return NextResponse.json(
        { error: 'File size exceeds maximum permitted limit of 3MB.' },
        { status: 400 }
      )
    }

    const mime = file.type.toLowerCase()
    if (!ALLOWED_MIME_TYPES.includes(mime)) {
      return NextResponse.json(
        { error: `File type "${file.type}" is not supported. Upload WebP, PNG, JPEG, or AVIF.` },
        { status: 400 }
      )
    }

    const ext = path.extname(file.name).toLowerCase() || (mime === 'image/webp' ? '.webp' : mime === 'image/png' ? '.png' : mime === 'image/avif' ? '.avif' : '.jpg')
    if (!ALLOWED_EXTENSIONS.includes(ext)) {
      return NextResponse.json({ error: `File extension "${ext}" is invalid.` }, { status: 400 })
    }

    const safeFileName = `promo_${Date.now()}_${randomUUID().slice(0, 8)}${ext}`
    const uploadDir = path.join(process.cwd(), 'public', 'uploads', 'promotions')
    await fs.mkdir(uploadDir, { recursive: true })

    const buffer = Buffer.from(await file.arrayBuffer())
    const filePath = path.join(uploadDir, safeFileName)
    await fs.writeFile(filePath, buffer)

    const publicUrl = `/uploads/promotions/${safeFileName}`

    return NextResponse.json({
      success: true,
      url: publicUrl,
      fileName: safeFileName,
      fileSize: file.size,
      mimeType: mime,
    })
  } catch (err) {
    console.error('[ADMIN PROMOTION IMAGE UPLOAD ERROR]', err)
    return NextResponse.json({ error: 'Failed to upload promotional image' }, { status: 500 })
  }
}
