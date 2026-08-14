'use client'

import { useState } from 'react'
import Link from 'next/link'
import Image from 'next/image'
import { Heart, ShoppingCart, Trash2, Bell, CheckCircle2, ArrowRight } from 'lucide-react'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { formatTZS } from '@/lib/format'
import { toast } from 'sonner'

import { useSessionStore } from '@/lib/stores/session-store'
import { useEffect } from 'react'

type WishlistItem = {
  id: string
  title: string
  slug: string
  image: string
  priceTZS: number
  inStock: boolean
  notifyOnPriceDrop: boolean
}

const INITIAL_WISHLIST: WishlistItem[] = [
  {
    id: 'w1',
    title: '65W GaN Fast Wall Charger Hub (3-Port)',
    slug: '65w-gan-fast-wall-charger',
    image: '/images/products/phone-case-armour.png',
    priceTZS: 45000,
    inStock: true,
    notifyOnPriceDrop: true,
  },
  {
    id: 'w2',
    title: 'Off-Grid Mono Solar Panel 350W',
    slug: 'solar-panel-350w',
    image: '/images/products/solar-panel.png',
    priceTZS: 280000,
    inStock: true,
    notifyOnPriceDrop: false,
  },
  {
    id: 'w3',
    title: 'Industrial Safety Work Boots S3 Leather',
    slug: 'leather-boots',
    image: '/images/products/leather-boots.png',
    priceTZS: 95000,
    inStock: false,
    notifyOnPriceDrop: true,
  },
]

export default function CustomerWishlistPage() {
  const user = useSessionStore((s) => s.user)
  const isDemoUser =
    user?.id === 'usr_cus_001' ||
    user?.id === 'cust_01' ||
    user?.email === 'amina.hassan@example.co.tz'

  const [items, setItems] = useState<WishlistItem[]>([])

  useEffect(() => {
    if (!user) {
      setItems([])
      return
    }

    if (isDemoUser) {
      setItems(INITIAL_WISHLIST)
      return
    }

    try {
      const stored = localStorage.getItem(`lumo_wishlist_${user.id}`)
      if (stored) {
        setItems(JSON.parse(stored))
      } else {
        setItems([])
      }
    } catch {
      setItems([])
    }
  }, [user, isDemoUser])

  function updateAndPersistItems(newItems: WishlistItem[]) {
    setItems(newItems)
    if (user && !isDemoUser) {
      try {
        localStorage.setItem(`lumo_wishlist_${user.id}`, JSON.stringify(newItems))
      } catch (e) {
        console.error('Failed to save wishlist:', e)
      }
    }
  }

  function handleRemove(id: string) {
    const updated = items.filter((item) => item.id !== id)
    updateAndPersistItems(updated)
    toast.success('Item removed from wishlist!')
  }

  function handleToggleNotify(id: string) {
    const updated = items.map((item) =>
      item.id === id ? { ...item, notifyOnPriceDrop: !item.notifyOnPriceDrop } : item,
    )
    updateAndPersistItems(updated)
    toast.success('Price drop notification preference updated!')
  }

  function handleAddToCart(item: WishlistItem) {
    toast.success(`"${item.title}" added to your cart!`)
  }

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="text-2xl font-extrabold tracking-tight">Saved Items &amp; Wishlist</h1>
        <p className="text-sm text-muted-foreground">
          Manage your saved B2B products, monitor price drops, and add items directly to cart.
        </p>
      </div>

      {items.length === 0 ? (
        <Card className="py-12 text-center">
          <CardContent className="space-y-4">
            <Heart className="size-12 text-muted-foreground mx-auto" />
            <div>
              <h3 className="text-base font-bold">Your wishlist is empty</h3>
              <p className="text-xs text-muted-foreground mt-1">Explore our marketplace to save items for future orders.</p>
            </div>
            <Button render={<Link href="/marketplace" />} className="bg-brand-500 hover:bg-brand-600 text-white font-bold text-xs">
              Browse Marketplace
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {items.map((item) => (
            <Card key={item.id} className="flex flex-col justify-between overflow-hidden group">
              <div className="relative aspect-square w-full bg-muted/30 overflow-hidden">
                <Image
                  src={item.image}
                  alt={item.title}
                  fill
                  className="object-cover group-hover:scale-105 transition-transform duration-300"
                />
                <button
                  type="button"
                  onClick={() => handleRemove(item.id)}
                  className="absolute top-2 right-2 size-8 rounded-full bg-black/60 hover:bg-red-600 text-white flex items-center justify-center transition-colors"
                  title="Remove from wishlist"
                >
                  <Trash2 className="size-4" />
                </button>

                <div className="absolute bottom-2 left-2">
                  <Badge
                    className={`text-[10px] font-bold ${
                      item.inStock ? 'bg-emerald-600 text-white' : 'bg-slate-600 text-white'
                    }`}
                  >
                    {item.inStock ? 'In Stock' : 'Out of Stock'}
                  </Badge>
                </div>
              </div>

              <CardContent className="p-4 space-y-3 flex-1 flex flex-col justify-between">
                <div>
                  <h3 className="text-sm font-bold text-foreground line-clamp-2">{item.title}</h3>
                  <p className="text-base font-mono font-extrabold text-brand-500 mt-1">
                    {formatTZS(item.priceTZS)}
                  </p>
                </div>

                <div className="space-y-2 pt-2 border-t">
                  <button
                    type="button"
                    onClick={() => handleToggleNotify(item.id)}
                    className="flex items-center justify-between w-full text-xs text-muted-foreground hover:text-foreground transition-colors"
                  >
                    <span className="flex items-center gap-1.5">
                      <Bell className={`size-3.5 ${item.notifyOnPriceDrop ? 'text-amber-500 fill-amber-500' : ''}`} />
                      Price Drop Alerts
                    </span>
                    <span className="font-bold text-[10px] font-mono">
                      {item.notifyOnPriceDrop ? 'ENABLED' : 'DISABLED'}
                    </span>
                  </button>

                  <Button
                    onClick={() => handleAddToCart(item)}
                    disabled={!item.inStock}
                    className="w-full bg-brand-500 hover:bg-brand-600 text-white font-bold text-xs"
                  >
                    <ShoppingCart className="size-3.5 mr-1.5" />
                    Add to Shopping Cart
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  )
}
