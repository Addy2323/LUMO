import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db'

/**
 * PATCH /api/products/[id]/approve
 * Admin Approval endpoint for supplier submitted products
 */
export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const body = await req.json().catch(() => ({}))
    const action = body.action || 'approve' // 'approve' | 'reject'

    const existing = await prisma.product.findUnique({
      where: { id },
    })

    if (!existing) {
      return NextResponse.json({ error: 'Product not found' }, { status: 404 })
    }

    if (action === 'approve') {
      const updated = await prisma.product.update({
        where: { id },
        data: {
          status: 'PUBLISHED',
          isApproved: true,
          publishedAt: new Date(),
        },
      })

      return NextResponse.json({
        success: true,
        message: `Product ${id} approved & published to live catalog`,
        product: {
          ...updated,
          priceTZS: Number(updated.priceTZS),
          priceUSD: Number(updated.priceUSD),
        },
      })
    } else {
      const updated = await prisma.product.update({
        where: { id },
        data: {
          status: 'REJECTED',
          isApproved: false,
        },
      })

      return NextResponse.json({
        success: true,
        message: `Product ${id} rejected`,
        product: {
          ...updated,
          priceTZS: Number(updated.priceTZS),
          priceUSD: Number(updated.priceUSD),
        },
      })
    }
  } catch (error: any) {
    console.error('[API PRODUCT APPROVE ERROR]', error)
    return NextResponse.json({ error: error.message || 'Failed to update approval status' }, { status: 500 })
  }
}
