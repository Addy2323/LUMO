'use client'

import { useState } from 'react'
import Image from 'next/image'
import Link from 'next/link'
import { Check, Heart, ShoppingCart, Store } from 'lucide-react'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Skeleton } from '@/components/ui/skeleton'
import { Rating } from '@/components/marketplace/rating'
import { formatTZS } from '@/lib/format'
import type { Product } from '@/lib/mock/products'
import { SafeProductImage } from '@/components/ui/product-image'
import { useCartStore } from '@/lib/stores/cart-store'
import { cn } from '@/lib/utils'

export function ProductCard({
  product,
  className,
  onSelect,
}: {
  product: Product
  className?: string
  onSelect?: (product: Product) => void
}) {
  const [isAdded, setIsAdded] = useState(false)

  const totalStock = product.variants.reduce((sum, variant) => sum + variant.stock, 0)
  const lowStock = totalStock > 0 && totalStock <= 20
  const discount = product.compareAtPrice
    ? Math.round((1 - product.fromPrice / product.compareAtPrice) * 100)
    : 0

  function handleAddToCart(e: React.MouseEvent) {
    e.stopPropagation()

    const firstVariant = product.variants[0] || {
      id: `var-default-${product.id}`,
      sku: `SKU-${product.id}`,
      options: { Variant: 'Default' },
      price: product.fromPrice,
      stock: 100,
      imageIndex: 0,
    }

    const variantLabel = Object.values(firstVariant.options || {}).join(' / ') || 'Default'

    useCartStore.getState().add({
      id: firstVariant.id,
      productId: product.id,
      slug: product.slug,
      title: product.title,
      variantLabel,
      sku: firstVariant.sku,
      image: product.images[0]?.url || '',
      unitPrice: product.fromPrice,
      stock: firstVariant.stock || 100,
      quantity: 1,
    })

    // Trigger flying cart animation
    const rect = (e.currentTarget as HTMLElement).getBoundingClientRect()
    window.dispatchEvent(
      new CustomEvent('lumo_cart_item_added', {
        detail: {
          imageUrl: product.images[0]?.url || '',
          startX: rect.left + rect.width / 2,
          startY: rect.top + rect.height / 2,
        },
      }),
    )

    setIsAdded(true)
    setTimeout(() => setIsAdded(false), 1800)
  }

  return (
    <Card
      className={cn(
        'group relative gap-0 overflow-hidden rounded-2xl py-0 border-border/80 bg-card card-hover-lift cursor-pointer transition-all duration-200 hover:border-brand-500/40 hover:shadow-xl flex flex-col justify-between',
        className,
      )}
      onClick={(e) => {
        if (onSelect) {
          e.preventDefault()
          onSelect(product)
        }
      }}
    >
      <div className="relative aspect-square overflow-hidden bg-muted">
        <SafeProductImage
          src={product.images[0]?.url}
          alt={product.images[0]?.alt || product.title}
          title={product.title}
          category={product.categoryId}
          className="size-full object-cover transition-transform duration-300 group-hover:scale-[1.03]"
        />
        {/* Country Origin & Gold Verification Badge */}
        {product.supplier?.flag ? (
          <div className="absolute top-2 left-2 rounded-lg bg-slate-900/90 backdrop-blur-md px-2 py-0.5 text-[10px] font-bold text-white flex items-center gap-1.5 shadow-md z-10 border border-amber-500/40">
            <span>{product.supplier.flag}</span>
            <span>{product.supplier.country}</span>
            {Boolean((product.supplier as { verified?: boolean }).verified) && (
              <span className="text-[9px] text-amber-400 font-extrabold tracking-wider border-l border-amber-500/30 pl-1.5">
                ★ VERIFIED
              </span>
            )}
          </div>
        ) : discount > 0 ? (
          <Badge className="absolute top-2 left-2 border-danger/35 bg-danger/10 text-danger text-[10px] font-bold z-10">
            -{discount}%
          </Badge>
        ) : null}

        <Button
          variant="secondary"
          size="icon"
          aria-label={`Save ${product.title} to wishlist`}
          className="absolute top-2 right-2 opacity-0 transition-opacity group-hover:opacity-100 focus-visible:opacity-100 z-10 size-7 rounded-full bg-background/80 backdrop-blur"
          onClick={(e) => e.stopPropagation()}
        >
          <Heart className="size-3.5" />
        </Button>

        {/* Quick Add floating image cart button */}
        <button
          type="button"
          onClick={handleAddToCart}
          title="Quick add to cart"
          aria-label={`Add ${product.title} to cart`}
          className={cn(
            'absolute bottom-2.5 right-2.5 z-10 size-9 rounded-full shadow-lg flex items-center justify-center transition-all duration-200 cursor-pointer border border-white/20 active:scale-90',
            isAdded
              ? 'bg-emerald-600 text-white scale-110'
              : 'bg-[#FF6B00] hover:bg-[#E05E00] text-white hover:scale-110'
          )}
        >
          {isAdded ? (
            <Check className="size-4 stroke-[3]" />
          ) : (
            <ShoppingCart className="size-4 stroke-[2.5]" />
          )}
        </button>
      </div>

      <CardContent className="flex flex-col justify-between flex-1 gap-1.5 sm:gap-2 p-2.5 sm:p-3.5">
        <div className="flex flex-col gap-2">
          {onSelect ? (
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation()
                onSelect(product)
              }}
              className="text-left text-xs font-bold leading-snug text-pretty text-foreground group-hover:text-brand-500 transition-colors line-clamp-2"
            >
              {product.title}
            </button>
          ) : (
            <Link
              href={`/marketplace/${product.slug}`}
              className="text-xs font-bold leading-snug text-pretty text-foreground group-hover:text-brand-500 transition-colors line-clamp-2"
            >
              <span className="absolute inset-0" aria-hidden="true" />
              {product.title}
            </Link>
          )}

          <Rating value={product.rating} reviewCount={product.reviewCount} size="sm" />

          <div className="flex flex-wrap items-baseline gap-1.5 pt-0.5">
            <span className="text-sm font-extrabold tnum text-foreground">{formatTZS(product.fromPrice)}</span>
            {product.compareAtPrice ? (
              <span className="text-[11px] text-muted-foreground line-through tnum">
                {formatTZS(product.compareAtPrice)}
              </span>
            ) : null}
          </div>

          <div className="flex items-center gap-1.5 text-[11px] text-muted-foreground pt-0.5 border-t border-border/50">
            <Store aria-hidden="true" className="size-3 shrink-0 text-brand-500" strokeWidth={2} />
            <span className="truncate font-medium">{product.supplier.name}</span>
          </div>

          <div className="flex items-center justify-between gap-2 text-[11px]">
            <span className="text-muted-foreground font-medium">{product.soldCount.toLocaleString()} sold</span>
            {totalStock === 0 ? (
              <span className="font-bold text-danger">Out of stock</span>
            ) : lowStock ? (
              <span className="font-bold text-warning">{totalStock} left</span>
            ) : null}
          </div>
        </div>

        {/* Prominent Easy-to-click Add to Cart Button */}
        <Button
          size="sm"
          type="button"
          onClick={handleAddToCart}
          className={cn(
            'w-full mt-1 font-bold text-xs rounded-xl shadow-xs transition-all duration-200 cursor-pointer flex items-center justify-center gap-1.5 py-2 active:scale-[0.98]',
            isAdded
              ? 'bg-emerald-600 hover:bg-emerald-700 text-white shadow-emerald-500/20'
              : 'bg-[#FF6B00] hover:bg-[#E05E00] active:bg-[#C44F00] text-white shadow-orange-500/20 hover:shadow-md'
          )}
        >
          {isAdded ? (
            <>
              <Check className="size-3.5 stroke-[3]" />
              <span>Added to Cart!</span>
            </>
          ) : (
            <>
              <ShoppingCart className="size-3.5 stroke-[2.5]" />
              <span>Add to Cart</span>
            </>
          )}
        </Button>
      </CardContent>
    </Card>
  )
}

export function ProductCardSkeleton() {
  return (
    <Card className="gap-0 overflow-hidden py-0">
      <Skeleton className="aspect-square rounded-none" />
      <CardContent className="flex flex-col gap-2 p-3">
        <Skeleton className="h-4 w-full" />
        <Skeleton className="h-3 w-24" />
        <Skeleton className="h-5 w-28" />
        <Skeleton className="h-3 w-32" />
      </CardContent>
    </Card>
  )
}

