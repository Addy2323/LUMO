import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { ApplicationStatus, Role } from '@prisma/client'
import { prisma } from '@/lib/db'
import { getCurrentUser } from '@/lib/auth/server'

const ReviewDecisionSchema = z.object({
  action: z.enum(['START_REVIEW', 'REQUEST_INFO', 'APPROVE', 'REJECT']),
  reason: z.string().optional(),
  messageToApplicant: z.string().optional(),
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
    const result = ReviewDecisionSchema.safeParse(body)

    if (!result.success) {
      return NextResponse.json(
        { error: 'Validation failed', details: result.error.flatten().fieldErrors },
        { status: 400 }
      )
    }

    const { action, reason, messageToApplicant } = result.data

    const application = await prisma.partnerApplication.findUnique({
      where: { id },
      include: {
        user: true,
      },
    })

    if (!application) {
      return NextResponse.json({ error: 'Application not found.' }, { status: 404 })
    }

    const ipAddress = req.headers.get('x-forwarded-for')?.split(',')[0] || req.headers.get('x-real-ip') || undefined

    // 1. START_REVIEW: SUBMITTED -> UNDER_REVIEW
    if (action === 'START_REVIEW') {
      if (application.status !== ApplicationStatus.SUBMITTED) {
        return NextResponse.json(
          { error: `Cannot start review. Current status is ${application.status}.` },
          { status: 400 }
        )
      }

      const updated = await prisma.$transaction(async (tx) => {
        const app = await tx.partnerApplication.update({
          where: { id },
          data: {
            status: ApplicationStatus.UNDER_REVIEW,
            assignedReviewerId: user.id,
          },
        })

        await tx.applicationStatusHistory.create({
          data: {
            applicationId: id,
            previousStatus: application.status,
            newStatus: ApplicationStatus.UNDER_REVIEW,
            changedById: user.id,
            changedByName: user.name,
            reason: reason || 'Administrator initiated review.',
          },
        })

        await tx.auditLog.create({
          data: {
            userId: user.id,
            userRole: user.role,
            action: 'APPLICATION_REVIEW_STARTED',
            targetResource: `partner_application:${id}`,
            details: `Admin ${user.name} started reviewing application ${id}`,
            ipAddress,
          },
        })

        return app
      })

      return NextResponse.json({ success: true, application: updated })
    }

    // 2. REQUEST_INFO: UNDER_REVIEW -> MORE_INFORMATION_REQUIRED
    if (action === 'REQUEST_INFO') {
      if (application.status !== ApplicationStatus.UNDER_REVIEW) {
        return NextResponse.json(
          { error: `Cannot request info. Current status must be UNDER_REVIEW.` },
          { status: 400 }
        )
      }

      if (!messageToApplicant) {
        return NextResponse.json(
          { error: 'A message to applicant is required when requesting more information.' },
          { status: 400 }
        )
      }

      const updated = await prisma.$transaction(async (tx) => {
        const app = await tx.partnerApplication.update({
          where: { id },
          data: { status: ApplicationStatus.MORE_INFORMATION_REQUIRED },
        })

        await tx.applicationStatusHistory.create({
          data: {
            applicationId: id,
            previousStatus: application.status,
            newStatus: ApplicationStatus.MORE_INFORMATION_REQUIRED,
            changedById: user.id,
            changedByName: user.name,
            reason: reason || messageToApplicant,
          },
        })

        await tx.applicationMessage.create({
          data: {
            applicationId: id,
            senderId: user.id,
            senderName: user.name,
            senderRole: user.role,
            message: messageToApplicant,
          },
        })

        await tx.auditLog.create({
          data: {
            userId: user.id,
            userRole: user.role,
            action: 'APPLICATION_MORE_INFO_REQUESTED',
            targetResource: `partner_application:${id}`,
            details: `Admin ${user.name} requested more info for application ${id}`,
            ipAddress,
          },
        })

        return app
      })

      return NextResponse.json({ success: true, application: updated })
    }

    // 3. REJECT: UNDER_REVIEW -> REJECTED
    if (action === 'REJECT') {
      if (application.status !== ApplicationStatus.UNDER_REVIEW) {
        return NextResponse.json(
          { error: `Cannot reject application. Current status must be UNDER_REVIEW.` },
          { status: 400 }
        )
      }

      if (!reason) {
        return NextResponse.json({ error: 'A rejection reason is required.' }, { status: 400 })
      }

      const now = new Date()
      const updated = await prisma.$transaction(async (tx) => {
        const app = await tx.partnerApplication.update({
          where: { id },
          data: {
            status: ApplicationStatus.REJECTED,
            decisionDate: now,
            decisionReason: reason,
          },
        })

        await tx.user.update({
          where: { id: application.userId },
          data: { kycStatus: 'REJECTED' },
        })

        await tx.applicationStatusHistory.create({
          data: {
            applicationId: id,
            previousStatus: application.status,
            newStatus: ApplicationStatus.REJECTED,
            changedById: user.id,
            changedByName: user.name,
            reason,
          },
        })

        if (messageToApplicant) {
          await tx.applicationMessage.create({
            data: {
              applicationId: id,
              senderId: user.id,
              senderName: user.name,
              senderRole: user.role,
              message: messageToApplicant,
            },
          })
        }

        await tx.auditLog.create({
          data: {
            userId: user.id,
            userRole: user.role,
            action: 'APPLICATION_REJECTED',
            targetResource: `partner_application:${id}`,
            details: `Admin ${user.name} rejected application ${id}. Reason: ${reason}`,
            ipAddress,
          },
        })

        return app
      })

      return NextResponse.json({ success: true, application: updated })
    }

    // 4. APPROVE: UNDER_REVIEW -> APPROVED (Strict Idempotent Transaction)
    if (action === 'APPROVE') {
      if (application.status !== ApplicationStatus.UNDER_REVIEW) {
        return NextResponse.json(
          { error: `Cannot approve application. Status must be UNDER_REVIEW (current: ${application.status}).` },
          { status: 400 }
        )
      }

      const now = new Date()
      const draftData = (application.draftData as Record<string, any>) || {}

      const updated = await prisma.$transaction(async (tx) => {
        // Idempotency check inside transaction: re-verify status
        const freshApp = await tx.partnerApplication.findUnique({
          where: { id },
        })

        if (!freshApp || freshApp.status !== ApplicationStatus.UNDER_REVIEW) {
          throw new Error('Application status changed concurrently. Approval aborted.')
        }

        // 1. Update Application status
        const app = await tx.partnerApplication.update({
          where: { id },
          data: {
            status: ApplicationStatus.APPROVED,
            decisionDate: now,
            decisionReason: reason || 'Application approved by administrator.',
          },
        })

        // 2. Assign authoritative Role (SUPPLIER or LOGISTICS) & set kycStatus to VERIFIED
        const targetRole =
          application.applicationType === 'SUPPLIER' ? Role.SUPPLIER : Role.LOGISTICS

        await tx.user.update({
          where: { id: application.userId },
          data: {
            role: targetRole,
            kycStatus: 'VERIFIED',
          },
        })

        // 3. Create SupplierProfile or LogisticsProfile once
        if (application.applicationType === 'SUPPLIER') {
          await tx.supplierProfile.upsert({
            where: { applicationId: id },
            create: {
              applicationId: id,
              userId: application.userId,
              registeredName: draftData.registeredName || application.user.name,
              tradingName: draftData.tradingName || null,
              registrationNumber: draftData.registrationNumber || 'N/A',
              tinNumber: draftData.tinNumber || 'N/A',
              countryOfRegistration: draftData.countryOfRegistration || 'Tanzania',
              businessAddress: draftData.businessAddress || 'Tanzania',
              website: draftData.website || null,
              contactPerson: draftData.contactPerson || application.user.name,
              contactPosition: draftData.contactPosition || 'Director',
              yearEstablished: draftData.yearEstablished ? parseInt(draftData.yearEstablished, 10) : null,
              employeeCount: draftData.employeeCount || null,
              supplierType: draftData.supplierType || 'Manufacturer',
              mainCategories: Array.isArray(draftData.mainCategories) ? draftData.mainCategories : ['General'],
              productDescription: draftData.productDescription || 'Supplied products',
              partnerStatus: 'PENDING_ACTIVATION',
            },
            update: {
              partnerStatus: 'PENDING_ACTIVATION',
            },
          })
        } else if (application.applicationType === 'LOGISTICS') {
          await tx.logisticsProfile.upsert({
            where: { applicationId: id },
            create: {
              applicationId: id,
              userId: application.userId,
              companyName: draftData.companyName || application.user.name,
              tradingName: draftData.tradingName || null,
              registrationNumber: draftData.registrationNumber || 'N/A',
              tinNumber: draftData.tinNumber || 'N/A',
              countryOfRegistration: draftData.countryOfRegistration || 'Tanzania',
              officeAddress: draftData.officeAddress || 'Tanzania',
              website: draftData.website || null,
              contactPerson: draftData.contactPerson || application.user.name,
              contactPosition: draftData.contactPosition || 'Operations Manager',
              yearsInOperation: draftData.yearsInOperation ? parseInt(draftData.yearsInOperation, 10) : null,
              servicesOffered: Array.isArray(draftData.servicesOffered) ? draftData.servicesOffered : ['Air Freight'],
              partnerStatus: 'PENDING_ACTIVATION',
            },
            update: {
              partnerStatus: 'PENDING_ACTIVATION',
            },
          })
        }

        // 4. Create Status History record
        await tx.applicationStatusHistory.create({
          data: {
            applicationId: id,
            previousStatus: application.status,
            newStatus: ApplicationStatus.APPROVED,
            changedById: user.id,
            changedByName: user.name,
            reason: reason || 'Approved by administrator.',
          },
        })

        // 5. Audit Log entry
        await tx.auditLog.create({
          data: {
            userId: user.id,
            userRole: user.role,
            action: 'APPLICATION_APPROVED_ROLE_ASSIGNED',
            targetResource: `partner_application:${id}`,
            details: `Admin ${user.name} approved application ${id} for user ${application.userId}, assigned role ${targetRole}`,
            ipAddress,
          },
        })

        return app
      })

      return NextResponse.json({ success: true, application: updated })
    }

    return NextResponse.json({ error: 'Invalid action.' }, { status: 400 })
  } catch (error: unknown) {
    console.error('[API ADMIN REVIEW ACTION ERROR]', error)
    return NextResponse.json(
      { error: (error as Error).message || 'Failed to process review decision.' },
      { status: 500 }
    )
  }
}
