'use client'

import { create } from 'zustand'
import { persist } from 'zustand/middleware'

export type CartLine = {
  /** Variant id — one line per variant, quantities merge. */
  id: string
  productId: string
  slug: string
  title: string
  variantLabel: string
  sku: string
  image: string
  unitPrice: number
  stock: number
  quantity: number
  savedForLater: boolean
}

type CartState = {
  lines: CartLine[]
  add: (line: Omit<CartLine, 'savedForLater'>) => void
  remove: (id: string) => void
  setQuantity: (id: string, quantity: number) => void
  toggleSavedForLater: (id: string) => void
  clear: () => void
}

const SEED: CartLine[] = []

export const useCartStore = create<CartState>()(
  persist(
    (set) => ({
      lines: SEED,
      add: (line) =>
        set((state) => {
          const existing = state.lines.find((item) => item.id === line.id)
          if (existing) {
            return {
              lines: state.lines.map((item) =>
                item.id === line.id
                  ? {
                      ...item,
                      quantity: Math.min(item.stock, item.quantity + line.quantity),
                      savedForLater: false,
                    }
                  : item,
              ),
            }
          }
          return { lines: [...state.lines, { ...line, savedForLater: false }] }
        }),
      remove: (id) => set((state) => ({ lines: state.lines.filter((item) => item.id !== id) })),
      setQuantity: (id, quantity) =>
        set((state) => ({
          lines: state.lines.map((item) =>
            item.id === id
              ? { ...item, quantity: Math.max(1, Math.min(item.stock, quantity)) }
              : item,
          ),
        })),
      toggleSavedForLater: (id) =>
        set((state) => ({
          lines: state.lines.map((item) =>
            item.id === id ? { ...item, savedForLater: !item.savedForLater } : item,
          ),
        })),
      clear: () => set({ lines: [] }),
    }),
    { name: 'lumo.cart.mock' },
  ),
)

export function cartSubtotal(lines: CartLine[]): number {
  return lines
    .filter((line) => !line.savedForLater)
    .reduce((total, line) => total + line.unitPrice * line.quantity, 0)
}

export function activeCartCount(lines: CartLine[]): number {
  return lines.filter((line) => !line.savedForLater).reduce((total, line) => total + line.quantity, 0)
}
