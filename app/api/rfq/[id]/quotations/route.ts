import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db'
import { authorizeApiRequest } from '@/lib/auth/authorize'
import { checkRateLimit } from '@/lib/security/rate-limiter'
import { Role } from '@prisma/client'

/**
 * GET /api/rfq/[id]/quotations
 * List quotations submitted for an RFQ.
 */
export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const auth = await authorizeApiRequest(req)
  if (!auth.authorized) return auth.response!

  const { user } = auth
  const { id: rfqId } = await params

  try {
    const rfq = await (prisma as any).rFQ.findUnique({
      where: { id: rfqId },
    })

    if (!rfq) {
      return NextResponse.json({ error: 'RFQ not found' }, { status: 404 })
    }

    let whereClause: any = { rfqId }

    if (user.role === Role.SUPPLIER) {
      whereClause.supplierId = user.id
    } else if (user.role === Role.BUYER && rfq.buyerId !== user.id) {
      return NextResponse.json(
        { error: 'Forbidden: You do not own this RFQ' },
        { status: 403 }
      )
    }

    const quotations = await (prisma as any).supplierQuotation.findMany({
      where: whereClause,
      include: {
        supplierUser: {
          select: { id: true, name: true, companyName: true, email: true },
        },
        items: true,
        charges: true,
        versions: { orderBy: { versionNumber: 'desc' } },
        messages: { orderBy: { createdAt: 'asc' } },
        statusHistory: { orderBy: { createdAt: 'desc' } },
      },
      orderBy: { createdAt: 'desc' },
    })

    return NextResponse.json({ rfqId, quotations })
  } catch (error: any) {
    console.error('[RFQ QUOTATIONS GET ERROR]', error)
    return NextResponse.json({ error: 'Failed to fetch quotations' }, { status: 500 })
  }
}

/**
 * POST /api/rfq/[id]/quotations
 * Supplier submits or updates a quotation for an RFQ.
 */
