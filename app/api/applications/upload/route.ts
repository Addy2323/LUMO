import { NextRequest, NextResponse } from 'next/server'
import { createHash, randomUUID } from 'crypto'
import { promises as fs } from 'fs'
import path from 'path'
import { prisma } from '@/lib/db'
import { getCurrentUser } from '@/lib/auth/server'

const MAX_FILE_SIZE = 10 * 1024 * 1024 // 10MB
const ALLOWED_MIME_TYPES = [
  'application/pdf',
  'image/jpeg',
  'image/png',
  'image/webp',
]
const ALLOWED_EXTENSIONS = ['.pdf', '.jpg', '.jpeg', '.png', '.webp']

export async function POST(req: NextRequest) {
  try {
    const user = await getCurrentUser()
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const formData = await req.formData()
    const file = formData.get('file') as File | null
    const applicationId = formData.get('applicationId') as string | null
    const documentCategory = formData.get('documentCategory') as string | null

    if (!file || !applicationId || !documentCategory) {
      return NextResponse.json(
        { error: 'Missing file, applicationId or documentCategory.' },
        { status: 400 }
      )
    }

    // Verify application ownership or draft status
    const application = await prisma.partnerApplication.findFirst({
      where: {
        id: applicationId,
        userId: user.id,
      },
    })

    if (!application) {
      return NextResponse.json({ error: 'Application not found or access denied.' }, { status: 404 })
    }

    if (file.size > MAX_FILE_SIZE) {
      return NextResponse.json(
        { error: 'File size exceeds maximum permitted limit of 10MB.' },
        { status: 400 }
      )
    }

    if (!ALLOWED_MIME_TYPES.includes(file.type.toLowerCase())) {
      return NextResponse.json(
        { error: `File type ${file.type} is not permitted. Upload PDF or JPG/PNG/WEBP images.` },
        { status: 400 }
      )
    }

    const fileExt = path.extname(file.name).toLowerCase()
    if (!ALLOWED_EXTENSIONS.includes(fileExt)) {
      return NextResponse.json(
        { error: `File extension ${fileExt} is invalid.` },
        { status: 400 }
      )
    }

    const arrayBuffer = await file.arrayBuffer()
    const buffer = Buffer.from(arrayBuffer)
    const fileHash = createHash('sha256').update(buffer).digest('hex')

    // Generate safe storage key outside public web path
    const safeFileName = `${randomUUID()}${fileExt}`
    const uploadDir = path.join(process.cwd(), 'private_uploads', 'applications', applicationId)
    await fs.mkdir(uploadDir, { recursive: true })

    const targetFilePath = path.join(uploadDir, safeFileName)
    await fs.writeFile(targetFilePath, buffer)

    const storageKey = `private_uploads/applications/${applicationId}/${safeFileName}`

    // Create ApplicationDocument record
    const document = await prisma.applicationDocument.create({
      data: {
        applicationId,
        documentCategory,
        fileName: safeFileName,
        originalName: file.name,
        fileSize: file.size,
        mimeType: file.type,
        storageKey,
        fileHash,
        verifiedStatus: false,
      },
    })

    return NextResponse.json({
      success: true,
      document: {
        id: document.id,
        documentCategory: document.documentCategory,
        originalName: document.originalName,
        fileSize: document.fileSize,
        mimeType: document.mimeType,
        verifiedStatus: document.verifiedStatus,
        uploadedAt: document.uploadedAt.toISOString(),
      },
    })
  } catch (error: unknown) {
    console.error('[API UPLOAD DOCUMENT ERROR]', error)
    return NextResponse.json({ error: 'Failed to upload document safely.' }, { status: 500 })
  }
}
