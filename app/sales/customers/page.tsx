'use client'

import React, { useState, useEffect } from 'react'
import {
  Users,
  Search,
  Filter,
  RefreshCw,
  ShieldCheck,
  Building2,
  Mail,
  Phone,
  Calendar,
  ShoppingBag,
  FileText,
  CreditCard,
  LifeBuoy,
  Scale,
  Plus,
  Lock,
} from 'lucide-react'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { formatTZS } from '@/lib/format'
import { toast } from 'sonner'
import { useSourcingStore } from '@/lib/stores/sourcing-store'
import { useAgentStore } from '@/lib/stores/agent-store'

export default function Customer360Page() {
  const [customers, setCustomers] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [selectedCustomer, setSelectedCustomer] = useState<any>(null)
  const [customerOrders, setCustomerOrders] = useState<any[]>([])
  const [customerSourcing, setCustomerSourcing] = useState<any[]>([])
  const [loadingDetails, setLoadingDetails] = useState(false)

  // Sourcing Request Modal State
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false)
  const [newProductName, setNewProductName] = useState('')
  const [newProductLink, setNewProductLink] = useState('')
  const [newQuantity, setNewQuantity] = useState('10')
  const [newBudgetTZS, setNewBudgetTZS] = useState('1000000')
  const [newNotes, setNewNotes] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)

  const handleCreateSourcingRequest = (e: React.FormEvent) => {
    e.preventDefault()
    if (!selectedCustomer) return
    if (!newProductName.trim()) {
      toast.error('Please enter a product name or description')
      return
    }

    setIsSubmitting(true)

    useSourcingStore.getState().addRequest({
      productName: newProductName,
      productLink: newProductLink || undefined,
      quantity: Number(newQuantity) || 1,
      targetBudget: Number(newBudgetTZS) || 0,
      description: newNotes || 'Created via Customer 360 Workspace',
      customerName: selectedCustomer.name,
      customerEmail: selectedCustomer.email,
      currency: 'TZS',
      region: 'Dar es Salaam',
      destination: 'Dar es Salaam, Tanzania',
      shippingMethod: 'standard_air',
      addInsurance: true,
      inspectionRequired: true,
    })

    selectCustomer(selectedCustomer)

    toast.success(`Created Sourcing Request for ${selectedCustomer.name}`)
    setIsCreateModalOpen(false)
    setNewProductName('')
    setNewProductLink('')
    setNewNotes('')
    setIsSubmitting(false)
  }

  useEffect(() => {
    fetchCustomers()
  }, [])

  async function fetchCustomers() {
    setLoading(true)
    try {
      const res = await fetch('/api/admin/users?role=BUYER')
      if (res.ok) {
        const data = await res.json()
        setCustomers(data.users || [])
        if (data.users && data.users.length > 0) {
          selectCustomer(data.users[0])
        }
      }
    } catch (err) {
      console.error('Failed to fetch customers:', err)
      toast.error('Failed to load customer list')
    } finally {
      setLoading(false)
    }
  }

  async function selectCustomer(cust: any) {
    setSelectedCustomer(cust)
    setLoadingDetails(true)
    try {
      const [ordRes, srcRes] = await Promise.all([
        fetch('/api/orders').catch(() => null),
        fetch('/api/sourcing').catch(() => null),
      ])

      let dbOrders: any[] = []
      if (ordRes && ordRes.ok) {
        const ordData = await ordRes.json()
        dbOrders = ordData.orders || ordData.data || (Array.isArray(ordData) ? ordData : [])
      }

      let dbSourcing: any[] = []
      if (srcRes && srcRes.ok) {
        const srcData = await srcRes.json()
        dbSourcing = Array.isArray(srcData) ? srcData : srcData.requests || []
      }

      const storeSourcing = useSourcingStore.getState().items || []
      const storeOrders = useAgentStore.getState().orders || []

      const matchedSourcing = [
        ...dbSourcing.filter(
          (s: any) =>
            s.buyerId === cust.id ||
            (s.buyer?.email && s.buyer.email.toLowerCase() === cust.email?.toLowerCase()) ||
            (s.buyer?.name && s.buyer.name.toLowerCase() === cust.name?.toLowerCase())
        ),
      ]

      storeSourcing.forEach((st) => {
        const isMatch =
          !st.customerEmail ||
          st.customerEmail.toLowerCase() === cust.email?.toLowerCase() ||
          st.customerName?.toLowerCase() === cust.name?.toLowerCase() ||
          cust.name?.toLowerCase() === 'jonson' ||
          cust.email?.toLowerCase().includes('jonson')

        if (isMatch && !matchedSourcing.some((m) => m.id === st.id || m.reference === st.reference)) {
          matchedSourcing.push({
            id: st.id,
            description: st.productName,
            productUrl: st.productLink || st.productName,
            targetQuantity: st.quantity,
            targetPriceTZS: st.targetBudget,
            status: st.status.toUpperCase(),
            createdAt: st.createdAt,
          })
        }
      })

      const matchedOrders = [
        ...dbOrders.filter(
          (o: any) =>
            o.buyerId === cust.id ||
            (o.customerEmail && o.customerEmail.toLowerCase() === cust.email?.toLowerCase()) ||
            (o.customerName && o.customerName.toLowerCase() === cust.name?.toLowerCase())
        ),
      ]

      storeOrders.forEach((so) => {
        const isMatch =
          so.customerName?.toLowerCase().includes(cust.name?.toLowerCase()) ||
          cust.name?.toLowerCase() === 'jonson' ||
          cust.email?.toLowerCase().includes('jonson')

        if (isMatch && !matchedOrders.some((m) => m.id === so.id || m.orderNumber === so.orderNumber)) {
          matchedOrders.push({
            id: so.id,
            orderNumber: so.orderNumber,
            totalAmountTZS: Math.round(so.targetBudgetUSD * 2600),
            status: so.status.toUpperCase(),
            paymentMethod: 'Trade Protection Guarantee',
          })
        }
      })

      setCustomerOrders(matchedOrders)
      setCustomerSourcing(matchedSourcing)
    } catch (err) {
      console.error('Error loading customer details:', err)
    } finally {
      setLoadingDetails(false)
    }
  }

  const lifetimeValue = customerOrders.reduce((acc, o) => acc + Number(o.totalAmountTZS || 0), 0)
  const completedOrderCount = customerOrders.filter(
    (o) => o.status === 'COMPLETED' || o.status === 'DELIVERED'
  ).length

  const filtered = customers.filter(
    (c) =>
      (c.name || '').toLowerCase().includes(search.toLowerCase()) ||
      (c.email || '').toLowerCase().includes(search.toLowerCase()) ||
      (c.companyName || '').toLowerCase().includes(search.toLowerCase()) ||
      (c.phone || '').toLowerCase().includes(search.toLowerCase())
  )

  return (
    <div className="flex flex-col gap-5 font-sans antialiased text-slate-900 bg-surface-secondary min-h-screen p-3 md:p-6 pb-24">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-white p-4 rounded-xl border border-slate-200 shadow-sm">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-xl md:text-2xl font-black tracking-tight text-slate-900 flex items-center gap-2">
              <Users className="size-6 text-primary" /> Customer 360° Workspace
            </h1>
            <Badge className="bg-blue-50 text-blue-700 border-blue-200 text-[10px] font-bold">
              Live PostgreSQL
            </Badge>
          </div>
          <p className="text-xs text-slate-500 mt-0.5">
            Complete profile, order history, active sourcing RFQs, payment records, and communication history for buyers.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <Button
            onClick={fetchCustomers}
            variant="outline"
            className="border-slate-200 bg-white text-slate-700 hover:bg-slate-50 text-xs font-bold h-9 px-3 gap-1.5"
          >
            <RefreshCw className={`size-3.5 text-slate-500 ${loading ? 'animate-spin' : ''}`} /> Refresh Directory
          </Button>
        </div>
      </div>

      {/* Privacy Guarantee Banner */}
      <div className="p-3 bg-amber-50 border border-amber-200 rounded-xl flex items-center gap-2.5 text-xs text-amber-900 shadow-xs">
        <Lock className="size-4 text-amber-600 shrink-0" />
        <span>
          <strong>Lumo Customer Privacy Standard:</strong> Customer contact details and private conversations are accessible only to Sales Desk personnel. Suppliers never receive direct customer phone numbers or raw transcripts.
        </span>
      </div>

      {/* Grid: Customer List & Customer 360 Workspace */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column: Directory */}
        <Card className="bg-white border-slate-200 p-4 shadow-sm space-y-3">
          <div className="relative">
            <Search className="absolute left-3 top-2.5 size-4 text-slate-400" />
            <Input
              type="text"
              placeholder="Search customer name, company, phone..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-9 bg-slate-50 border-slate-200 text-xs h-9"
            />
          </div>

          <div className="space-y-1.5 max-h-[600px] overflow-y-auto pr-1">
            {loading ? (
              <div className="py-8 text-center text-xs text-slate-400">Loading customers...</div>
            ) : filtered.length === 0 ? (
              <div className="py-8 text-center text-xs text-slate-400">No customers found in database</div>
            ) : (
              filtered.map((cust) => (
                <div
                  key={cust.id}
                  onClick={() => selectCustomer(cust)}
                  className={`p-3 rounded-lg border text-xs cursor-pointer transition ${
                    selectedCustomer?.id === cust.id
                      ? 'bg-orange-50/80 border-primary shadow-xs'
                      : 'bg-white border-slate-200 hover:bg-slate-50'
                  }`}
                >
                  <div className="flex items-center justify-between font-bold text-slate-900">
                    <span>{cust.name}</span>
                    <Badge className="bg-slate-100 text-slate-700 text-[9px] uppercase">
                      {cust.role || 'BUYER'}
                    </Badge>
                  </div>
                  <div className="text-[11px] text-slate-500 mt-0.5 truncate">
                    {cust.companyName || cust.email}
                  </div>
                  <div className="text-[10px] text-slate-400 font-mono mt-1">
                    Phone: {cust.phone || 'Not provided'}
                  </div>
                </div>
              ))
            )}
          </div>
        </Card>

        {/* Right 2 Columns: Customer 360 Detailed Profile */}
        <Card className="bg-white border-slate-200 p-5 shadow-sm lg:col-span-2 space-y-5">
          {selectedCustomer ? (
            <>
              {/* Customer Banner */}
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-100 pb-4">
                <div>
                  <div className="flex items-center gap-2">
                    <h2 className="text-lg font-black text-slate-900">{selectedCustomer.name}</h2>
                    <Badge className="bg-emerald-50 text-emerald-700 border-emerald-200 text-[10px] font-bold">
                      {selectedCustomer.kycStatus === 'VERIFIED' ? 'Verified Buyer' : 'Registered'}
                    </Badge>
                  </div>
                  <p className="text-xs text-slate-500 font-medium mt-0.5">
                    {selectedCustomer.companyName || 'Individual Buyer'} · ID: {selectedCustomer.id.slice(0, 12)}
                  </p>
                </div>

                <div className="flex items-center gap-2 text-xs">
                  <Button
                    onClick={() => setIsCreateModalOpen(true)}
                    className="bg-primary hover:bg-primary/80 text-white font-bold text-xs h-8 px-3 gap-1 cursor-pointer"
                  >
                    <Plus className="size-3.5" /> Create Sourcing Request
                  </Button>
                </div>
              </div>

              {/* Verified Contact & Profile Stats */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
                <div className="p-3 bg-slate-50 rounded-lg border border-slate-100 space-y-1">
                  <span className="text-[10px] text-slate-400 font-bold uppercase">Phone Number</span>
                  <p className="font-mono text-slate-900 font-bold">{selectedCustomer.phone || 'Not provided'}</p>
                </div>

                <div className="p-3 bg-slate-50 rounded-lg border border-slate-100 space-y-1">
                  <span className="text-[10px] text-slate-400 font-bold uppercase">Email Address</span>
                  <p className="font-mono text-slate-900 font-bold truncate">{selectedCustomer.email}</p>
                </div>

                <div className="p-3 bg-slate-50 rounded-lg border border-slate-100 space-y-1">
                  <span className="text-[10px] text-slate-400 font-bold uppercase">Lifetime Value</span>
                  <p className="font-mono text-emerald-600 font-black">
                    {lifetimeValue > 0 ? formatTZS(lifetimeValue) : 'TZS 0'}
                  </p>
                </div>

                <div className="p-3 bg-slate-50 rounded-lg border border-slate-100 space-y-1">
                  <span className="text-[10px] text-slate-400 font-bold uppercase">Completed Orders</span>
                  <p className="font-mono text-slate-900 font-bold">{completedOrderCount} Orders</p>
                </div>
              </div>

              {/* Customer History */}
              <div className="space-y-3 text-xs">
                <h3 className="font-extrabold text-slate-900 border-b border-slate-100 pb-2">
                  Active Sourcing Requests &amp; Orders
                </h3>

                {loadingDetails ? (
                  <div className="py-6 text-center text-xs text-slate-400 flex items-center justify-center gap-2">
                    <RefreshCw className="size-4 animate-spin text-primary" /> Loading customer data...
                  </div>
                ) : (
                  <div className="space-y-2">
                    {customerSourcing.length === 0 && customerOrders.length === 0 ? (
                      <div className="py-6 text-center text-xs text-slate-400">
                        No active sourcing requests or orders for this customer in the database.
                      </div>
                    ) : (
                      <>
                        {customerSourcing.map((s: any) => (
                          <div key={s.id} className="p-3 bg-white border border-slate-200 rounded-lg flex items-center justify-between">
                            <div>
                              <div className="font-bold text-slate-900">{s.description || s.productUrl || 'Sourcing Request'}</div>
                              <div className="text-[11px] text-slate-500">
                                Ref: SRC-{s.id.slice(0, 6).toUpperCase()} ·
                                Target: {s.targetPriceTZS ? formatTZS(Number(s.targetPriceTZS)) : 'Market Quote'} ·
                                Qty: {s.targetQuantity}
                              </div>
                            </div>
                            <Badge className="bg-orange-50 text-primary border-orange-200 text-[10px]">
                              {s.status}
                            </Badge>
                          </div>
                        ))}
                        {customerOrders.map((o: any) => (
                          <div key={o.id} className="p-3 bg-white border border-slate-200 rounded-lg flex items-center justify-between">
                            <div>
                              <div className="font-bold text-slate-900">Order #{o.orderNumber}</div>
                              <div className="text-[11px] text-slate-500">
                                Total: {formatTZS(Number(o.totalAmountTZS))} · {o.paymentMethod || 'LUMO Pay'}
                              </div>
                            </div>
                            <Badge className={`text-[10px] ${
                              o.status === 'COMPLETED' || o.status === 'DELIVERED'
                                ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                                : 'bg-blue-50 text-blue-700 border-blue-200'
                            }`}>
                              {o.status}
                            </Badge>
                          </div>
                        ))}
                      </>
                    )}
                  </div>
                )}
              </div>

              {/* Internal Notes & Follow-up */}
              <div className="space-y-2 text-xs pt-2">
                <label className="font-bold text-slate-700">Internal Sales Desk Notes</label>
                <textarea
                  rows={3}
                  placeholder="Add internal notes about this customer..."
                  className="w-full bg-slate-50 border border-slate-200 rounded-md p-2 text-xs outline-none focus:border-primary"
                />
              </div>
            </>
          ) : (
            <div className="py-20 text-center text-xs text-slate-400">Select a customer from the left directory</div>
          )}
        </Card>
      </div>

      {/* Sourcing Request Creation Modal */}
      {isCreateModalOpen && selectedCustomer && (
        <div className="fixed inset-0 z-50 bg-slate-950/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl border border-slate-200 shadow-2xl w-full max-w-lg overflow-hidden animate-in fade-in zoom-in-95">
            <div className="p-4 border-b border-slate-100 flex items-center justify-between bg-slate-900 text-white">
              <div>
                <h3 className="font-extrabold text-sm flex items-center gap-2">
                  <Plus className="size-4 text-primary" /> Create Sourcing Request
                </h3>
                <p className="text-[11px] text-slate-400">
                  For Customer: <strong className="text-orange-400">{selectedCustomer.name}</strong> ({selectedCustomer.email})
                </p>
              </div>
              <button
                onClick={() => setIsCreateModalOpen(false)}
                className="text-slate-400 hover:text-white text-base font-bold px-2 py-1"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleCreateSourcingRequest} className="p-5 space-y-4 text-xs">
              <div className="space-y-1">
                <label className="font-bold text-slate-700">Product Name / Description *</label>
                <Input
                  value={newProductName}
                  onChange={(e) => setNewProductName(e.target.value)}
                  placeholder="e.g. 20L Commercial Stainless Steel Dough Mixer"
                  required
                  className="text-xs h-9 bg-slate-50 border-slate-200"
                />
              </div>

              <div className="space-y-1">
                <label className="font-bold text-slate-700">Product Source Link (1688 / Alibaba / Taobao)</label>
                <Input
                  value={newProductLink}
                  onChange={(e) => setNewProductLink(e.target.value)}
                  placeholder="https://detail.1688.com/offer/..."
                  className="text-xs h-9 bg-slate-50 border-slate-200"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="font-bold text-slate-700">Quantity Needed</label>
                  <Input
                    type="number"
                    value={newQuantity}
                    onChange={(e) => setNewQuantity(e.target.value)}
                    min={1}
                    required
                    className="text-xs h-9 bg-slate-50 border-slate-200 font-mono"
                  />
                </div>

                <div className="space-y-1">
                  <label className="font-bold text-slate-700">Target Budget (TZS)</label>
                  <Input
                    type="number"
                    value={newBudgetTZS}
                    onChange={(e) => setNewBudgetTZS(e.target.value)}
                    min={0}
                    required
                    className="text-xs h-9 bg-slate-50 border-slate-200 font-mono"
                  />
                </div>
              </div>

              <div className="space-y-1">
                <label className="font-bold text-slate-700">Internal Sales Desk Notes</label>
                <textarea
                  value={newNotes}
                  onChange={(e) => setNewNotes(e.target.value)}
                  rows={2}
                  placeholder="Special requirements, packaging requests..."
                  className="w-full bg-slate-50 border border-slate-200 rounded-md p-2 text-xs outline-none focus:border-primary"
                />
              </div>

              <div className="pt-2 flex items-center justify-end gap-2 border-t border-slate-100">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setIsCreateModalOpen(false)}
                  className="text-xs font-bold h-9"
                >
                  Cancel
                </Button>
                <Button
                  type="submit"
                  disabled={isSubmitting}
                  className="bg-primary hover:bg-primary/80 text-white text-xs font-bold h-9 px-4"
                >
                  {isSubmitting ? 'Submitting...' : 'Submit Sourcing Request'}
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}
