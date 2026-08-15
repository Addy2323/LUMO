import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db'

export async function GET(req: NextRequest) {
  try {
    const [
      submittedSourcingCount,
      paidOrdersCount,
      totalSourcingCount,
      quotedSourcingCount,
      openDisputesCount,
      pendingApplicationsCount,
      totalUsersCount,
      shipmentsCount,
      agentAssignmentsCount,
      inspectionsCount,
      productsCount,
    ] = await Promise.all([
      prisma.sourcingRequest.count({ where: { status: 'SUBMITTED' } }),
      prisma.order.count({ where: { status: { in: ['PAID', 'PROCESSING'] } } }),
      prisma.sourcingRequest.count(),
      prisma.sourcingRequest.count({ where: { status: 'QUOTED' } }),
      prisma.dispute.count({ where: { status: 'OPEN' } }),
      prisma.partnerApplication.count({ where: { status: 'SUBMITTED' } }).catch(() => 0),
      prisma.user.count(),
      prisma.shipment.count().catch(() => 0),
      prisma.agentAssignment.count({ where: { status: 'assigned' } }).catch(() => 0),
      prisma.inspectionRecord.count({ where: { passed: true } }).catch(() => 0),
      prisma.product.count().catch(() => 0),
    ])

    // Build badges object — ONLY real database counts, NO fallback demo numbers
    const badges: Record<string, string | number> = {}

    // Sales Badges — only show if count > 0
    if (submittedSourcingCount > 0) badges['/sales/inbox'] = submittedSourcingCount
    if (paidOrdersCount > 0) badges['/sales/orders'] = paidOrdersCount
    if (totalSourcingCount > 0) badges['/sales/sourcing'] = totalSourcingCount
    if (quotedSourcingCount > 0) badges['/sales/quotations'] = quotedSourcingCount
    if (openDisputesCount > 0) badges['/sales/tickets'] = openDisputesCount
    if (openDisputesCount > 0) badges['/sales/disputes'] = openDisputesCount
    if (openDisputesCount > 0) badges['/sales/escalations'] = openDisputesCount

    // Admin Badges
    if (pendingApplicationsCount > 0) badges['/admin/applications'] = pendingApplicationsCount
    if (totalUsersCount > 0) badges['/admin/users'] = totalUsersCount
    if (paidOrdersCount > 0) badges['/admin/orders'] = paidOrdersCount
    if (agentAssignmentsCount > 0) badges['/admin/inspections'] = agentAssignmentsCount

    // Logistics Badges
    if (shipmentsCount > 0) badges['/logistics/shipments'] = shipmentsCount
    if (agentAssignmentsCount > 0) badges['/logistics/job-marketplace'] = agentAssignmentsCount
    if (inspectionsCount > 0) badges['/logistics/proof-of-delivery'] = inspectionsCount

    // Supplier Badges
    if (paidOrdersCount > 0) badges['/supplier/orders'] = paidOrdersCount
    if (productsCount > 0) badges['/supplier/products'] = productsCount

    // Agent Badges
    if (agentAssignmentsCount > 0) badges['/agent/assignments'] = agentAssignmentsCount
    if (inspectionsCount > 0) badges['/agent/inspections'] = inspectionsCount

    return NextResponse.json({ success: true, badges })
  } catch (error: any) {
    console.error('[NAVIGATION BADGES API ERROR]', error)
    return NextResponse.json({ error: error.message || 'Failed to fetch dynamic badges' }, { status: 500 })
  }
}
