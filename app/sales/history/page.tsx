'use client'

import { useState } from 'react'
import { ScrollText, Search, UserCheck, Package, ShoppingBag, Banknote, Calendar } from 'lucide-react'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { formatTZS } from '@/lib/format'

type CustomerRecord = {
  id: string
  name: string
  email: string
  phone: string
  company: string
  location: string
  tier: 'Gold VIP' | 'Enterprise B2B' | 'Standard'
  lifetimeGMV: number
  totalOrders: number
  totalSourcingRequests: number
  lastActivity: string
  orders: { id: string; date: string; total: number; status: string }[]
}

const CUSTOMERS: CustomerRecord[] = [
  {
    id: 'cust_1',
    name: 'Juma Mkwawa',
    email: 'juma.mkwawa@kilimanjarooil.co.tz',
    phone: '+255 754 123 456',
    company: 'Kilimanjaro Petroleum Ltd',
    location: 'Dar es Salaam, Tanzania',
    tier: 'Enterprise B2B',
    lifetimeGMV: 48500000,
    totalOrders: 14,
    totalSourcingRequests: 6,
    lastActivity: '2026-08-04',
    orders: [
      { id: 'ORD-9901', date: '2026-08-01', total: 12500000, status: 'Shipped' },
      { id: 'ORD-9840', date: '2026-07-20', total: 8400000, status: 'Delivered' },
      { id: 'ORD-9710', date: '2026-06-15', total: 27600000, status: 'Delivered' },
    ],
  },
  {
    id: 'cust_2',
    name: 'Amina Hassan',
    email: 'amina@zanziimports.com',
    phone: '+255 784 987 654',
    company: 'Zanzibar Spice Imports',
    location: 'Stone Town, Zanzibar',
    tier: 'Gold VIP',
    lifetimeGMV: 29000000,
    totalOrders: 8,
    totalSourcingRequests: 4,
    lastActivity: '2026-08-03',
    orders: [
      { id: 'ORD-9888', date: '2026-07-28', total: 15000000, status: 'Processing' },
      { id: 'ORD-9650', date: '2026-05-10', total: 14000000, status: 'Delivered' },
    ],
  },
]

export default function CustomerHistoryPage() {
  const [search, setSearch] = useState('')
  const [selectedCustomerId, setSelectedCustomerId] = useState<string>('cust_1')

  const activeCustomer = CUSTOMERS.find((c) => c.id === selectedCustomerId) || CUSTOMERS[0]

  const filteredCustomers = CUSTOMERS.filter((c) => {
    const q = search.toLowerCase()
    return (
      q === '' ||
      c.name.toLowerCase().includes(q) ||
      c.email.toLowerCase().includes(q) ||
      c.company.toLowerCase().includes(q)
    )
  })

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="text-2xl font-extrabold tracking-tight">Customer 360° Procurement History</h1>
        <p className="text-sm text-muted-foreground">
          Comprehensive customer audit trails, lifetime GMV, order logs, and sourcing history.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Customer Roster List */}
        <Card className="lg:col-span-4">
          <CardHeader className="pb-3 space-y-3">
            <CardTitle className="text-base font-extrabold flex items-center gap-2">
              <ScrollText className="size-5 text-brand-500" />
              Customer Accounts ({filteredCustomers.length})
            </CardTitle>
            <div className="relative">
              <Search className="absolute left-2.5 top-2.5 size-4 text-muted-foreground" />
              <Input
                placeholder="Search name, email, or company..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="pl-8 text-xs"
              />
            </div>
          </CardHeader>
          <CardContent className="p-0">
            <div className="divide-y border-t max-h-[550px] overflow-y-auto">
              {filteredCustomers.map((cust) => {
                const isSelected = cust.id === activeCustomer.id
                return (
                  <div
                    key={cust.id}
                    onClick={() => setSelectedCustomerId(cust.id)}
                    className={`p-4 cursor-pointer transition-colors ${
                      isSelected ? 'bg-brand-500/10 border-l-4 border-l-brand-500' : 'hover:bg-muted/30'
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <h4 className="text-xs font-bold text-foreground">{cust.name}</h4>
                      <Badge variant="outline" className="text-[9px] font-bold">
                        {cust.tier}
                      </Badge>
                    </div>
                    <p className="text-[11px] text-muted-foreground truncate">{cust.company}</p>
                    <div className="mt-2 flex items-center justify-between text-[11px]">
                      <span className="text-muted-foreground">Lifetime:</span>
                      <span className="font-mono font-extrabold text-brand-500">{formatTZS(cust.lifetimeGMV)}</span>
                    </div>
                  </div>
                )
              })}
            </div>
          </CardContent>
        </Card>

        {/* Selected Customer Audit Inspector */}
        <Card className="lg:col-span-8">
          <CardHeader className="border-b pb-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
              <div>
                <div className="flex items-center gap-2">
                  <h2 className="text-lg font-extrabold text-foreground">{activeCustomer.name}</h2>
                  <Badge className="bg-brand-500 text-white text-[10px] font-bold">{activeCustomer.tier}</Badge>
                </div>
                <p className="text-xs text-muted-foreground">{activeCustomer.company} · {activeCustomer.location}</p>
              </div>

              <div className="text-right text-xs">
                <p className="text-muted-foreground">Contact details:</p>
                <p className="font-mono font-bold text-foreground">{activeCustomer.phone}</p>
                <p className="font-mono text-muted-foreground">{activeCustomer.email}</p>
              </div>
            </div>
          </CardHeader>

          <CardContent className="p-6 space-y-6">
            {/* KPI Cards */}
            <div className="grid grid-cols-3 gap-4">
              <div className="bg-muted/40 p-4 rounded-xl border space-y-1">
                <span className="text-xs text-muted-foreground font-medium flex items-center gap-1.5">
                  <Banknote className="size-4 text-emerald-500" /> Lifetime GMV
                </span>
                <p className="text-lg font-mono font-extrabold text-brand-500">{formatTZS(activeCustomer.lifetimeGMV)}</p>
              </div>

              <div className="bg-muted/40 p-4 rounded-xl border space-y-1">
                <span className="text-xs text-muted-foreground font-medium flex items-center gap-1.5">
                  <ShoppingBag className="size-4 text-brand-500" /> Completed Orders
                </span>
                <p className="text-lg font-mono font-extrabold text-foreground">{activeCustomer.totalOrders} Orders</p>
              </div>

              <div className="bg-muted/40 p-4 rounded-xl border space-y-1">
                <span className="text-xs text-muted-foreground font-medium flex items-center gap-1.5">
                  <Package className="size-4 text-amber-500" /> Sourcing RFQs
                </span>
                <p className="text-lg font-mono font-extrabold text-foreground">{activeCustomer.totalSourcingRequests} Requests</p>
              </div>
            </div>

            {/* Historical Order Ledger */}
            <div className="space-y-3">
              <h3 className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Order &amp; Shipment History</h3>

              <div className="divide-y rounded-xl border overflow-hidden">
                {activeCustomer.orders.map((ord) => (
                  <div key={ord.id} className="p-3.5 flex items-center justify-between text-xs bg-card hover:bg-muted/20">
                    <div className="flex items-center gap-3">
                      <span className="font-mono font-bold text-brand-500">{ord.id}</span>
                      <span className="text-muted-foreground">{ord.date}</span>
                    </div>

                    <div className="flex items-center gap-4">
                      <Badge variant="outline" className="text-[10px] uppercase font-bold">
                        {ord.status}
                      </Badge>
                      <span className="font-mono font-extrabold text-foreground">{formatTZS(ord.total)}</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
