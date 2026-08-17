'use client'

/**
 * Every data read in the app goes through one of these hooks. The `mock`
 * resolver is the only thing that changes when the backend lands.
 */

import { useQuery } from '@tanstack/react-query'
import { apiRequest } from '@/lib/api/client'
import { CATEGORIES, PRODUCTS, getStoredProducts, updateCategoryCounts, type Product } from '@/lib/mock/products'
import { ORDERS, type Order, type OrderStatus } from '@/lib/mock/orders'
import {
  ACTIVITY_LOG,
  CANNED_RESPONSES,
  NOTIFICATIONS,
  SOURCING_REQUESTS,
  TICKETS,
  type SupportTicket,
  type TicketStatus,
} from '@/lib/mock/support'

export type ProductQuery = {
  q?: string
  categoryId?: string
  minPrice?: number
  maxPrice?: number
  minRating?: number
  inStockOnly?: boolean
  sort?: 'relevance' | 'price_asc' | 'price_desc' | 'rating' | 'newest'
}

function filterProducts(query: ProductQuery): Product[] {
  const term = query.q?.trim().toLowerCase()
  const allProducts = getStoredProducts()

  let result = allProducts.filter((product) => {
    if (term) {
      const haystack = `${product.title} ${product.brand} ${product.shortDescription}`.toLowerCase()
      if (!haystack.includes(term)) return false
    }
    if (query.categoryId && product.categoryId !== query.categoryId) return false
    if (query.minPrice !== undefined && product.fromPrice < query.minPrice) return false
    if (query.maxPrice !== undefined && product.fromPrice > query.maxPrice) return false
    if (query.minRating !== undefined && product.rating < query.minRating) return false
    if (query.inStockOnly && !product.variants.some((variant) => variant.stock > 0)) return false
    return true
  })

  switch (query.sort) {
    case 'price_asc':
      result = [...result].sort((a, b) => a.fromPrice - b.fromPrice)
      break
    case 'price_desc':
      result = [...result].sort((a, b) => b.fromPrice - a.fromPrice)
      break
    case 'rating':
      result = [...result].sort((a, b) => b.rating - a.rating)
      break
    case 'newest':
      result = [...result].sort((a, b) => b.createdAt.localeCompare(a.createdAt))
      break
    default:
      result = [...result].sort((a, b) => b.soldCount - a.soldCount)
  }

  return result
}

export function useProducts(query: ProductQuery = {}) {
  return useQuery<Product[]>({
    queryKey: ['products', query],
    queryFn: async (): Promise<Product[]> => {
      let dbProducts: Product[] = []
      try {
        const res = await apiRequest<any>('/api/products', { mock: () => filterProducts(query), latency: 300 })
        if (Array.isArray(res)) {
          dbProducts = res
        } else if (res && Array.isArray(res.data)) {
          dbProducts = res.data
        }
      } catch {
        dbProducts = []
      }

      const storedProducts = getStoredProducts()
      const dbIds = new Set(dbProducts.map((p) => p.id))
      const combined = [...dbProducts, ...storedProducts.filter((p) => !dbIds.has(p.id))]

      // Apply in-memory search, category filter, and sorting
      const term = query.q?.trim().toLowerCase()
      let result = combined.filter((product) => {
        if (term) {
          const haystack = `${product.title} ${product.brand} ${product.shortDescription}`.toLowerCase()
          if (!haystack.includes(term)) return false
        }
        if (query.categoryId) {
          const cat = query.categoryId.toLowerCase()
          const pCat = (product.categoryId || '').toLowerCase()
          if (pCat !== cat && !pCat.includes(cat) && !cat.includes(pCat)) {
            return false
          }
        }
        if (query.minPrice !== undefined && product.fromPrice < query.minPrice) return false
        if (query.maxPrice !== undefined && product.fromPrice > query.maxPrice) return false
        if (query.minRating !== undefined && product.rating < query.minRating) return false
        if (query.inStockOnly && !product.variants?.some((variant) => variant.stock > 0)) return false
        return true
      })

      switch (query.sort) {
        case 'price_asc':
          result = [...result].sort((a, b) => a.fromPrice - b.fromPrice)
          break
        case 'price_desc':
          result = [...result].sort((a, b) => b.fromPrice - a.fromPrice)
          break
        case 'rating':
          result = [...result].sort((a, b) => b.rating - a.rating)
          break
        case 'newest':
          result = [...result].sort((a, b) => (b.createdAt || '').localeCompare(a.createdAt || ''))
          break
        default:
          result = [...result].sort((a, b) => (b.soldCount || 0) - (a.soldCount || 0))
      }

      return result
    },
  })
}

