'use client'

import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import { resolveImage } from '@/lib/mock/products'

export interface SupplierVariant {
  id: string
  sku: string
  name: string
  priceTZS: number
  costPriceTZS: number
  stock: number
  reorderPoint: number
  attributes: Record<string, string>
}

export interface SupplierProduct {
  id: string
  title: string
  slug: string
  brand: string
  category: string
  description: string
  status: 'active' | 'draft' | 'archived'
  fromPriceTZS: number
  images: string[]
  variants: SupplierVariant[]
  createdAt: string
  updatedAt: string
}

export interface SupplierOrder {
  id: string
  orderNumber: string
  customerName: string
  destinationRegion: string
  items: {
    productId: string
    productTitle: string
    variantSku: string
    quantity: number
    unitPriceTZS: number
  }[]
  totalAmountTZS: number
  status: 'pending' | 'processing' | 'shipped' | 'delivered' | 'cancelled'
  createdAt: string
  trackingNumber?: string
  carrier?: string
}

export interface SupplierShipment {
  id: string
  shipmentRef: string
  orderNumber: string
  destination: string
  carrier: string
  trackingCode: string
  packagesCount: number
  status: 'manifested' | 'picked_up' | 'in_transit' | 'delivered'
  dispatchedAt: string
  estimatedDelivery: string
}

export interface SupplierKYCProfile {
  companyName: string
  tinNumber: string
  vrnNumber: string
  brelaRegistrationNumber: string
  businessAddress: string
  contactEmail: string
  contactPhone: string
  bankAccount: {
    bankName: string
    accountNumber: string
    accountName: string
  }
  mobilePayout: {
    provider: string
    phoneNumber: string
  }
  kycStatus: 'verified' | 'under_review' | 'action_required'
  submittedDocuments: {
    name: string
    type: string
    uploadedAt: string
    verified: boolean
  }[]
}

export interface SupplierSettlement {
  id: string
  reference: string
  amountTZS: number
  method: string
  status: 'completed' | 'processing' | 'pending'
  createdAt: string
  period: string
}

interface SupplierState {
  products: SupplierProduct[]
  orders: SupplierOrder[]
  shipments: SupplierShipment[]
  profile: SupplierKYCProfile
  settlements: SupplierSettlement[]

  // Product CRUD
  addProduct: (product: Omit<SupplierProduct, 'id' | 'createdAt' | 'updatedAt'>) => void
  updateProduct: (id: string, updates: Partial<SupplierProduct>) => void
  deleteProduct: (id: string) => void
  importProducts: (products: Omit<SupplierProduct, 'id' | 'createdAt' | 'updatedAt'>[]) => void

  // Inventory CRUD
  updateStock: (productId: string, variantId: string, newStock: number) => void
  updateReorderPoint: (productId: string, variantId: string, newReorderPoint: number) => void

  // Order & Shipment Management
  updateOrderStatus: (orderId: string, status: SupplierOrder['status'], trackingCode?: string, carrier?: string) => void
  addShipment: (shipment: Omit<SupplierShipment, 'id'>) => void
  updateShipmentStatus: (shipmentId: string, status: SupplierShipment['status']) => void

  // Company & KYC
  updateProfile: (profile: Partial<SupplierKYCProfile>) => void
  addKYCDocument: (doc: { name: string; type: string }) => void

  // Settlements
  requestPayout: (amountTZS: number, method: string) => void
}

const initialProducts: SupplierProduct[] = []

const initialOrders: SupplierOrder[] = []

const initialShipments: SupplierShipment[] = []

const initialProfile: SupplierKYCProfile = {
  companyName: '',
  tinNumber: '',
  vrnNumber: '',
  brelaRegistrationNumber: '',
  businessAddress: '',
  contactEmail: '',
  contactPhone: '',
  bankAccount: {
    bankName: '',
    accountNumber: '',
    accountName: '',
  },
  mobilePayout: {
    provider: '',
    phoneNumber: '',
  },
  kycStatus: 'action_required',
  submittedDocuments: [],
}

const initialSettlements: SupplierSettlement[] = []

