import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db'
import { authorizeApiRequest } from '@/lib/auth/authorize'
import { checkRateLimit } from '@/lib/security/rate-limiter'
import { Role } from '@prisma/client'

/**
 * GET /api/rfq
 * List RFQs. Buyers see their own RFQs; Suppliers & Admins see published RFQs.
 */
export async function GET(req: NextRequest) {
  const auth = await authorizeApiRequest(req)
  if (!auth.authorized) return auth.response!

  const { user } = auth
  const { searchParams } = new URL(req.url)
  const status = searchParams.get('status')

  try {
    let whereClause: any = {}

    if (user.role === Role.BUYER) {
      whereClause.buyerId = user.id
    } else if (user.role === Role.SUPPLIER) {
      whereClause.status = { in: ['SUBMITTED', 'IN_REVIEW', 'QUOTED'] }
    }

    if (status) {
      whereClause.status = status
    }

    const rfqs = await (prisma as any).rFQ.findMany({
      where: whereClause,
      include: {
        buyer: {
          select: { id: true, name: true, companyName: true, email: true },
        },
        items: true,
        requirements: true,
        attachments: true,
        _count: {
          select: { quotations: true },
        },
      },
      orderBy: { createdAt: 'desc' },
    })

    return NextResponse.json({ rfqs })
  } catch (error: any) {
    console.error('[RFQ GET ERROR]', error)
    return NextResponse.json({ error: 'Failed to fetch RFQs' }, { status: 500 })
  }
}

/**
 * POST /api/rfq
 * Submit a new Request for Quotation (RFQ).
 */
export async function POST(req: NextRequest) {
  const rateLimit = checkRateLimit(req, { limit: 15, windowMs: 60000, prefix: 'rfq_create' })
  if (!rateLimit.success && rateLimit.response) return rateLimit.response

  const auth = await authorizeApiRequest(req)
  if (!auth.authorized) return auth.response!

  const { user } = auth

  try {
    const body = await req.json()
    const {
      title,
      description,
      categoryId,
      targetDeliveryDate,
      destinationCity,
      destinationPort,
      incotermPreference,
      maxBudgetTZS,
      items,
      requirements,
      attachments,
    } = body

    if (!title || !description || !Array.isArray(items) || items.length === 0) {
      return NextResponse.json(
        { error: 'Missing required fields: title, description, and at least 1 item' },
        { status: 400 }
      )
    }

    const count = await (prisma as any).rFQ.count()
    const rfqNumber = `RFQ-${new Date().getFullYear()}-${String(count + 1001).padStart(5, '0')}`

    const expiresAt = new Date(Date.now() + 14 * 24 * 60 * 60 * 1000) // Default 14-day RFQ validity

    const newRfq = await (prisma as any).rFQ.create({
      data: {
        rfqNumber,
        buyerId: user.id,
        title,
        description,
        categoryId: categoryId || null,
        targetDeliveryDate: targetDeliveryDate ? new Date(targetDeliveryDate) : null,
        destinationCity: destinationCity || 'Dar es Salaam',
        destinationPort: destinationPort || 'Dar es Salaam Port',
        incotermPreference: incotermPreference || 'FOB',
        maxBudgetTZS: maxBudgetTZS ? parseFloat(String(maxBudgetTZS)) : null,
        status: 'SUBMITTED',
        expiresAt,
        items: {
          create: items.map((item: any) => ({
            productName: item.productName,
            specifications: item.specifications || null,
            quantity: parseInt(String(item.quantity || 1), 10),
            unit: item.unit || 'pcs',
            targetUnitPriceTZS: item.targetUnitPriceTZS ? parseFloat(String(item.targetUnitPriceTZS)) : null,
          })),
        },
        requirements: requirements && Array.isArray(requirements)
          ? {
              create: requirements.map((reqItem: any) => ({
                requirementType: reqItem.requirementType || 'CUSTOM',
                description: reqItem.description,
                isMandatory: reqItem.isMandatory ?? true,
              })),
            }
          : undefined,
        attachments: attachments && Array.isArray(attachments)
          ? {
              create: attachments.map((att: any) => ({
                fileName: att.fileName,
                fileUrl: att.fileUrl,
                fileSize: parseInt(String(att.fileSize || 0), 10),
                mimeType: att.mimeType || 'application/pdf',
              })),
            }
          : undefined,
      },
      include: {
        items: true,
        requirements: true,
        attachments: true,
      },
    })

    return NextResponse.json({ success: true, rfq: newRfq }, { status: 201 })
  } catch (error: any) {
    console.error('[RFQ POST ERROR]', error)
    return NextResponse.json({ error: 'Failed to create RFQ' }, { status: 500 })
  }
}
