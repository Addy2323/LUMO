import { NextRequest, NextResponse } from 'next/server'
import { authorizeApiRequest } from '@/lib/auth/authorize'
import { prisma } from '@/lib/prisma'

export async function POST(req: NextRequest) {
  const auth = await authorizeApiRequest(req)
  if (!auth.authorized) return auth.response!

  const { user } = auth
  const body = await req.json()
  const hub = body.hub || 'China'

  const randomId = Math.floor(100000 + Math.random() * 900000)
  const orderNumber = `ORD-SIM-${randomId}`

  let order = null
  try {
    order = await prisma.order.create({
      data: {
        orderNumber,
        buyerId: user.id,
        subtotalTZS: 4500000.0,
        shippingFeeTZS: 250000.0,
        taxAmountTZS: 180000.0,
        totalAmountTZS: 4930000.0,
        status: 'PAID',
        paymentMethod: 'AzamPay Escrow (Simulated)',
        shippingAddress: {
          fullName: 'Tanzania Sourcing Merchant',
          street: 'Samora Avenue, Plot 42',
          city: 'Dar es Salaam',
          country: 'Tanzania',
        },
        items: {
          create: [
            {
              quantity: 100,
              unitPriceTZS: 45000.0,
              totalPriceTZS: 4500000.0,
              selectedVariant: 'Standard / Black',
              product: {
                create: {
                  productCode: `PROD-SIM-${randomId}`,
                  title: `Simulated HQ Sourcing Order (${hub} Hub)`,
                  slug: `simulated-hq-sourcing-order-${randomId}`,
                  description: 'High-priority sourcing request generated from LUMO HQ Assignment Console.',
                  categoryId: (await prisma.category.findFirst())?.id || '',
                  priceTZS: 45000.0,
                  priceUSD: 18.0,
                  status: 'APPROVED',
                  sourceHub: `${hub} Hub`,
                },
              },
            },
          ],
        },
      },
    })

    // Create corresponding OrderAssignment record
    await prisma.orderAssignment.create({
      data: {
        orderId: order.id,
        assignmentRole: 'AGENT',
        assigneeId: user.id,
        status: 'UNASSIGNED',
        priority: 'HIGH',
        instructions: `Simulated sourcing order assigned by LUMO HQ for ${hub} Hub.`,
      },
    })
  } catch (e) {
    order = { id: `sim-${Date.now()}`, orderNumber, status: 'PAID' }
  }

  // Audit record
  await prisma.auditLog.create({
    data: {
      userId: user.id,
      userRole: 'AGENT',
      action: 'SIMULATION_ORDER_CREATED',
      targetResource: `Order:${orderNumber}`,
      details: JSON.stringify({ hub, simulatedBy: user.name }),
    },
  })

  return NextResponse.json({ success: true, orderNumber, order })
}
