import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { Role } from '@prisma/client'
import { prisma } from '@/lib/db'
import { getCurrentUser } from '@/lib/auth/server'

const NoteSchema = z.object({
  noteText: z.string().min(1, 'Note cannot be empty'),
})

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await getCurrentUser()
    if (!user || user.role !== Role.ADMIN) {
      return NextResponse.json({ error: 'Forbidden: Administrator access required.' }, { status: 403 })
    }

    const { id } = await params
    const body = await req.json()
    const result = NoteSchema.safeParse(body)

    if (!result.success) {
      return NextResponse.json({ error: 'Validation failed' }, { status: 400 })
    }

    const note = await prisma.applicationReviewNote.create({
      data: {
        applicationId: id,
        authorId: user.id,
        authorName: user.name,
        noteText: result.data.noteText,
      },
    })

    return NextResponse.json({ success: true, note })
  } catch (error: unknown) {
    console.error('[API ADMIN APPLICATION NOTE ERROR]', error)
    return NextResponse.json({ error: 'Failed to save review note.' }, { status: 500 })
  }
}

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await getCurrentUser()
    if (!user || user.role !== Role.ADMIN) {
      return NextResponse.json({ error: 'Forbidden: Administrator access required.' }, { status: 403 })
    }

    const { id } = await params
    const notes = await prisma.applicationReviewNote.findMany({
      where: { applicationId: id },
      orderBy: { createdAt: 'desc' },
    })

    return NextResponse.json({ notes })
  } catch (error: unknown) {
    console.error('[API ADMIN GET NOTES ERROR]', error)
    return NextResponse.json({ error: 'Failed to retrieve notes.' }, { status: 500 })
  }
}
