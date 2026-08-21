'use client'

import React from 'react'
import Image from 'next/image'
import Link from 'next/link'
import {
  Scale,
  ShoppingCart,
  Trash2,
  Store,
  ArrowRight,
  ExternalLink,
  ShieldCheck,
  CheckCircle2,
  XCircle,
  Plus,
} from 'lucide-react'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Rating } from '@/components/marketplace/rating'
import { formatTZS } from '@/lib/format'
import { toast } from 'sonner'
import { useCompareStore, type CompareItem } from '@/lib/stores/compare-store'
import { useCartStore } from '@/lib/stores/cart-store'

export default function ProductComparisonPage() {
  const items = useCompareStore((s) => s.items)
  const removeItem = useCompareStore((s) => s.removeItem)
  const clearCompare = useCompareStore((s) => s.clear)
  const addToCart = useCartStore((s) => s.add)

  function handleRemove(id: string, title: string) {
    removeItem(id)
    toast.success(`Removed "${title}" from comparison matrix.`)
  }

  function handleAddToCart(item: CompareItem) {
    addToCart({
      id: `var-compare-${item.id}`,
      productId: item.productId,
      slug: item.slug,
      title: item.title,
      variantLabel: 'Default',
      sku: `SKU-${item.id}`,
      image: item.image,
      unitPrice: item.priceTZS,
      stock: 100,
      quantity: 1,
    })
    toast.success(`"${item.title}" added to your shopping cart!`)
  }

  return (
    <div className="flex flex-col gap-6 font-sans antialiased text-foreground min-h-screen">
      {/* Top Banner */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-white dark:bg-slate-900 p-5 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xs">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-xl md:text-2xl font-extrabold tracking-tight flex items-center gap-2">
              <Scale className="size-6 text-amber-500" /> Product &amp; Supplier Comparison Matrix
            </h1>
            <Badge className="bg-amber-50 text-amber-600 dark:bg-amber-950/40 dark:text-amber-400 border-amber-200 dark:border-amber-800 text-[10px] font-bold">
              {items.length} / 4 Products
            </Badge>
          </div>
          <p className="text-xs text-muted-foreground mt-1">
            Compare MOQ price tiers, supplier ratings, warranty terms, and landed delivery estimates side-by-side.
          </p>
        </div>

        <div className="flex items-center gap-2">
          {items.length > 0 && (
            <Button
              variant="outline"
              size="sm"
              onClick={clearCompare}
              className="text-xs font-bold border-slate-200 dark:border-slate-700 hover:bg-red-50 text-red-600 dark:hover:bg-red-950/30"
            >
              Clear Matrix
            </Button>
          )}
          <Link href="/marketplace">
            <Button
              size="sm"
              className="bg-primary hover:bg-primary/80 text-white font-bold text-xs h-9 px-4 gap-2 rounded-xl shadow-xs"
            >
              <Store className="size-4" /> Browse Marketplace
            </Button>
          </Link>
        </div>
      </div>

      {items.length === 0 ? (
        <Card className="py-16 text-center bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 shadow-xs">
          <CardContent className="space-y-4 max-w-md mx-auto">
            <div className="size-16 rounded-full bg-amber-50 dark:bg-amber-950/30 text-amber-500 flex items-center justify-center mx-auto">
              <Scale className="size-8" />
            </div>
            <div>
              <h3 className="text-lg font-extrabold text-foreground">No products in comparison matrix</h3>
              <p className="text-xs text-muted-foreground mt-1 leading-relaxed">
                Click the <Scale className="size-3.5 inline text-amber-500 mx-0.5" /> button on any marketplace product card or detail page to view side-by-side pricing &amp; spec comparisons here.
              </p>
            </div>
            <Link href="/marketplace">
              <Button className="bg-primary hover:bg-primary/80 text-white font-bold text-xs rounded-xl shadow-md gap-2 mt-2 px-5">
                Explore B2B Marketplace <ArrowRight className="size-4" />
              </Button>
            </Link>
          </CardContent>
        </Card>
      ) : (
        <div className="overflow-x-auto rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-xs">
          <table className="w-full text-left border-collapse min-w-[700px]">
            <thead>
              <tr className="border-b border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/50">
                <th className="p-4 w-48 text-xs font-bold text-muted-foreground uppercase tracking-wider">
                  Product Attributes
                </th>
                {items.map((item) => (
                  <th key={item.id} className="p-4 w-64 min-w-[220px] vertical-top border-l border-slate-200 dark:border-slate-800">
                    <div className="flex flex-col gap-2 relative">
                      <button
                        type="button"
                        onClick={() => handleRemove(item.id, item.title)}
                        className="absolute -top-1 -right-1 size-7 rounded-full bg-slate-200 dark:bg-slate-700 hover:bg-red-600 hover:text-white text-muted-foreground flex items-center justify-center transition-colors"
                        title="Remove from comparison"
                      >
                        <Trash2 className="size-3.5" />
                      </button>

                      <div className="relative aspect-square w-full rounded-xl overflow-hidden bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700">
                        <Image src={item.image} alt={item.title} fill className="object-cover" />
                      </div>

                      <Link
                        href={`/marketplace/${item.slug}`}
                        className="text-xs font-extrabold text-foreground hover:text-brand-500 transition-colors line-clamp-2 mt-1 flex items-center gap-1"
                      >
                        <span>{item.title}</span>
                        <ExternalLink className="size-3 shrink-0" />
                      </Link>

                      <div className="text-base font-mono font-black text-brand-500">
                        {formatTZS(item.priceTZS)}
                      </div>

                      <Button
                        size="sm"
                        onClick={() => handleAddToCart(item)}
                        disabled={!item.inStock}
                        className="w-full bg-primary hover:bg-primary/80 text-white font-bold text-xs rounded-xl shadow-xs mt-1"
                      >
                        <ShoppingCart className="size-3.5 mr-1" /> Add to Cart
                      </Button>
                    </div>
                  </th>
                ))}
                {items.length < 4 && (
                  <th className="p-4 w-56 text-center border-l border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900/30">
                    <Link href="/marketplace" className="flex flex-col items-center justify-center gap-2 p-6 rounded-xl border-2 border-dashed border-slate-300 dark:border-slate-700 hover:border-brand-500 transition-colors group">
                      <div className="size-10 rounded-full bg-slate-100 dark:bg-slate-800 group-hover:bg-brand-500/10 text-slate-500 group-hover:text-brand-500 flex items-center justify-center transition-colors">
                        <Plus className="size-5" />
                      </div>
                      <span className="text-xs font-bold text-muted-foreground group-hover:text-foreground">
                        Add Another Product
                      </span>
                    </Link>
                  </th>
                )}
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200 dark:divide-slate-800 text-xs">
              {/* Supplier Info */}
              <tr>
                <td className="p-4 font-bold text-muted-foreground bg-slate-50/40 dark:bg-slate-800/20">
                  Supplier / Vendor
                </td>
                {items.map((item) => (
                  <td key={item.id} className="p-4 border-l border-slate-200 dark:border-slate-800 font-medium">
                    <div className="flex flex-col gap-1">
                      <span className="font-bold text-foreground">{item.supplierName || 'Verified Supplier'}</span>
                      <span className="text-muted-foreground flex items-center gap-1 text-[11px]">
                        {item.supplierFlag || '🇨🇳'} {item.supplierCountry || 'China'}
                        {item.supplierVerified && (
                          <span className="text-amber-500 font-extrabold text-[10px]">★ VERIFIED</span>
                        )}
                      </span>
                    </div>
                  </td>
                ))}
              </tr>

              {/* Rating */}
              <tr>
                <td className="p-4 font-bold text-muted-foreground bg-slate-50/40 dark:bg-slate-800/20">
                  Rating &amp; Reviews
                </td>
                {items.map((item) => (
                  <td key={item.id} className="p-4 border-l border-slate-200 dark:border-slate-800">
                    <Rating value={item.rating} reviewCount={item.reviewCount} size="sm" />
                  </td>
                ))}
              </tr>

              {/* MOQ */}
              <tr>
                <td className="p-4 font-bold text-muted-foreground bg-slate-50/40 dark:bg-slate-800/20">
                  Min. Order (MOQ)
                </td>
                {items.map((item) => (
                  <td key={item.id} className="p-4 border-l border-slate-200 dark:border-slate-800 font-bold">
                    {item.moq || '1 Unit'}
                  </td>
                ))}
              </tr>

              {/* Stock Availability */}
              <tr>
                <td className="p-4 font-bold text-muted-foreground bg-slate-50/40 dark:bg-slate-800/20">
                  Stock Status
                </td>
                {items.map((item) => (
                  <td key={item.id} className="p-4 border-l border-slate-200 dark:border-slate-800">
                    {item.inStock ? (
                      <span className="inline-flex items-center gap-1 text-emerald-600 dark:text-emerald-400 font-bold">
                        <CheckCircle2 className="size-3.5" /> In Stock
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1 text-slate-500 font-bold">
                        <XCircle className="size-3.5" /> Out of Stock
                      </span>
                    )}
                  </td>
                ))}
              </tr>

              {/* Warranty */}
              <tr>
                <td className="p-4 font-bold text-muted-foreground bg-slate-50/40 dark:bg-slate-800/20">
                  Warranty &amp; Terms
                </td>
                {items.map((item) => (
                  <td key={item.id} className="p-4 border-l border-slate-200 dark:border-slate-800 font-medium">
                    {item.warranty || '12 Months Factory Warranty'}
                  </td>
                ))}
              </tr>

              {/* Lead Time */}
              <tr>
                <td className="p-4 font-bold text-muted-foreground bg-slate-50/40 dark:bg-slate-800/20">
                  Landed Lead Time
                </td>
                {items.map((item) => (
                  <td key={item.id} className="p-4 border-l border-slate-200 dark:border-slate-800 font-medium">
                    {item.leadTime || '5-8 Business Days'}
                  </td>
                ))}
              </tr>

              {/* Marketplace Quick Link */}
              <tr>
                <td className="p-4 font-bold text-muted-foreground bg-slate-50/40 dark:bg-slate-800/20">
                  Marketplace Link
                </td>
                {items.map((item) => (
                  <td key={item.id} className="p-4 border-l border-slate-200 dark:border-slate-800">
                    <Link href={`/marketplace/${item.slug}`}>
                      <Button variant="outline" size="sm" className="w-full text-xs font-bold border-slate-200 dark:border-slate-700">
                        View Product <ExternalLink className="size-3 ml-1" />
                      </Button>
                    </Link>
                  </td>
                ))}
              </tr>
            </tbody>
          </table>
        </div>
      )}
    </div>
  )
}
