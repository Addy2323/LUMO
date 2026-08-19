'use client'

import Link from 'next/link'
import Image from 'next/image'
import { Heart, ShoppingCart, Trash2, Bell, Store, ArrowRight, ExternalLink } from 'lucide-react'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { formatTZS } from '@/lib/format'
import { toast } from 'sonner'
import { useWishlistStore, type WishlistItem } from '@/lib/stores/wishlist-store'
import { useCartStore } from '@/lib/stores/cart-store'

export default function CustomerWishlistPage() {
  const items = useWishlistStore((s) => s.items)
  const removeItem = useWishlistStore((s) => s.removeItem)
  const toggleNotify = useWishlistStore((s) => s.toggleNotify)
  const clearWishlist = useWishlistStore((s) => s.clear)
  const addToCart = useCartStore((s) => s.add)

  function handleRemove(id: string, title: string) {
    removeItem(id)
    toast.success(`Removed "${title}" from wishlist!`)
  }

  function handleToggleNotify(id: string) {
    toggleNotify(id)
    toast.success('Price drop notification preference updated!')
  }

  function handleAddToCart(item: WishlistItem) {
    addToCart({
      id: `var-wishlist-${item.id}`,
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
    <div className="flex flex-col gap-6 font-sans antialiased text-foreground">
      {/* Header Banner */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-white dark:bg-slate-900 p-5 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xs">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-xl md:text-2xl font-extrabold tracking-tight flex items-center gap-2">
              <Heart className="size-6 text-red-500 fill-red-500" /> Saved Items &amp; Wishlist
            </h1>
            <Badge className="bg-red-50 text-red-600 border-red-200 text-[10px] font-bold">
              {items.length} {items.length === 1 ? 'Item' : 'Items'} Saved
            </Badge>
          </div>
          <p className="text-xs text-muted-foreground mt-1">
            Manage your saved B2B products, monitor price drops, and move items directly to cart or explore the marketplace.
          </p>
        </div>

        <div className="flex items-center gap-2">
          {items.length > 0 && (
            <Button
              variant="outline"
              size="sm"
              onClick={clearWishlist}
              className="text-xs font-bold border-slate-200 dark:border-slate-700 hover:bg-red-50 text-red-600 dark:hover:bg-red-950/30"
            >
              Clear All
            </Button>
          )}
          <Link href="/marketplace">
            <Button
              size="sm"
              className="bg-[#FF6B00] hover:bg-[#E05E00] text-white font-bold text-xs h-9 px-4 gap-2 rounded-xl shadow-xs"
            >
              <Store className="size-4" /> Browse Marketplace
            </Button>
          </Link>
        </div>
      </div>

      {items.length === 0 ? (
        <Card className="py-16 text-center bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 shadow-xs">
          <CardContent className="space-y-4 max-w-md mx-auto">
            <div className="size-16 rounded-full bg-red-50 dark:bg-red-950/30 text-red-500 flex items-center justify-center mx-auto">
              <Heart className="size-8" />
            </div>
            <div>
              <h3 className="text-lg font-extrabold text-foreground">Your wishlist is empty</h3>
              <p className="text-xs text-muted-foreground mt-1 leading-relaxed">
                Save products while browsing the marketplace to compare prices, get price alerts, and order whenever you are ready.
              </p>
            </div>
            <Link href="/marketplace">
              <Button className="bg-[#FF6B00] hover:bg-[#E05E00] text-white font-bold text-xs rounded-xl shadow-md gap-2 mt-2 px-5">
                Explore Marketplace <ArrowRight className="size-4" />
              </Button>
            </Link>
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {items.map((item) => (
            <Card key={item.id} className="flex flex-col justify-between overflow-hidden group bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 shadow-xs hover:shadow-md transition-shadow">
              <div className="relative aspect-square w-full bg-slate-100 dark:bg-slate-800 overflow-hidden">
                <Image
                  src={item.image}
                  alt={item.title}
                  fill
                  className="object-cover group-hover:scale-105 transition-transform duration-300"
                />
                <button
                  type="button"
                  onClick={() => handleRemove(item.id, item.title)}
                  className="absolute top-2.5 right-2.5 size-8 rounded-full bg-black/60 hover:bg-red-600 text-white flex items-center justify-center transition-colors z-10"
                  title="Remove from wishlist"
                >
                  <Trash2 className="size-4" />
                </button>

                <div className="absolute bottom-2.5 left-2.5 z-10">
                  <Badge
                    className={`text-[10px] font-bold ${
                      item.inStock ? 'bg-emerald-600 text-white' : 'bg-slate-600 text-white'
                    }`}
                  >
                    {item.inStock ? 'In Factory Stock' : 'Out of Stock'}
                  </Badge>
                </div>
              </div>

              <CardContent className="p-4 space-y-3 flex-1 flex flex-col justify-between">
                <div>
                  <Link
                    href={`/marketplace/${item.slug}`}
                    className="text-sm font-extrabold text-foreground group-hover:text-brand-500 transition-colors line-clamp-2 flex items-center gap-1"
                  >
                    <span>{item.title}</span>
                    <ExternalLink className="size-3.5 opacity-0 group-hover:opacity-100 shrink-0 transition-opacity" />
                  </Link>

                  {item.supplierName && (
                    <p className="text-[11px] text-muted-foreground font-medium mt-1">
                      Supplier: <span className="font-semibold text-foreground">{item.supplierName}</span>
                    </p>
                  )}

                  <p className="text-lg font-mono font-black text-brand-500 mt-1.5">
                    {formatTZS(item.priceTZS)}
                  </p>
                </div>

                <div className="space-y-2.5 pt-3 border-t border-slate-100 dark:border-slate-800">
                  <button
                    type="button"
                    onClick={() => handleToggleNotify(item.id)}
                    className="flex items-center justify-between w-full text-xs text-muted-foreground hover:text-foreground transition-colors p-1.5 rounded-lg bg-slate-50 dark:bg-slate-800/60"
                  >
                    <span className="flex items-center gap-1.5 font-medium">
                      <Bell className={`size-3.5 ${item.notifyOnPriceDrop ? 'text-amber-500 fill-amber-500' : ''}`} />
                      Price Drop Alerts
                    </span>
                    <span className="font-bold text-[10px] font-mono px-1.5 py-0.5 rounded bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700">
                      {item.notifyOnPriceDrop ? 'ENABLED' : 'DISABLED'}
                    </span>
                  </button>

                  <div className="grid grid-cols-2 gap-2">
                    <Link href={`/marketplace/${item.slug}`}>
                      <Button
                        variant="outline"
                        size="sm"
                        className="w-full text-xs font-bold border-slate-200 dark:border-slate-700"
                      >
                        View Details
                      </Button>
                    </Link>

                    <Button
                      size="sm"
                      onClick={() => handleAddToCart(item)}
                      disabled={!item.inStock}
                      className="w-full bg-[#FF6B00] hover:bg-[#E05E00] text-white font-bold text-xs"
                    >
                      <ShoppingCart className="size-3.5 mr-1" /> Add to Cart
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  )
}
