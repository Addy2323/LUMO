'use client'

import { create } from 'zustand'
import { persist } from 'zustand/middleware'

export type SourcingMessageRole = 'customer' | 'sales' | 'admin'

export type SourcingMessage = {
  id: string
  senderRole: SourcingMessageRole
  senderName: string
  content: string
  sentAt: string
  attachment?: {
    name: string
    size: string
    url?: string
  }
}

export type SourcingSubmittedDocument = {
  name: string
  size: string
  fileType?: string
  contentUrl?: string // Data URL or text content for real browser download
}

export type SourcingQuotation = {
  unitCostTZS: number
  shippingCostTZS: number
  customsDutyTZS: number
  totalLandedTZS: number
  deliveryEta: string
  quotedAt: string
  notes?: string
}

export type SourcingItem = {
  id: string
  reference: string
  customerName: string
  customerEmail: string
  productName: string
  productLink?: string
  description?: string
  brand?: string
  modelNumber?: string
  color?: string
  sizeDimensions?: string
  techSpecs?: string
  quantity: number
  targetBudget: number
  currency: string
  region: string
  destination: string
  shippingMethod: 'express_air' | 'standard_air' | 'sea'
  addInsurance: boolean
  inspectionRequired: boolean
  status: 'open' | 'assigned' | 'quoted' | 'paid' | 'completed'
  assignedAgent?: string
  createdAt: string
  submittedDocument?: SourcingSubmittedDocument
  quotation?: SourcingQuotation
  paymentDetails?: {
    method: string
    transactionRef: string
    paidAmountTZS: number
    paidAt: string
  }
  messages: SourcingMessage[]
}

const INITIAL_SOURCING_ITEMS: SourcingItem[] = [
  {
    id: 'src_demo_01',
    reference: 'SR-412',
    customerName: 'Amina Hassan',
    customerEmail: 'amina.hassan@example.co.tz',
    productName: '500W Portable Solar Power Station',
    productLink: 'https://detail.1688.com/offer/7421890123.html',
    description: 'Foldable 100W solar panel + 500Wh lithium battery station with 220V AC output for commercial office backup.',
    brand: 'Yexing Solar Tech',
    modelNumber: 'YX-500W-PRO',
    color: 'Matte Black',
    sizeDimensions: '42 x 28 x 20 cm (4.5 kg)',
    techSpecs: 'Pure Sine Wave 220V AC output, 12V DC input, Type-C 60W PD quick charge.',
    quantity: 10,
    targetBudget: 1620000,
    currency: 'TZS',
    region: 'Dar es Salaam',
    destination: 'Dar es Salaam',
    shippingMethod: 'standard_air',
    addInsurance: true,
    inspectionRequired: true,
    status: 'quoted',
    assignedAgent: 'John Sourcing (Guangzhou Hub)',
    createdAt: new Date(Date.now() - 3600000 * 24).toISOString(),
    quotation: {
      unitCostTZS: 125000,
      shippingCostTZS: 250000,
      customsDutyTZS: 120000,
      totalLandedTZS: 1620000,
      deliveryEta: '14–21 Days via Standard Air Freight',
      quotedAt: new Date(Date.now() - 3600000 * 5).toISOString(),
      notes: 'All-inclusive landed quote includes Guangzhou pre-shipment quality inspection and customs clearance at TRA Dar es Salaam.',
    },
    messages: [
      {
        id: 'msg_demo_01',
        senderRole: 'customer',
        senderName: 'Amina Hassan',
        content: 'Sourcing request SR-412 created for 500W Portable Solar Power Station. Quantity: 10 units.',
        sentAt: new Date(Date.now() - 3600000 * 24).toISOString(),
      },
      {
        id: 'msg_demo_02',
        senderRole: 'sales',
        senderName: 'John Sourcing (Guangzhou Hub)',
        content: 'Formal Landed TZS Quote issued: TZS 1,620,000. All factory tests verified.',
        sentAt: new Date(Date.now() - 3600000 * 5).toISOString(),
      },
    ],
  },
  {
    id: 'src_demo_02',
    reference: 'SR-413',
    customerName: 'Amina Hassan',
    customerEmail: 'amina.hassan@example.co.tz',
    productName: 'Series 9 Ultra Smart Watch 256GB',
    productLink: 'https://www.alibaba.com/product-detail/Series-9-Ultra_1601880490.html',
    description: 'AMOLED display, heart rate monitor, IP68 waterproof, wireless charging.',
    brand: 'HK Tech',
    modelNumber: 'HK9-ULTRA-2',
    color: 'Titanium Grey',
    sizeDimensions: '49mm Dial',
    quantity: 50,
    targetBudget: 1170000,
    currency: 'TZS',
    region: 'Arusha',
    destination: 'Arusha',
    shippingMethod: 'express_air',
    addInsurance: true,
    inspectionRequired: true,
    status: 'assigned',
    assignedAgent: 'Amani Sourcing Officer',
    createdAt: new Date(Date.now() - 3600000 * 12).toISOString(),
    messages: [
      {
        id: 'msg_demo_03',
        senderRole: 'customer',
        senderName: 'Amina Hassan',
        content: 'Sourcing request SR-413 created for Series 9 Ultra Smart Watch 256GB. Quantity: 50 units.',
        sentAt: new Date(Date.now() - 3600000 * 12).toISOString(),
      },
      {
        id: 'msg_demo_04',
        senderRole: 'sales',
        senderName: 'System Dispatch',
        content: 'Sourcing Officer assigned: Amani Sourcing Officer. Officer is reviewing product specifications with suppliers.',
        sentAt: new Date(Date.now() - 3600000 * 2).toISOString(),
      },
    ],
  },
]

