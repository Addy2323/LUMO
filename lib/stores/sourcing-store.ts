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

const INITIAL_SOURCING_ITEMS: SourcingItem[] = []

type SourcingStore = {
  items: SourcingItem[]
  addRequest: (item: Omit<SourcingItem, 'id' | 'reference' | 'status' | 'createdAt' | 'messages'> & { documentFile?: File | null }) => string
  addMessage: (requestId: string, message: { senderRole: SourcingMessageRole; senderName: string; content: string; attachment?: { name: string; size: string; url?: string } }) => void
  assignOfficer: (requestId: string, officerName: string) => void
  submitQuotation: (requestId: string, quotation: SourcingQuotation) => void
  payQuotation: (requestId: string, paymentDetails: { method: string; transactionRef: string; paidAmountTZS: number }) => void
  updateStatus: (requestId: string, status: SourcingItem['status']) => void
  downloadDocument: (doc: SourcingSubmittedDocument) => void
  clearAll: () => void
}

export const useSourcingStore = create<SourcingStore>()(
  persist(
    (set, get) => ({
      items: [],
      clearAll: () => set({ items: [] }),

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
                  content: `Buyer Protection Payment Confirmed! Landed quote paid via ${paymentDetails.method}. Transaction Reference: ${paymentDetails.transactionRef}. Total Paid: TZS ${paymentDetails.paidAmountTZS.toLocaleString()}`,
                  sentAt: paidAt,
                },
                {
                  id: `msg_${Date.now() + 1}`,
                  senderRole: 'sales',
                  senderName: 'Lumo Automated Protection',
                  content: `Funds held under Lumo Buyer Protection. Supplier manufacturing order dispatched to Guangzhou/Shenzhen hub. Tracking updates will appear here.`,
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
