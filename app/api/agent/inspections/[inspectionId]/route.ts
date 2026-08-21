import { NextRequest, NextResponse } from 'next/server'
import { authorizeApiRequest } from '@/lib/auth/authorize'
import { prisma } from '@/lib/prisma'
import { evaluateAqlResult } from '@/lib/aql-engine'

// GET /api/agent/inspections/[inspectionId]
export async function GET(req: NextRequest, { params }: { params: Promise<{ inspectionId: string }> }) {
  const auth = await authorizeApiRequest(req)
  if (!auth.authorized) return auth.response!

  const { inspectionId } = await params

  try {
    const inspection = await (prisma as any).qualityInspection?.findFirst({
      where: {
        OR: [{ id: inspectionId }, { inspectionRef: inspectionId }],
      },
      include: {
        defects: { orderBy: { createdAt: 'desc' } },
        evidences: { orderBy: { uploadedAt: 'asc' } },
        correctiveActions: { orderBy: { createdAt: 'desc' } },
        auditLogs: { orderBy: { createdAt: 'desc' } },
      },
    })

    if (!inspection) {
      return NextResponse.json({ success: false, error: 'Quality Inspection not found' }, { status: 404 })
    }

    return NextResponse.json({ success: true, inspection })
  } catch (err: any) {
    console.error(`GET /api/agent/inspections/${inspectionId} error:`, err)
    return NextResponse.json({ success: false, error: err.message || 'Failed to fetch inspection' }, { status: 500 })
  }
}

// PATCH /api/agent/inspections/[inspectionId]
// Autosave draft inspection details, checklist, quantities, defects, photos
export async function PATCH(req: NextRequest, { params }: { params: Promise<{ inspectionId: string }> }) {
  const auth = await authorizeApiRequest(req)
  if (!auth.authorized) return auth.response!
  const { user } = auth

  const { inspectionId } = await params

  try {
    const body = await req.json()
    const {
      lotSize,
      receivedQty,
      inspectedQty,
      passedQty,
      failedQty,
      criticalDefects,
      majorDefects,
      minorDefects,
      checklist,
      specsSnapshot,
      evidencePhotos,
      evidenceVideos,
      notes,
      status,
    } = body

    const existing = await (prisma as any).qualityInspection?.findFirst({
      where: {
        OR: [{ id: inspectionId }, { inspectionRef: inspectionId }],
      },
    })

    if (!existing) {
      return NextResponse.json({ success: false, error: 'Inspection not found' }, { status: 404 })
    }

    // Lock submitted inspections from arbitrary editing
    if (['Submitted', 'Under HQ Review', 'Passed', 'Approved by HQ', 'Failed'].includes(existing.status)) {
      return NextResponse.json(
        { success: false, error: `Inspection ${existing.inspectionRef} is locked with status: ${existing.status}` },
        { status: 400 }
      )
    }

    // Calculate preliminary AQL result
    const currentLotSize = lotSize !== undefined ? Number(lotSize) : existing.lotSize
    const currentInspected = inspectedQty !== undefined ? Number(inspectedQty) : existing.inspectedQty
    const crit = criticalDefects !== undefined ? Number(criticalDefects) : existing.criticalDefects
    const maj = majorDefects !== undefined ? Number(majorDefects) : existing.majorDefects
    const min = minorDefects !== undefined ? Number(minorDefects) : existing.minorDefects

    const aqlEval = evaluateAqlResult({
      lotSize: currentLotSize,
      inspectedQty: currentInspected,
      criticalDefects: crit,
      majorDefects: maj,
      minorDefects: min,
    })

    const updated = await (prisma as any).qualityInspection?.update({
      where: { id: existing.id },
      data: {
        ...(lotSize !== undefined && { lotSize: Number(lotSize) }),
        ...(receivedQty !== undefined && { receivedQty: Number(receivedQty) }),
        ...(inspectedQty !== undefined && { inspectedQty: Number(inspectedQty) }),
        ...(passedQty !== undefined && { passedQty: Number(passedQty) }),
        ...(failedQty !== undefined && { failedQty: Number(failedQty) }),
        ...(criticalDefects !== undefined && { criticalDefects: Number(criticalDefects) }),
        ...(majorDefects !== undefined && { majorDefects: Number(majorDefects) }),
        ...(minorDefects !== undefined && { minorDefects: Number(minorDefects) }),
        ...(checklist && { checklist }),
        ...(specsSnapshot && { specsSnapshot }),
        ...(evidencePhotos && { evidencePhotos }),
        ...(evidenceVideos && { evidenceVideos }),
        ...(notes !== undefined && { notes }),
        ...(status && { status }),
        result: aqlEval.decision,
        aqlConfig: aqlEval.plan,
        updatedAt: new Date(),
        auditLogs: {
          create: {
            actorId: user?.id || 'agent',
            actorName: user?.name || 'Agent',
            role: user?.role || 'AGENT',
            action: 'DRAFT_UPDATED',
            previousStatus: existing.status,
            newStatus: status || existing.status,
            reason: 'Autosaved draft quality inspection details',
          },
        },
      },
      include: {
        defects: true,
        evidences: true,
        auditLogs: { orderBy: { createdAt: 'desc' }, take: 5 },
      },
    })

    return NextResponse.json({ success: true, inspection: updated, aqlEvaluation: aqlEval })
  } catch (err: any) {
    console.error(`PATCH /api/agent/inspections/${inspectionId} error:`, err)
    return NextResponse.json({ success: false, error: err.message || 'Failed to update inspection' }, { status: 500 })
  }
}
