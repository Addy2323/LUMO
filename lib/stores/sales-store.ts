'use client'

import { create } from 'zustand'

interface SalesCountsState {
  counts: {
    inbox: number
    orders: number
    sourcing: number
    quotations: number
    tickets: number
    returns: number
    disputes: number
    escalations: number
  }
  loading: boolean
  fetchSalesCounts: () => Promise<void>
}

export const useSalesStore = create<SalesCountsState>((set) => ({
  counts: {
    inbox: 0,
    orders: 0,
    sourcing: 0,
    quotations: 0,
    tickets: 0,
    returns: 0,
    disputes: 0,
    escalations: 0,
  },
  loading: false,
  fetchSalesCounts: async () => {
    try {
      set({ loading: true })
      const res = await fetch('/api/sales/overview')
      if (res.ok) {
        const data = await res.json()
        const kpis = data?.kpis || {}
        set({
          counts: {
            inbox: kpis.unassignedCount || kpis.enquiriesCount || 0,
            orders: kpis.paidOrdersCount || data?.workQueue?.filter((w: any) => w.type === 'Order').length || 0,
            sourcing: kpis.activeSourcingCount || data?.workQueue?.filter((w: any) => w.type === 'Sourcing Request').length || 0,
            quotations: kpis.quotationsAwaitingCount || 0,
            tickets: kpis.enquiriesCount || 0,
            returns: 0,
            disputes: kpis.slaAtRiskCount || data?.workQueue?.filter((w: any) => w.type === 'Dispute Case').length || 0,
            escalations: data?.escalations?.length || 0,
          },
          loading: false,
        })
      }
    } catch (err) {
      console.error('[SALES STORE FETCH ERROR]', err)
      set({ loading: false })
    }
  },
}))