type SourcingStore = {
  items: SourcingItem[]
  addRequest: (item: Omit<SourcingItem, 'id' | 'reference' | 'status' | 'createdAt' | 'messages'> & { documentFile?: File | null }) => string
  addMessage: (requestId: string, message: { senderRole: SourcingMessageRole; senderName: string; content: string; attachment?: { name: string; size: string; url?: string } }) => void
  assignOfficer: (requestId: string, officerName: string) => void
  submitQuotation: (requestId: string, quotation: SourcingQuotation) => void
  payQuotation: (requestId: string, paymentDetails: { method: string; transactionRef: string; paidAmountTZS: number }) => void
  updateStatus: (requestId: string, status: SourcingItem['status']) => void
  downloadDocument: (doc: SourcingSubmittedDocument) => void
}

export const useSourcingStore = create<SourcingStore>()(
  persist(
    (set, get) => ({
      items: INITIAL_SOURCING_ITEMS,

      addRequest: (requestData) => {
        const nextIdNumber = get().items.length + 413
        const reference = `SR-${nextIdNumber}`
        const id = `src_${Date.now()}`

        let submittedDocument: SourcingSubmittedDocument | undefined = undefined
        if (requestData.documentFile) {
          const file = requestData.documentFile
          submittedDocument = {
            name: file.name,
            size: `${(file.size / (1024 * 1024)).toFixed(2)} MB`,
            fileType: file.type,
            contentUrl: URL.createObjectURL(file),
          }
        }

        const newItem: SourcingItem = {
          ...requestData,
          id,
          reference,
          status: 'open',
          createdAt: new Date().toISOString(),
          submittedDocument,
          messages: [
            {
              id: `msg_${Date.now()}`,
              senderRole: 'customer',
              senderName: requestData.customerName || 'Customer',
              content: `Sourcing request ${reference} created for ${requestData.productName}. Quantity: ${requestData.quantity} unit(s). Target Budget: ${requestData.currency} ${Number(requestData.targetBudget).toLocaleString()}`,
              sentAt: new Date().toISOString(),
            },
          ],
        }

        set({ items: [newItem, ...get().items] })
        return reference
      },

      addMessage: (requestId, messageData) => {
        set({
          items: get().items.map((item) => {
            if (item.id !== requestId && item.reference !== requestId) return item
            const newMsg: SourcingMessage = {
              id: `msg_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
              senderRole: messageData.senderRole,
              senderName: messageData.senderName,
              content: messageData.content,
              sentAt: new Date().toISOString(),
              attachment: messageData.attachment,
            }
            return {
              ...item,
              messages: [...item.messages, newMsg],
            }
          }),
        })
      },

      assignOfficer: (requestId, officerName) => {
        set({
          items: get().items.map((item) => {
            if (item.id !== requestId && item.reference !== requestId) return item
            return {
              ...item,
              assignedAgent: officerName,
              status: item.status === 'open' ? 'assigned' : item.status,
              messages: [
                ...item.messages,
                {
                  id: `msg_${Date.now()}`,
                  senderRole: 'sales',
                  senderName: 'System Dispatch',
                  content: `Sourcing Officer assigned: ${officerName}. Officer is reviewing product specifications with suppliers.`,
                  sentAt: new Date().toISOString(),
                },
              ],
            }
          }),
        })
      },

      submitQuotation: (requestId, quotation) => {
        set({
          items: get().items.map((item) => {
            if (item.id !== requestId && item.reference !== requestId) return item
            return {
              ...item,
              quotation,
              status: 'quoted',
              messages: [
                ...item.messages,
                {
                  id: `msg_${Date.now()}`,
                  senderRole: 'sales',
                  senderName: item.assignedAgent || 'Lumo Sourcing Officer',
                  content: `Formal Landed TZS Quote issued: TZS ${quotation.totalLandedTZS.toLocaleString()}. ETA: ${quotation.deliveryEta}. Note: ${quotation.notes || 'All-inclusive quote ready.'}`,
                  sentAt: new Date().toISOString(),
                },
              ],
            }
          }),
        })
      },

      payQuotation: (requestId, paymentDetails) => {
        set({
          items: get().items.map((item) => {
            if (item.id !== requestId && item.reference !== requestId) return item
            const paidAt = new Date().toISOString()
            return {
              ...item,
              status: 'paid',
              paymentDetails: {
                ...paymentDetails,
                paidAt,
              },
              messages: [
                ...item.messages,
                {
                  id: `msg_${Date.now()}`,
                  senderRole: 'customer',
                  senderName: item.customerName || 'Buyer',
                  content: `Escrow Payment Confirmed! Landed quote paid via ${paymentDetails.method}. Transaction Reference: ${paymentDetails.transactionRef}. Total Paid: TZS ${paymentDetails.paidAmountTZS.toLocaleString()}`,
                  sentAt: paidAt,
                },
                {
                  id: `msg_${Date.now() + 1}`,
                  senderRole: 'sales',
                  senderName: 'Lumo Automated Escrow',
                  content: `Funds held in Lumo Escrow Protection. Supplier manufacturing order dispatched to Guangzhou/Shenzhen hub. Tracking updates will appear here.`,
                  sentAt: paidAt,
                },
              ],
            }
          }),
        })
      },

      updateStatus: (requestId, status) => {
        set({
          items: get().items.map((item) => {
            if (item.id !== requestId && item.reference !== requestId) return item
            return { ...item, status }
          }),
        })
      },

      downloadDocument: (doc) => {
        if (!doc) return
        const href = doc.contentUrl || `data:text/plain;charset=utf-8,${encodeURIComponent(`Document Content: ${doc.name}\nSize: ${doc.size}\nLumo Verified Specification File`)}`
        const element = document.createElement('a')
        element.setAttribute('href', href)
        element.setAttribute('download', doc.name)
        element.style.display = 'none'
        document.body.appendChild(element)
        element.click()
        document.body.removeChild(element)
      },
    }),
    { name: 'lumo.sourcing.store.v1' },
  ),
)
