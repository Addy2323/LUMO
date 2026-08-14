import { prisma } from '@/lib/db'

export interface InputCartItem {
  productId: string
  quantity: number
  selectedVariant?: string
}

export interface RepricedCartItem {
  productId: string
  title: string
  quantity: number
  baseUnitPriceTZS: number
  authoritativeUnitPriceTZS: number
  subtotalTZS: number
  tierApplied?: {
    minQuantity: number
    maxQuantity?: number | null
    tierUnitPriceTZS: number
    discountPercentage: number
  }
}

export interface RepricedCartSummary {
  items: RepricedCartItem[]
  totalItems: number
  subtotalAmountTZS: number
  shippingEstimateTZS: number
  totalAmountTZS: number
}

/**
 * Server-side Cart Repricing Service (Authoritative Wholesale Pricing)
 * 
 * Re-evaluates all cart items against database-backed ProductPriceTier records.
 * The client-submitted prices are ignored; authoritative prices are calculated server-side.
 */
export async function repriceCartItems(
  items: InputCartItem[]
): Promise<RepricedCartSummary> {
  if (!items || items.length === 0) {
    return {
      items: [],
      totalItems: 0,
      subtotalAmountTZS: 0,
      shippingEstimateTZS: 0,
      totalAmountTZS: 0,
    }
  }

  const productIds = items.map((i) => i.productId)
  const products = await (prisma.product as any).findMany({
    where: {
      id: { in: productIds },
    },
    include: {
      priceTiers: {
        where: { isActive: true },
        orderBy: { minQuantity: 'asc' },
      },
    },
  })

  const productMap = new Map(products.map((p: any) => [p.id, p]))

  let subtotalAmountTZS = 0
  let totalItemsCount = 0
  const repricedItems: RepricedCartItem[] = []

  for (const item of items) {
    const product: any = productMap.get(item.productId)
    if (!product) continue

    const qty = Math.max(1, Math.floor(item.quantity))
    totalItemsCount += qty

    const basePriceTZS = Math.round(Number(product.priceTZS))
    let applicableUnitPriceTZS = basePriceTZS
    let appliedTier: RepricedCartItem['tierApplied'] | undefined = undefined

    // Evaluate database-backed price tiers
    if (product.priceTiers && product.priceTiers.length > 0) {
      // Find the highest matching tier where minQuantity <= qty
      const matchingTier = product.priceTiers
        .filter((t: any) => t.minQuantity <= qty && (t.maxQuantity === null || qty <= t.maxQuantity))
        .pop()

      if (matchingTier) {
        const tierPriceTZS = Math.round(Number(matchingTier.unitPrice))
        applicableUnitPriceTZS = tierPriceTZS
        const discount =
          basePriceTZS > 0
            ? Math.round(((basePriceTZS - tierPriceTZS) / basePriceTZS) * 100)
            : 0

        appliedTier = {
          minQuantity: matchingTier.minQuantity,
          maxQuantity: matchingTier.maxQuantity,
          tierUnitPriceTZS: tierPriceTZS,
          discountPercentage: Math.max(0, discount),
        }
      }
    }

    const itemSubtotal = applicableUnitPriceTZS * qty
    subtotalAmountTZS += itemSubtotal

    repricedItems.push({
      productId: product.id,
      title: product.title,
      quantity: qty,
      baseUnitPriceTZS: basePriceTZS,
      authoritativeUnitPriceTZS: applicableUnitPriceTZS,
      subtotalTZS: itemSubtotal,
      tierApplied: appliedTier,
    })
  }

  // Calculate standard shipping estimate (dynamic landed-cost baseline)
  const shippingEstimateTZS = Math.round(15000 + totalItemsCount * 2500)
  const totalAmountTZS = subtotalAmountTZS + shippingEstimateTZS

  return {
    items: repricedItems,
    totalItems: totalItemsCount,
    subtotalAmountTZS,
    shippingEstimateTZS,
    totalAmountTZS,
  }
}
