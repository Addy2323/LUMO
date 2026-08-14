'use client'

import { useState } from 'react'
import Link from 'next/link'
import {
  Building2,
  Search,
  Star,
  ShieldCheck,
  MapPin,
  Phone,
  CheckCircle2,
  SlidersHorizontal,
  ArrowRight,
  TrendingDown,
  ClipboardList,
  PlusCircle,
} from 'lucide-react'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { useAgentStore, FieldSupplier } from '@/lib/stores/agent-store'
import { toast } from 'sonner'

export default function AgentSuppliersPage() {
  const { suppliers, activeCountry, selectSupplierForOrder, orders, seedSampleOrder } = useAgentStore()
  const [searchTerm, setSearchTerm] = useState('')

  const hubOrders = orders.filter((o) => o.assignedCountry === activeCountry)
  const activeOrder = hubOrders[0]

  const filteredSuppliers = suppliers.filter(
    (s) =>
      s.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      s.city.toLowerCase().includes(searchTerm.toLowerCase()) ||
      s.productCategory.toLowerCase().includes(searchTerm.toLowerCase())
  )

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-extrabold font-heading text-white">Supplier Search &amp; Comparison</h1>
        <p className="text-xs text-slate-400 font-mono">
          Field Directory Hub: <strong className="text-brand-400">{activeCountry}</strong> · Verified Market Factories in Yiwu, Shenzhen, Dragon Mart &amp; Istanbul
        </p>
      </div>

      {/* 3-Way Side-by-Side Supplier Comparison Matrix Card */}
      <Card className="bg-slate-900 border-slate-800">
        <CardHeader className="p-5 border-b border-slate-800 flex flex-row items-center justify-between">
          <div>
            <CardTitle className="text-base font-extrabold text-white flex items-center gap-2">
              <Building2 className="size-5 text-brand-400" />
              Supplier Comparison Matrix
            </CardTitle>
            <p className="text-xs text-slate-400">
              {activeOrder
                ? `Comparing factory quotes for order #${activeOrder.orderNumber} (${activeOrder.productName})`
                : `No active order assigned in ${activeCountry} Hub for quotation comparison`}
            </p>
          </div>
          {activeOrder && (
            <Badge className="bg-brand-500/20 text-brand-400 border border-brand-500/30 text-xs font-bold font-mono">
              RFQ Recommendation Ready
            </Badge>
          )}
        </CardHeader>

        <CardContent className="p-6">
          {!activeOrder ? (
            <div className="p-8 text-center space-y-3">
              <div className="size-12 rounded-2xl bg-slate-800 text-brand-400 mx-auto flex items-center justify-center border border-slate-700">
                <Building2 className="size-6" />
              </div>
              <div className="space-y-1 max-w-sm mx-auto">
                <h4 className="text-sm font-bold text-white">No Order Selected for Comparison</h4>
                <p className="text-xs text-slate-400">
                  Select an assigned order from your queue to build a 3-way supplier quotation comparison for buyer approval.
                </p>
              </div>
              <div className="pt-2 flex flex-wrap items-center justify-center gap-3">
                <Button
                  render={
                    <Link href="/agent/orders">
                      <ClipboardList className="size-4 mr-1.5" />
                      View Orders Queue
                    </Link>
                  }
                  className="bg-brand-500 hover:bg-brand-600 text-white text-xs font-bold"
                />
                <Button
                  onClick={() => {
                    seedSampleOrder()
                    toast.success(`Created order in ${activeCountry} Hub for comparison testing.`)
                  }}
                  variant="outline"
                  className="border-slate-700 bg-slate-800 text-slate-300 hover:bg-slate-700 text-xs font-bold"
                >
                  <PlusCircle className="size-4 mr-1.5" />
                  Add Test Order
                </Button>
              </div>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {suppliers.slice(0, 3).map((sup, idx) => (
                <div
                  key={sup.id}
                  className={`p-5 rounded-2xl space-y-4 ${
                    idx === 0
                      ? 'border-2 border-brand-500/60 bg-brand-500/5 relative'
                      : 'border border-slate-800 bg-slate-950/50'
                  }`}
                >
                  {idx === 0 && (
                    <Badge className="absolute -top-3 left-4 bg-brand-500 text-white font-extrabold text-[10px]">
                      RECOMMENDED BEST VALUE
                    </Badge>
                  )}

                  <div className="space-y-1 pt-1">
                    <h4 className="font-extrabold text-white text-base">{sup.name}</h4>
                    <p className="text-xs text-slate-400">{sup.city} · MOQ {sup.moq} pcs</p>
                  </div>

                  <div className="p-3 rounded-xl bg-slate-900 border border-slate-800 space-y-1">
                    <span className="text-[10px] text-slate-400 uppercase font-mono">Quoted Unit Price</span>
                    <p className="text-2xl font-black text-brand-400 font-mono">${sup.unitPriceUSD} USD</p>
                  </div>

                  <div className="space-y-1.5 text-xs text-slate-300 font-mono">
                    <div className="flex justify-between">
                      <span className="text-slate-500">Rating:</span>
                      <span className="text-amber-400 font-bold flex items-center gap-1">
                        <Star className="size-3 fill-current" /> {sup.rating} / 5.0
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-500">Lead Time:</span>
                      <strong className="text-white">4 Days</strong>
                    </div>
                  </div>

                  <Button
                    onClick={() => {
                      selectSupplierForOrder(activeOrder.id, sup)
                      toast.success(`Selected ${sup.name} for order #${activeOrder.orderNumber}!`)
                    }}
                    className={`w-full font-bold text-xs ${
                      idx === 0 ? 'bg-brand-500 hover:bg-brand-600 text-white' : 'bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700'
                    }`}
                  >
                    Select Supplier {String.fromCharCode(65 + idx)}
                  </Button>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Directory Search & Supplier Cards */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="text-base font-extrabold text-white font-heading">Field Supplier Directory</h3>
          <div className="relative w-72">
            <Search className="size-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <Input
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Search by city, name or category..."
              className="pl-9 h-10 bg-slate-900 border-slate-800 text-xs text-white placeholder:text-slate-500"
            />
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {filteredSuppliers.map((sup) => (
            <Card key={sup.id} className="bg-slate-900 border-slate-800 hover:border-slate-700 transition-colors">
              <CardContent className="p-5 space-y-3">
                <div className="flex items-start justify-between">
                  <div>
                    <h4 className="font-bold text-white text-base">{sup.name}</h4>
                    <p className="text-xs text-slate-400 flex items-center gap-1 font-mono">
                      <MapPin className="size-3.5 text-brand-400" /> {sup.address}
                    </p>
                  </div>
                  <Badge className="bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 text-[10px]">
                    VERIFIED
                  </Badge>
                </div>

                <div className="grid grid-cols-3 gap-2 text-xs font-mono bg-slate-950 p-3 rounded-xl border border-slate-800 text-slate-300">
                  <div>
                    <span className="block text-[10px] text-slate-500">MOQ</span>
                    <strong>{sup.moq} Pcs</strong>
                  </div>
                  <div>
                    <span className="block text-[10px] text-slate-500">Unit Price</span>
                    <strong className="text-brand-400">${sup.unitPriceUSD} USD</strong>
                  </div>
                  <div>
                    <span className="block text-[10px] text-slate-500">Rating</span>
                    <strong className="text-amber-400 flex items-center gap-1">
                      <Star className="size-3 fill-current" /> {sup.rating}
                    </strong>
                  </div>
                </div>

                <div className="flex items-center justify-between text-xs pt-1">
                  <span className="text-slate-400 flex items-center gap-1 font-mono">
                    <Phone className="size-3.5 text-slate-500" /> {sup.contactPhone}
                  </span>

                  <div className="flex items-center gap-2">
                    <Button size="sm" variant="outline" className="border-slate-700 bg-slate-800 text-xs font-bold text-slate-200 hover:bg-slate-700">
                      Visit &amp; Call
                    </Button>
                    <Button
                      size="sm"
                      onClick={() => toast.success(`Contacted ${sup.name} for quotation!`)}
                      className="bg-brand-500 hover:bg-brand-600 text-xs font-bold text-white"
                    >
                      Create Quotation
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    </div>
  )
}
