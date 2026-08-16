import { NextResponse } from 'next/server'
import { prisma } from '@/lib/db'

export async function GET() {
  try {
    let paidOrdersCount = 0
    let unassignedOrdersCount = 0
    let processingOrdersCount = 0
    let shipmentsInTransitCount = 0
    let openDisputesCount = 0
    let pendingSettlementsTZS = 0

    try {
      const [
        paidRes,
        unassignedRes,
        processingRes,
        shipmentsRes,
        disputesRes,
        escrowAgg,
      ] = await Promise.all([
        prisma.order.count({ where: { status: 'PAID' } }),
        prisma.order.count({ where: { status: 'PENDING_PAYMENT' } }),
        prisma.order.count({ where: { status: 'PROCESSING' } }),
        prisma.shipment.count({ where: { status: { contains: 'Transit' } } }),
        prisma.dispute.count({ where: { status: 'OPEN' } }),
        prisma.escrowLedger.aggregate({
          where: { status: 'HELD' },
          _sum: { amountTZS: true },
        }),
      ])

      paidOrdersCount = paidRes
      unassignedOrdersCount = unassignedRes
      processingOrdersCount = processingRes
      shipmentsInTransitCount = shipmentsRes
      openDisputesCount = disputesRes
      pendingSettlementsTZS = Number(escrowAgg._sum.amountTZS || 0)
    } catch (dbErr) {
      console.warn('PostgreSQL operations overview query failed:', dbErr)
    }

    return NextResponse.json({
      success: true,
      data: {
        paidOrders: paidOrdersCount,
        unassignedOrders: unassignedOrdersCount,
        slaAtRisk: processingOrdersCount,
        shipmentsInTransit: shipmentsInTransitCount,
        pendingSettlementsTZS: pendingSettlementsTZS,
        openDisputes: openDisputesCount,
        reportingPeriod: 'vs yesterday',
      },
    })
  } catch (error) {
    console.error('Error fetching admin operations overview:', error)
    return NextResponse.json({
      success: true,
      data: {
        paidOrders: 0,
        unassignedOrders: 0,
        slaAtRisk: 0,
        shipmentsInTransit: 0,
        pendingSettlementsTZS: 0,
        openDisputes: 0,
        reportingPeriod: 'vs yesterday',
      },
    })
  }
}