export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const rateLimit = checkRateLimit(req, { limit: 15, windowMs: 60000, prefix: 'quotation_submit' })
  if (!rateLimit.success && rateLimit.response) return rateLimit.response

  const auth = await authorizeApiRequest(req, [Role.SUPPLIER, Role.ADMIN])
  if (!auth.authorized) return auth.response!

  const { user } = auth
  const { id: rfqId } = await params

  try {
    const rfq = await (prisma as any).rFQ.findUnique({
      where: { id: rfqId },
    })

    if (!rfq) {
      return NextResponse.json({ error: 'RFQ not found' }, { status: 404 })
    }

    if (rfq.status === 'CLOSED' || rfq.status === 'EXPIRED' || rfq.status === 'CANCELLED') {
      return NextResponse.json({ error: 'This RFQ is no longer accepting quotations' }, { status: 400 })
    }

    const body = await req.json()
    const {
      items,
      charges,
      validUntil,
      currency,
      incoterm,
      estimatedLeadDays,
      sampleAvailable,
      originCountry,
      inspectionTerms,
      paymentTerms,
      notes,
    } = body

    if (!Array.isArray(items) || items.length === 0 || !validUntil) {
      return NextResponse.json(
        { error: 'Missing required fields: items array and validUntil date' },
        { status: 400 }
      )
    }

    // Calculate subtotal, freight, tax, and total
    let subtotalAmount = 0
    const quotationItemsData = items.map((i: any) => {
      const q = parseInt(String(i.quantity || 1), 10)
      const p = parseFloat(String(i.unitPrice || 0))
      const itemSub = q * p
      subtotalAmount += itemSub
      return {
        itemDescription: i.itemDescription || i.productName || 'Quotation Item',
        quantity: q,
        unitPrice: p,
        subtotal: itemSub,
      }
    })

    let freightAmount = 0
    let taxAmount = 0
    const chargesData = (charges && Array.isArray(charges))
      ? charges.map((c: any) => {
          const amt = parseFloat(String(c.amount || 0))
          if (c.isFreight) freightAmount += amt
          else taxAmount += amt
          return {
            chargeName: c.chargeName || 'Additional Charge',
            amount: amt,
            isIncluded: c.isIncluded ?? true,
          }
        })
      : []

    const totalAmount = subtotalAmount + freightAmount + taxAmount

    // Check if supplier has an existing quotation for this RFQ to manage versioning
    const existingQuotation = await (prisma as any).supplierQuotation.findFirst({
      where: { rfqId, supplierId: user.id },
    })

    let resultQuotation: any

    if (existingQuotation) {
      // Create version snapshot of existing quotation before updating
      const nextVersion = existingQuotation.version + 1

      await (prisma as any).$transaction(async (tx: any) => {
        // Save version snapshot
        await tx.quotationVersion.create({
          data: {
            quotationId: existingQuotation.id,
            versionNumber: existingQuotation.version,
            snapshotData: existingQuotation,
            changeReason: notes || 'Supplier submitted updated quotation version',
          },
        })

        // Delete old items & charges to replace with new set
        await tx.quotationItem.deleteMany({ where: { quotationId: existingQuotation.id } })
        await tx.quotationCharge.deleteMany({ where: { quotationId: existingQuotation.id } })

        // Update quotation header
        resultQuotation = await tx.supplierQuotation.update({
          where: { id: existingQuotation.id },
          data: {
            version: nextVersion,
            status: 'REVISED',
            validUntil: new Date(validUntil),
            currency: currency || 'TZS',
            subtotalAmount,
            freightAmount,
            taxAmount,
            totalAmount,
            incoterm: incoterm || 'FOB',
            estimatedLeadDays: parseInt(String(estimatedLeadDays || 14), 10),
            sampleAvailable: Boolean(sampleAvailable),
            originCountry: originCountry || 'China',
            inspectionTerms: inspectionTerms || null,
            paymentTerms: paymentTerms || null,
            notes: notes || null,
            items: { create: quotationItemsData },
            charges: { create: chargesData },
            statusHistory: {
              create: {
                previousStatus: existingQuotation.status,
                newStatus: 'REVISED',
                changedById: user.id,
                reason: `Quotation updated to v${nextVersion}`,
              },
            },
          },
          include: { items: true, charges: true },
        })
      })
    } else {
      // Create new quotation record
      const count = await (prisma as any).supplierQuotation.count()
      const quotationNumber = `QUO-${new Date().getFullYear()}-${String(count + 1001).padStart(5, '0')}`

      await (prisma as any).$transaction(async (tx: any) => {
        resultQuotation = await tx.supplierQuotation.create({
          data: {
            quotationNumber,
            rfqId,
            supplierId: user.id,
            version: 1,
            status: 'SUBMITTED',
            validUntil: new Date(validUntil),
            currency: currency || 'TZS',
            subtotalAmount,
            freightAmount,
            taxAmount,
            totalAmount,
            incoterm: incoterm || 'FOB',
            estimatedLeadDays: parseInt(String(estimatedLeadDays || 14), 10),
            sampleAvailable: Boolean(sampleAvailable),
            originCountry: originCountry || 'China',
            inspectionTerms: inspectionTerms || null,
            paymentTerms: paymentTerms || null,
            notes: notes || null,
            items: { create: quotationItemsData },
            charges: { create: chargesData },
            statusHistory: {
              create: {
                previousStatus: 'DRAFT',
                newStatus: 'SUBMITTED',
                changedById: user.id,
                reason: 'Initial quotation submission',
              },
            },
          },
          include: { items: true, charges: true },
        })

        // Update RFQ status to QUOTED if still SUBMITTED
        await tx.rFQ.update({
          where: { id: rfqId },
          data: { status: 'QUOTED' },
        })
      })
    }

    return NextResponse.json({ success: true, quotation: resultQuotation }, { status: 201 })
  } catch (error: any) {
    console.error('[QUOTATION SUBMIT ERROR]', error)
    return NextResponse.json({ error: 'Failed to submit quotation' }, { status: 500 })
  }
}
