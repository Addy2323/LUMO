'use client'

import React, { useState, useEffect } from 'react'
import Link from 'next/link'
import {
  Activity,
  AlertCircle,
  AlertTriangle,
  ArrowUpRight,
  ArrowDownRight,
  ArrowRight,
  CheckCircle2,
  ChevronRight,
  Clock,
  FileText,
  Inbox,
  Info,
  Mail,
  MessageSquare,
  Plus,
  RefreshCw,
  Search,
  ShieldCheck,
  Sparkles,
  TrendingUp,
  User,
  Users,
  X,
  Zap,
} from 'lucide-react'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { toast } from 'sonner'

export function SalesDashboard() {
  const [showInfoBanner, setShowInfoBanner] = useState(true)
  const [queueTab, setQueueTab] = useState<'all' | 'enquiries' | 'rfqs' | 'orders' | 'disputes'>('all')
  const [completedFollowups, setCompletedFollowups] = useState<Record<string, boolean>>({})

  // Live PostgreSQL Data State
  const [data, setData] = useState<any>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchOverview()
  }, [])

  async function fetchOverview() {
    setLoading(true)
    try {
      const res = await fetch('/api/sales/overview')
      if (res.ok) {
        const json = await res.json()
        setData(json)
      }
    } catch (err) {
      console.error('Error fetching sales overview:', err)
      toast.error('Failed to connect to sales database')
    } finally {
      setLoading(false)
    }
  }

  // Toggle followup completion
  function toggleFollowup(id: string) {
    setCompletedFollowups((prev) => ({ ...prev, [id]: !prev[id] }))
    toast.success('Follow-up status updated')
  }

  const kpis = data?.kpis || {
    enquiriesCount: 0,
    myAssignedCount: 0,
    activeRfqsCount: 0,
    quotesAwaitingCount: 0,
    slaAtRiskCount: 0,
    conversionRate: 0,
  }

  const workQueue = data?.workQueue || []
  const followups = data?.followups || []
  const pipelineStages = data?.pipelineStages || []
  const escalations = data?.escalations || []
  const recentActivity = data?.recentActivity || []
  const teamMembers = data?.teamMembers || []

  const filteredQueue =
    queueTab === 'all'
      ? workQueue
      : workQueue.filter((i: any) => (i.category || '').toLowerCase() === queueTab)

  return (
    <div className="flex flex-col gap-5 font-sans antialiased text-slate-900 bg-[#f8fafc] min-h-screen p-3 md:p-6 pb-24">
      {/* 1. Header Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2.5">
            <h1 className="text-xl md:text-2xl font-black tracking-tight text-slate-900">
              Sales &amp; Customer Operations
            </h1>
            <span className="inline-flex items-center gap-1 text-[11px] font-bold text-[#FF6B00] bg-orange-50 border border-orange-200/80 px-2.5 py-0.5 rounded-full">
              <Sparkles className="size-3 text-[#FF6B00]" /> Lumo Live Database
            </span>
          </div>
          <p className="text-xs text-slate-500 mt-1">
            Manage enquiries, sourcing, quotations, orders and customer resolutions with real PostgreSQL data.
          </p>
        </div>

        <div className="flex items-center gap-2.5">
          <Button
            onClick={fetchOverview}
            variant="outline"
            size="sm"
            className="border-slate-300 bg-white text-slate-700 hover:bg-slate-50 text-xs font-bold h-9 px-3 gap-1.5 shadow-xs"
          >
            <RefreshCw className={`size-3.5 text-slate-500 ${loading ? 'animate-spin' : ''}`} /> Refresh Live Data
          </Button>

          <Button
            size="sm"
            className="bg-[#FF6B00] hover:bg-[#E05E00] text-white font-bold text-xs h-9 px-4 gap-1.5 shadow-sm"
            render={<Link href="/sales/quotations" />}
          >
            <FileText className="size-3.5" /> Create Quotation
          </Button>
        </div>
      </div>

      {/* 2. Dismissable Info Banner */}
      {showInfoBanner && (
        <div className="rounded-xl border border-blue-200/80 bg-blue-50/70 p-3 flex items-center justify-between text-xs text-blue-900 shadow-xs">
          <div className="flex items-center gap-2">
            <Info className="size-4 text-blue-600 shrink-0" />
            <span>Customer conversations remain within the Lumo Sales Desk.</span>
          </div>
          <button
            onClick={() => setShowInfoBanner(false)}
            className="text-blue-500 hover:text-blue-700 p-0.5 rounded-md hover:bg-blue-100 transition"
          >
            <X className="size-3.5" />
          </button>
        </div>
      )}

      {/* 3. Top 6 KPI Cards Row */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3.5">
        {/* Card 1 */}
        <Card className="bg-white border-slate-200/80 p-3.5 shadow-xs hover:border-[#FF6B00] transition">
          <div className="flex items-center justify-between">
            <div className="size-8 rounded-lg bg-blue-50 flex items-center justify-center text-blue-600">
              <Users className="size-4" />
            </div>
          </div>
          <div className="mt-2.5">
            <span className="text-[11px] font-bold text-slate-500">New Enquiries</span>
            <div className="text-2xl font-black text-slate-900 mt-0.5 font-mono">{kpis.enquiriesCount}</div>
          </div>
          <div className="mt-1 flex items-center gap-1 text-[10px] font-bold text-emerald-600">
            <span>Live DB count</span>
            <ArrowUpRight className="size-3" />
          </div>
        </Card>

        {/* Card 2 */}
        <Card className="bg-white border-slate-200/80 p-3.5 shadow-xs hover:border-[#FF6B00] transition">
          <div className="flex items-center justify-between">
            <div className="size-8 rounded-lg bg-emerald-50 flex items-center justify-center text-emerald-600">
              <User className="size-4" />
            </div>
          </div>
          <div className="mt-2.5">
            <span className="text-[11px] font-bold text-slate-500">My Assigned</span>
            <div className="text-2xl font-black text-slate-900 mt-0.5 font-mono">{kpis.myAssignedCount}</div>
          </div>
          <div className="mt-1 flex items-center gap-1 text-[10px] font-bold text-emerald-600">
            <span>Active assignments</span>
          </div>
        </Card>

        {/* Card 3 */}
        <Card className="bg-white border-slate-200/80 p-3.5 shadow-xs hover:border-[#FF6B00] transition">
          <div className="flex items-center justify-between">
            <div className="size-8 rounded-lg bg-purple-50 flex items-center justify-center text-purple-600">
              <FileText className="size-4" />
            </div>
          </div>
          <div className="mt-2.5">
            <span className="text-[11px] font-bold text-slate-500">Active RFQs</span>
            <div className="text-2xl font-black text-slate-900 mt-0.5 font-mono">{kpis.activeRfqsCount}</div>
          </div>
          <div className="mt-1 flex items-center gap-1 text-[10px] font-bold text-emerald-600">
            <span>Live requests</span>
          </div>
        </Card>

        {/* Card 4 */}
        <Card className="bg-white border-slate-200/80 p-3.5 shadow-xs hover:border-[#FF6B00] transition">
          <div className="flex items-center justify-between">
            <div className="size-8 rounded-lg bg-orange-50 flex items-center justify-center text-orange-600">
              <FileText className="size-4" />
            </div>
          </div>
          <div className="mt-2.5">
            <span className="text-[11px] font-bold text-slate-500">Quotes Awaiting</span>
            <div className="text-2xl font-black text-slate-900 mt-0.5 font-mono">{kpis.quotesAwaitingCount}</div>
          </div>
          <div className="mt-1 flex items-center gap-1 text-[10px] font-bold text-slate-500">
            <span>Awaiting decision</span>
          </div>
        </Card>

        {/* Card 5 */}
        <Card className="bg-white border-slate-200/80 p-3.5 shadow-xs hover:border-[#FF6B00] transition">
          <div className="flex items-center justify-between">
            <div className="size-8 rounded-lg bg-rose-50 flex items-center justify-center text-rose-600">
              <AlertTriangle className="size-4" />
            </div>
          </div>
          <div className="mt-2.5">
            <span className="text-[11px] font-bold text-slate-500">SLA at Risk</span>
            <div className="text-2xl font-black text-rose-600 mt-0.5 font-mono">{kpis.slaAtRiskCount}</div>
          </div>
          <div className="mt-1 flex items-center gap-1 text-[10px] font-bold text-rose-600">
            <span>Open disputes</span>
          </div>
        </Card>

        {/* Card 6 */}
        <Card className="bg-white border-slate-200/80 p-3.5 shadow-xs hover:border-[#FF6B00] transition">
          <div className="flex items-center justify-between">
            <div className="size-8 rounded-lg bg-cyan-50 flex items-center justify-center text-cyan-600">
              <TrendingUp className="size-4" />
            </div>
          </div>
          <div className="mt-2.5">
            <span className="text-[11px] font-bold text-slate-500">Conversion</span>
            <div className="text-2xl font-black text-slate-900 mt-0.5 font-mono">{kpis.conversionRate}%</div>
          </div>
          <div className="mt-1 flex items-center gap-1 text-[10px] font-bold text-emerald-600">
            <span>Live conversion</span>
          </div>
        </Card>
      </div>

      {/* 4. Priority Work Queue & Today's Follow-ups Split Row */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left 2 Cols: Priority Work Queue */}
        <Card className="bg-white border-slate-200/80 p-4 shadow-xs lg:col-span-2 space-y-3.5">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-100 pb-3">
            <h3 className="text-sm font-extrabold text-slate-900">Priority Work Queue</h3>

            <div className="flex items-center gap-1 bg-slate-100/70 p-1 rounded-lg text-xs font-bold">
              {(['all', 'enquiries', 'rfqs', 'orders', 'disputes'] as const).map((tab) => (
                <button
                  key={tab}
                  onClick={() => setQueueTab(tab)}
                  className={`px-2.5 py-1 rounded-md transition capitalize ${
                    queueTab === tab
                      ? 'bg-white text-slate-900 shadow-xs'
                      : 'text-slate-500 hover:text-slate-800'
                  }`}
                >
                  {tab === 'all' ? 'All' : tab.toUpperCase()}
                </button>
              ))}
            </div>
          </div>

          {loading ? (
            <div className="py-8 text-center text-xs text-slate-400 flex items-center justify-center gap-2">
              <RefreshCw className="size-4 animate-spin text-[#FF6B00]" /> Querying live PostgreSQL tables...
            </div>
          ) : filteredQueue.length === 0 ? (
            <div className="py-8 text-center text-xs text-slate-400">No items found in database queue</div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse text-xs">
                <thead>
                  <tr className="text-slate-400 border-b border-slate-100 font-bold text-[10px] uppercase tracking-wider">
                    <th className="pb-2.5">Reference</th>
                    <th className="pb-2.5">Customer</th>
                    <th className="pb-2.5">Type</th>
                    <th className="pb-2.5">Value</th>
                    <th className="pb-2.5">Owner</th>
                    <th className="pb-2.5">Priority</th>
                    <th className="pb-2.5">SLA</th>
                    <th className="pb-2.5 text-right">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 text-slate-800">
                  {filteredQueue.map((item: any) => (
                    <tr key={item.id} className="hover:bg-slate-50/70 transition">
                      <td className="py-3 font-mono font-bold text-blue-600">{item.reference}</td>
                      <td className="py-3 font-bold text-slate-900">{item.customer}</td>
                      <td className="py-3">
                        <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${item.typeBg}`}>
                          {item.type}
                        </span>
                      </td>
                      <td className="py-3 font-mono font-bold text-slate-900">{item.value}</td>
                      <td className="py-3">
                        <div className="flex items-center gap-1.5">
                          <div
                            className={`size-5 rounded-full ${item.ownerBg} text-white text-[9px] font-bold flex items-center justify-center shrink-0`}
                          >
                            {item.ownerAvatar}
                          </div>
                          <span className="font-semibold text-slate-700">{item.owner}</span>
                        </div>
                      </td>
                      <td className="py-3">
                        <span
                          className={`px-2 py-0.5 rounded-full text-[10px] font-bold border ${item.priorityBg}`}
                        >
                          {item.priority}
                        </span>
                      </td>
                      <td className="py-3 font-mono text-slate-600 font-semibold">
                        <span className="text-rose-500 font-bold">●</span> {item.sla}
                      </td>
                      <td className="py-3 text-right">
                        <Button
                          variant="outline"
                          size="sm"
                          className="h-6 px-2.5 text-[11px] font-bold border-rose-200 text-rose-600 hover:bg-rose-50 rounded"
                          render={<Link href={item.href} />}
                        >
                          {item.action}
                        </Button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          <div className="border-t border-slate-100 pt-2.5">
            <Link
              href="/sales/inbox"
              className="text-xs text-[#FF6B00] font-bold hover:underline inline-flex items-center gap-1"
            >
              View all items in queue <ArrowRight className="size-3.5" />
            </Link>
          </div>
        </Card>

        {/* Right Col: Today's Follow-ups */}
        <Card className="bg-white border-slate-200/80 p-4 shadow-xs space-y-3.5">
          <div className="flex items-center justify-between border-b border-slate-100 pb-3">
            <h3 className="text-sm font-extrabold text-slate-900">Today's Follow-ups</h3>
            <Button
              variant="outline"
              size="sm"
              className="h-7 px-2 text-[11px] font-bold border-slate-200 text-slate-700"
              render={<Link href="/sales/tasks" />}
            >
              <Clock className="size-3 mr-1" /> View Calendar
            </Button>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="text-slate-400 border-b border-slate-100 font-bold text-[10px] uppercase tracking-wider">
                  <th className="pb-2">Time</th>
                  <th className="pb-2">Customer</th>
                  <th className="pb-2">Task</th>
                  <th className="pb-2">Status</th>
                  <th className="pb-2 text-right">Complete</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-slate-800">
                {followups.map((f: any) => (
                  <tr key={f.id} className="hover:bg-slate-50/70 transition">
                    <td className="py-2.5 font-mono text-slate-500 font-semibold">{f.time}</td>
                    <td className="py-2.5 font-bold text-slate-900 max-w-[90px] truncate">{f.customer}</td>
                    <td className="py-2.5 text-slate-700 font-medium max-w-[120px] truncate">{f.task}</td>
                    <td className="py-2.5">
                      <span className={`px-2 py-0.5 rounded text-[9px] font-bold ${f.statusBg}`}>
                        {f.status}
                      </span>
                    </td>
                    <td className="py-2.5 text-right">
                      <input
                        type="checkbox"
                        checked={!!completedFollowups[f.id]}
                        onChange={() => toggleFollowup(f.id)}
                        className="size-3.5 accent-[#FF6B00] rounded cursor-pointer"
                      />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <div className="border-t border-slate-100 pt-2.5">
            <Link
              href="/sales/tasks"
              className="text-xs text-[#FF6B00] font-bold hover:underline inline-flex items-center gap-1"
            >
              View all follow-ups <ArrowRight className="size-3.5" />
            </Link>
          </div>
        </Card>
      </div>

      {/* 5. Sales Pipeline Chevron Workflow Section */}
      <Card className="bg-white border-slate-200/80 p-4 shadow-xs space-y-4">
        <div className="flex items-center justify-between border-b border-slate-100 pb-3">
          <h3 className="text-sm font-extrabold text-slate-900">Sales Pipeline (Live PostgreSQL)</h3>
          <Link
            href="/sales/pipeline"
            className="text-xs text-[#FF6B00] font-bold hover:underline inline-flex items-center gap-1"
          >
            View full pipeline <ArrowRight className="size-3.5" />
          </Link>
        </div>

        {/* Chevron Stage Headers */}
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-2">
          {pipelineStages.map((stage: any) => (
            <div key={stage.id} className="space-y-2">
              {/* Stage Pill */}
              <div className="bg-slate-100/90 text-slate-800 p-2 rounded-lg flex items-center justify-between border border-slate-200/60">
                <span className="text-xs font-extrabold truncate">{stage.title}</span>
                <span className="bg-blue-600 text-white text-[10px] font-bold px-1.5 py-0.2 rounded-full font-mono">
                  {stage.count}
                </span>
              </div>

              {/* Deal Cards */}
              <div className="space-y-2">
                {stage.deals.map((deal: any, idx: number) => (
                  <div
                    key={idx}
                    className="p-2.5 bg-white border border-slate-200/80 rounded-lg shadow-2xs hover:border-[#FF6B00] transition cursor-pointer space-y-1.5"
                  >
                    <div className="text-xs font-bold text-slate-900 truncate">{deal.name}</div>
                    <div className="flex items-center justify-between text-[11px]">
                      <span className="font-mono text-slate-500 font-bold">{deal.value}</span>
                      <div
                        className={`size-4.5 rounded-full ${deal.avatarBg} text-white text-[8px] font-bold flex items-center justify-center shrink-0`}
                      >
                        {deal.avatar}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      </Card>

      {/* 6. Bottom 3-Column Section */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Col 1: Urgent Escalations */}
        <Card className="bg-white border-slate-200/80 p-4 shadow-xs space-y-3">
          <div className="flex items-center justify-between border-b border-slate-100 pb-2.5">
            <h3 className="text-xs font-extrabold uppercase tracking-wider text-slate-900">
              Urgent Escalations
            </h3>
            <Link href="/sales/escalations" className="text-xs text-[#FF6B00] font-bold hover:underline">
              View all
            </Link>
          </div>

          <div className="space-y-2.5 text-xs">
            {escalations.length === 0 ? (
              <div className="text-slate-400 py-4 text-center">No urgent escalations</div>
            ) : (
              escalations.map((item: any) => (
                <div key={item.id} className="p-2.5 bg-rose-50/50 border border-rose-100 rounded-lg flex items-center justify-between">
                  <div className="flex items-start gap-2 min-w-0">
                    <AlertTriangle className="size-4 text-rose-600 shrink-0 mt-0.5" />
                    <div className="min-w-0">
                      <div className="font-bold text-slate-900 truncate">{item.title}</div>
                      <span className="text-[10px] text-slate-500 font-mono">{item.ref} • {item.due}</span>
                    </div>
                  </div>
                  <div className="flex flex-col items-end gap-1 shrink-0 ml-2">
                    <span className={`px-2 py-0.5 rounded text-[9px] font-bold ${item.priorityBg}`}>
                      {item.priority}
                    </span>
                    <Button variant="outline" size="sm" className={`h-6 px-2 text-[10px] font-bold ${item.actionBg}`}>
                      {item.action}
                    </Button>
                  </div>
                </div>
              ))
            )}
          </div>
        </Card>

        {/* Col 2: Recent Customer Activity */}
        <Card className="bg-white border-slate-200/80 p-4 shadow-xs space-y-3">
          <div className="flex items-center justify-between border-b border-slate-100 pb-2.5">
            <h3 className="text-xs font-extrabold uppercase tracking-wider text-slate-900">
              Recent Customer Activity
            </h3>
            <Link href="/sales/history" className="text-xs text-[#FF6B00] font-bold hover:underline">
              View all
            </Link>
          </div>

          <div className="space-y-3 text-xs">
            {recentActivity.map((act: any, idx: number) => (
              <div key={idx} className="flex items-start gap-2.5">
                <span className="font-mono text-[10px] text-slate-400 font-bold shrink-0 mt-0.5">{act.time}</span>
                <div className="min-w-0 flex-1 flex items-center justify-between">
                  <div>
                    <div className="font-bold text-slate-900">{act.customer}</div>
                    <p className="text-[11px] text-slate-600 truncate">{act.detail}</p>
                  </div>
                  {act.amount && (
                    <span className="px-2 py-0.5 bg-emerald-50 text-emerald-700 font-mono font-bold rounded text-[10px] border border-emerald-200">
                      {act.amount}
                    </span>
                  )}
                </div>
              </div>
            ))}
          </div>
        </Card>

        {/* Col 3: Team Capacity & SLA */}
        <Card className="bg-white border-slate-200/80 p-4 shadow-xs space-y-3">
          <div className="flex items-center justify-between border-b border-slate-100 pb-2.5">
            <h3 className="text-xs font-extrabold uppercase tracking-wider text-slate-900">
              Team Capacity &amp; SLA
            </h3>
            <Link href="/sales/workload" className="text-xs text-[#FF6B00] font-bold hover:underline">
              View team workload
            </Link>
          </div>

          <div className="space-y-3 text-xs">
            <div className="grid grid-cols-4 font-bold text-[10px] text-slate-400 uppercase tracking-wider border-b border-slate-100 pb-1.5">
              <span>Sales Officer</span>
              <span className="text-center">Active Cases</span>
              <span className="text-center">Workload</span>
              <span className="text-right">SLA Compliance</span>
            </div>

            {teamMembers.map((member: any, i: number) => (
              <div key={i} className="grid grid-cols-4 items-center gap-2">
                <div className="flex items-center gap-1.5 min-w-0">
                  <div className="size-5 rounded-full bg-slate-200 text-slate-800 text-[9px] font-bold flex items-center justify-center shrink-0">
                    {member.name.split(' ').map((n: string) => n[0]).join('')}
                  </div>
                  <span className="font-bold text-slate-900 truncate">{member.name}</span>
                </div>

                <span className="text-center font-mono font-bold text-slate-700">{member.cases}</span>

                <div className="px-1">
                  <div className="w-full bg-slate-100 h-2 rounded-full overflow-hidden">
                    <div
                      className={`h-full rounded-full ${member.workloadColor}`}
                      style={{ width: `${member.workload}%` }}
                    />
                  </div>
                </div>

                <div className="text-right">
                  <span className="px-2 py-0.5 bg-emerald-50 text-emerald-700 border border-emerald-200 rounded text-[10px] font-bold">
                    {member.sla}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </Card>
      </div>
    </div>
  )
}
