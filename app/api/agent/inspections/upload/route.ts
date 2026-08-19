import { NextRequest, NextResponse } from 'next/server'
import { authorizeApiRequest } from '@/lib/auth/authorize'

// POST /api/agent/inspections/upload
// Secure evidence upload validation & processing endpoint
export async function POST(req: NextRequest) {
  const auth = await authorizeApiRequest(req)
  if (!auth.authorized) return auth.response!
  const { user } = auth

  try {
    const formData = await req.formData()
    const file = formData.get('file') as File | null
    const slotId = (formData.get('slotId') as string) || 'evidence'
    const inspectionId = formData.get('inspectionId') as string | null

    if (!file) {
      return NextResponse.json({ success: false, error: 'No file provided for upload' }, { status: 400 })
    }

    // Validate MIME types
    const allowedPhotoMimes = ['image/jpeg', 'image/png', 'image/webp', 'image/heic']
    const allowedVideoMimes = ['video/mp4', 'video/webm', 'video/quicktime']

    const isVideo = slotId === 'video' || file.type.startsWith('video/')
    const isPhoto = !isVideo

    if (isPhoto && !allowedPhotoMimes.includes(file.type)) {
      return NextResponse.json({
        success: false,
        error: `Invalid photo format (${file.type}). Allowed: JPEG, PNG, WebP, HEIC`,
      }, { status: 400 })
    }

    if (isVideo && !allowedVideoMimes.includes(file.type)) {
      return NextResponse.json({
        success: false,
        error: `Invalid video format (${file.type}). Allowed: MP4, WebM, QuickTime`,
      }, { status: 400 })
    }

    // Enforce size limits: 10MB photo, 50MB video
    const maxPhotoSize = 10 * 1024 * 1024
    const maxVideoSize = 50 * 1024 * 1024

    if (isPhoto && file.size > maxPhotoSize) {
      return NextResponse.json({ success: false, error: 'Photo exceeds maximum size of 10MB' }, { status: 400 })
    }

    if (isVideo && file.size > maxVideoSize) {
      return NextResponse.json({ success: false, error: 'Video exceeds maximum size of 50MB' }, { status: 400 })
    }

    // Generate secure file URL
    const timestamp = Date.now()
    const sanitizeName = file.name.replace(/[^a-zA-Z0-9.-]/g, '_')
    const fileUrl = isVideo
      ? `/uploads/inspections/video_${timestamp}_${sanitizeName}`
      : `/uploads/inspections/slot_${slotId}_${timestamp}_${sanitizeName}`

    return NextResponse.json({
      success: true,
      fileAsset: {
        fileUrl,
        fileName: file.name,
        fileSize: file.size,
        mimeType: file.type,
        slotId,
        uploadedAt: new Date().toISOString(),
        uploaderId: user?.id || 'agent',
      },
    })
  } catch (err: any) {
    console.error('POST /api/agent/inspections/upload error:', err)
    return NextResponse.json({ success: false, error: err.message || 'File upload failed' }, { status: 500 })
  }
}
