import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db'

/**
 * GET /api/shipments/track?code=...
 * Real Database tracking lookup endpoint for Electronic Waybills, Orders, and Sourcing Requests.
 */
export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url)
  const rawCode = searchParams.get('code')?.trim()

  if (!rawCode) {
    return NextResponse.json({ error: 'Missing "code" query parameter' }, { status: 400 })
  }

  const code = rawCode.toUpperCase()

  try {
    // 1. Search Electronic Waybill table first
    const waybill = await (prisma as any).electronicWaybill.findFirst({
      where: {
        OR: [
          { ewbNumber: { equals: code, mode: 'insensitive' } },
          { billOfLadingNo: { equals: code, mode: 'insensitive' } },
          { containerNo: { equals: code, mode: 'insensitive' } },
          { orderId: rawCode },
        ],
      },
      include: {
        order: {
          select: {
            id: true,
            orderNumber: true,
            status: true,
            totalAmountTZS: true,
          },
        },
        events: {
          orderBy: { eventTimestamp: 'asc' },
        },
        proofOfDelivery: true,
      },
    })

    if (waybill) {
      return NextResponse.json({
        found: true,
        waybill: {
          id: waybill.id,
          code: waybill.ewbNumber,
          orderNumber: waybill.order?.orderNumber || waybill.orderId,
          origin: waybill.originPort || 'Guangzhou Sourcing Hub',
          destination: waybill.destinationPort || 'Dar es Salaam Port',
          mode: waybill.shipmentType === 'AIR_CARGO' ? 'Air Freight' : 'Sea Cargo',
          carrier: waybill.carrierName || 'Lumo Cargo Line',
          status: waybill.status || 'In Transit',
          vesselOrFlightNo: waybill.vesselOrFlightNo,
          containerNo: waybill.containerNo,
          billOfLadingNo: waybill.billOfLadingNo,
          departureDate: waybill.departureDate,
          estimatedArrival: waybill.estimatedArrival,
          weight: 'Standard Cargo Package',
          steps: waybill.events && waybill.events.length > 0
            ? waybill.events.map((evt: any) => ({
                title: evt.eventCode?.replace(/_/g, ' ') || 'Milestone Updated',
                location: evt.locationName || 'Port Hub',
                timestamp: evt.eventTimestamp ? new Date(evt.eventTimestamp).toLocaleString() : 'Recent',
                done: true,
                description: evt.statusDescription || 'Shipment in transit.',
              }))
            : [
                {
                  title: 'Waybill Issued & Scanned',
                  location: waybill.originPort || 'Merchant Assembly Depot',
                  timestamp: waybill.createdAt ? new Date(waybill.createdAt).toLocaleDateString() : 'Active',
                  done: true,
                  description: `Waybill ${waybill.ewbNumber} generated and registered.`,
                },
                {
                  title: 'Customs & Departure Clearance',
                  location: 'International Freight Exchange',
                  timestamp: waybill.departureDate ? new Date(waybill.departureDate).toLocaleDateString() : 'Processing',
                  done: true,
                  description: 'Cleared export customs assessment.',
                },
                {
                  title: 'Transit to Destination Hub',
                  location: waybill.destinationPort || 'Dar es Salaam Port',
                  timestamp: waybill.estimatedArrival ? new Date(waybill.estimatedArrival).toLocaleDateString() : 'In Transit',
                  done: waybill.status === 'DELIVERED',
                  description: 'On route via carrier network.',
                },
              ],
        },
      })
    }

    // 2. Search Orders table by orderNumber or id
    const order = await prisma.order.findFirst({
      where: {
        OR: [
          { orderNumber: { equals: rawCode, mode: 'insensitive' } },
          { id: rawCode },
        ],
      },
      include: {
        items: {
          include: { product: true },
        },
        waybills: true,
        buyer: {
          select: { name: true, phone: true, email: true },
        },
      },
    })

    if (order) {
      const itemNames = order.items.map((i) => `${i.quantity}x ${i.product.title}`).join(', ')
      const isDelivered = order.status === 'DELIVERED' || order.status === 'COMPLETED'
      const isShipped = isDelivered || order.status === 'SHIPPED'
      const isPaid = isShipped || order.status === 'PAID' || order.status === 'PROCESSING'

      return NextResponse.json({
        found: true,
        waybill: {
          id: order.id,
          code: order.orderNumber,
          orderNumber: order.orderNumber,
          origin: 'Lumo Merchant Fulfillment Hub',
          destination: 'Dar es Salaam Delivery Address',
          mode: 'Air Freight',
          carrier: 'Lumo Express Logistics',
          status: order.status.replace(/_/g, ' '),
          weight: `${order.items.reduce((acc, curr) => acc + curr.quantity, 0)} Items`,
          items: itemNames || 'Commercial Goods Order',
          etd: new Date(order.createdAt).toLocaleDateString(),
          eta: isDelivered ? 'Delivered' : 'Est. 2-3 Business Days',
          steps: [
            {
              title: 'Order Placed & Payment Confirmed',
              location: 'Lumo B2B Platform',
              timestamp: new Date(order.createdAt).toLocaleString(),
              done: true,
              description: `Order ${order.orderNumber} successfully registered under AzamPay escrow protection.`,
            },
            {
              title: 'Supplier Warehouse Packing & Quality Inspection',
              location: 'Verified Partner Depot',
              timestamp: isPaid ? new Date(order.updatedAt).toLocaleString() : 'Pending',
              done: isPaid,
              description: 'Goods inspected for quality standards and packed.',
            },
            {
              title: 'Dispatched with Courier',
              location: 'Dar es Salaam Sorting Center',
              timestamp: isShipped ? 'In Transit' : 'Pending Dispatch',
              done: isShipped,
              description: 'Assigned to local delivery fleet for doorstep handoff.',
            },
            {
              title: 'Doorstep Delivery & Buyer Confirmation',
              location: 'Customer Address',
              timestamp: isDelivered ? 'Completed' : 'Awaiting Delivery',
              done: isDelivered,
              description: 'Final delivery verification and OTP signature.',
            },
          ],
        },
      })
    }

    // 3. Search Sourcing Requests table
    const sourcingReq = await prisma.sourcingRequest.findFirst({
      where: { id: rawCode },
      include: {
        buyer: { select: { name: true, email: true } },
      },
    })

    if (sourcingReq) {
      return NextResponse.json({
        found: true,
        waybill: {
          id: sourcingReq.id,
          code: sourcingReq.id,
          orderNumber: sourcingReq.id,
          origin: 'Global Sourcing Desk (China / Dubai / Turkey)',
          destination: 'Tanzania Sourcing Hub',
          mode: 'Air Freight',
          carrier: 'Lumo Procurement Desk',
          status: sourcingReq.status.replace(/_/g, ' '),
          weight: `${sourcingReq.targetQuantity} Units Target`,
          items: sourcingReq.productUrl ? `Sourcing Request (${sourcingReq.productUrl.substring(0, 30)}...)` : 'Custom Sourcing Ticket',
          etd: new Date(sourcingReq.createdAt).toLocaleDateString(),
          eta: 'Quote Processing',
          steps: [
            {
              title: 'Sourcing Request Submitted',
              location: 'Lumo Platform',
              timestamp: new Date(sourcingReq.createdAt).toLocaleString(),
              done: true,
              description: `Request Ticket ${sourcingReq.id} received by field procurement team.`,
            },
            {
              title: 'Factory Audit & Price Negotiation',
              location: 'Guangzhou / Yiwu Factory Network',
              timestamp: sourcingReq.status !== 'SUBMITTED' ? 'Active' : 'In Progress',
              done: sourcingReq.status !== 'SUBMITTED',
              description: 'Contacting verified factory suppliers for lowest unit rate.',
            },
          ],
        },
      })
    }

    return NextResponse.json(
      { found: false, message: `No active shipment or order found for code "${rawCode}".` },
      { status: 404 }
    )
  } catch (error: any) {
    console.error('[SHIPMENT TRACK ERROR]', error)
    return NextResponse.json({ error: 'Failed to query database shipment tracking' }, { status: 500 })
  }
}
