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

export default function Customer360Page() {
  const [customers, setCustomers] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [selectedCustomer, setSelectedCustomer] = useState<any>(null)

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
          setSelectedCustomer(data.users[0])
        }
      }
    } catch (err) {
      console.error('Failed to fetch customers:', err)
      toast.error('Failed to load customer list')
    } finally {
      setLoading(false)
    }
  }

  const filtered = customers.filter(
    (c) =>
      (c.name || '').toLowerCase().includes(search.toLowerCase()) ||
      (c.email || '').toLowerCase().includes(search.toLowerCase()) ||
      (c.companyName || '').toLowerCase().includes(search.toLowerCase()) ||
      (c.phone || '').toLowerCase().includes(search.toLowerCase())
  )

  return (
    <div className="flex flex-col gap-5 font-sans antialiased text-slate-900 bg-[#f8fafc] min-h-screen p-3 md:p-6 pb-24">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-white p-4 rounded-xl border border-slate-200 shadow-sm">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-xl md:text-2xl font-black tracking-tight text-slate-900 flex items-center gap-2">
              <Users className="size-6 text-[#FF6B00]" /> Customer 360° Workspace
            </h1>
            <Badge className="bg-blue-50 text-blue-700 border-blue-200 text-[10px] font-bold">
              Shielded Data Access
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
              <div className="py-8 text-center text-xs text-slate-400">No customers found</div>
            ) : (
              filtered.map((cust) => (
                <div
                  key={cust.id}
                  onClick={() => setSelectedCustomer(cust)}
                  className={`p-3 rounded-lg border text-xs cursor-pointer transition ${
                    selectedCustomer?.id === cust.id
                      ? 'bg-orange-50/80 border-[#FF6B00] shadow-xs'
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
                    Phone: {cust.phone || 'N/A'}
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
                      Verified Buyer
                    </Badge>
                  </div>
                  <p className="text-xs text-slate-500 font-medium mt-0.5">
                    {selectedCustomer.companyName || 'Retail Merchant'} · ID: {selectedCustomer.id.slice(0, 12)}
                  </p>
                </div>

                <div className="flex items-center gap-2 text-xs">
                  <Button className="bg-[#FF6B00] hover:bg-[#E05E00] text-white font-bold text-xs h-8 px-3 gap-1">
                    <Plus className="size-3.5" /> Create Sourcing Request
                  </Button>
                </div>
              </div>

              {/* Verified Contact & Profile Stats */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
                <div className="p-3 bg-slate-50 rounded-lg border border-slate-100 space-y-1">
                  <span className="text-[10px] text-slate-400 font-bold uppercase">Phone Number</span>
                  <p className="font-mono text-slate-900 font-bold">{selectedCustomer.phone || '0768828247'}</p>
                </div>

                <div className="p-3 bg-slate-50 rounded-lg border border-slate-100 space-y-1">
                  <span className="text-[10px] text-slate-400 font-bold uppercase">Email Address</span>
                  <p className="font-mono text-slate-900 font-bold truncate">{selectedCustomer.email}</p>
                </div>

                <div className="p-3 bg-slate-50 rounded-lg border border-slate-100 space-y-1">
                  <span className="text-[10px] text-slate-400 font-bold uppercase">Lifetime Value</span>
                  <p className="font-mono text-emerald-600 font-black">{formatTZS(14500000)}</p>
                </div>

                <div className="p-3 bg-slate-50 rounded-lg border border-slate-100 space-y-1">
                  <span className="text-[10px] text-slate-400 font-bold uppercase">Completed Orders</span>
                  <p className="font-mono text-slate-900 font-bold">12 Orders</p>
                </div>
              </div>

              {/* Customer History Tabs */}
              <div className="space-y-3 text-xs">
                <h3 className="font-extrabold text-slate-900 border-b border-slate-100 pb-2">
                  Active Sourcing Requests &amp; Orders
                </h3>

                <div className="space-y-2">
                  <div className="p-3 bg-white border border-slate-200 rounded-lg flex items-center justify-between">
                    <div>
                      <div className="font-bold text-slate-900">High-Grade Cotton Textiles (500 rolls)</div>
                      <div className="text-[11px] text-slate-500">RFQ Ref: RFQ-8821 · Budget: {formatTZS(8500000)}</div>
                    </div>
                    <Badge className="bg-orange-50 text-[#FF6B00] border-orange-200 text-[10px]">
                      QUOTATION PREPARED
                    </Badge>
                  </div>

                  <div className="p-3 bg-white border border-slate-200 rounded-lg flex items-center justify-between">
                    <div>
                      <div className="font-bold text-slate-900">Order #ORD-9902 (Solar Panels 10kW)</div>
                      <div className="text-[11px] text-slate-500">Total: {formatTZS(12400000)} · AzamPay Escrow</div>
                    </div>
                    <Badge className="bg-emerald-50 text-emerald-700 border-emerald-200 text-[10px]">
                      IN TRANSIT
                    </Badge>
                  </div>
                </div>
              </div>

              {/* Internal Notes & Follow-up */}
              <div className="space-y-2 text-xs pt-2">
                <label className="font-bold text-slate-700">Internal Sales Desk Notes</label>
                <textarea
                  rows={3}
                  defaultValue="Customer prefers Swahili communication via SMS. High repetition rate for textile sourcing."
                  className="w-full bg-slate-50 border border-slate-200 rounded-md p-2 text-xs outline-none focus:border-[#FF6B00]"
                />
              </div>
            </>
          ) : (
            <div className="py-20 text-center text-xs text-slate-400">Select a customer from the left directory</div>
          )}
        </Card>
      </div>
    </div>
  )
}
