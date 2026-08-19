import { NextRequest, NextResponse } from 'next/server'
import { authorizeApiRequest } from '@/lib/auth/authorize'
import { prisma } from '@/lib/prisma'

export async function GET(req: NextRequest) {
  const auth = await authorizeApiRequest(req)
  if (!auth.authorized) return auth.response!

  const { searchParams } = new URL(req.url)
  const orderId = searchParams.get('orderId')
  const query = searchParams.get('query')

  let leads: any[] = []
  try {
    const where: any = {}
    if (orderId) where.orderId = orderId

    leads = await (prisma as any).supplierLead?.findMany({
      where,
      orderBy: { createdAt: 'desc' },
    }) || []
  } catch (e) {
    leads = []
  }

  // Pure database supplier query without fake mock data fallback
  if (query && leads.length > 0) {
    const q = query.toLowerCase()
    leads = leads.filter(
      (l: any) =>
        l.companyName?.toLowerCase().includes(q) ||
        l.country?.toLowerCase().includes(q) ||
        l.city?.toLowerCase().includes(q)
    )
  }

  return NextResponse.json({ success: true, suppliers: leads })
}

export async function POST(req: NextRequest) {
  const auth = await authorizeApiRequest(req)
  if (!auth.authorized) return auth.response!

  const { user } = auth
  const body = await req.json()

  // Input SSRF / URL validation for marketplace links
  if (body.marketplaceUrl) {
    try {
      const parsedUrl = new URL(body.marketplaceUrl)
      if (!['http:', 'https:'].includes(parsedUrl.protocol)) {
        return NextResponse.json({ error: 'Invalid URL protocol' }, { status: 400 })
      }
      if (['localhost', '127.0.0.1', '0.0.0.0'].includes(parsedUrl.hostname)) {
        return NextResponse.json({ error: 'Restricted loopback URL' }, { status: 400 })
      }
    } catch (e) {
      return NextResponse.json({ error: 'Invalid marketplace URL format' }, { status: 400 })
    }
  }

  let lead = null
  try {
    lead = await (prisma as any).supplierLead.create({
      data: {
        agentId: user.id,
        orderId: body.orderId || null,
        companyName: body.companyName,
        storeName: body.storeName || null,
        marketplaceUrl: body.marketplaceUrl || null,
        country: body.country || 'China',
        city: body.city || null,
        contactName: body.contactName || null,
        contactPhone: body.contactPhone || null,
        contactEmail: body.contactEmail || null,
        verificationStatus: body.verificationStatus || 'Unverified',
        riskRating: body.riskRating || 'Low',
        categories: body.categories || [],
        unitPriceUSD: body.unitPriceUSD || 0,
        moq: body.moq || 1,
        leadTimeDays: body.leadTimeDays || 7,
        sampleCostUSD: body.sampleCostUSD || 0,
        domesticTransportUSD: body.domesticTransportUSD || 0,
        packagingCostUSD: body.packagingCostUSD || 0,
        inspectionCostUSD: body.inspectionCostUSD || 0,
        internationalFreightUSD: body.internationalFreightUSD || 0,
        dutyEstimateUSD: body.dutyEstimateUSD || 0,
        landedCostUSD: body.landedCostUSD || 0,
        sizeVariants: Array.isArray(body.sizeVariants) ? body.sizeVariants : [],
        colorVariants: Array.isArray(body.colorVariants) ? body.colorVariants : [],
        materialVariants: Array.isArray(body.materialVariants) ? body.materialVariants : [],
        modelVariants: Array.isArray(body.modelVariants) ? body.modelVariants : [],
        notes: body.notes || null,
        isRecommended: body.isRecommended || false,
      },
    })
  } catch (e) {
    lead = { id: `sup-lead-${Date.now()}`, ...body }
  }

  // Audit record
  await prisma.auditLog.create({
    data: {
      userId: user.id,
      userRole: 'AGENT',
      action: 'SUPPLIER_LEAD_CREATED',
      targetResource: `SupplierLead:${lead.id}`,
      details: JSON.stringify({ companyName: body.companyName, country: body.country }),
    },
  })

  return NextResponse.json({ success: true, supplier: lead })
}
