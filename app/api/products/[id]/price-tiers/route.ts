import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db'
import { authorizeApiRequest } from '@/lib/auth/authorize'
import { checkRateLimit } from '@/lib/security/rate-limiter'
import { Role } from '@prisma/client'

/**
 * GET /api/products/[id]/price-tiers
 * Public endpoint: Retrieves active wholesale price tiers for a product sorted by minQuantity.
 */
export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: productId } = await params

    const product = await prisma.product.findFirst({
      where: {
        OR: [{ id: productId }, { slug: productId }, { productCode: productId }],
      },
      select: { id: true },
    })

    if (!product) {
      return NextResponse.json({ error: 'Product not found' }, { status: 404 })
    }

    const tiers = await (prisma as any).productPriceTier.findMany({
      where: {
        productId: product.id,
        isActive: true,
      },
      orderBy: {
        minQuantity: 'asc',
      },
    })

    const formattedTiers = tiers.map((tier: any) => ({
      id: tier.id,
      minQuantity: tier.minQuantity,
      maxQuantity: tier.maxQuantity,
      unitPrice: Number(tier.unitPrice),
      currency: tier.currency,
      validFrom: tier.validFrom,
      validUntil: tier.validUntil,
    }))

    return NextResponse.json({ productId: product.id, tiers: formattedTiers })
  } catch (error: any) {
    console.error('[API PRICE TIERS GET ERROR]', error)
    return NextResponse.json({ error: 'Failed to fetch product price tiers' }, { status: 500 })
  }
}

/**
 * POST /api/products/[id]/price-tiers
 * Authorized endpoint: Allows SUPPLIER or ADMIN to set price tiers for a product.
 */
export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const rateLimit = checkRateLimit(req, { limit: 20, windowMs: 60000, prefix: 'price_tiers_post' })
  if (!rateLimit.success && rateLimit.response) {
    return rateLimit.response
  }

  const { id: productId } = await params

  const product = await prisma.product.findFirst({
    where: {
      OR: [{ id: productId }, { slug: productId }, { productCode: productId }],
    },
    include: { supplier: true },
  })

  if (!product) {
    return NextResponse.json({ error: 'Product not found' }, { status: 404 })
  }

  // Authorize SUPPLIER or ADMIN
  const auth = await authorizeApiRequest(
    req,
    [Role.SUPPLIER, Role.ADMIN],
    product.supplier?.userId
  )
  if (!auth.authorized) {
    return auth.response!
  }

  try {
    const body = await req.json()
    const { tiers } = body

    if (!Array.isArray(tiers) || tiers.length === 0) {
      return NextResponse.json(
        { error: 'Invalid input: "tiers" must be a non-empty array' },
        { status: 400 }
      )
    }

    // Validate tier formats & check for overlapping quantities
    const sortedInput = [...tiers].sort((a: any, b: any) => Number(a.minQuantity) - Number(b.minQuantity))
    for (let i = 0; i < sortedInput.length; i++) {
      const tier = sortedInput[i]
      const minQty = parseInt(tier.minQuantity, 10)
      const maxQty = tier.maxQuantity ? parseInt(tier.maxQuantity, 10) : null
      const price = parseFloat(tier.unitPrice)

      if (isNaN(minQty) || minQty < 1) {
        return NextResponse.json(
          { error: `Invalid minQuantity at tier index ${i}. Must be a positive integer.` },
          { status: 400 }
        )
      }

      if (isNaN(price) || price <= 0) {
        return NextResponse.json(
          { error: `Invalid unitPrice at tier index ${i}. Must be greater than 0.` },
          { status: 400 }
        )
      }

      if (maxQty !== null && maxQty < minQty) {
        return NextResponse.json(
          { error: `maxQuantity cannot be less than minQuantity at tier index ${i}` },
          { status: 400 }
        )
      }

      if (i > 0) {
        const prevTier = sortedInput[i - 1]
        const prevMax = prevTier.maxQuantity ? parseInt(prevTier.maxQuantity, 10) : null
        if (prevMax === null || minQty <= prevMax) {
          return NextResponse.json(
            { error: `Overlapping price tiers detected between tier ${i} and previous tier` },
            { status: 400 }
          )
        }
      }
    }

    // Atomically replace price tiers for product
    await prisma.$transaction(async (tx: any) => {
      // Deactivate existing tiers
      await tx.productPriceTier.updateMany({
        where: { productId: product.id },
        data: { isActive: false },
      })

      // Create new tiers
      for (const tier of sortedInput) {
        await tx.productPriceTier.create({
          data: {
            productId: product.id,
            minQuantity: parseInt(tier.minQuantity, 10),
            maxQuantity: tier.maxQuantity ? parseInt(tier.maxQuantity, 10) : null,
            unitPrice: parseFloat(tier.unitPrice),
            currency: tier.currency || 'TZS',
            isActive: true,
          },
        })
      }
    })

    const updatedTiers = await (prisma as any).productPriceTier.findMany({
      where: { productId: product.id, isActive: true },
      orderBy: { minQuantity: 'asc' },
    })

    return NextResponse.json({
      success: true,
      productId: product.id,
      tiers: updatedTiers.map((t: any) => ({
        id: t.id,
        minQuantity: t.minQuantity,
        maxQuantity: t.maxQuantity,
        unitPrice: Number(t.unitPrice),
        currency: t.currency,
      })),
    })
  } catch (error: any) {
    console.error('[API PRICE TIERS POST ERROR]', error)
    return NextResponse.json({ error: 'Failed to update product price tiers' }, { status: 500 })
  }
}
