'use client'

import { useMemo, useState } from 'react'
import Image from 'next/image'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import {
  BadgeCheck,
  ChevronRight,
  Clock,
  ExternalLink,
  Heart,
  MessageSquare,
  Minus,
  Plus,
  RotateCcw,
  ShieldCheck,
  ShoppingCart,
  Sparkles,
  Store,
  Truck,
  Zap,
} from 'lucide-react'
import { toast } from 'sonner'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Skeleton } from '@/components/ui/skeleton'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import {
  Table,
  TableBody,
  TableCell,
  TableRow,
} from '@/components/ui/table'
import { Rating } from '@/components/marketplace/rating'
import { useProduct, usePriceTiers, useRecommendedProducts } from '@/lib/api/hooks'
import { CATEGORIES, defaultSelection, findVariant, variantLabel } from '@/lib/mock/products'
import { formatDate, formatTZS } from '@/lib/format'
import { useCartStore } from '@/lib/stores/cart-store'
import { useSessionStore } from '@/lib/stores/session-store'
import { AuthRequiredModal } from '@/components/auth/auth-required-modal'
import { cn } from '@/lib/utils'

export function ProductDetail({
  slug,
  isModal = false,
}: {
  slug: string
  isModal?: boolean
}) {
  const router = useRouter()
  const user = useSessionStore((state) => state.user)
  const { data: product, isLoading } = useProduct(slug)
  const { data: dbTiers } = usePriceTiers(product?.id)
  const addToCart = useCartStore((state) => state.add)

  const [selection, setSelection] = useState<Record<string, string> | null>(null)
  const [quantity, setQuantity] = useState(1)
  const [activeImage, setActiveImage] = useState(0)
  const [showAuthModal, setShowAuthModal] = useState(false)

  const effectiveSelection = useMemo(
    () => selection ?? (product ? defaultSelection(product) : {}),
    [selection, product],
  )
  const variant = product ? findVariant(product, effectiveSelection) : undefined

  const basePrice = variant?.price ?? product?.fromPrice ?? 0
  const stock = variant?.stock ?? 0

  const activeUnitPrice = useMemo(() => {
    if (dbTiers && dbTiers.length > 0) {
      const matched = dbTiers
        .filter((t) => t.minQuantity <= quantity && (!t.maxQuantity || quantity <= t.maxQuantity))
        .pop()
      if (matched) return matched.unitPrice
    }
    const tier1Price = basePrice
    const tier2Price = Math.round(basePrice * 0.95)
    const tier3Price = Math.round(basePrice * 0.90)
    return quantity >= 50 ? tier3Price : quantity >= 10 ? tier2Price : tier1Price
  }, [dbTiers, quantity, basePrice])

  const displayTiers = useMemo(() => {
    if (dbTiers && dbTiers.length > 0) {
      return dbTiers.map((t) => ({
        min: t.minQuantity,
        max: t.maxQuantity,
        price: t.unitPrice,
        label: t.maxQuantity ? `${t.minQuantity}–${t.maxQuantity} pcs` : `≥ ${t.minQuantity} pcs`,
      }))
    }
    const t1 = basePrice
    const t2 = Math.round(basePrice * 0.95)
    const t3 = Math.round(basePrice * 0.90)
    return [
      { min: 1, max: 9, price: t1, label: '1–9 pcs' },
      { min: 10, max: 49, price: t2, label: '10–49 pcs' },
      { min: 50, max: null, price: t3, label: '≥ 50 pcs' },
    ]
  }, [dbTiers, basePrice])

  if (isLoading) return <ProductDetailSkeleton isModal={isModal} />

  if (!product) {
    return (
      <Card>
        <CardContent className="flex flex-col items-center gap-3 py-12 text-center">
          <p className="font-medium">This product is no longer listed.</p>
          <Button variant="outline" render={<Link href="/marketplace">Back to marketplace</Link>} />
        </CardContent>
      </Card>
    )
  }

  const image = product.images[activeImage] ?? product.images[0]
  const maxQuantity = Math.max(1, Math.min(stock, 50))

  const categoryName =
    CATEGORIES.find((c) => c.id === product.categoryId)?.name ?? product.categoryId

  const calculatedShippingFee = Math.round(15000 + quantity * 2500)

  function chooseOption(attribute: string, option: string) {
    const next = { ...effectiveSelection, [attribute]: option }
    setSelection(next)
    const nextVariant = findVariant(product!, next)
    if (nextVariant) setActiveImage(nextVariant.imageIndex)
  }

  function handleAddToCart(thenCheckout = false, e?: React.MouseEvent) {
    if (!variant || stock === 0) return
    const imageUrl = product!.images[variant.imageIndex]?.url ?? product!.images[0]?.url

    if (!thenCheckout && e) {
      const rect = (e.currentTarget as HTMLElement).getBoundingClientRect()
      window.dispatchEvent(
        new CustomEvent('lumo_cart_item_added', {
          detail: {
            imageUrl,
            startX: rect.left + rect.width / 2,
            startY: rect.top + rect.height / 2,
          },
        }),
      )
    }

    addToCart({
      id: variant.id,
      productId: product!.id,
      slug: product!.slug,
      title: product!.title,
      variantLabel: variantLabel(variant),
      sku: variant.sku,
      image: imageUrl,
      unitPrice: activeUnitPrice,
      stock: variant.stock,
      quantity,
    })
    if (thenCheckout) {
      if (!user) {
        setShowAuthModal(true)
        return
      }
      router.push('/checkout')
      return
    }
    toast.success('Added to cart', {
      description: `${quantity} × ${product!.title}`,
      action: { label: 'View cart', onClick: () => router.push('/cart') },
    })
  }

  // Country Flag helper
  const countryFlag =
    product.supplier.country === 'China'
      ? '🇨🇳'
      : product.supplier.country === 'UAE'
        ? '🇦🇪'
        : product.supplier.country === 'Turkey'
          ? '🇹🇷'
          : '🇹🇿'

  return (
    <div className="flex flex-col gap-5 text-foreground antialiased">
      {/* Category Breadcrumb (Only on full page) */}
      {!isModal && (
        <nav className="flex items-center gap-1.5 text-xs text-muted-foreground">
          <Link href="/" className="hover:text-primary transition-colors">
            Home
          </Link>
          <ChevronRight className="size-3.5" />
          <Link href="/marketplace" className="hover:text-primary transition-colors">
            Global Marketplace
          </Link>
          <ChevronRight className="size-3.5" />
          <span className="font-semibold text-foreground truncate max-w-[200px] sm:max-w-none">
            {categoryName}
          </span>
        </nav>
      )}

      {/* Grid Layout: 2-column for Modal, 3-column for Full Page */}
      <div
        className={cn(
          'grid gap-6',
          isModal
            ? 'grid-cols-1 md:grid-cols-2 items-start'
            : 'grid-cols-1 lg:grid-cols-[340px_1fr_320px] xl:grid-cols-[380px_1fr_340px]',
        )}
      >
        {/* Column 1: Left Gallery & Supplier Card */}
        <div className="flex flex-col gap-4">
          <div className="flex flex-col gap-3 sm:flex-row-reverse sm:items-start">
            {/* Main Preview Image */}
            <div className="relative aspect-square w-full overflow-hidden rounded-xl border bg-muted group">
              <Image
                src={image.url}
                alt={image.alt}
                fill
                sizes="(min-width: 1024px) 380px, 100vw"
                className="object-cover transition-transform duration-300 group-hover:scale-105"
                priority
              />
              <button
                type="button"
                className="absolute top-3 right-3 rounded-full bg-background/80 p-2 text-foreground shadow-sm backdrop-blur hover:bg-background transition-colors"
                aria-label="Save to wishlist"
              >
                <Heart className="size-4" />
              </button>
            </div>

            {/* Thumbnail List */}
            <ul className="flex gap-2 sm:flex-col shrink-0" role="list">
              {product.images.map((item, index) => (
                <li key={item.url}>
                  <button
                    type="button"
                    onClick={() => setActiveImage(index)}
                    className={cn(
                      'relative size-12 sm:size-14 overflow-hidden rounded-lg border-2 transition-all',
                      index === activeImage
                        ? 'border-primary ring-2 ring-primary/20'
                        : 'border-transparent hover:border-border',
                    )}
                  >
                    <Image src={item.url} alt="" fill sizes="56px" className="object-cover" />
                  </button>
                </li>
              ))}
            </ul>
          </div>

          {/* Supplier Business Card */}
          <Card className="border shadow-xs bg-muted/30">
            <CardContent className="p-3.5 flex flex-col gap-2.5 text-xs">
              <div className="flex items-center justify-between gap-2 border-b pb-2.5">
                <div className="flex items-center gap-2 min-w-0">
                  <div className="rounded-md bg-primary-100 dark:bg-primary-950 p-2 text-primary shrink-0">
                    <Store className="size-4" />
                  </div>
                  <div className="flex flex-col min-w-0">
                    <span className="font-bold text-xs sm:text-sm truncate">{product.supplier.name}</span>
                    <span className="text-muted-foreground flex items-center gap-1 font-medium text-[11px]">
                      {product.supplier.country} {countryFlag} · Verified Supplier
                    </span>
                  </div>
                </div>
                <Badge variant="outline" className="text-[10px] uppercase font-bold shrink-0">
                  1yr
                </Badge>
              </div>

              <div className="grid grid-cols-2 gap-2 text-center pt-0.5">
                <div className="p-1.5 rounded-lg bg-background border flex flex-col gap-0.5">
                  <span className="font-bold text-foreground">≤ 8h</span>
                  <span className="text-[10px] text-muted-foreground font-medium">Response Time</span>
                </div>
                <div className="p-1.5 rounded-lg bg-background border flex flex-col gap-0.5">
                  <span className="font-bold text-emerald-600 dark:text-emerald-400">99.4%</span>
                  <span className="text-[10px] text-muted-foreground font-medium">On-Time Dispatch</span>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Key Specifications summary box */}
          <div className="rounded-xl border bg-muted/20 p-3.5 flex flex-col gap-2">
            <span className="text-xs font-bold text-foreground">Key Attributes</span>
            <div className="grid grid-cols-2 gap-2 text-xs">
              <div className="flex flex-col gap-0.5">
                <span className="text-muted-foreground text-[10px]">Brand</span>
                <span className="font-semibold text-xs truncate">{product.brand}</span>
              </div>
              <div className="flex flex-col gap-0.5">
                <span className="text-muted-foreground text-[10px]">Origin</span>
                <span className="font-semibold text-xs">{product.supplier.country} {countryFlag}</span>
              </div>
              <div className="flex flex-col gap-0.5">
                <span className="text-muted-foreground text-[10px]">Logistics</span>
                <span className="font-semibold text-xs">Air / Sea Cargo</span>
              </div>
              <div className="flex flex-col gap-0.5">
                <span className="text-muted-foreground text-[10px]">Protection</span>
                <span className="font-semibold text-xs text-emerald-600 dark:text-emerald-400">AzamPay Protected</span>
              </div>
            </div>
          </div>
        </div>

        {/* Column 2: Center Details in Modal OR 3-Column in Full Page */}
        <div className="flex flex-col gap-4">
          <div className="flex flex-col gap-1.5">
            <div className="flex items-center gap-2">
              <Badge variant="secondary" className="text-[10px] uppercase font-bold">
                {categoryName}
              </Badge>
              <span className="text-xs text-muted-foreground">•</span>
              <span className="text-xs font-semibold text-muted-foreground">
                {product.soldCount.toLocaleString()} sold
              </span>
            </div>

            <h1 className="text-lg font-bold tracking-tight sm:text-xl leading-snug">
              {product.title}
            </h1>

            <div className="flex items-center gap-2 text-xs pt-0.5">
              <Rating value={product.rating} reviewCount={product.reviewCount} size="sm" />
            </div>
          </div>

          {/* Wholesale Tiered Pricing Table */}
          <div className="rounded-xl border bg-card p-3 shadow-xs">
            <div className="text-[11px] font-bold text-muted-foreground uppercase tracking-wider mb-2">
              Wholesale Tiered Pricing (TZS)
            </div>
            <div className="grid grid-cols-3 gap-2 text-center">
              {displayTiers.map((tier, idx) => {
                const isSelected =
                  quantity >= tier.min && (tier.max === null || tier.max === undefined || quantity <= tier.max)
                return (
                  <button
                    key={idx}
                    type="button"
                    onClick={() => setQuantity(tier.min)}
                    className={cn(
                      'p-2 rounded-lg border flex flex-col items-center justify-center gap-0.5 transition-all cursor-pointer hover:border-primary/60',
                      isSelected
                        ? 'border-primary bg-primary/5 ring-2 ring-primary/30 shadow-xs'
                        : 'bg-muted/30',
                    )}
                  >
                    <span className="text-[9px] text-muted-foreground font-bold uppercase">TZS</span>
                    <span className="text-xs sm:text-sm font-extrabold text-foreground leading-none">
                      {tier.price.toLocaleString()}
                    </span>
                    <span className="text-[10px] text-muted-foreground font-medium mt-0.5">{tier.label}</span>
                  </button>
                )
              })}
            </div>
          </div>

          {/* Variant Attribute Pickers */}
          <div className="flex flex-col gap-3">
            {product.attributes.map((attribute) => (
              <fieldset key={attribute.name} className="flex flex-col gap-1.5">
                <legend className="text-xs font-bold text-foreground">
                  {attribute.name}:{' '}
                  <span className="font-normal text-muted-foreground">
                    {effectiveSelection[attribute.name]}
                  </span>
                </legend>
                <div className="flex flex-wrap gap-1.5">
                  {attribute.options.map((option) => {
                    const isSelected = effectiveSelection[attribute.name] === option
                    const candidate = findVariant(product, {
                      ...effectiveSelection,
                      [attribute.name]: option,
                    })
                    const unavailable = !candidate || candidate.stock === 0
                    return (
                      <Button
                        key={option}
                        type="button"
                        size="sm"
                        variant={isSelected ? 'default' : 'outline'}
                        onClick={() => chooseOption(attribute.name, option)}
                        className={cn(
                          'text-xs font-semibold h-8 px-3',
                          unavailable && 'line-through opacity-50',
                        )}
                      >
                        {option}
                      </Button>
                    )
                  })}
                </div>
              </fieldset>
            ))}

            {/* Quantity Counter */}
            <div className="flex flex-col gap-1.5 pt-1">
              <span className="text-xs font-bold text-foreground">Quantity</span>
              <div className="flex items-center gap-3">
                <div className="flex items-center rounded-lg border bg-card">
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon-sm"
                    disabled={quantity <= 1}
                    onClick={() => setQuantity((v) => Math.max(1, v - 1))}
                  >
                    <Minus className="size-3.5" />
                  </Button>
                  <span className="w-10 text-center text-sm font-bold tabular-nums">
                    {quantity}
                  </span>
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon-sm"
                    disabled={quantity >= maxQuantity}
                    onClick={() => setQuantity((v) => Math.min(maxQuantity, v + 1))}
                  >
                    <Plus className="size-3.5" />
                  </Button>
                </div>
                <span className="text-xs text-muted-foreground font-medium">
                  {stock === 0 ? 'Out of stock' : `${stock} pcs available in factory`}
                </span>
              </div>
            </div>
          </div>

          {/* Freight & Delivery summary box */}
          <Card className="border shadow-xs bg-muted/20">
            <CardContent className="p-3 flex flex-col gap-1.5 text-xs">
              <div className="flex items-center justify-between font-bold text-foreground">
                <span className="flex items-center gap-1.5">
                  <Truck className="size-4 text-primary" />
                  Freight &amp; Delivery
                </span>
                <span className="text-muted-foreground font-normal">Est. 5–8 days</span>
              </div>
              <p className="text-muted-foreground leading-normal">
                Air Freight fee: <span className="font-bold text-foreground">{formatTZS(calculatedShippingFee)}</span> to Tanzania. Customs cleared.
              </p>
            </CardContent>
          </Card>

          {/* Trade Assurance Badge */}
          <div className="rounded-lg border border-emerald-500/20 bg-emerald-50/50 dark:bg-emerald-950/20 p-2.5 flex items-center gap-2 text-xs">
            <ShieldCheck className="size-4 text-emerald-600 dark:text-emerald-400 shrink-0" />
            <span className="text-emerald-900/90 dark:text-emerald-200/90 text-[11px]">
              <strong>Lumo Trade Assurance:</strong> AzamPay Buyer Protection &amp; Money-back inspection guarantee.
            </span>
          </div>

          {/* Action Order Buttons */}
          <div className="flex flex-col gap-2 pt-1">
            <Button
              size="lg"
              className="w-full bg-orange-600 hover:bg-orange-700 text-white font-bold text-sm shadow-md h-11"
              disabled={stock === 0}
              onClick={() => handleAddToCart(true)}
            >
              <Zap className="size-4 mr-1" />
              Start Order ({formatTZS(activeUnitPrice * quantity)})
            </Button>

            <div className="grid grid-cols-2 gap-2">
              <Button
                size="default"
                variant="outline"
                className="w-full font-bold text-xs border-primary/30 text-primary hover:bg-primary/5 h-10"
                disabled={stock === 0}
                onClick={(e) => handleAddToCart(false, e)}
              >
                <ShoppingCart className="size-3.5 mr-1" />
                Add to Cart
              </Button>

              <Button
                size="default"
                variant="secondary"
                className="w-full font-semibold text-xs text-muted-foreground h-10"
                onClick={() => toast.info(`Opened chat inquiry with ${product.supplier.name}`)}
              >
                <MessageSquare className="size-3.5 mr-1" />
                Chat Supplier
              </Button>
            </div>
          </div>

          {/* If inside Modal: Direct Link to Full Product Page */}
          {isModal && (
            <div className="pt-2 border-t text-center">
              <Link
                href={`/marketplace/${product.slug}`}
                className="inline-flex items-center gap-1.5 text-xs font-semibold text-primary hover:underline"
              >
                <span>View Full Specifications, Customer Reviews &amp; Ratings</span>
                <ExternalLink className="size-3.5" />
              </Link>
            </div>
          )}
        </div>

        {/* Column 3 (Only in Full Page Mode): Right Alibaba Sidebar */}
        {!isModal && (
          <div className="flex flex-col gap-4">
            <Card className="border shadow-xs">
              <CardContent className="p-4 flex flex-col gap-3 text-xs">
                <div className="flex items-center justify-between font-bold text-foreground border-b pb-2">
                  <span className="flex items-center gap-1.5">
                    <Truck className="size-4 text-primary" />
                    Freight &amp; Delivery
                  </span>
                  <span className="text-primary cursor-pointer hover:underline">Calculate</span>
                </div>

                <div className="flex flex-col gap-1">
                  <span className="font-semibold text-foreground">
                    Standard Lumo / Baraka Air Freight
                  </span>
                  <span className="text-muted-foreground leading-relaxed">
                    Shipping fee: <span className="font-bold text-foreground">{formatTZS(calculatedShippingFee)}</span> for {quantity} pcs
                  </span>
                  <span className="text-muted-foreground">
                    Est. Delivery: <span className="font-bold text-foreground">5–8 working days</span> to Dar es Salaam, Arusha &amp; Dodoma.
                  </span>
                </div>
              </CardContent>
            </Card>

            <Card className="border shadow-xs bg-emerald-50/50 dark:bg-emerald-950/20 border-emerald-500/20">
              <CardContent className="p-4 flex flex-col gap-3 text-xs">
                <div className="flex items-center gap-2 font-bold text-emerald-800 dark:text-emerald-300">
                  <ShieldCheck className="size-4 text-emerald-600 dark:text-emerald-400" />
                  <span>Lumo Trade Assurance</span>
                </div>

                <div className="flex flex-col gap-2 text-emerald-900/80 dark:text-emerald-200/80">
                  <div className="flex items-start gap-2">
                    <BadgeCheck className="size-3.5 text-emerald-600 shrink-0 mt-0.5" />
                    <span><strong>Secure Payments:</strong> AzamPay, M-Pesa, Mix by Yas, Airtel Money &amp; Bank.</span>
                  </div>
                  <div className="flex items-start gap-2">
                    <RotateCcw className="size-3.5 text-emerald-600 shrink-0 mt-0.5" />
                    <span><strong>Money-Back Protection:</strong> Full refund if goods fail inspection upon arrival in Tanzania.</span>
                  </div>
                </div>
              </CardContent>
            </Card>

            <div className="flex flex-col gap-2.5 pt-1">
              <Button
                size="lg"
                className="w-full bg-orange-600 hover:bg-orange-700 text-white font-bold text-sm shadow-md"
                disabled={stock === 0}
                onClick={() => handleAddToCart(true)}
              >
                <Zap className="size-4 mr-1" />
                Start Order ({formatTZS(activeUnitPrice * quantity)})
              </Button>

              <Button
                size="lg"
                variant="outline"
                className="w-full font-bold text-sm border-primary/30 text-primary hover:bg-primary/5"
                disabled={stock === 0}
                onClick={(e) => handleAddToCart(false, e)}
              >
                <ShoppingCart className="size-4 mr-1" />
                Add to Cart
              </Button>

              <Button
                size="lg"
                variant="secondary"
                className="w-full font-semibold text-xs text-muted-foreground"
                onClick={() => toast.info(`Opened chat inquiry with ${product.supplier.name}`)}
              >
                <MessageSquare className="size-4 mr-1" />
                Chat Now with Supplier
              </Button>
            </div>
          </div>
        )}
      </div>

      {/* Tabs Section: Description, Specifications, Reviews (Full Page Only) */}
      {!isModal && (
        <Tabs defaultValue="description" className="mt-4">
          <TabsList>
            <TabsTrigger value="description">Product Overview</TabsTrigger>
            <TabsTrigger value="specifications">Full Specifications</TabsTrigger>
            <TabsTrigger value="reviews">Customer Reviews ({product.reviews.length})</TabsTrigger>
          </TabsList>

          <TabsContent value="description">
            <Card>
              <CardContent className="p-6">
                <p className="max-w-4xl text-sm leading-relaxed whitespace-pre-line text-muted-foreground">
                  {product.description}
                </p>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="specifications">
            <Card className="py-0">
              <CardContent className="px-0">
                <Table>
                  <TableBody>
                    {product.specifications.map((spec) => (
                      <TableRow key={spec.label}>
                        <TableCell className="w-48 font-semibold">{spec.label}</TableCell>
                        <TableCell className="text-muted-foreground">{spec.value}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="reviews">
            <div className="flex flex-col gap-3">
              {product.reviews.map((review) => (
                <Card key={review.id}>
                  <CardContent className="p-4 flex flex-col gap-2">
                    <div className="flex flex-wrap items-center justify-between gap-2">
                      <div className="flex items-center gap-2">
                        <span className="text-sm font-semibold">{review.author}</span>
                        {review.verifiedPurchase && (
                          <Badge variant="secondary" className="gap-1 text-[10px]">
                            <BadgeCheck className="size-3" />
                            Verified purchase
                          </Badge>
                        )}
                      </div>
                      <span className="text-xs text-muted-foreground">
                        {formatDate(review.createdAt)}
                      </span>
                    </div>
                    <Rating value={review.rating} />
                    <p className="text-sm font-bold">{review.title}</p>
                    <p className="text-sm leading-relaxed text-muted-foreground">{review.body}</p>
                  </CardContent>
                </Card>
              ))}
            </div>
          </TabsContent>
        </Tabs>
      )}

      <AuthRequiredModal
        open={showAuthModal}
        onOpenChange={setShowAuthModal}
        title="Sign In Required to Start Order"
        description="Please sign in or create an account to start your direct factory order and proceed to checkout."
        redirectUrl="/checkout"
      />
    </div>
  )
}

function ProductDetailSkeleton({ isModal = false }: { isModal?: boolean }) {
  return (
    <div
      className={cn(
        'grid gap-6',
        isModal
          ? 'grid-cols-1 md:grid-cols-2'
          : 'grid-cols-1 lg:grid-cols-[340px_1fr_320px]',
      )}
    >
      <Skeleton className="aspect-square w-full rounded-xl" />
      <div className="flex flex-col gap-4">
        <Skeleton className="h-6 w-3/4" />
        <Skeleton className="h-4 w-32" />
        <Skeleton className="h-20 w-full" />
        <Skeleton className="h-24 w-full" />
      </div>
      {!isModal && <Skeleton className="h-64 w-full rounded-xl" />}
    </div>
  )
}