export const useSupplierStore = create<SupplierState>()(
  persist(
    (set, get) => ({
      products: initialProducts,
      orders: initialOrders,
      shipments: initialShipments,
      profile: initialProfile,
      settlements: initialSettlements,

      addProduct: (prod) => {
        const id = `prod_${Date.now()}`
        const newProduct: SupplierProduct = {
          ...prod,
          id,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        }
        set((state) => ({ products: [newProduct, ...state.products] }))
      },

      updateProduct: (id, updates) => {
        set((state) => ({
          products: state.products.map((p) =>
            p.id === id ? { ...p, ...updates, updatedAt: new Date().toISOString() } : p,
          ),
        }))
      },

      deleteProduct: (id) => {
        set((state) => ({ products: state.products.filter((p) => p.id !== id) }))
      },

      importProducts: (newProds) => {
        const timestamp = new Date().toISOString()
        const formatted = newProds.map((prod, idx) => ({
          ...prod,
          id: `prod_imp_${Date.now()}_${idx}`,
          createdAt: timestamp,
          updatedAt: timestamp,
        }))
        set((state) => ({ products: [...formatted, ...state.products] }))
      },

      updateStock: (productId, variantId, newStock) => {
        set((state) => ({
          products: state.products.map((p) => {
            if (p.id !== productId) return p
            return {
              ...p,
              variants: p.variants.map((v) => (v.id === variantId ? { ...v, stock: Math.max(0, newStock) } : v)),
              updatedAt: new Date().toISOString(),
            }
          }),
        }))
      },

      updateReorderPoint: (productId, variantId, newReorderPoint) => {
        set((state) => ({
          products: state.products.map((p) => {
            if (p.id !== productId) return p
            return {
              ...p,
              variants: p.variants.map((v) =>
                v.id === variantId ? { ...v, reorderPoint: Math.max(0, newReorderPoint) } : v,
              ),
              updatedAt: new Date().toISOString(),
            }
          }),
        }))
      },

      updateOrderStatus: (orderId, status, trackingCode, carrier) => {
        set((state) => {
          const updatedOrders = state.orders.map((o) => {
            if (o.id !== orderId) return o
            return {
              ...o,
              status,
              ...(trackingCode ? { trackingNumber: trackingCode } : {}),
              ...(carrier ? { carrier } : {}),
            }
          })

          // Automatically generate shipment entry if status becomes shipped
          let updatedShipments = [...state.shipments]
          const targetOrder = state.orders.find((o) => o.id === orderId)
          if (status === 'shipped' && targetOrder) {
            const existing = updatedShipments.find((s) => s.orderNumber === targetOrder.orderNumber)
            if (!existing) {
              updatedShipments.unshift({
                id: `ship_${Date.now()}`,
                shipmentRef: `SHP-TZ-${Math.floor(1000 + Math.random() * 9000)}`,
                orderNumber: targetOrder.orderNumber,
                destination: `${targetOrder.destinationRegion} Central Hub`,
                carrier: carrier || 'Supercargo Freight TZ',
                trackingCode: trackingCode || `TZ-EXP-${Math.floor(10000 + Math.random() * 90000)}`,
                packagesCount: targetOrder.items.reduce((acc, i) => acc + i.quantity, 0),
                status: 'in_transit',
                dispatchedAt: new Date().toISOString(),
                estimatedDelivery: new Date(Date.now() + 86400000 * 2).toISOString().split('T')[0],
              })
            }
          }

          return { orders: updatedOrders, shipments: updatedShipments }
        })
      },

      addShipment: (shipment) => {
        set((state) => ({
          shipments: [{ ...shipment, id: `ship_${Date.now()}` }, ...state.shipments],
        }))
      },

      updateShipmentStatus: (shipmentId, status) => {
        set((state) => ({
          shipments: state.shipments.map((s) => (s.id === shipmentId ? { ...s, status } : s)),
        }))
      },

      updateProfile: (profileUpdates) => {
        set((state) => ({
          profile: { ...state.profile, ...profileUpdates },
        }))
      },

      addKYCDocument: (doc) => {
        set((state) => ({
          profile: {
            ...state.profile,
            submittedDocuments: [
              ...state.profile.submittedDocuments,
              { ...doc, uploadedAt: new Date().toISOString().split('T')[0], verified: false },
            ],
            kycStatus: 'under_review',
          },
        }))
      },

      requestPayout: (amountTZS, method) => {
        const newSettlement: SupplierSettlement = {
          id: `set_${Date.now()}`,
          reference: `PAY-TZS-${Math.floor(8000 + Math.random() * 1000)}`,
          amountTZS,
          method,
          status: 'processing',
          createdAt: new Date().toISOString(),
          period: 'Instant On-Demand Request',
        }
        set((state) => ({ settlements: [newSettlement, ...state.settlements] }))
      },
    }),
    {
      name: 'lumoo-supplier-store-v2',
      merge: (persistedState: any, currentState) => {
        if (persistedState && Array.isArray(persistedState.products)) {
          const sanitizedProducts = persistedState.products.map((p: any) => {
            const cleanImages = (p.images || []).map((u: any) => {
              let str = typeof u === 'string' ? u : (u?.url || u?.src || '')
              if (!str) return ''
              str = str.trim().replace(/^['"]|['"]$/g, '')
              if (str.startsWith('//')) return `https:${str}`
              if (!str.startsWith('http://') && !str.startsWith('https://') && !str.startsWith('data:') && !str.startsWith('/')) {
                if (str.includes('.') || str.includes('/')) return `https://${str}`
              }
              return str
            }).filter(Boolean)

            return {
              ...p,
              images: cleanImages,
            }
          })
          return {
            ...currentState,
            ...persistedState,
            products: sanitizedProducts,
          }
        }
        return { ...currentState, ...persistedState }
      },
    },
  ),
)