export function useProduct(slug: string) {
  return useQuery<Product | null>({
    queryKey: ['product', slug],
    queryFn: async (): Promise<Product | null> => {
      try {
        const res = await apiRequest<any>(`/api/products/${slug}`, {
          mock: () => getStoredProducts().find((p) => p.slug === slug || p.id === slug) ?? null,
          latency: 300,
        })
        const prod = res?.data || res
        if (prod && typeof prod === 'object' && prod.id) return prod as Product
        return getStoredProducts().find((p) => p.slug === slug || p.id === slug) ?? null
      } catch {
        return getStoredProducts().find((p) => p.slug === slug || p.id === slug) ?? null
      }
    },
  })
}

export function usePriceTiers(productId?: string) {
  return useQuery({
    queryKey: ['price-tiers', productId],
    enabled: Boolean(productId),
    queryFn: async () => {
      if (!productId) return []
      try {
        const res = await apiRequest<{ tiers: Array<{ minQuantity: number; maxQuantity?: number; unitPrice: number; currency: string }> }>(
          `/products/${productId}/price-tiers`,
          {
            mock: () => ({ tiers: [] }),
            latency: 200,
          }
        )
        return res?.tiers ?? []
      } catch {
        return []
      }
    },
  })
}

export function useCategories() {
  updateCategoryCounts()
  return useQuery({
    queryKey: ['categories'],
    queryFn: async () => {
      updateCategoryCounts()
      return CATEGORIES
    },
  })
}

export function useRecommendedProducts(limit = 4) {
  return useQuery({
    queryKey: ['products', 'recommended', limit],
    queryFn: () =>
      apiRequest<Product[]>('/products/recommended', {
        mock: () => [...PRODUCTS].sort((a, b) => b.rating - a.rating).slice(0, limit),
        latency: 350,
      }),
  })
}

export type OrderQuery = { status?: OrderStatus | 'all'; supplierId?: string; customerId?: string }

export function useOrders(query: OrderQuery = {}) {
  return useQuery({
    queryKey: ['orders', query],
    queryFn: () =>
      apiRequest<Order[]>('/orders', {
        mock: () =>
          ORDERS.filter((order) => {
            if (query.status && query.status !== 'all' && order.status !== query.status) return false
            if (query.supplierId && order.supplier.id !== query.supplierId) return false
            if (query.customerId && order.customer.id !== query.customerId) return false
            return true
          }),
        latency: 450,
      }),
  })
}

export function useOrder(reference: string) {
  return useQuery({
    queryKey: ['order', reference],
    queryFn: () =>
      apiRequest<Order | null>(`/orders/${reference}`, {
        mock: () => ORDERS.find((order) => order.reference === reference) ?? null,
        latency: 400,
      }),
  })
}

export function useTickets(query: { status?: TicketStatus | 'all'; customerId?: string } = {}) {
  return useQuery({
    queryKey: ['tickets', query],
    queryFn: () =>
      apiRequest<SupportTicket[]>('/support/tickets', {
        mock: () =>
          TICKETS.filter((ticket) => {
            if (query.status && query.status !== 'all' && ticket.status !== query.status)
              return false
            if (query.customerId && ticket.customer.id !== query.customerId) return false
            return true
          }),
        latency: 450,
      }),
  })
}

export function useTicket(reference: string) {
  return useQuery({
    queryKey: ['ticket', reference],
    queryFn: () =>
      apiRequest<SupportTicket | null>(`/support/tickets/${reference}`, {
        mock: () => TICKETS.find((ticket) => ticket.reference === reference) ?? null,
        latency: 350,
      }),
  })
}

export function useSourcingRequests() {
  return useQuery({
    queryKey: ['sourcing-requests'],
    queryFn: () =>
      apiRequest<typeof SOURCING_REQUESTS>('/sales/sourcing-requests', {
        mock: () => SOURCING_REQUESTS,
        latency: 400,
      }),
  })
}

export function useCannedResponses() {
  return useQuery({
    queryKey: ['canned-responses'],
    queryFn: () =>
      apiRequest<typeof CANNED_RESPONSES>('/sales/templates', {
        mock: () => CANNED_RESPONSES,
        latency: 300,
      }),
  })
}

export function useNotifications() {
  return useQuery({
    queryKey: ['notifications'],
    queryFn: () =>
      apiRequest<typeof NOTIFICATIONS>('/notifications', {
        mock: () => NOTIFICATIONS,
        latency: 300,
      }),
  })
}

export function useActivityLog() {
  return useQuery({
    queryKey: ['activity-log'],
    queryFn: () =>
      apiRequest<typeof ACTIVITY_LOG>('/me/activity', { mock: () => ACTIVITY_LOG, latency: 300 }),
  })
}
