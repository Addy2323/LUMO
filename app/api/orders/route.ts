import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { Prisma, OrderStatus, PaymentStatus, EscrowStatus } from '@prisma/client'
import { prisma } from '@/lib/db'
import { authorizeApiRequest } from '@/lib/auth/authorize'
import { OutboxService } from '@/lib/notifications/outbox-service'
import { processOutboxBatch } from '@/lib/notifications/outbox-worker'
import { SmsTemplateType } from '@/lib/sms/sms-template-service'

const CreateOrderItemSchema = z.object({
  productId: z.string().min(1),
  quantity: z.number().int().positive(),
  selectedVariant: z.string().optional(),
  title: z.string().optional(),
  imageUrl: z.string().optional(),
  priceTZS: z.number().optional(),
})

const CreateOrderSchema = z.object({
  items: z.array(CreateOrderItemSchema).min(1, 'Order must contain at least 1 item'),
  shippingAddress: z.object({
    fullName: z.string(),
    phone: z.string(),
    street: z.string(),
    city: z.string(),
  }),
  paymentMethod: z.string().default('LUMO Payment Protection'),
  status: z.string().optional(),
  paymentStatus: z.string().optional(),
  subtotalTZS: z.number().optional(),
  shippingFeeTZS: z.number().optional(),
  taxAmountTZS: z.number().optional(),
  totalAmountTZS: z.number().optional(),
})

export async function GET(req: NextRequest) {
  const auth = await authorizeApiRequest(req)
  if (!auth.authorized) return auth.response!

  const { user, activeRole } = auth
  const effectiveRole = activeRole || user.role
  const { searchParams } = new URL(req.url)
  const page = parseInt(searchParams.get('page') || '1', 10)
  const perPage = parseInt(searchParams.get('perPage') || '20', 10)
  const skip = (page - 1) * perPage

  const requestedRole = searchParams.get('role') || effectiveRole

  const where: Prisma.OrderWhereInput = {}
  if (requestedRole === 'ADMIN' || requestedRole === 'SALES') {
    // Unrestricted access for Admin & Sales
  } else if (requestedRole === 'AGENT') {
    const agentAssignments = await prisma.orderAssignment.findMany({
      where: { assignmentRole: 'AGENT' },
      select: { orderId: true },
    })
    const assignedOrderIds = agentAssignments.map((a) => a.orderId).filter(Boolean)

    where.OR = [
      ...(assignedOrderIds.length > 0
        ? [{ id: { in: assignedOrderIds } }, { orderNumber: { in: assignedOrderIds } }]
        : []),
      { status: 'PAID' },
      { status: 'PROCESSING' },
      { status: 'SHIPPED' },
    ]
  } else if (requestedRole === 'SUPPLIER') {
    const supplierAssignments = await prisma.orderAssignment.findMany({
      where: { assignmentRole: 'SUPPLIER' },
      select: { orderId: true },
    })
    const assignedOrderIds = supplierAssignments.map((a) => a.orderId).filter(Boolean)

    where.OR = [
      ...(assignedOrderIds.length > 0
        ? [{ id: { in: assignedOrderIds } }, { orderNumber: { in: assignedOrderIds } }]
        : []),
      { status: 'PAID' },
      { status: 'PROCESSING' },
      { status: 'SHIPPED' },
    ]
  } else if (requestedRole === 'LOGISTICS') {
    const logisticsAssignments = await prisma.orderAssignment.findMany({
      where: { assignmentRole: 'LOGISTICS' },
      select: { orderId: true },
    })
    const assignedOrderIds = logisticsAssignments.map((a) => a.orderId).filter(Boolean)

    where.OR = [
      ...(assignedOrderIds.length > 0
        ? [{ id: { in: assignedOrderIds } }, { orderNumber: { in: assignedOrderIds } }]
        : []),
      { status: 'PAID' },
      { status: 'PROCESSING' },
      { status: 'SHIPPED' },
    ]
  } else {
    where.buyerId = user.id
  }

  const [orders, total] = await Promise.all([
    prisma.order.findMany({
      where,
      take: perPage,
      skip,
      orderBy: { createdAt: 'desc' },
      include: {
        buyer: { select: { name: true, companyName: true } },
        items: {
          include: {
            product: {
              select: { title: true, imageUrl: true, slug: true },
            },
          },
        },
        shipments: true,
        payments: true,
      },
    }),
    prisma.order.count({ where }),
  ])

  const formatted = orders.map((o) => {
    const firstItem = o.items?.[0]
    return {
      ...o,
      subtotalTZS: Number(o.subtotalTZS),
      shippingFeeTZS: Number(o.shippingFeeTZS),
      taxAmountTZS: Number(o.taxAmountTZS),
      discountTZS: Number(o.discountTZS),
      totalAmountTZS: Number(o.totalAmountTZS),
      customerName: o.buyer?.companyName || o.buyer?.name || 'LUMO Merchant',
      productName: firstItem?.product?.title || 'Wholesale B2B Goods',
      items: o.items
        ? o.items.map((i) => {
            let rawImg = i.product?.imageUrl || ''
            if (rawImg.includes('unsplash.com')) {
              rawImg = ''
            }
            const sanitizedImg = rawImg.startsWith('//')
              ? `https:${rawImg}`
              : rawImg
            return {
              ...i,
              unitPriceTZS: Number(i.unitPriceTZS),
              totalPriceTZS: Number(i.totalPriceTZS),
              product: i.product
                ? {
                    ...i.product,
                    imageUrl: sanitizedImg,
                  }
                : {
                    title: 'Wholesale B2B Goods',
                    imageUrl: '',
                    slug: 'general-wholesale',
                  },
            }
          })
        : [],
    }
  })

  return NextResponse.json({
    data: formatted,
    meta: { page, perPage, total, totalPages: Math.ceil(total / perPage) || 1 },
  })
}

