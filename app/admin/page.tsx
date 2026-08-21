'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import {
  ShoppingBag,
  FileText,
  AlertTriangle,
  Truck,
  DollarSign,
  Search,
  Filter,
  Plus,
  Send,
  Bell,
  Globe,
  RotateCw,
  Settings,
  Activity,
  CheckCircle2,
  Info,
  UserPlus,
  MessageSquare,
} from 'lucide-react'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog'
import { formatTZS, cleanProductTitle } from '@/lib/format'
import { toast } from 'sonner'
import { OrderProductThumbnail } from '@/components/account/order-product-thumbnail'

type PipelineStage =
  | 'New'
  | 'Paid'
  | 'Sales Review'
  | 'Agent Assigned'
  | 'Supplier Processing'
  | 'Inspection'
  | 'Logistics'
  | 'Delivered'

type OrderCard = {
  id: string
  ref: string
  customer: string
  amountTZS: number
  subtotalTZS?: number
  shippingFeeTZS?: number
  taxAmountTZS?: number
  paymentMethod?: string
  paymentStatus?: string
  createdAt?: string
  location: string
  stage: PipelineStage
  priority: 'High' | 'Normal' | 'Low' | 'Delivered'
  assigned?: string
  dotColor?: string
  image?: string
  itemTitle?: string
  items?: Array<{
    id: string
    title: string
    imageUrl: string
    quantity: number
    variant?: string
    unitPriceTZS: number
    totalPriceTZS: number
  }>
}

type Candidate = {
  id: string
  name: string
  role: string
  workloadCount: number
  maxCapacity: number
  capacityStatus: string
  percentage: number
}

type OverviewMetrics = {
  paidOrders: number
  unassignedOrders: number
  slaAtRisk: number
  shipmentsInTransit: number
  pendingSettlementsTZS: number
}

const PIPELINE_STAGES: PipelineStage[] = [
  'New',
  'Paid',
  'Sales Review',
  'Agent Assigned',
  'Supplier Processing',
  'Inspection',
  'Logistics',
  'Delivered',
]

