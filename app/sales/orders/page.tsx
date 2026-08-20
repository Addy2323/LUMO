'use client'

import React, { useState, useEffect } from 'react'
import {
  ClipboardList,
  Search,
  Filter,
  RefreshCw,
  UserCheck,
  Building2,
  Clock,
  ShieldCheck,
  CheckCircle2,
  AlertTriangle,
  Plus,
  ArrowRight,
  UserPlus,
} from 'lucide-react'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { formatTZS } from '@/lib/format'
import { toast } from 'sonner'

export default function SalesOrdersAssignmentPage() {
  const [orders, setOrders] = useState<any[]>([])
  const [candidates, setCandidates] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [selectedOrder, setSelectedOrder] = useState<any>(null)
  const [assigning, setAssigning] = useState(false)

  useEffect(() => {
    fetchData()
  }, [])

  async function fetchData() {
    setLoading(true)
    try {
      const [ordRes, candRes] = await Promise.all([
        fetch('/api/admin/orders/pipeline'),
        fetch('/api/admin/assignment-candidates?role=AGENT'),
      ])

      if (ordRes.ok) {
        const ordData = await ordRes.json()
        setOrders(ordData.data?.orders || ordData.orders || [])
      }

      if (candRes.ok) {
        const candData = await candRes.json()
        setCandidates(candData.data || candData.candidates || [])
      }
    } catch (err) {
      console.error('Failed to fetch orders:', err)
      toast.error('Failed to load order assignment data')
    } finally {
      setLoading(false)
    }
  }

  async function handleAssignAgent(agentId: string, agentName: string) {
    if (!selectedOrder) return
    setAssigning(true)

    try {
      const res = await fetch('/api/admin/orders/pipeline', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          orderId: selectedOrder.id,
          stage: 'Agent Assigned',
          assigneeId: agentId,
          assigneeName: agentName,
          assignmentRole: 'Sourcing Agent',
        }),
      })

      const json = await res.json()
      if (res.ok && json.success) {
        toast.success(`Agent ${agentName} assigned to Order #${selectedOrder.ref || selectedOrder.orderNumber}!`)
        setSelectedOrder(null)
        fetchData()
      } else {
        toast.error(json.error || 'Failed to assign agent')
      }
    } catch (err) {
      console.error('Error assigning agent:', err)
      toast.error('Network error during assignment')
    } finally {
      setAssigning(false)
    }
  }

  const filtered = orders.filter((o) =>
    (o.ref || o.orderNumber || '').toLowerCase().includes(search.toLowerCase()) ||
    (o.customer || o.buyer?.name || '').toLowerCase().includes(search.toLowerCase())
  )

  return (
    <div className="flex flex-col gap-5 font-sans antialiased text-slate-900 bg-surface-secondary min-h-screen p-3 md:p-6 pb-24">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-white p-4 rounded-xl border border-slate-200 shadow-sm">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-xl md:text-2xl font-black tracking-tight text-slate-900 flex items-center gap-2">
              <ClipboardList className="size-6 text-primary" /> Order Assignment &amp; Coordination Console
            </h1>
            <Badge className="bg-orange-50 text-primary border-orange-200 text-[10px] font-bold">
              Workload-Aware Matching
            </Badge>
          </div>
          <p className="text-xs text-slate-500 mt-0.5">
            Assign paid orders to specialized sourcing agents, logistics partners, and inspectors with SLA tracking.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <Button
            onClick={fetchData}
            variant="outline"
            className="border-slate-200 bg-white text-slate-700 hover:bg-slate-50 text-xs font-bold h-9 px-3 gap-1.5"
          >
            <RefreshCw className={`size-3.5 text-slate-500 ${loading ? 'animate-spin' : ''}`} /> Refresh Desk
          </Button>
        </div>
      </div>

      {/* Grid: Order Queue & Available Agents */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left 2 Cols: Order Queue */}
        <Card className="bg-white border-slate-200 p-4 shadow-sm lg:col-span-2 space-y-4">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 border-b border-slate-100 pb-3">
            <div className="relative w-full md:w-72">
              <Search className="absolute left-3 top-2.5 size-4 text-slate-400" />
              <Input
                type="text"
                placeholder="Search order #, customer..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="pl-9 bg-slate-50 border-slate-200 text-xs h-9"
              />
            </div>

            <span className="text-xs text-slate-500 font-semibold">
              Showing {filtered.length} paid orders
            </span>
          </div>

          {loading ? (
            <div className="py-12 text-center text-xs text-slate-400 flex items-center justify-center gap-2">
              <RefreshCw className="size-4 animate-spin text-primary" /> Loading orders...
            </div>
          ) : filtered.length === 0 ? (
            <div className="py-12 text-center text-xs text-slate-400">No orders found</div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse text-xs">
                <thead>
                  <tr className="bg-slate-50 text-slate-500 border-b border-slate-200 uppercase font-bold text-[10px] tracking-wider">
                    <th className="p-3">Order Number</th>
                    <th className="p-3">Customer</th>
                    <th className="p-3">Total (TZS)</th>
                    <th className="p-3">Payment Method</th>
                    <th className="p-3">Status</th>
                    <th className="p-3 text-right">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 text-slate-800">
                  {filtered.map((ord) => (
                    <tr key={ord.id} className="hover:bg-slate-50/80 transition">
                      <td className="p-3 font-mono font-bold text-primary">#{ord.ref || ord.orderNumber}</td>
                      <td className="p-3 font-semibold text-slate-900">{ord.customer || ord.buyer?.name || 'Retail Merchant'}</td>
                      <td className="p-3 font-mono font-bold text-slate-900">{formatTZS(ord.amountTZS || ord.totalAmountTZS)}</td>
                      <td className="p-3 text-slate-600 text-[11px] font-mono">{ord.paymentMethod || 'LUMO Payment Protection'}</td>
                      <td className="p-3">
                        <Badge className="bg-emerald-50 text-emerald-700 border-emerald-200 text-[10px] font-bold">
                          {ord.stage || ord.status}
                        </Badge>
                        {ord.assigned && (
                          <div className="text-[9px] text-primary font-bold mt-0.5">{ord.assigned}</div>
                        )}
                      </td>
                      <td className="p-3 text-right">
                        <Button
                          onClick={() => setSelectedOrder(ord)}
                          className="bg-primary hover:bg-primary/80 text-white font-bold text-[11px] h-7 px-3 gap-1 shadow-sm"
                        >
                          <UserPlus className="size-3" /> Assign Agent
                        </Button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </Card>

        {/* Right Col: Available Sourcing Agents */}
        <Card className="bg-white border-slate-200 p-5 shadow-sm space-y-4">
          <div className="flex items-center gap-2 border-b border-slate-100 pb-3">
            <Building2 className="size-5 text-primary" />
            <h3 className="text-base font-extrabold text-slate-900">Available Sourcing Agents</h3>
          </div>

          <div className="space-y-3 text-xs">
            {candidates.length === 0 ? (
              <div className="p-3 bg-amber-50 border border-amber-200 text-amber-800 rounded-lg text-center font-semibold">
                No active AGENT users in database. Registered Sourcing Agents will appear here.
              </div>
            ) : (
              candidates.map((cand) => (
                <div
                  key={cand.id}
                  className="p-3 bg-slate-50 border border-slate-200 rounded-lg space-y-2 hover:bg-slate-100/80 transition"
                >
                  <div className="flex items-center justify-between font-bold text-slate-900">
                    <span>{cand.name}</span>
                    <Badge className="bg-emerald-50 text-emerald-700 border-emerald-200 text-[9px]">
                      {cand.activeAssignmentsCount || 0} ACTIVE JOBS
                    </Badge>
                  </div>
                  <div className="text-[11px] text-slate-500 font-mono">Company: {cand.companyName || 'Lumo Agent'}</div>

                  {selectedOrder && (
                    <Button
                      onClick={() => handleAssignAgent(cand.id, cand.name)}
                      disabled={assigning}
                      className="w-full bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs h-8 gap-1.5"
                    >
                      Assign to #{selectedOrder.orderNumber}
                    </Button>
                  )}
                </div>
              ))
            )}
          </div>
        </Card>
      </div>
    </div>
  )
}
