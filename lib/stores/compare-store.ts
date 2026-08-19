'use client'

import { create } from 'zustand'
import { persist } from 'zustand/middleware'

export type CompareItem = {
  id: string
  productId: string
  title: string
  slug: string
  image: string
  priceTZS: number
  compareAtPrice?: number
  inStock: boolean
  rating: number
  reviewCount: number
  moq?: string
  supplierName?: string
  supplierCountry?: string
  supplierFlag?: string
  supplierVerified?: boolean
  warranty?: string
  leadTime?: string
  category?: string
  specifications?: Record<string, string>
}

type CompareState = {
  items: CompareItem[]
  addItem: (item: CompareItem) => boolean
  removeItem: (id: string) => void
  toggleItem: (item: CompareItem) => { added: boolean; limitReached?: boolean }
  isInCompare: (productId: string) => boolean
  clear: () => void
}

const SEED_COMPARE: CompareItem[] = [
  {
    id: 'c1',
    productId: 'prod-001',
    title: '65W GaN Fast Wall Charger Hub (3-Port)',
    slug: '65w-gan-fast-wall-charger',
    image: '/images/products/phone-case-armour.png',
    priceTZS: 45000,
    compareAtPrice: 55000,
    inStock: true,
    rating: 4.9,
    reviewCount: 128,
    moq: '10 Units',
    supplierName: 'Shenzhen Anker Tech Co.',
    supplierCountry: 'China',
    supplierFlag: '🇨🇳',
    supplierVerified: true,
    warranty: '12 Months Factory Warranty',
    leadTime: '3-5 Business Days',
    category: 'Electronics',
    specifications: {
      'Port Count': '3 (2x USB-C PD, 1x USB-A QC)',
      'Max Output': '65W Power Delivery 3.0',
      'Technology': 'GaN III Semiconductor',
      'Certification': 'CE, FCC, RoHS Certified',
    },
  },
  {
    id: 'c2',
    productId: 'prod-002',
    title: 'Off-Grid Mono Solar Panel 350W',
    slug: 'solar-panel-350w',
    image: '/images/products/solar-panel.png',
    priceTZS: 280000,
    compareAtPrice: 320000,
    inStock: true,
    rating: 4.8,
    reviewCount: 84,
    moq: '5 Units',
    supplierName: 'Guangzhou SolarTech Ltd',
    supplierCountry: 'China',
    supplierFlag: '🇨🇳',
    supplierVerified: true,
    warranty: '25 Years Efficiency Warranty',
    leadTime: '7-10 Business Days',
    category: 'Energy & Power',
    specifications: {
      'Efficiency': '21.8% Monocrystalline',
      'Max Voltage': '38.5V Vmp',
      'Frame': 'Anodized Aluminum Alloy',
      'Protection': 'IP68 Waterproof Junction Box',
    },
  },
]

export const useCompareStore = create<CompareState>()(
  persist(
    (set, get) => ({
      items: SEED_COMPARE,
      addItem: (item) => {
        const state = get()
        if (state.items.some((i) => i.productId === item.productId || i.id === item.id)) {
          return true
        }
        if (state.items.length >= 4) {
          return false
        }
        set({ items: [...state.items, item] })
        return true
      },
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
          return { added: false }
        } else {
          if (state.items.length >= 4) {
            return { added: false, limitReached: true }
          }
          set({ items: [...state.items, item] })
          return { added: true }
        }
      },
      isInCompare: (productId) => {
        return get().items.some((i) => i.productId === productId || i.id === productId)
      },
      clear: () => set({ items: [] }),
    }),
    { name: 'lumo.compare.store' },
  ),
)
