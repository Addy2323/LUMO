'use client'

import Link from 'next/link'
import {
  ClipboardList,
  Truck,
  ShieldCheck,
  Package,
  Ship,
  ArrowRight,
  Sparkles,
  Building2,
  CheckCircle2,
  Clock,
  MapPin,
  Search,
  PlusCircle,
  Trash2,
  RotateCcw,
} from 'lucide-react'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { useAgentStore } from '@/lib/stores/agent-store'
import { toast } from 'sonner'

export default function AgentDashboardPage() {
  const { activeCountry, agentName, orders, seedSampleOrder, clearAllData } = useAgentStore()

  const countryFlagMap: Record<string, string> = {
    China: '🇨🇳',
    Dubai: '🇦🇪',
    Turkey: '🇹🇷',
    India: '🇮🇳',
  }

  const activeFlag = countryFlagMap[activeCountry] || '🇨🇳'

  // Dynamic calculations based on active country orders
  const countryOrders = orders.filter((o) => o.assignedCountry === activeCountry)

  const newOrdersCount = countryOrders.filter((o) => o.status === 'assigned' || o.status === 'new').length
  const pendingCollectionCount = countryOrders.filter((o) => o.status === 'purchased' || o.status === 'collection_pending').length
  const waitingApprovalCount = countryOrders.filter((o) => o.customerInspectionApproval === 'pending' && o.status === 'inspected').length
  const readyToShipCount = countryOrders.filter((o) => o.status === 'packed' || o.status === 'at_warehouse').length
  const shippedTodayCount = countryOrders.filter((o) => o.status === 'shipped').length

  return (
    <div className="space-y-8">
      {/* Top Banner Greeting & Production Data Controls */}
      <div className="p-6 rounded-2xl bg-gradient-to-r from-slate-900 via-slate-800 to-slate-900 border border-slate-800 relative overflow-hidden flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div className="absolute top-0 right-0 size-72 bg-brand-500/10 rounded-full blur-3xl pointer-events-none" />

        <div className="relative z-10 space-y-1">
          <div className="flex items-center gap-2">
            <h1 className="text-2xl md:text-3xl font-black font-heading text-white">
              Hello, {agentName.split(' ')[0]} {activeFlag}
            </h1>
            <Badge className="bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 text-xs font-bold">
              Active Agent
            </Badge>
          </div>
          <p className="text-xs text-slate-400 flex items-center gap-2 font-mono">
            <MapPin className="size-3.5 text-brand-400" />
            Field Operations Hub: <strong className="text-white">{activeCountry}</strong> · GPS Coordinates Verified
          </p>
        </div>

        <div className="relative z-10 flex flex-wrap items-center gap-3">
          <Button
            onClick={() => {
              seedSampleOrder()
              toast.success(`New Sourcing Request assigned to ${activeCountry} Hub!`)
            }}
            variant="outline"
            className="border-brand-500/50 bg-brand-500/10 text-brand-400 hover:bg-brand-500/20 text-xs font-bold"
          >
            <PlusCircle className="size-4 mr-1.5" />
            Simulate Order from HQ
          </Button>

          {orders.length > 0 && (
            <Button
              onClick={() => {
                clearAllData()
                toast.info('Cleared demo data. Dashboard is ready for production!')
              }}
              variant="outline"
              className="border-rose-500/40 bg-rose-500/10 text-rose-400 hover:bg-rose-500/20 text-xs font-bold"
            >
              <Trash2 className="size-4 mr-1.5" />
              Clear Demo Data
            </Button>
          )}

          <Button
            render={
              <Link href="/agent/inspection">
                <ShieldCheck className="size-4 mr-1.5" />
                New Inspection
              </Link>
            }
            className="bg-brand-500 hover:bg-brand-600 text-white text-xs font-extrabold shadow-lg shadow-brand-500/20"
          />
        </div>
      </div>

      {/* Today's Dynamic Tasks Metrics Grid */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <h2 className="text-sm font-extrabold uppercase tracking-wider text-slate-400 font-mono">
            Today&apos;s Tasks Overview ({activeCountry} Hub)
          </h2>
          <span className="text-xs text-slate-500 font-mono">Live operational sync</span>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-4">
          <Card className="bg-slate-900/80 border-slate-800 hover:border-brand-500/50 transition-all">
            <CardContent className="p-4 space-y-2">
              <div className="flex items-center justify-between text-slate-400">
                <span className="text-xs font-bold">New Orders</span>
                <ClipboardList className="size-4 text-brand-400" />
              </div>
              <p className="text-3xl font-black text-white font-mono">{newOrdersCount}</p>
              <p className="text-[10px] text-slate-500">Assigned by LUMO HQ</p>
            </CardContent>
          </Card>

          <Card className="bg-slate-900/80 border-slate-800 hover:border-amber-500/50 transition-all">
            <CardContent className="p-4 space-y-2">
              <div className="flex items-center justify-between text-slate-400">
                <span className="text-xs font-bold">Pending Collection</span>
                <Truck className="size-4 text-amber-400" />
              </div>
              <p className="text-3xl font-black text-amber-400 font-mono">{pendingCollectionCount}</p>
              <p className="text-[10px] text-slate-500">Factory pickup scheduled</p>
            </CardContent>
          </Card>

          <Card className="bg-slate-900/80 border-slate-800 hover:border-blue-500/50 transition-all">
            <CardContent className="p-4 space-y-2">
              <div className="flex items-center justify-between text-slate-400">
                <span className="text-xs font-bold">Waiting Approval</span>
                <Clock className="size-4 text-blue-400" />
              </div>
              <p className="text-3xl font-black text-blue-400 font-mono">{waitingApprovalCount}</p>
              <p className="text-[10px] text-slate-500">Photos sent to customer</p>
            </CardContent>
          </Card>

          <Card className="bg-slate-900/80 border-slate-800 hover:border-emerald-500/50 transition-all">
            <CardContent className="p-4 space-y-2">
              <div className="flex items-center justify-between text-slate-400">
                <span className="text-xs font-bold">Ready to Ship</span>
                <Package className="size-4 text-emerald-400" />
              </div>
              <p className="text-3xl font-black text-emerald-400 font-mono">{readyToShipCount}</p>
              <p className="text-[10px] text-slate-500">Packed in warehouse</p>
            </CardContent>
          </Card>

          <Card className="bg-slate-900/80 border-slate-800 hover:border-purple-500/50 transition-all">
            <CardContent className="p-4 space-y-2">
              <div className="flex items-center justify-between text-slate-400">
                <span className="text-xs font-bold">Shipped Today</span>
                <Ship className="size-4 text-purple-400" />
              </div>
              <p className="text-3xl font-black text-purple-400 font-mono">{shippedTodayCount}</p>
              <p className="text-[10px] text-slate-500">Air / Sea containers</p>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Active Assigned Orders Table & Production Empty State */}
      <Card className="bg-slate-900/90 border-slate-800">
        <CardHeader className="p-5 border-b border-slate-800 flex flex-row items-center justify-between">
          <div>
            <CardTitle className="text-base font-extrabold text-white">Assigned Field Orders</CardTitle>
            <p className="text-xs text-slate-400">Orders requiring field agent action in {activeCountry}</p>
          </div>
          <Button
            render={
              <Link href="/agent/orders">
                View All Queue
                <ArrowRight className="size-3.5 ml-1" />
              </Link>
            }
            variant="ghost"
            size="sm"
            className="text-brand-400 hover:bg-slate-800 text-xs font-bold"
          />
        </CardHeader>
        <CardContent className="p-0">
          {countryOrders.length === 0 ? (
            <div className="p-12 text-center space-y-4">
              <div className="size-12 rounded-2xl bg-slate-800 text-slate-400 mx-auto flex items-center justify-center border border-slate-700">
                <ClipboardList className="size-6" />
              </div>
              <div className="space-y-1 max-w-sm mx-auto">
                <h4 className="text-sm font-bold text-white">No Assigned Orders in {activeCountry} Hub</h4>
                <p className="text-xs text-slate-400">
                  Site is ready for production. Orders placed by Tanzanian buyers or assigned by LUMO HQ will populate here automatically.
                </p>
              </div>
              <Button
                onClick={() => {
                  seedSampleOrder()
                  toast.success(`Created sample order in ${activeCountry} Hub for testing.`)
                }}
                variant="outline"
                className="border-slate-700 bg-slate-800 text-brand-400 hover:bg-slate-700 text-xs font-bold"
              >
                <PlusCircle className="size-4 mr-1.5" />
                Add Sample Order for Testing
              </Button>
            </div>
          ) : (
            <div className="divide-y divide-slate-800">
              {countryOrders.map((ord) => (
                <div key={ord.id} className="p-5 flex flex-col md:flex-row md:items-center justify-between gap-4 hover:bg-slate-800/40 transition-colors">
                  <div className="space-y-1 flex-1">
                    <div className="flex items-center gap-2">
                      <span className="font-mono text-xs font-black text-brand-400">{ord.orderNumber}</span>
                      <Badge
                        className={`text-[10px] font-extrabold uppercase ${
                          ord.priority === 'Urgent'
                            ? 'bg-rose-500/20 text-rose-400 border border-rose-500/30'
                            : 'bg-slate-800 text-slate-300'
                        }`}
                      >
                        {ord.priority} Priority
                      </Badge>
                      <Badge variant="outline" className="text-[10px] border-slate-700 text-slate-300 font-mono">
                        {ord.status.replace(/_/g, ' ')}
                      </Badge>
                    </div>
                    <h4 className="text-sm font-bold text-white">{ord.productName}</h4>
                    <div className="flex flex-wrap items-center gap-4 text-xs text-slate-400 font-mono">
                      <span>Customer: <strong className="text-slate-200">{ord.customerName}</strong></span>
                      <span>Qty: <strong className="text-white">{ord.quantityNeeded} units</strong></span>
                      <span>Budget: <strong className="text-brand-400">${ord.targetBudgetUSD.toLocaleString()} USD</strong></span>
                      <span>Destination: <strong className="text-slate-200">{ord.destinationRegion}, {ord.destinationCountry}</strong></span>
                    </div>
                  </div>

                  <div className="flex items-center gap-2 shrink-0">
                    <Button
                      render={
                        <Link href={`/agent/orders`}>
                          Manage Order
                        </Link>
                      }
                      size="sm"
                      className="bg-slate-800 hover:bg-slate-700 text-white text-xs font-bold border border-slate-700"
                    />
                    <Button
                      render={
                        <Link href={`/agent/inspection`}>
                          Inspect &amp; Photos
                        </Link>
                      }
                      size="sm"
                      className="bg-brand-500 hover:bg-brand-600 text-white text-xs font-bold"
                    />
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
