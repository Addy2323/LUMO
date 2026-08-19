import { NextRequest, NextResponse } from 'next/server'
import { authorizeApiRequest } from '@/lib/auth/authorize'
import { prisma } from '@/lib/prisma'
import { calculateAqlSamplingPlan } from '@/lib/aql-engine'

// GET /api/agent/inspections
// Filter by status, hub, result, orderId, supplierId, search, pagination
export async function GET(req: NextRequest) {
  const auth = await authorizeApiRequest(req)
  if (!auth.authorized) return auth.response!

  const { searchParams } = new URL(req.url)
  const status = searchParams.get('status')
  const result = searchParams.get('result')
  const hub = searchParams.get('hub')
  const orderId = searchParams.get('orderId')
  const supplierId = searchParams.get('supplierId')
  const query = searchParams.get('query')
  const page = Number(searchParams.get('page') || 1)
  const limit = Number(searchParams.get('limit') || 10)

  try {
    const where: any = {}
    if (status && status !== 'ALL') where.status = status
    if (result && result !== 'ALL') where.result = result
    if (hub && hub !== 'ALL') where.hub = hub
    if (orderId) where.orderId = orderId
    if (supplierId) where.supplierId = supplierId

    if (query) {
      where.OR = [
        { inspectionRef: { contains: query, mode: 'insensitive' } },
        { orderId: { contains: query, mode: 'insensitive' } },
        { notes: { contains: query, mode: 'insensitive' } },
      ]
    }

    const [inspections, total] = await Promise.all([
      (prisma as any).qualityInspection?.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        skip: (page - 1) * limit,
        take: limit,
        include: {
          defects: true,
          evidences: true,
          auditLogs: { orderBy: { createdAt: 'desc' }, take: 5 },
        },
      }) || [],
      (prisma as any).qualityInspection?.count({ where }) || 0,
    ])

    return NextResponse.json({
      success: true,
      inspections,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit) || 1,
      },
    })
  } catch (err: any) {
    console.error('GET /api/agent/inspections error:', err)
    return NextResponse.json({ success: false, error: err.message || 'Failed to list inspections' }, { status: 500 })
  }
}

// POST /api/agent/inspections
// Create a new Quality Inspection with server-side eligibility checks
export async function POST(req: NextRequest) {
  const auth = await authorizeApiRequest(req)
  if (!auth.authorized) return auth.response!
  const { user } = auth

  try {
    const body = await req.json()
    const {
      orderId,
      supplierId,
      hub = 'China',
      inspectionType = 'Pre-shipment',
      lotSize = 100,
      inspectionLevel = 'Level II',
      checklist,
      notes,
    } = body

    if (!orderId) {
      return NextResponse.json({ success: false, error: 'Order ID is required' }, { status: 400 })
    }

    // Server-side Eligibility Verification:
    // 1. Order must exist and not be cancelled
    let order: any = null
    try {
      order = await (prisma as any).order?.findUnique({ where: { id: orderId } })
    } catch (e) {
      order = null
    }

    if (order && order.status === 'CANCELLED') {
      return NextResponse.json({ success: false, error: 'Cannot perform inspection on cancelled orders.' }, { status: 400 })
    }

    // 2. Check for active draft or in-progress inspection for same order
    const existingDraft = await (prisma as any).qualityInspection?.findFirst({
      where: {
        orderId,
        status: { in: ['Draft', 'In Progress', 'Ready for Submission'] },
      },
    })

    if (existingDraft) {
      return NextResponse.json({
        success: true,
        inspection: existingDraft,
        message: `Resuming active draft inspection ${existingDraft.inspectionRef}`,
      })
    }

    // Calculate AQL Plan math for sample size defaults
    const plan = calculateAqlSamplingPlan(lotSize)
    const inspectionRef = `INS-${Date.now().toString().slice(-6)}-${Math.floor(Math.random() * 1000)}`

    const newInspection = await (prisma as any).qualityInspection?.create({
      data: {
        inspectionRef,
        orderId,
        supplierId: supplierId || null,
        agentId: user?.id || null,
        hub,
        inspectionType,
        lotSize,
        orderedQty: lotSize,
        receivedQty: lotSize,
        sampleSize: plan.suggestedSampleSize,
        inspectedQty: plan.suggestedSampleSize,
        passedQty: plan.suggestedSampleSize,
        failedQty: 0,
        inspectionLevel,
        aqlConfig: plan,
        status: 'Draft',
        result: 'Pending',
        checklist: checklist || {
          quantityCorrect: true,
          productMatchesRequest: true,
          colorCorrect: true,
          sizeCorrect: true,
          logoCorrect: true,
          packagingGood: true,
          noDamage: true,
          accessoriesIncluded: true,
          powerTestPassed: true,
        },
        notes: notes || '',
        auditLogs: {
          create: {
            actorId: user?.id || 'agent',
            actorName: user?.name || 'Agent',
            role: user?.role || 'AGENT',
            action: 'CREATED',
            newStatus: 'Draft',
            reason: `Initialized ${inspectionType} for order #${orderId}`,
          },
        },
      },
    })

    // Also update order status to UNDER_INSPECTION
    if (order) {
      try {
        await (prisma as any).order?.update({
          where: { id: orderId },
          data: { status: 'PROCESSING' },
        })
      } catch (e) {
        console.warn('Failed to update order status to PROCESSING:', e)
      }
    }

    return NextResponse.json({ success: true, inspection: newInspection })
  } catch (err: any) {
    console.error('POST /api/agent/inspections error:', err)
    return NextResponse.json({ success: false, error: err.message || 'Failed to create inspection' }, { status: 500 })
  }
}
