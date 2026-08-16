'use client'

import { create } from 'zustand'
import { persist } from 'zustand/middleware'

export type AgentCountry = 'China' | 'Dubai' | 'Turkey' | 'India'

export type OrderWorkflowStatus =
  | 'new'
  | 'assigned'
  | 'searching_supplier'
  | 'supplier_selected'
  | 'quotation_submitted'
  | 'customer_approved_quote'
  | 'purchased'
  | 'collection_pending'
  | 'collected'
  | 'at_warehouse'
  | 'inspected'
  | 'photos_uploaded'
  | 'customer_inspection_approved'
  | 'customer_inspection_rejected'
  | 'packed'
  | 'shipment_created'
  | 'shipped'
  | 'delivered'

export interface FieldSupplier {
  id: string
  name: string
  city: string
  country: AgentCountry
  productCategory: string
  rating: number
  verified: boolean
  moq: number
  unitPriceUSD: number
  contactPhone: string
  address: string
}

export interface SupplierComparisonItem {
  supplier: FieldSupplier
  notes: string
  leadTimeDays: number
  recommended: boolean
}

export interface InspectionPhotoSlot {
  id: string
  label: string
  required: boolean
  url?: string
  uploadedAt?: string
}

export interface QualityChecklist {
  quantityCorrect: boolean
  productMatchesRequest: boolean
  colorCorrect: boolean
  sizeCorrect: boolean
  logoCorrect: boolean
  packagingGood: boolean
  noDamage: boolean
  accessoriesIncluded: boolean
  powerTestPassed: boolean
}

export interface CollectionTask {
  id: string
  orderNumber: string
  supplierName: string
  collectionDate: string
  collectionAddress: string
  driverName: string
  vehiclePlate: string
  status: 'Waiting' | 'Collected' | 'At Warehouse'
}

export interface PackageSpecs {
  cartonCount: number
  weightKg: number
  lengthCm: number
  widthCm: number
  heightCm: number
  packagingType: string
  fragile: boolean
  shelfLocation: string
}

export interface AgentOrder {
  id: string
  orderNumber: string
  customerName: string
  destinationRegion: string
  destinationCountry: string
  assignedCountry: AgentCountry
  productName: string
  quantityNeeded: number
  targetBudgetUSD: number
  status: OrderWorkflowStatus
  priority: 'Low' | 'Medium' | 'High' | 'Urgent'
  assignedBy: string
  createdAt: string
  updatedAt: string
  // Supplier selection
  selectedSupplier?: FieldSupplier
  comparisonList?: SupplierComparisonItem[]
  // Collection
  collection?: CollectionTask
  // Quality inspection
  inspectionChecklist?: QualityChecklist
  inspectionPhotos?: InspectionPhotoSlot[]
  inspectionVideoUrl?: string
  inspectionPassed?: boolean
  customerInspectionApproval?: 'pending' | 'approved' | 'rejected'
  reinspectionNotes?: string
  // Packaging
  packageSpecs?: PackageSpecs
  // Shipment
  shippingMethod?: 'Air Freight' | 'Sea Freight' | 'Express' | 'Courier'
  carrierName?: string
  trackingNumber?: string
  estimatedDeliveryDays?: number
}

export interface AuditLogEntry {
  id: string
  timestamp: string
  agentName: string
  country: AgentCountry
  action: string
  details: string
  gpsLocation?: string
  deviceInfo?: string
}

interface AgentState {
  activeCountry: AgentCountry
  agentName: string
  orders: AgentOrder[]
  suppliers: FieldSupplier[]
  auditLogs: AuditLogEntry[]

