'use client'

import { create } from 'zustand'
import { persist } from 'zustand/middleware'

export type WishlistItem = {
  id: string
  productId: string
  title: string
  slug: string
  image: string
  priceTZS: number
  inStock: boolean
  supplierName?: string
  notifyOnPriceDrop?: boolean
}

type WishlistState = {
  items: WishlistItem[]
  addItem: (item: WishlistItem) => void
  removeItem: (id: string) => void
  toggleItem: (item: WishlistItem) => boolean
  toggleNotify: (id: string) => void
  isInWishlist: (productId: string) => boolean
  clear: () => void
}

const SEED_WISHLIST: WishlistItem[] = [
  {
    id: 'w1',
    productId: 'prod-001',
    title: '65W GaN Fast Wall Charger Hub (3-Port)',
    slug: '65w-gan-fast-wall-charger',
    image: '/images/products/phone-case-armour.png',
    priceTZS: 45000,
    inStock: true,
    supplierName: 'Shenzhen Anker Tech Co.',
    notifyOnPriceDrop: true,
  },
  {
    id: 'w2',
    productId: 'prod-002',
    title: 'Off-Grid Mono Solar Panel 350W',
    slug: 'solar-panel-350w',
    image: '/images/products/solar-panel.png',
    priceTZS: 280000,
    inStock: true,
    supplierName: 'Guangzhou SolarTech Ltd',
    notifyOnPriceDrop: false,
  },
  {
    id: 'w3',
    productId: 'prod-003',
    title: 'Industrial Safety Work Boots S3 Leather',
    slug: 'leather-boots',
    image: '/images/products/leather-boots.png',
    priceTZS: 95000,
    inStock: false,
    supplierName: 'Qingdao Safety Products',
    notifyOnPriceDrop: true,
  },
]

export const useWishlistStore = create<WishlistState>()(
  persist(
    (set, get) => ({
      items: SEED_WISHLIST,
      addItem: (item) =>
        set((state) => {
          if (state.items.some((i) => i.productId === item.productId || i.id === item.id)) {
            return state
          }
          return { items: [item, ...state.items] }
        }),
      removeItem: (id) =>
        set((state) => ({
          items: state.items.filter((i) => i.id !== id && i.productId !== id),
        })),
      toggleItem: (item) => {
        const state = get()
        const exists = state.items.some((i) => i.productId === item.productId || i.id === item.id)
        if (exists) {
          set({
            items: state.items.filter((i) => i.id !== item.id && i.productId !== item.productId),
          })
          return false
        } else {
          set({ items: [item, ...state.items] })
          return true
        }
      },
      toggleNotify: (id) =>
        set((state) => ({
          items: state.items.map((i) =>
            i.id === id || i.productId === id
              ? { ...i, notifyOnPriceDrop: !i.notifyOnPriceDrop }
              : i,
          ),
        })),
      isInWishlist: (productId) => {
        return get().items.some((i) => i.productId === productId || i.id === productId)
      },
      clear: () => set({ items: [] }),
    }),
    { name: 'lumo.wishlist.store' },
  ),
)
