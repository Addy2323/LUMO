import { NextRequest, NextResponse } from 'next/server'
import { authorizeApiRequest } from '@/lib/auth/authorize'
import { prisma } from '@/lib/prisma'

// POST /api/agent/inspections/[inspectionId]/review
// HQ Reviewer decision handler (Approved by HQ, Rejected by HQ, Conditionally Passed, Clarification Requested)
export async function POST(req: NextRequest, { params }: { params: Promise<{ inspectionId: string }> }) {
  const auth = await authorizeApiRequest(req)
  if (!auth.authorized) return auth.response!
  const { user } = auth

  const { inspectionId } = await params

  try {
    const body = await req.json()
    const { decision, notes, overrideReason } = body

    if (!['Approved by HQ', 'Rejected by HQ', 'Conditionally Passed', 'Clarification Requested'].includes(decision)) {
      return NextResponse.json({ success: false, error: 'Invalid HQ review decision' }, { status: 400 })
    }

    const inspection = await (prisma as any).qualityInspection?.findFirst({
      where: {
        OR: [{ id: inspectionId }, { inspectionRef: inspectionId }],
      },
    })

    if (!inspection) {
      return NextResponse.json({ success: false, error: 'Inspection not found' }, { status: 404 })
    }

    // Require reason if overriding a failed inspection
    if (inspection.result === 'Failed' && decision === 'Approved by HQ' && !overrideReason) {
      return NextResponse.json({ success: false, error: 'Mandatory override reason required to approve a failed inspection.' }, { status: 400 })
    }

    const updated = await (prisma as any).qualityInspection?.update({
      where: { id: inspection.id },
      data: {
        status: decision,
        hqDecision: decision,
        hqReviewNotes: notes || overrideReason || '',
        hqReviewerId: user?.id || 'admin',
        hqReviewedAt: new Date(),
        updatedAt: new Date(),
        auditLogs: {
          create: {
            actorId: user?.id || 'hq_reviewer',
            actorName: user?.name || 'LUMO HQ Reviewer',
            role: user?.role || 'ADMIN',
            action: 'HQ_REVIEWED',
            previousStatus: inspection.status,
            newStatus: decision,
            reason: overrideReason ? `HQ OVERRIDE: ${overrideReason}` : `HQ Review Decision: ${decision}`,
          },
        },
      },
    })

    // Update associated Order status
    if (inspection.orderId) {
      let orderStatus = 'PROCESSING'
      if (decision === 'Approved by HQ') orderStatus = 'SHIPPED' // Authorized for release/shipment
      if (decision === 'Rejected by HQ') orderStatus = 'INSPECTION_FAILED'

      try {
        await (prisma as any).order?.update({
          where: { id: inspection.orderId },
          data: { status: orderStatus },
        })
      } catch (e) {
        console.warn('Failed to update order status during HQ review:', e)
      }
    }

    return NextResponse.json({ success: true, message: `HQ Review completed: ${decision}`, inspection: updated })
  } catch (err: any) {
    console.error(`POST /api/agent/inspections/${inspectionId}/review error:`, err)
    return NextResponse.json({ success: false, error: err.message || 'Failed to record HQ review' }, { status: 500 })
  }
}