  // Actions
  setActiveCountry: (country: AgentCountry) => void
  addOrder: (order: Partial<AgentOrder>) => void
  acceptOrder: (orderId: string) => void
  rejectOrder: (orderId: string) => void
  updateOrderStatus: (orderId: string, status: OrderWorkflowStatus) => void
  selectSupplierForOrder: (orderId: string, supplier: FieldSupplier) => void
  updateInspection: (orderId: string, checklist: QualityChecklist, photos: InspectionPhotoSlot[], videoUrl?: string) => void
  approveCustomerInspection: (orderId: string) => void
  rejectCustomerInspection: (orderId: string, notes: string) => void
  updatePackaging: (orderId: string, specs: PackageSpecs) => void
  createShipment: (orderId: string, method: AgentOrder['shippingMethod'], carrier: string, trackingNum: string) => void
  logAuditAction: (action: string, details: string) => void
  clearAllData: () => void
  seedSampleOrder: () => void
}

const INITIAL_SUPPLIERS: FieldSupplier[] = []

export const DEFAULT_PHOTOS: InspectionPhotoSlot[] = [
  { id: 'p1', label: 'Front View', required: true },
  { id: 'p2', label: 'Back View', required: true },
  { id: 'p3', label: 'Left Side', required: true },
  { id: 'p4', label: 'Right Side', required: true },
  { id: 'p5', label: 'Accessories', required: true },
  { id: 'p6', label: 'Outer Package', required: true },
  { id: 'p7', label: 'Barcode Label', required: true },
  { id: 'p8', label: 'Serial Number', required: true },
  { id: 'p9', label: 'Factory Label', required: true },
  { id: 'p10', label: 'Supplier Invoice', required: true },
]

const INITIAL_ORDERS: AgentOrder[] = []

