import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { ApplicationStatus } from '@prisma/client'
import { prisma } from '@/lib/db'
import { getCurrentUser } from '@/lib/auth/server'

const SubmitApplicationSchema = z.object({
  applicationId: z.string().uuid('Invalid application ID'),
})

export async function POST(req: NextRequest) {
  try {
    const user = await getCurrentUser()
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await req.json()
    const result = SubmitApplicationSchema.safeParse(body)

    if (!result.success) {
      return NextResponse.json(
        { error: 'Validation failed', details: result.error.flatten().fieldErrors },
        { status: 400 }
      )
    }

    const { applicationId } = result.data

    const application = await prisma.partnerApplication.findFirst({
      where: {
        id: applicationId,
        userId: user.id,
      },
      include: {
        documents: true,
      },
    })

    if (!application) {
      return NextResponse.json({ error: 'Application not found.' }, { status: 404 })
    }

    // State machine check: only DRAFT or MORE_INFORMATION_REQUIRED can transition to SUBMITTED
    if (
      application.status !== ApplicationStatus.DRAFT &&
      application.status !== ApplicationStatus.MORE_INFORMATION_REQUIRED
    ) {
      return NextResponse.json(
        {
          error: `Cannot submit application in ${application.status} state. Permitted transition is DRAFT/MORE_INFORMATION_REQUIRED -> SUBMITTED.`,
        },
        { status: 400 }
      )
    }

    // Server-side validation of draft data
    const draftData = (application.draftData as Record<string, any>) || {}
    if (!draftData.registeredName && !draftData.companyName) {
      return NextResponse.json(
        { error: 'Company or business name is required before submission.' },
        { status: 400 }
      )
    }

    if (!draftData.tinNumber) {
      return NextResponse.json(
        { error: 'TIN or tax registration number is required before submission.' },
        { status: 400 }
      )
    }

    const now = new Date()

    // Execute state transition inside transaction
    const updatedApplication = await prisma.$transaction(async (tx) => {
      const updated = await tx.partnerApplication.update({
        where: { id: applicationId },
        data: {
          status: ApplicationStatus.SUBMITTED,
          submissionDate: now,
        },
      })

      await tx.applicationStatusHistory.create({
        data: {
          applicationId,
          previousStatus: application.status,
          newStatus: ApplicationStatus.SUBMITTED,
          changedById: user.id,
          changedByName: user.name,
          reason: 'Applicant completed and submitted application.',
        },
      })

      return updated
    })

    return NextResponse.json({
      success: true,
      message: 'Your application has been submitted successfully.',
      application: {
        id: updatedApplication.id,
        status: updatedApplication.status,
        submissionDate: updatedApplication.submissionDate?.toISOString(),
      },
    })
  } catch (error: unknown) {
    console.error('[API SUBMIT APPLICATION ERROR]', error)
    return NextResponse.json({ error: 'Failed to submit application.' }, { status: 500 })
  }
}