export default function AdminOperationsPage() {
  const [orders, setOrders] = useState<OrderCard[]>([])
  const [stageCounts, setStageCounts] = useState<Record<string, number>>({})
  const [metrics, setMetrics] = useState<OverviewMetrics>({
    paidOrders: 0,
    unassignedOrders: 0,
    slaAtRisk: 0,
    shipmentsInTransit: 0,
    pendingSettlementsTZS: 0,
  })
  const [candidates, setCandidates] = useState<Candidate[]>([])
  const [loading, setLoading] = useState(true)
  const [candidatesLoading, setCandidatesLoading] = useState(false)
  const [selectedRole, setSelectedRole] = useState<'Sales' | 'Agents' | 'Suppliers' | 'Logistics'>('Sales')
  const [search, setSearch] = useState('')
  const [selectedOrder, setSelectedOrder] = useState<OrderCard | null>(null)
  const [assignmentModalOpen, setAssignmentModalOpen] = useState(false)
  const [assignModalOrderId, setAssignModalOrderId] = useState('')
  const [assignModalRole, setAssignModalRole] = useState('Agents')
  const [assignModalCandidateId, setAssignModalCandidateId] = useState('')

  // Broadcast SMS Modal State
  const [smsModalOpen, setSmsModalOpen] = useState(false)
  const [smsCampaignName, setSmsCampaignName] = useState('Platform Operational Update')
  const [smsAudience, setSmsAudience] = useState('ALL')
  const [smsSenderId, setSmsSenderId] = useState('LUMO')
  const [smsMessage, setSmsMessage] = useState('')
  const [isSendingSms, setIsSendingSms] = useState(false)

  // Fetch real PostgreSQL data on mount
  useEffect(() => {
    fetchLiveData()
  }, [])

  // Fetch candidate list when role tab changes
  useEffect(() => {
    fetchCandidates(selectedRole)
  }, [selectedRole])

  async function fetchLiveData() {
    setLoading(true)
    try {
      const [overviewRes, pipelineRes] = await Promise.all([
        fetch('/api/admin/operations/overview'),
        fetch('/api/admin/orders/pipeline'),
      ])

      if (overviewRes.ok) {
        const json = await overviewRes.json()
        if (json.data) setMetrics(json.data)
      }

      if (pipelineRes.ok) {
        const json = await pipelineRes.json()
        if (json.data) {
          setOrders(json.data.orders || [])
          setStageCounts(json.data.stages || {})
        }
      }
    } catch (err) {
      console.error('Failed to load admin operations data from PostgreSQL:', err)
    } finally {
      setLoading(false)
    }
  }

  async function fetchCandidates(role: string) {
    setCandidatesLoading(true)
    try {
      const res = await fetch(`/api/admin/assignment-candidates?role=${role}`)
      if (res.ok) {
        const json = await res.json()
        if (json.data) setCandidates(json.data)
      }
    } catch (err) {
      console.error('Failed to load candidates:', err)
    } finally {
      setCandidatesLoading(false)
    }
  }

  async function handleUpdateOrderStage(
    orderId: string,
    stage: PipelineStage,
    assigneeId?: string,
    assigneeName?: string,
    assignmentRole?: string
  ) {
    try {
      const res = await fetch('/api/admin/orders/pipeline', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          orderId,
          stage,
          assigneeId,
          assigneeName,
          assignmentRole,
        }),
      })

      const json = await res.json()
      if (res.ok && json.success) {
        toast.success(`Order ${json.order.orderNumber} stage updated to '${stage}'${assigneeName ? ` (${assigneeName})` : ''}!`)
        fetchLiveData()
        if (selectedOrder && (selectedOrder.id === orderId || selectedOrder.ref === orderId)) {
          setSelectedOrder((prev: any) => (prev ? { ...prev, stage, assigned: json.order.assignedTo || prev.assigned } : null))
        }
      } else {
        toast.error(json.error || 'Failed to update order stage.')
      }
    } catch (err) {
      console.error('Failed to update stage:', err)
      toast.error('Network error updating order stage.')
    }
  }

  async function handleCreateAssignment() {
    if (!assignModalOrderId) {
      toast.error('Please select an order to assign.')
      return
    }

    const selectedCand = candidates.find((c) => c.id === assignModalCandidateId)
    await handleUpdateOrderStage(
      assignModalOrderId,
      'Agent Assigned',
      selectedCand?.id,
      selectedCand?.name || (assignModalCandidateId ? 'Assigned Staff' : undefined),
      assignModalRole
    )
    setAssignmentModalOpen(false)
  }

  async function handleBroadcastSms() {
    if (!smsCampaignName.trim() || !smsMessage.trim()) {
      toast.error('Please enter a campaign name and message content.')
      return
    }

    setIsSendingSms(true)
    try {
      const res = await fetch('/api/admin/sms/campaigns', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          campaignName: smsCampaignName,
          campaignType: 'SERVICE',
          senderId: smsSenderId,
          language: 'sw',
          messageContent: smsMessage,
          audienceFilter: { role: smsAudience },
        }),
      })

      const json = await res.json()
      if (res.ok && json.success) {
        toast.success(`Broadcast SMS Campaign Dispatched! Target Recipients: ${json.recipientCount}`)
        setSmsModalOpen(false)
        setSmsMessage('')
      } else {
        toast.error(json.error || 'Failed to dispatch SMS broadcast.')
      }
    } catch (err) {
      console.error('SMS Broadcast error:', err)
      toast.error('Network error dispatching SMS campaign.')
    } finally {
      setIsSendingSms(false)
    }
  }

  const filteredOrders = orders.filter(
    (o) =>
      o.ref.toLowerCase().includes(search.toLowerCase()) ||
      o.customer.toLowerCase().includes(search.toLowerCase())
  )

  const roleLabelMap = {
    Sales: 'Sales Representatives',
    Agents: 'Sourcing Agents',
    Suppliers: 'Verified Suppliers',
    Logistics: 'Logistics Partners',
  }

  const smsSegmentCount = Math.ceil((smsMessage.length || 1) / 160)

  return (
    <div className="flex flex-col gap-5 font-sans antialiased text-slate-900 bg-surface-secondary min-h-screen p-3 md:p-5 pb-24">
      {/* Top Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-white p-4 rounded-xl border border-slate-200 shadow-sm">
        <div>
          <h1 className="text-xl md:text-2xl font-black tracking-tight text-slate-900 flex items-center gap-2">
            Admin Operations &amp; Governance
          </h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Operate, assign, and govern the six-role commerce workflow with real-time oversight.
          </p>
        </div>

        <div className="flex items-center gap-2.5">
          <Button
            onClick={() => setAssignmentModalOpen(true)}
            className="bg-primary hover:bg-primary/80 text-white font-bold text-xs h-9 px-3.5 rounded-lg shadow-sm gap-1.5"
          >
            <Plus className="size-4 stroke-[3]" /> Create Assignment
          </Button>

          <Button
            onClick={() => setSmsModalOpen(true)}
            variant="outline"
            className="border-primary text-primary hover:bg-orange-50 text-xs font-extrabold h-9 px-3.5 rounded-lg shadow-sm gap-1.5"
          >
            <Send className="size-3.5" /> Broadcast SMS
          </Button>

          <div className="flex items-center gap-2 pl-2 border-l border-slate-200">
            <button className="p-1.5 text-slate-500 hover:text-slate-700 relative">
              <Bell className="size-4" />
              <span className="absolute top-1 right-1 size-2 rounded-full bg-primary" />
            </button>

            <button className="p-1.5 text-slate-500 hover:text-slate-700">
              <Globe className="size-4" />
            </button>

            <div className="flex items-center gap-2 pl-1">
              <div className="size-8 rounded-full bg-primary text-white font-black text-xs flex items-center justify-center shadow-sm">
                AM
              </div>
              <div className="hidden sm:block text-left text-xs">
                <p className="font-bold text-slate-900 leading-none">Administrator</p>
                <p className="text-[10px] text-slate-500">Super Admin</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* 5 Operational KPI Cards */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
        <Card className="bg-white border-slate-200 p-3.5 shadow-sm relative overflow-hidden">
          <div className="flex items-center justify-between text-slate-500 text-xs font-semibold">
            <span>Paid Orders</span>
            <div className="size-8 rounded-lg bg-emerald-50 text-emerald-600 flex items-center justify-center">
              <ShoppingBag className="size-4" />
            </div>
          </div>
          <div className="mt-1.5 flex items-baseline gap-2">
            <span className="text-xl font-black text-slate-900">{metrics.paidOrders}</span>
            <span className="text-[10px] font-bold text-emerald-600">Live DB</span>
          </div>
        </Card>

        <Card className="bg-white border-slate-200 p-3.5 shadow-sm relative overflow-hidden">
          <div className="flex items-center justify-between text-slate-500 text-xs font-semibold">
            <span>Unassigned Orders</span>
            <div className="size-8 rounded-lg bg-amber-50 text-amber-600 flex items-center justify-center">
              <FileText className="size-4" />
            </div>
          </div>
          <div className="mt-1.5 flex items-baseline gap-2">
            <span className="text-xl font-black text-slate-900">{metrics.unassignedOrders}</span>
            <span className="text-[10px] font-bold text-emerald-600">Live DB</span>
          </div>
        </Card>

        <Card className="bg-white border-slate-200 p-3.5 shadow-sm relative overflow-hidden">
          <div className="flex items-center justify-between text-slate-500 text-xs font-semibold">
            <span>SLA at Risk</span>
            <div className="size-8 rounded-lg bg-rose-50 text-rose-600 flex items-center justify-center">
              <AlertTriangle className="size-4" />
            </div>
          </div>
          <div className="mt-1.5 flex items-baseline gap-2">
            <span className="text-xl font-black text-slate-900">{metrics.slaAtRisk}</span>
            <span className="text-[10px] font-bold text-rose-600">Live DB</span>
          </div>
        </Card>

        <Card className="bg-white border-slate-200 p-3.5 shadow-sm relative overflow-hidden">
          <div className="flex items-center justify-between text-slate-500 text-xs font-semibold">
            <span>Shipments in Transit</span>
            <div className="size-8 rounded-lg bg-blue-50 text-blue-600 flex items-center justify-center">
              <Truck className="size-4" />
            </div>
          </div>
          <div className="mt-1.5 flex items-baseline gap-2">
            <span className="text-xl font-black text-slate-900">{metrics.shipmentsInTransit}</span>
            <span className="text-[10px] font-bold text-emerald-600">Live DB</span>
          </div>
        </Card>

        <Card className="bg-white border-slate-200 p-3.5 shadow-sm relative overflow-hidden col-span-2 md:col-span-1">
          <div className="flex items-center justify-between text-slate-500 text-xs font-semibold">
            <span>Pending Settlements</span>
            <div className="size-8 rounded-lg bg-purple-50 text-purple-600 flex items-center justify-center">
              <DollarSign className="size-4" />
            </div>
          </div>
          <div className="mt-1.5 flex items-baseline gap-2">
            <span className="text-lg font-black text-slate-900 font-mono">
              {formatTZS(metrics.pendingSettlementsTZS)}
            </span>
          </div>
        </Card>
      </div>

      {/* Filter Toolbar */}
      <div className="flex flex-wrap items-center justify-between gap-3 bg-white p-3 rounded-xl border border-slate-200 shadow-sm text-xs">
        <div className="flex flex-wrap items-center gap-3">
          <div className="flex items-center gap-1.5">
            <span className="text-slate-500 font-medium">Order Type</span>
            <select className="bg-slate-50 border border-slate-200 text-slate-800 rounded px-2 py-1 text-xs font-semibold outline-none">
              <option>All</option>
              <option>Sourcing RFQ</option>
              <option>Marketplace</option>
            </select>
          </div>

          <div className="flex items-center gap-1.5">
            <span className="text-slate-500 font-medium">Region</span>
            <select className="bg-slate-50 border border-slate-200 text-slate-800 rounded px-2 py-1 text-xs font-semibold outline-none">
              <option>All Regions</option>
              <option>Dar es Salaam</option>
              <option>Mwanza</option>
              <option>Arusha</option>
            </select>
          </div>

          <div className="flex items-center gap-1.5">
            <span className="text-slate-500 font-medium">Priority</span>
            <select className="bg-slate-50 border border-slate-200 text-slate-800 rounded px-2 py-1 text-xs font-semibold outline-none">
              <option>All</option>
              <option>High</option>
              <option>Normal</option>
              <option>Low</option>
            </select>
          </div>
        </div>

        <div className="flex items-center gap-2 w-full sm:w-auto">
          <div className="relative flex-1 sm:w-64">
            <Search className="absolute left-3 top-2.5 size-3.5 text-slate-400" />
            <Input
              placeholder="Search orders by ref, customer..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-8 text-xs bg-slate-50 border-slate-200 h-8 text-slate-800 placeholder:text-slate-400"
            />
          </div>
          <Button onClick={fetchLiveData} variant="outline" size="sm" className="h-8 border-slate-200 bg-white text-slate-700 hover:bg-slate-50 text-xs font-bold gap-1">
            <RotateCw className={`size-3.5 text-slate-500 ${loading ? 'animate-spin' : ''}`} /> Refresh
          </Button>
        </div>
      </div>

      {/* Main Grid: All 8 Pipeline Stages + Assignment Intelligence Sidebar */}
      <div className="grid grid-cols-1 xl:grid-cols-4 gap-4 items-start">
        {/* 8-Stage Live Order Pipeline */}
        <div className="xl:col-span-3 space-y-2.5 overflow-hidden">
          <div className="flex items-center justify-between">
            <h2 className="text-xs md:text-sm font-extrabold text-slate-900 flex items-center gap-2">
              Live Order Pipeline
              <span className="text-[10px] text-emerald-700 font-medium flex items-center gap-1 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200">
                <span className="size-1.5 rounded-full bg-emerald-500 animate-pulse" /> Direct PostgreSQL connection
              </span>
            </h2>

            <div className="flex items-center gap-3 text-xs text-slate-500">
              <span className="text-[11px] font-medium flex items-center gap-1">
                Auto-refresh <RotateCw onClick={fetchLiveData} className="size-3 cursor-pointer hover:text-slate-800" />
              </span>
            </div>
          </div>

          {/* Kanban Container - Responsive grid */}
          <div className="overflow-x-auto pb-3 custom-scrollbar">
            <div className="grid grid-cols-8 gap-2 min-w-[1080px]">
              {PIPELINE_STAGES.map((stage) => {
                const colOrders = filteredOrders.filter((o) => o.stage === stage)
                const count = stageCounts[stage] || colOrders.length

                return (
                  <div key={stage} className="bg-slate-100/80 border border-slate-200 rounded-xl p-1.5 flex flex-col gap-1.5 shrink-0 min-w-0">
                    <div className="flex items-center justify-between px-1 py-0.5 border-b border-slate-200/60">
                      <span className="font-black text-[10px] text-slate-800 truncate" title={stage}>{stage}</span>
                      <span className="font-mono text-[9px] bg-slate-200 text-slate-700 px-1 py-0.2 rounded font-bold shrink-0">
                        {count}
                      </span>
                    </div>

                    <div className="flex flex-col gap-1.5 min-h-[360px] max-h-[460px] overflow-y-auto pr-0.5">
                      {colOrders.length === 0 ? (
                        <div className="text-[10px] text-slate-400 italic text-center py-8">
                          No orders
                        </div>
                      ) : (
                        colOrders.map((ord: any) => (
                          <Card
                            key={ord.id}
                            onClick={() => setSelectedOrder(ord)}
                            className="bg-white border-slate-200 p-2 hover:border-primary hover:shadow-md cursor-pointer transition-all space-y-1.5 shadow-sm"
                          >
                            <div className="flex items-start gap-2">
                              <OrderProductThumbnail src={ord.image} alt={ord.itemTitle || ord.ref} className="size-10 rounded-lg shrink-0" />
                              <div className="min-w-0 flex-1">
                                <span className="font-mono font-black text-[10px] text-slate-900 truncate block">{ord.ref}</span>
                                <p className="font-bold text-[10px] text-slate-800 line-clamp-1">{cleanProductTitle(ord.itemTitle) || ord.customer}</p>
                                <p className="text-[9px] text-slate-500 truncate">{ord.customer}</p>
                              </div>
                            </div>

                            <div className="flex items-center justify-between text-[9px]">
                              <span className="text-slate-500 font-mono font-bold">{formatTZS(ord.amountTZS)}</span>
                              <span className="text-slate-400 truncate">{ord.location}</span>
                            </div>

                            <div className="pt-1 flex items-center justify-between border-t border-slate-100 mt-1" onClick={(e) => e.stopPropagation()}>
                              <span
                                className={`text-[8px] font-extrabold px-1 py-0.2 rounded uppercase ${
                                  ord.priority === 'High'
                                    ? 'bg-rose-100 text-rose-700'
                                    : ord.priority === 'Low'
                                    ? 'bg-blue-100 text-blue-700'
                                    : 'bg-slate-100 text-slate-600'
                                }`}
                              >
                                {ord.priority}
                              </span>

                              <select
                                value={ord.stage}
                                onChange={(e) => handleUpdateOrderStage(ord.id, e.target.value as PipelineStage)}
                                className="text-[9px] bg-slate-50 border border-slate-200 rounded px-1 py-0.5 font-bold text-slate-800 hover:border-primary cursor-pointer"
                              >
                                {PIPELINE_STAGES.map((s) => (
                                  <option key={s} value={s}>
                                    {s}
                                  </option>
                                ))}
                              </select>
                            </div>

                            {ord.assigned && (
                              <p className="text-[8px] text-primary font-bold pt-0.5 truncate">
                                {ord.assigned}
                              </p>
                            )}
                          </Card>
                        ))
                      )}
                    </div>

                    {count > 3 && (
                      <div className="text-center pt-1 border-t border-slate-200/60">
                        <span className="text-[9px] font-bold text-slate-500 hover:text-slate-800 cursor-pointer">
                          + {count - 3} more
                        </span>
                      </div>
                    )}
                  </div>
                )
              })}
            </div>
          </div>
        </div>

        {/* Right Side Panel: Assignment Intelligence Sidebar */}
        <div className="space-y-4">
          <Card className="bg-white border-slate-200 p-3.5 space-y-3.5 shadow-sm">
            <div className="flex items-center justify-between border-b border-slate-100 pb-2.5">
              <div>
                <h3 className="font-extrabold text-xs text-slate-900">Assignment Intelligence</h3>
                <p className="text-[10px] text-slate-500 mt-0.5">Live database capacity</p>
              </div>
              <Info className="size-4 text-slate-400" />
            </div>

            {/* Role Tabs */}
            <div className="flex border-b border-slate-200">
              {(['Sales', 'Agents', 'Suppliers', 'Logistics'] as const).map((role) => (
                <button
                  key={role}
                  onClick={() => setSelectedRole(role)}
                  className={`flex-1 py-1.5 text-center text-xs font-bold transition-all border-b-2 ${
                    selectedRole === role
                      ? 'border-primary text-primary'
                      : 'border-transparent text-slate-400 hover:text-slate-600'
                  }`}
                >
                  {role}
                </button>
              ))}
            </div>

            {/* Candidate List */}
            <div className="space-y-3 pt-1">
              <div className="flex justify-between items-center text-[9px] font-black text-slate-400 uppercase tracking-wider px-1">
                <span>User</span>
                <span className="text-right">Workload &amp; Capacity</span>
              </div>

              {candidatesLoading ? (
                <div className="text-center py-6 text-xs text-slate-400 flex items-center justify-center gap-2">
                  <RotateCw className="size-3.5 animate-spin" /> Querying database...
                </div>
              ) : candidates.length === 0 ? (
                <div className="text-center py-6 px-3 bg-slate-50 rounded-xl border border-slate-200 space-y-2">
                  <p className="text-xs font-extrabold text-slate-800">
                    No registered {roleLabelMap[selectedRole]} in database
                  </p>
                  <p className="text-[10px] text-slate-500">
                    Create system users under Governance &gt; Users &amp; Roles.
                  </p>
                  <Link href="/admin/users">
                    <Button variant="outline" size="sm" className="h-7 text-[10px] font-bold mt-1 border-slate-300 gap-1">
                      <UserPlus className="size-3 text-primary" /> + Add {selectedRole} User
                    </Button>
                  </Link>
                </div>
              ) : (
                candidates.map((c) => (
                  <div key={c.id} className="flex items-center justify-between gap-2 p-2 rounded-lg bg-slate-50 border border-slate-100 hover:border-slate-200 transition-colors">
                    <div className="flex items-center gap-2 min-w-0 flex-1">
                      <div className="size-7 rounded-full bg-slate-200 text-slate-800 font-bold text-xs flex items-center justify-center shrink-0">
                        {c.name[0]}
                      </div>
                      <span className="font-bold text-slate-900 truncate text-[11px] leading-snug">{c.name}</span>
                    </div>

                    <div className="flex items-center gap-2 shrink-0">
                      <div className="w-20 text-right">
                        <div className="h-1.5 rounded-full bg-slate-200 overflow-hidden mb-1">
                          <div
                            className={`h-full ${
                              c.percentage > 75 ? 'bg-rose-500' : c.percentage > 50 ? 'bg-amber-500' : 'bg-emerald-500'
                            }`}
                            style={{ width: `${Math.max(c.percentage, 5)}%` }}
                          />
                        </div>
                        <span className="text-[9px] text-slate-500 font-mono font-semibold block leading-none">
                          {c.workloadCount} / {c.maxCapacity} orders
                        </span>
                      </div>

                      <span
                        className={`text-[9px] font-extrabold px-1.5 py-0.5 rounded ${
                          c.capacityStatus === 'High'
                            ? 'bg-rose-100 text-rose-700'
                            : c.capacityStatus === 'Busy'
                            ? 'bg-amber-100 text-amber-700'
                            : 'bg-emerald-100 text-emerald-700'
                        }`}
                      >
                        {c.capacityStatus}
                      </span>
                    </div>
                  </div>
                ))
              )}

              <Button
                onClick={() => setAssignmentModalOpen(true)}
                className="w-full bg-primary hover:bg-primary/80 text-white font-bold text-xs h-9 mt-2 rounded-lg shadow-sm gap-2"
              >
                Assign Order <Send className="size-3.5" />
              </Button>
            </div>
          </Card>
        </div>
      </div>

      {/* Broadcast SMS Modal */}
      {smsModalOpen && (
        <Dialog open onOpenChange={setSmsModalOpen}>
          <DialogContent className="max-w-md bg-white text-slate-900 p-6 space-y-4 rounded-xl shadow-xl">
            <DialogHeader>
              <DialogTitle className="text-base font-black text-slate-900 flex items-center gap-2 border-b border-slate-100 pb-3">
                <Send className="size-5 text-primary" /> Broadcast SMS Campaign
              </DialogTitle>
            </DialogHeader>

            <div className="space-y-3.5 text-xs">
              <div className="space-y-1">
                <label className="font-bold text-slate-700">Campaign Title</label>
                <Input
                  value={smsCampaignName}
                  onChange={(e) => setSmsCampaignName(e.target.value)}
                  placeholder="e.g. Platform Order SLA Update"
                  className="bg-slate-50 border-slate-300 text-slate-900 h-9"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="font-bold text-slate-700">Target Audience</label>
                  <select
                    value={smsAudience}
                    onChange={(e) => setSmsAudience(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-300 rounded-md p-2 text-xs font-semibold text-slate-900"
                  >
                    <option value="ALL">All Active Users</option>
                    <option value="BUYER">Buyers &amp; Customers</option>
                    <option value="SALES">Sales Staff</option>
                    <option value="AGENT">Sourcing Agents</option>
                    <option value="SUPPLIER">Verified Suppliers</option>
                    <option value="LOGISTICS">Logistics Partners</option>
                  </select>
                </div>

                <div className="space-y-1">
                  <label className="font-bold text-slate-700">Sender ID</label>
                  <Input
                    value={smsSenderId}
                    onChange={(e) => setSmsSenderId(e.target.value)}
                    placeholder="LUMO"
                    className="bg-slate-50 border-slate-300 text-slate-900 h-9 font-mono uppercase"
                  />
                </div>
              </div>

              <div className="space-y-1">
                <div className="flex justify-between items-center">
                  <label className="font-bold text-slate-700">Message Content (Swahili / English)</label>
                  <span className="text-[10px] font-mono text-slate-500">
                    {smsMessage.length} chars ({smsSegmentCount} SMS {smsSegmentCount === 1 ? 'Segment' : 'Segments'})
                  </span>
                </div>
                <textarea
                  rows={4}
                  value={smsMessage}
                  onChange={(e) => setSmsMessage(e.target.value)}
                  placeholder="Habari, Lumo Platform updates: Order LUMO-100982 has been dispatched..."
                  className="w-full bg-slate-50 border border-slate-300 rounded-md p-2.5 text-xs text-slate-900 placeholder:text-slate-400 outline-none focus:border-primary"
                />
              </div>
            </div>

            <DialogFooter className="mt-4 flex items-center justify-between gap-2 border-t border-slate-100 pt-3">
              <Button variant="outline" size="sm" onClick={() => setSmsModalOpen(false)} className="border-slate-300 text-slate-700 text-xs">
                Cancel
              </Button>
              <Button
                size="sm"
                disabled={isSendingSms}
                onClick={handleBroadcastSms}
                className="bg-primary hover:bg-primary/80 text-white font-bold text-xs gap-1.5"
              >
                {isSendingSms ? <RotateCw className="size-3.5 animate-spin" /> : <Send className="size-3.5" />}
                Dispatch Broadcast SMS
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      )}

      {/* Order Operational Detail Modal */}
      {selectedOrder && (
        <Dialog open onOpenChange={() => setSelectedOrder(null)}>
          <DialogContent className="max-w-2xl bg-white text-slate-900 p-6 space-y-4">
            <DialogHeader>
              <DialogTitle className="text-lg font-black flex items-center justify-between text-slate-900 border-b border-slate-100 pb-3">
                <div className="flex items-center gap-2">
                  <span className="font-mono text-primary">{selectedOrder.ref}</span>
                  <Badge className="bg-emerald-100 text-emerald-700 text-[10px]">{selectedOrder.stage}</Badge>
                </div>
                <span className="font-mono text-slate-900 text-base">{formatTZS(selectedOrder.amountTZS)}</span>
              </DialogTitle>
            </DialogHeader>

            <div className="space-y-4 text-xs">
              {/* Payment & Customer Metadata */}
              <div className="grid grid-cols-3 gap-3 p-3 bg-slate-50 rounded-xl border border-slate-200">
                <div className="space-y-0.5">
                  <span className="text-[10px] text-slate-500 font-bold uppercase">Customer</span>
                  <p className="font-extrabold text-slate-900 text-xs">{selectedOrder.customer}</p>
                </div>
                <div className="space-y-0.5">
                  <span className="text-[10px] text-slate-500 font-bold uppercase">Location</span>
                  <p className="font-bold text-slate-800 text-xs">{selectedOrder.location}</p>
                </div>
                <div className="space-y-0.5">
                  <span className="text-[10px] text-slate-500 font-bold uppercase">Payment Guarantee</span>
                  <p className="font-bold text-emerald-700 text-xs flex items-center gap-1">
                    <CheckCircle2 className="size-3.5 text-emerald-600" />
                    {selectedOrder.stage === 'Paid' ? 'PAID (LUMO Trade Protection)' : 'Pending Authorization'}
                  </p>
                </div>
              </div>

              {/* Product Line Items */}
              <div className="space-y-2">
                <h4 className="font-extrabold text-slate-900 text-xs uppercase tracking-wider text-slate-500">
                  Paid Line Items ({selectedOrder.items?.length || 1})
                </h4>
                <div className="space-y-2 max-h-48 overflow-y-auto pr-1">
                  {selectedOrder.items && selectedOrder.items.length > 0 ? (
                    selectedOrder.items.map((item) => (
                      <div
                        key={item.id}
                        className="flex items-center justify-between gap-3 p-2.5 bg-white border border-slate-200 rounded-xl shadow-xs"
                      >
                        <div className="flex items-center gap-3 min-w-0 flex-1">
                          <OrderProductThumbnail
                            src={item.imageUrl}
                            alt={item.title}
                            className="size-12 rounded-lg shrink-0"
                          />
                          <div className="min-w-0 flex-1">
                            <p className="font-bold text-slate-900 text-xs line-clamp-1">{cleanProductTitle(item.title)}</p>
                            <p className="text-[10px] text-slate-500">
                              {item.variant ? `Variant: ${item.variant} • ` : ''}Qty: <strong className="text-slate-800">{item.quantity}</strong>
                            </p>
                          </div>
                        </div>

                        <div className="text-right shrink-0">
                          <p className="font-mono font-black text-slate-900 text-xs">{formatTZS(item.totalPriceTZS)}</p>
                          <p className="text-[9px] text-slate-400 font-mono">
                            {formatTZS(item.unitPriceTZS)} each
                          </p>
                        </div>
                      </div>
                    ))
                  ) : (
                    <div className="flex items-center gap-3 p-2.5 bg-white border border-slate-200 rounded-xl">
                      <OrderProductThumbnail
                        src={selectedOrder.image}
                        alt={selectedOrder.itemTitle || selectedOrder.ref}
                        className="size-12 rounded-lg shrink-0"
                      />
                      <div className="min-w-0 flex-1">
                        <p className="font-bold text-slate-900 text-xs">{selectedOrder.itemTitle || 'Wholesale B2B Goods'}</p>
                        <p className="text-[10px] text-slate-500">Verified Database Order Item</p>
                      </div>
                      <div className="text-right">
                        <p className="font-mono font-black text-slate-900 text-xs">{formatTZS(selectedOrder.amountTZS)}</p>
                      </div>
                    </div>
                  )}
                </div>
              </div>

              {/* Financial Math Summary */}
              <div className="p-3 bg-slate-900 text-white rounded-xl space-y-1.5 font-mono text-xs">
                <div className="flex justify-between text-slate-300">
                  <span>Subtotal:</span>
                  <span>{formatTZS(selectedOrder.subtotalTZS || selectedOrder.amountTZS)}</span>
                </div>
                {selectedOrder.shippingFeeTZS !== undefined && (
                  <div className="flex justify-between text-slate-300">
                    <span>Doorstep Logistics:</span>
                    <span>{formatTZS(selectedOrder.shippingFeeTZS)}</span>
                  </div>
                )}
                <div className="flex justify-between text-emerald-400 font-bold border-t border-slate-800 pt-1.5 text-sm">
                  <span>Total Settled Amount:</span>
                  <span>{formatTZS(selectedOrder.amountTZS)}</span>
                </div>
              </div>
            </div>

            <div className="pt-2 border-t border-slate-200 flex items-center justify-between gap-3 text-xs">
              <div className="flex items-center gap-2">
                <span className="font-bold text-slate-700">Update Pipeline Stage:</span>
                <select
                  value={selectedOrder.stage}
                  onChange={(e) => handleUpdateOrderStage(selectedOrder.id, e.target.value as PipelineStage)}
                  className="bg-slate-50 border border-slate-300 rounded px-2 py-1 font-extrabold text-slate-900 cursor-pointer"
                >
                  {PIPELINE_STAGES.map((s) => (
                    <option key={s} value={s}>
                      {s}
                    </option>
                  ))}
                </select>
              </div>

              <DialogFooter className="gap-2">
                <Button variant="outline" size="sm" onClick={() => setSelectedOrder(null)} className="border-slate-300 text-slate-700 text-xs font-bold">
                  Close
                </Button>
                <Button
                  size="sm"
                  onClick={() => {
                    setAssignModalOrderId(selectedOrder.id)
                    setSelectedOrder(null)
                    setAssignmentModalOpen(true)
                  }}
                  className="bg-primary hover:bg-primary/80 text-white font-bold text-xs"
                >
                  + Assign Agent / Staff
                </Button>
              </DialogFooter>
            </div>
          </DialogContent>
        </Dialog>
      )}

      {/* Create Order Assignment Modal */}
      {assignmentModalOpen && (
        <Dialog open onOpenChange={setAssignmentModalOpen}>
          <DialogContent className="max-w-md bg-white text-slate-900 p-6 space-y-4">
            <DialogHeader>
              <DialogTitle className="text-base font-black text-slate-900 flex items-center gap-2">
                <Plus className="size-5 text-primary" /> Create New Order Assignment
              </DialogTitle>
            </DialogHeader>

            <div className="space-y-3 text-xs">
              <div className="space-y-1">
                <label className="font-bold text-slate-700">Select Order</label>
                <select
                  value={assignModalOrderId}
                  onChange={(e) => setAssignModalOrderId(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-300 rounded p-2 text-xs text-slate-900 font-bold"
                >
                  <option value="">-- Choose Active Order --</option>
                  {orders.map((o) => (
                    <option key={o.id} value={o.id}>
                      {o.ref} · {o.customer} ({formatTZS(o.amountTZS)})
                    </option>
                  ))}
                </select>
              </div>

              <div className="space-y-1">
                <label className="font-bold text-slate-700">Assignee Role</label>
                <select
                  value={assignModalRole}
                  onChange={(e) => {
                    const r = e.target.value
                    setAssignModalRole(r)
                    let roleKey = 'Agents'
                    if (r.includes('Sales')) roleKey = 'Sales'
                    else if (r.includes('Supplier')) roleKey = 'Suppliers'
                    else if (r.includes('Logistics')) roleKey = 'Logistics'
                    fetchCandidates(roleKey)
                  }}
                  className="w-full bg-slate-50 border border-slate-300 rounded p-2 text-xs text-slate-900 font-semibold"
                >
                  <option value="Sourcing Agent">Sourcing Agent</option>
                  <option value="Sales Representative">Sales Representative</option>
                  <option value="Supplier">Supplier</option>
                  <option value="Inspector">Inspector</option>
                  <option value="Logistics Partner">Logistics Partner</option>
                </select>
              </div>

              <div className="space-y-1">
                <label className="font-bold text-slate-700">Select Registered Candidate User</label>
                <select
                  value={assignModalCandidateId}
                  onChange={(e) => setAssignModalCandidateId(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-300 rounded p-2 text-xs text-slate-900 font-semibold"
                >
                  <option value="">-- Unassigned (General Queue) --</option>
                  {candidates.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.name} ({c.role}) · Workload: {c.workloadCount}/{c.maxCapacity}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <DialogFooter className="mt-4">
              <Button variant="outline" size="sm" onClick={() => setAssignmentModalOpen(false)} className="border-slate-300 text-slate-700 text-xs">
                Cancel
              </Button>
              <Button size="sm" onClick={handleCreateAssignment} className="bg-primary hover:bg-primary/80 text-white font-bold text-xs">
                Create &amp; Dispatch Assignment
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      )}
    </div>
  )
}