export const useAgentStore = create<AgentState>()(
  persist(
    (set, get) => ({
      activeCountry: 'China',
      agentName: 'Field Operations Agent',
      orders: INITIAL_ORDERS,
      suppliers: INITIAL_SUPPLIERS,
      auditLogs: [],

      setActiveCountry: (activeCountry) => {
        set({ activeCountry })
        get().logAuditAction('Country Switched', `Switched active field hub to ${activeCountry}`)
      },

      addOrder: (partialOrder) => {
        const id = `agent_ord_${Date.now()}`
        const num = `LM-2026${Math.floor(10000 + Math.random() * 90000)}`
        const newOrder: AgentOrder = {
          id,
          orderNumber: partialOrder.orderNumber || num,
          customerName: partialOrder.customerName || 'LUMO Customer',
          destinationRegion: partialOrder.destinationRegion || 'Dar Es Salaam',
          destinationCountry: partialOrder.destinationCountry || 'Tanzania',
          assignedCountry: partialOrder.assignedCountry || get().activeCountry,
          productName: partialOrder.productName || 'Sourced Product',
          quantityNeeded: partialOrder.quantityNeeded || 100,
          targetBudgetUSD: partialOrder.targetBudgetUSD || 1000,
          status: 'assigned',
          priority: partialOrder.priority || 'Medium',
          assignedBy: 'LUMO HQ (Dar)',
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
          inspectionPhotos: DEFAULT_PHOTOS,
        }
        set((state) => ({ orders: [newOrder, ...state.orders] }))
        get().logAuditAction('New Order Received', `Order #${newOrder.orderNumber} assigned to ${newOrder.assignedCountry} Hub`)
      },

      clearAllData: () => {
        set({ orders: [], auditLogs: [] })
      },

      seedSampleOrder: () => {
        get().addOrder({
          productName: 'Armour Shield Rugged Phone Case (iPhone 14 / 15)',
          customerName: 'ABC Electronics Ltd',
          quantityNeeded: 500,
          targetBudgetUSD: 1600,
          priority: 'High',
        })
      },

      acceptOrder: (orderId) => {
        set((state) => ({
          orders: state.orders.map((o) =>
            o.id === orderId ? { ...o, status: 'searching_supplier', updatedAt: new Date().toISOString() } : o
          ),
        }))
        get().logAuditAction('Accepted Order', `Accepted assigned order ID ${orderId}`)
      },

      rejectOrder: (orderId) => {
        set((state) => ({
          orders: state.orders.map((o) =>
            o.id === orderId ? { ...o, status: 'new', updatedAt: new Date().toISOString() } : o
          ),
        }))
        get().logAuditAction('Rejected Order', `Rejected order ID ${orderId}`)
      },

      updateOrderStatus: (orderId, status) => {
        set((state) => ({
          orders: state.orders.map((o) =>
            o.id === orderId ? { ...o, status, updatedAt: new Date().toISOString() } : o
          ),
        }))
        get().logAuditAction('Status Updated', `Updated order ${orderId} status to ${status}`)
      },

      selectSupplierForOrder: (orderId, supplier) => {
        set((state) => ({
          orders: state.orders.map((o) =>
            o.id === orderId
              ? {
                  ...o,
                  selectedSupplier: supplier,
                  status: 'supplier_selected',
                  updatedAt: new Date().toISOString(),
                }
              : o
          ),
        }))
        get().logAuditAction('Supplier Selected', `Selected supplier ${supplier.name} for order ${orderId}`)
      },

      updateInspection: (orderId, checklist, photos, videoUrl) => {
        set((state) => ({
          orders: state.orders.map((o) =>
            o.id === orderId
              ? {
                  ...o,
                  inspectionChecklist: checklist,
                  inspectionPhotos: photos,
                  inspectionVideoUrl: videoUrl,
                  inspectionPassed: Object.values(checklist).every(Boolean),
                  status: 'inspected',
                  customerInspectionApproval: 'pending',
                  updatedAt: new Date().toISOString(),
                }
              : o
          ),
        }))
        get().logAuditAction(
          'Inspection Completed',
          `Submitted 10-point inspection and photo proof for order ${orderId}`
        )
      },

      approveCustomerInspection: (orderId) => {
        set((state) => ({
          orders: state.orders.map((o) =>
            o.id === orderId
              ? {
                  ...o,
                  customerInspectionApproval: 'approved',
                  status: 'customer_inspection_approved',
                  updatedAt: new Date().toISOString(),
                }
              : o
          ),
        }))
        get().logAuditAction('Customer Approved Inspection', `Customer approved inspection proof for ${orderId}`)
      },

      rejectCustomerInspection: (orderId, notes) => {
        set((state) => ({
          orders: state.orders.map((o) =>
            o.id === orderId
              ? {
                  ...o,
                  customerInspectionApproval: 'rejected',
                  reinspectionNotes: notes,
                  status: 'customer_inspection_rejected',
                  updatedAt: new Date().toISOString(),
                }
              : o
          ),
        }))
        get().logAuditAction('Customer Rejected Inspection', `Customer requested re-inspection for ${orderId}: ${notes}`)
      },

      updatePackaging: (orderId, specs) => {
        set((state) => ({
          orders: state.orders.map((o) =>
            o.id === orderId
              ? { ...o, packageSpecs: specs, status: 'packed', updatedAt: new Date().toISOString() }
              : o
          ),
        }))
        get().logAuditAction(
          'Package Details Saved',
          `Saved package specs (${specs.weightKg}kg, ${specs.shelfLocation}) for order ${orderId}`
        )
      },

      createShipment: (orderId, method, carrierName, trackingNumber) => {
        set((state) => ({
          orders: state.orders.map((o) =>
            o.id === orderId
              ? {
                  ...o,
                  shippingMethod: method,
                  carrierName,
                  trackingNumber,
                  status: 'shipped',
                  estimatedDeliveryDays: method === 'Air Freight' ? 5 : 24,
                  updatedAt: new Date().toISOString(),
                }
              : o
          ),
        }))
        get().logAuditAction(
          'Shipment Created',
          `Created ${method} shipment (${carrierName}) with tracking #${trackingNumber} for ${orderId}`
        )
      },

      logAuditAction: (action, details) => {
        const newLog: AuditLogEntry = {
          id: `log_${Date.now()}`,
          timestamp: new Date().toLocaleString(),
          agentName: get().agentName,
          country: get().activeCountry,
          action,
          details,
          gpsLocation: '22.5431° N, 114.0579° E (Verified Field GPS)',
          deviceInfo: 'LUMO Terminal Handheld (Android 14)',
        }
        set((state) => ({
          auditLogs: [newLog, ...state.auditLogs],
        }))
      },
    }),
    {
      name: 'lumo.agent.store.v2',
    }
  )
)
