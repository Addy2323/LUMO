import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db'
import { transitionOrder } from '@/lib/orders/state-machine'
import { OutboxService } from '@/lib/notifications/outbox-service'
import { checkRateLimit } from '@/lib/security/rate-limiter'

export async function POST(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  const rateLimit = checkRateLimit(req, { limit: 30, windowMs: 60000, prefix: 'delivery_selection' })
  if (!rateLimit.success && rateLimit.response) {
    return rateLimit.response
  }

  try {
    const orderId = params.id
    const body = await req.json()
    const {
      method, // 'DOOR_DELIVERY' | 'OFFICE_PICKUP'
      pickupLocationId,
      streetAddress,
      city,
      landmark,
      recipientName,
      recipientPhone,
    } = body

    if (!method || !['DOOR_DELIVERY', 'OFFICE_PICKUP'].includes(method)) {
      return NextResponse.json({ error: 'Invalid delivery method selected' }, { status: 400 })
    }

    const order = await prisma.order.findFirst({
      where: {
        OR: [{ id: orderId }, { orderNumber: orderId }],
      },
      include: { buyer: true },
    })

    if (!order) {
      return NextResponse.json({ error: 'Order not found' }, { status: 404 })
    }

    // Generate 6-digit OTP for pickup or verification
    const pickupOtp = Math.floor(100000 + Math.random() * 900000).toString()

    // 1. Create or update DeliveryPreference record
    const preference = await prisma.deliveryPreference.upsert({
      where: { orderId: order.id },
      create: {
        orderId: order.id,
        method,
        pickupLocationId: pickupLocationId || null,
        streetAddress: streetAddress || null,
        city: city || 'Dar es Salaam',
        landmark: landmark || null,
        recipientName: recipientName || order.buyer.name || 'Customer',
        recipientPhone: recipientPhone || order.buyer.phone || '',
        pickupOtp: method === 'OFFICE_PICKUP' ? pickupOtp : null,
      },
      update: {
        method,
        pickupLocationId: pickupLocationId || null,
        streetAddress: streetAddress || null,
        city: city || 'Dar es Salaam',
        landmark: landmark || null,
        recipientName: recipientName || order.buyer.name || 'Customer',
        recipientPhone: recipientPhone || order.buyer.phone || '',
        pickupOtp: method === 'OFFICE_PICKUP' ? pickupOtp : null,
        updatedAt: new Date(),
      },
    })

    // 2. Determine target OrderStatus based on method
    const targetStatus = method === 'OFFICE_PICKUP' ? 'READY_FOR_PICKUP' : 'OUT_FOR_DELIVERY'

    // 3. Transition order status server-authoritatively
    const transition = await transitionOrder(
      order.id,
      targetStatus as any,
      order.buyerId,
      'BUYER',
      `Customer selected ${method === 'OFFICE_PICKUP' ? 'Office Pickup' : 'Door Delivery'}`
    )

    // 4. If Office Pickup, enqueue specific SMS with OTP code
    if (method === 'OFFICE_PICKUP' && pickupLocationId) {
      const location = await prisma.pickupLocation.findUnique({
        where: { id: pickupLocationId },
      })

      const locationName = location ? `${location.name}, ${location.city}` : 'Lumo Tanzania Hub'
      const customerPhone = recipientPhone || order.buyer.phone || '0712345678'

      await OutboxService.enqueue({
        eventType: 'READY_FOR_PICKUP_OTP',
        aggregateId: order.id,
        recipientId: order.buyerId,
        recipientPhone: customerPhone,
        templateKey: 'READY_FOR_PICKUP',
        payloadJson: {
          firstName: recipientName || order.buyer.name || 'Customer',
          orderReference: order.orderNumber,
          pickupLocation: locationName,
          pickupOtp,
          trackingUrl: `${process.env.NEXT_PUBLIC_APP_URL || 'https://lumo.co.tz'}/orders/${order.orderNumber}`,
        },
      })
    }

    return NextResponse.json({
      success: true,
      preference,
      transition,
      pickupOtp: method === 'OFFICE_PICKUP' ? pickupOtp : undefined,
    })
  } catch (error: any) {
    console.error('[DELIVERY SELECTION API ERROR]', error)
    return NextResponse.json(
      { success: false, error: error.message || 'Failed to save delivery selection' },
      { status: 500 }
    )
  }
}
