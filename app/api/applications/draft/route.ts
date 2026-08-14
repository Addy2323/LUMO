import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { ApplicationStatus, ApplicationType, Prisma } from '@prisma/client'
import { prisma } from '@/lib/db'
import { getCurrentUser } from '@/lib/auth/server'

const DraftSaveSchema = z.object({
  applicationType: z.enum(['SUPPLIER', 'LOGISTICS']),
  currentStep: z.number().int().min(1),
  draftData: z.record(z.string(), z.any()),
  version: z.number().int().optional(),
})

export async function GET(req: NextRequest) {
  try {
    const user = await getCurrentUser()
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { searchParams } = new URL(req.url)
    const type = searchParams.get('type') as ApplicationType | null

    const draft = await prisma.partnerApplication.findFirst({
      where: {
        userId: user.id,
        status: ApplicationStatus.DRAFT,
        ...(type ? { applicationType: type } : {}),
      },
      include: {
        documents: true,
      },
      orderBy: { updatedAt: 'desc' },
    })

    if (!draft) {
      return NextResponse.json({ draft: null })
    }

    return NextResponse.json({
      draft: {
        id: draft.id,
        version: draft.version,
        applicationType: draft.applicationType,
        status: draft.status,
        currentStep: draft.currentStep,
        draftData: draft.draftData,
        documents: draft.documents,
        updatedAt: draft.updatedAt.toISOString(),
      },
    })
  } catch (error: unknown) {
    console.error('[API APPLICATION DRAFT GET ERROR]', error)
    return NextResponse.json({ error: 'Failed to retrieve application draft.' }, { status: 500 })
  }
}

export async function POST(req: NextRequest) {
  try {
    const user = await getCurrentUser()
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await req.json()
    const result = DraftSaveSchema.safeParse(body)

    if (!result.success) {
      return NextResponse.json(
        { error: 'Validation failed', details: result.error.flatten().fieldErrors },
        { status: 400 }
      )
    }

    const { applicationType, currentStep, draftData, version } = result.data

    // Find existing draft
    const existingDraft = await prisma.partnerApplication.findFirst({
      where: {
        userId: user.id,
        applicationType,
        status: ApplicationStatus.DRAFT,
      },
    })

    if (existingDraft) {
      // Optimistic concurrency version check if version provided
      if (version !== undefined && existingDraft.version !== version) {
        return NextResponse.json(
          {
            error: 'Draft has been updated in another tab or session. Please refresh.',
            conflict: true,
            serverVersion: existingDraft.version,
          },
          { status: 409 }
        )
      }

      const updatedDraft = await prisma.partnerApplication.update({
        where: { id: existingDraft.id },
        data: {
          currentStep,
          draftData: draftData as Prisma.InputJsonValue,
          version: { increment: 1 },
        },
        include: { documents: true },
      })

      return NextResponse.json({
        success: true,
        draft: {
          id: updatedDraft.id,
          version: updatedDraft.version,
          applicationType: updatedDraft.applicationType,
          status: updatedDraft.status,
          currentStep: updatedDraft.currentStep,
          draftData: updatedDraft.draftData,
          documents: updatedDraft.documents,
          updatedAt: updatedDraft.updatedAt.toISOString(),
        },
      })
    }

    // Create new draft
    const newDraft = await prisma.partnerApplication.create({
      data: {
        userId: user.id,
        applicationType,
        status: ApplicationStatus.DRAFT,
        currentStep,
        draftData: draftData as Prisma.InputJsonValue,
        version: 1,
      },
      include: { documents: true },
    })

    return NextResponse.json({
      success: true,
      draft: {
        id: newDraft.id,
        version: newDraft.version,
        applicationType: newDraft.applicationType,
        status: newDraft.status,
        currentStep: newDraft.currentStep,
        draftData: newDraft.draftData,
        documents: newDraft.documents,
        updatedAt: newDraft.updatedAt.toISOString(),
      },
    })
  } catch (error: unknown) {
    console.error('[API APPLICATION DRAFT POST ERROR]', error)
    return NextResponse.json({ error: 'Failed to save application draft.' }, { status: 500 })
  }
}