export async function POST(req: NextRequest) {
  try {
    const authResult = await authorizeApiRequest(req).catch(() => ({ authorized: false } as any))
    let buyerUser = authResult.user

    if (!buyerUser) {
      buyerUser = await prisma.user.findFirst({
        where: {
          OR: [
            { role: 'BUYER' },
            { role: 'CUSTOMER' },
          ],
        },
      }).catch(() => null)
      if (!buyerUser) {
        buyerUser = await prisma.user.findFirst().catch(() => null)
      }
    }

    if (!buyerUser) {
      try {
        buyerUser = await prisma.user.create({
          data: {
            name: 'Lumo Merchant',
            email: `guest_${Date.now()}@lumo.co.tz`,
            role: 'CUSTOMER',
            accountStatus: 'ACTIVE',
          },
        })
      } catch (createErr) {
        console.error('[ORDER POST] Failed to create default guest user:', createErr)
        return NextResponse.json({ error: 'Authentication required. No valid buyer user found in system.' }, { status: 401 })
      }
    }

    const body = await req.json()
    const result = CreateOrderSchema.safeParse(body)

    if (!result.success) {
      return NextResponse.json({ error: 'Invalid order request', details: result.error.flatten() }, { status: 400 })
    }

    const { items: inputItems, shippingAddress, paymentMethod } = result.data

    const productIds = inputItems.map((i) => i.productId)
    const dbProducts = await prisma.product.findMany({
      where: {
        OR: [
          { id: { in: productIds } },
          { slug: { in: productIds } },
          { productCode: { in: productIds } },
        ],
      },
    })

    const productMap = new Map<string, any>()
    dbProducts.forEach((p) => {
      productMap.set(p.id, p)
      productMap.set(p.slug, p)
      if (p.productCode) productMap.set(p.productCode, p)
    })

    // Ensure category exists for fallback creation
    let category = await prisma.category.findFirst({ where: { slug: 'general-wholesale' } }).catch(() => null)
    if (!category) {
      category = await prisma.category.create({
        data: { name: 'General Wholesale', slug: 'general-wholesale' },
      }).catch(() => null)
    }

    let subtotalTZS = new Prisma.Decimal(0)
    const preparedItems: Prisma.OrderItemCreateWithoutOrderInput[] = []

    for (const item of inputItems) {
      let product = productMap.get(item.productId)

      let cleanItemImg = (item.imageUrl || '').trim()
      if (cleanItemImg.startsWith('//')) cleanItemImg = `https:${cleanItemImg}`
      if (cleanItemImg.includes('unsplash.com')) cleanItemImg = ''
      const fallbackImg = cleanItemImg || ''
      const fallbackTitle = item.title || 'Wholesale B2B Goods'
      const itemPriceTZS = item.priceTZS || 100000

      if (!product) {
        product = await prisma.product.findUnique({ where: { id: item.productId } }).catch(() => null)
      }

      if (!product) {
        try {
          const uniqueSuffix = Date.now().toString(36) + Math.floor(100 + Math.random() * 900)
          const safeSlug = `p-${uniqueSuffix}`
          const safeCode = `PC-${uniqueSuffix}`

          product = await prisma.product.create({
            data: {
              id: item.productId,
              productCode: safeCode,
              title: fallbackTitle,
              slug: safeSlug,
              description: 'Imported Wholesale Product',
              priceTZS: new Prisma.Decimal(itemPriceTZS),
              priceUSD: new Prisma.Decimal(Math.round(itemPriceTZS / 2500)),
              stock: 1000,
              status: 'PUBLISHED',
              categoryId: category?.id || 'general-wholesale',
              imageUrl: fallbackImg,
            },
          })
        } catch (createErr) {
          console.warn('[ORDER POST] Product creation failed, falling back to existing product:', createErr)
          product = await prisma.product.findFirst().catch(() => null)
        }
      }

      if (!product) {
        try {
          const uniqueSuffix = Date.now().toString(36) + Math.floor(1000 + Math.random() * 9000)
          product = await prisma.product.create({
            data: {
              productCode: `PC-FALLBACK-${uniqueSuffix}`,
              title: fallbackTitle,
              slug: `p-fallback-${uniqueSuffix}`,
              description: 'General Wholesale Goods',
              priceTZS: new Prisma.Decimal(itemPriceTZS),
              priceUSD: new Prisma.Decimal(Math.round(itemPriceTZS / 2500)),
              stock: 1000,
              status: 'PUBLISHED',
              categoryId: category?.id || 'general-wholesale',
              imageUrl: fallbackImg,
            },
          })
        } catch (fbErr) {
          console.error('[ORDER POST] Fatal product creation failure:', fbErr)
        }
      }

      if (product && cleanItemImg) {
        const isDefault = !product.imageUrl || product.imageUrl.includes('unsplash.com') || product.imageUrl.length < 5
        if (isDefault || product.imageUrl !== cleanItemImg) {
          await prisma.product.update({
            where: { id: product.id },
            data: {
              imageUrl: cleanItemImg,
              ...(item.title ? { title: item.title } : {}),
            },
          }).catch(() => {})
        }
      }

      const unitPriceVal = item.priceTZS || (product?.priceTZS ? Number(product.priceTZS) : 100000)
      const unitPriceTZS = new Prisma.Decimal(unitPriceVal.toString())
      const itemTotalTZS = unitPriceTZS.mul(item.quantity)
      subtotalTZS = subtotalTZS.add(itemTotalTZS)

      const targetProductId = product?.id || item.productId

      preparedItems.push({
        quantity: item.quantity,
        unitPriceTZS,
        totalPriceTZS: itemTotalTZS,
        selectedVariant: item.selectedVariant,
        product: { connect: { id: targetProductId } },
      })
    }

    const finalSubtotalTZS = result.data.subtotalTZS !== undefined
      ? new Prisma.Decimal(result.data.subtotalTZS)
      : subtotalTZS

    const finalShippingFeeTZS = result.data.shippingFeeTZS !== undefined
      ? new Prisma.Decimal(result.data.shippingFeeTZS)
      : new Prisma.Decimal(15000.0)

    const finalTaxAmountTZS = result.data.taxAmountTZS !== undefined
      ? new Prisma.Decimal(result.data.taxAmountTZS)
      : finalSubtotalTZS.mul(0.18)

    const finalTotalAmountTZS = result.data.totalAmountTZS !== undefined
      ? new Prisma.Decimal(result.data.totalAmountTZS)
      : finalSubtotalTZS.add(finalShippingFeeTZS).add(finalTaxAmountTZS)

    const orderNumber = `LUMO-${Date.now().toString().slice(-6)}-${Math.floor(100 + Math.random() * 900)}`

    let initialOrderStatus: OrderStatus = OrderStatus.PAID
    if (result.data.status === 'PENDING_PAYMENT') {
      initialOrderStatus = OrderStatus.PENDING_PAYMENT
    } else if (result.data.status === 'PROCESSING') {
      initialOrderStatus = OrderStatus.PROCESSING
    }

    let initialPaymentStatus: PaymentStatus = PaymentStatus.SUCCESSFUL
    if (result.data.paymentStatus === 'PENDING') {
      initialPaymentStatus = PaymentStatus.PENDING
    }

    // Atomic transaction for core Order and PaymentRecord creation only
    const createdOrder = await prisma.$transaction(async (tx) => {
      const order = await tx.order.create({
        data: {
          orderNumber,
          buyer: { connect: { id: buyerUser.id } },
          subtotalTZS: finalSubtotalTZS,
          shippingFeeTZS: finalShippingFeeTZS,
          taxAmountTZS: finalTaxAmountTZS,
          totalAmountTZS: finalTotalAmountTZS,
          status: initialOrderStatus,
          paymentMethod,
          shippingAddress: shippingAddress as Prisma.InputJsonValue,
          items: {
            create: preparedItems,
          },
        },
      })

      const transactionRef = `AZM-${Date.now()}-${Math.floor(1000 + Math.random() * 9000)}`
      await tx.paymentRecord.create({
        data: {
          orderId: order.id,
          provider: 'LUMO Pay',
          transactionRef,
          amountTZS: finalTotalAmountTZS,
          status: initialPaymentStatus,
        },
      })

      return order
    })

    // Execute secondary non-critical side effects outside transaction
    const targetPhone = shippingAddress?.phone || buyerUser.phone

    Promise.allSettled([
      ...inputItems.map((item) =>
        prisma.product.update({
          where: { id: item.productId },
          data: {
            stock: { decrement: item.quantity },
            totalSales: { increment: item.quantity },
          },
        }).catch(() => null)
      ),
      prisma.cartItem.deleteMany({
        where: { userId: buyerUser.id },
      }).catch(() => null),
      prisma.escrowLedger.create({
        data: {
          orderId: createdOrder.id,
          buyerId: buyerUser.id,
          amountTZS: finalTotalAmountTZS,
          status: EscrowStatus.INITIATED,
        },
      }).catch((e) => console.warn('[ESCROW LEDGER] Non-blocking warning:', e)),
      (async () => {
        // Only send payment confirmation SMS if order was created directly in PAID status (e.g. admin manual order)
        // For online checkouts with PENDING_PAYMENT, SMS is dispatched only after Mongike/carrier payment confirmation
        if (targetPhone && initialOrderStatus === OrderStatus.PAID && initialPaymentStatus === PaymentStatus.SUCCESSFUL) {
          await OutboxService.enqueue({
            eventType: 'ORDER_PAID_CUSTOMER',
            aggregateId: createdOrder.id,
            recipientId: buyerUser.id,
            recipientPhone: targetPhone,
            templateKey: 'ORDER_PAID_CUSTOMER',
            payloadJson: {
              orderReference: createdOrder.orderNumber,
              amountTZS: Number(createdOrder.totalAmountTZS).toLocaleString(),
            },
          }).catch((err) => console.warn('[ORDER SMS ENQUEUE WARN]', err))

          await processOutboxBatch(10).catch((err) => console.warn('[ORDER SMS DISPATCH WARN]', err))
        }
      })(),
    ])

    return NextResponse.json(
      {
        success: true,
        order: {
          id: createdOrder.id,
          orderNumber: createdOrder.orderNumber,
          totalAmountTZS: Number(createdOrder.totalAmountTZS),
          status: createdOrder.status,
        },
      },
      { status: 201 }
    )
  } catch (error: any) {
    console.error('[API ORDERS POST ERROR]', error?.message || error, error?.stack)
    return NextResponse.json(
      {
        error: error?.message || 'Failed to create transactional order',
        details: String(error),
      },
      { status: 500 }
    )
  }
}
