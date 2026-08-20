'use client'

import React, { useState, useEffect } from 'react'
import {
  LifeBuoy,
  Search,
  Filter,
  RefreshCw,
  MessageSquare,
  CheckCircle2,
  AlertTriangle,
  Clock,
  User,
  Package,
  ShieldCheck,
} from 'lucide-react'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { toast } from 'sonner'

export default function AdminSupportTicketsPage() {
  const [tickets, setTickets] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [statusFilter, setStatusFilter] = useState('ALL')
  const [selectedTicket, setSelectedTicket] = useState<any>(null)
  const [updating, setUpdating] = useState(false)
  const [responseMsg, setResponseMsg] = useState('')

  useEffect(() => {
    fetchTickets()
  }, [])

  async function fetchTickets() {
    setLoading(true)
    try {
      const res = await fetch('/api/support/tickets')
      if (res.ok) {
        const data = await res.json()
        setTickets(Array.isArray(data) ? data : [])
      }
    } catch (err) {
      console.error('Failed to fetch support tickets:', err)
      toast.error('Failed to load support tickets')
    } finally {
      setLoading(false)
    }
  }

  async function handleUpdateTicketStatus(newStatus: string) {
    if (!selectedTicket) return
    setUpdating(true)
    try {
      // Update dispute status
      const res = await fetch(`/api/admin/disputes`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          disputeId: selectedTicket.id,
          status: newStatus,
          adminComment: responseMsg || 'Status updated by Customer Ops Admin.',
        }),
      })

      if (res.ok) {
        toast.success(`Ticket ${selectedTicket.ticketNumber} updated to ${newStatus}`)
        setSelectedTicket(null)
        setResponseMsg('')
        fetchTickets()
      } else {
        toast.error('Failed to update ticket status')
      }
    } catch (err) {
      console.error('Error updating ticket:', err)
      toast.error('Failed to update ticket')
    } finally {
      setUpdating(false)
    }
  }

  const filtered = tickets.filter((t) => {
    const matchesSearch =
      (t.ticketNumber || '').toLowerCase().includes(search.toLowerCase()) ||
      (t.reason || '').toLowerCase().includes(search.toLowerCase()) ||
      (t.buyerId || '').toLowerCase().includes(search.toLowerCase())

    const matchesStatus = statusFilter === 'ALL' || t.status === statusFilter
    return matchesSearch && matchesStatus
  })

  return (
    <div className="flex flex-col gap-5 font-sans antialiased text-slate-900 bg-surface-secondary min-h-screen p-3 md:p-6 pb-24">
      {/* Top Bar */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-white p-4 rounded-xl border border-slate-200 shadow-sm">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-xl md:text-2xl font-black tracking-tight text-slate-900 flex items-center gap-2">
              <LifeBuoy className="size-6 text-primary" /> Customer Support Tickets &amp; Disputes
            </h1>
            <Badge className="bg-orange-50 text-primary border-orange-200 text-[10px] font-bold">
              Live PostgreSQL Data
            </Badge>
          </div>
          <p className="text-xs text-slate-500 mt-0.5">
            Operational desk for resolving order disputes, buyer inquiries, and partner support tickets.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <Button
            onClick={fetchTickets}
            variant="outline"
            className="border-slate-200 bg-white text-slate-700 hover:bg-slate-50 text-xs font-bold h-9 px-3 gap-1.5"
          >
            <RefreshCw className={`size-3.5 text-slate-500 ${loading ? 'animate-spin' : ''}`} /> Refresh Desk
          </Button>
        </div>
      </div>

      {/* KPI Ribbon */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3.5">
        <Card className="bg-white border-slate-200 p-4 shadow-sm">
          <span className="text-slate-500 text-xs font-semibold">Total Tickets</span>
          <p className="text-2xl font-black text-slate-900 mt-1 font-mono">{tickets.length}</p>
          <p className="text-[10px] text-slate-400 mt-1">Total disputes &amp; inquiries</p>
        </Card>

        <Card className="bg-white border-slate-200 p-4 shadow-sm">
          <span className="text-slate-500 text-xs font-semibold">Open / Action Required</span>
          <p className="text-2xl font-black text-rose-600 mt-1 font-mono">
            {tickets.filter((t) => t.status === 'OPEN' || t.status === 'PENDING').length}
          </p>
          <p className="text-[10px] text-rose-700 mt-1 font-bold">Priority SLA Queue</p>
        </Card>

        <Card className="bg-white border-slate-200 p-4 shadow-sm">
          <span className="text-slate-500 text-xs font-semibold">Under Investigation</span>
          <p className="text-2xl font-black text-amber-600 mt-1 font-mono">
            {tickets.filter((t) => t.status === 'UNDER_REVIEW').length}
          </p>
          <p className="text-[10px] text-slate-400 mt-1">Assigned to agents</p>
        </Card>

        <Card className="bg-white border-slate-200 p-4 shadow-sm">
          <span className="text-slate-500 text-xs font-semibold">Resolved Rate</span>
          <p className="text-2xl font-black text-emerald-600 mt-1 font-mono">
            {tickets.length > 0
              ? `${Math.round(
                  (tickets.filter((t) => t.status === 'RESOLVED' || t.status === 'CLOSED').length / tickets.length) * 100
                )}%`
              : '100%'}
          </p>
          <p className="text-[10px] text-emerald-700 mt-1 font-bold">Resolved within SLA</p>
        </Card>
      </div>

      {/* Main List */}
      <Card className="bg-white border-slate-200 p-4 shadow-sm space-y-4">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 border-b border-slate-100 pb-3">
          <div className="flex items-center gap-2 w-full md:w-auto">
            <div className="relative w-full md:w-72">
              <Search className="absolute left-3 top-2.5 size-4 text-slate-400" />
              <Input
                type="text"
                placeholder="Search ticket #, reason, buyer ID..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="pl-9 bg-slate-50 border-slate-200 text-xs h-9"
              />
            </div>

            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="bg-slate-50 border border-slate-200 rounded-md h-9 px-3 text-xs outline-none"
            >
              <option value="ALL">All Statuses</option>
              <option value="OPEN">Open</option>
              <option value="UNDER_REVIEW">Under Review</option>
              <option value="RESOLVED">Resolved</option>
              <option value="CLOSED">Closed</option>
            </select>
          </div>

          <span className="text-xs text-slate-500 font-semibold">
            Showing {filtered.length} of {tickets.length} tickets
          </span>
        </div>

        {loading ? (
          <div className="py-12 text-center text-xs text-slate-400 flex items-center justify-center gap-2">
            <RefreshCw className="size-4 animate-spin text-primary" /> Loading support tickets...
          </div>
        ) : filtered.length === 0 ? (
          <div className="py-12 text-center space-y-2">
            <LifeBuoy className="size-8 text-slate-300 mx-auto" />
            <p className="text-xs text-slate-500 font-semibold">No support tickets found</p>
            <p className="text-[11px] text-slate-400">All customer support tickets and order disputes will appear here.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="bg-slate-50 text-slate-500 border-b border-slate-200 uppercase font-bold text-[10px] tracking-wider">
                  <th className="p-3">Ticket #</th>
                  <th className="p-3">Issue / Reason</th>
                  <th className="p-3">Buyer ID</th>
                  <th className="p-3">Order Ref</th>
                  <th className="p-3">Status</th>
                  <th className="p-3">Created Date</th>
                  <th className="p-3 text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-slate-800">
                {filtered.map((t) => (
                  <tr key={t.id} className="hover:bg-slate-50/80 transition">
                    <td className="p-3 font-mono font-bold text-primary">{t.ticketNumber || t.id.slice(0, 8)}</td>
                    <td className="p-3 max-w-xs">
                      <div className="font-semibold text-slate-900 truncate">{t.reason || 'Support Request'}</div>
                    </td>
                    <td className="p-3 font-mono text-slate-600 text-[11px]">{t.buyerId ? t.buyerId.slice(0, 10) : 'Guest'}</td>
                    <td className="p-3 font-mono text-slate-600 text-[11px]">{t.orderId ? t.orderId.slice(0, 8) : 'N/A'}</td>
                    <td className="p-3">
                      <Badge
                        className={`text-[10px] font-bold ${
                          t.status === 'RESOLVED' || t.status === 'CLOSED'
                            ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                            : t.status === 'OPEN'
                            ? 'bg-rose-50 text-rose-700 border-rose-200'
                            : 'bg-amber-50 text-amber-700 border-amber-200'
                        }`}
                      >
                        {t.status}
                      </Badge>
                    </td>
                    <td className="p-3 text-slate-500 font-mono text-[11px]">
                      {new Date(t.createdAt).toLocaleDateString()}
                    </td>
                    <td className="p-3 text-right">
                      <Button
                        onClick={() => setSelectedTicket(t)}
                        variant="outline"
                        className="border-slate-200 text-slate-700 hover:bg-slate-50 text-[11px] h-7 px-2.5 font-bold"
                      >
                        Inspect &amp; Resolve
                      </Button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </Card>

      {/* Ticket Audit & Reply Modal */}
      {selectedTicket && (
        <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <Card className="bg-white border-slate-200 p-6 rounded-2xl shadow-xl w-full max-w-lg space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div>
                <span className="text-[10px] font-bold text-primary uppercase tracking-wider">Ticket Review</span>
                <h3 className="text-base font-extrabold text-slate-900">{selectedTicket.ticketNumber || selectedTicket.id}</h3>
              </div>
              <button onClick={() => setSelectedTicket(null)} className="text-slate-400 hover:text-slate-600 text-xs font-bold">
                ✕ Close
              </button>
            </div>

            <div className="space-y-3 text-xs bg-slate-50 p-3 rounded-lg border border-slate-100">
              <div><strong>Buyer ID:</strong> {selectedTicket.buyerId}</div>
              <div><strong>Order ID:</strong> {selectedTicket.orderId || 'None'}</div>
              <div><strong>Issue Description:</strong> {selectedTicket.reason}</div>
            </div>

            <div className="space-y-1 text-xs">
              <label className="font-bold text-slate-700">Admin Resolution Response</label>
              <textarea
                rows={3}
                value={responseMsg}
                onChange={(e) => setResponseMsg(e.target.value)}
                placeholder="Type resolution instructions or message to user..."
                className="w-full bg-slate-50 border border-slate-200 rounded-md p-2 text-xs outline-none focus:border-primary"
              />
            </div>

            <div className="flex justify-end gap-2 pt-2">
              <Button
                onClick={() => handleUpdateTicketStatus('UNDER_REVIEW')}
                disabled={updating}
                variant="outline"
                className="border-amber-200 bg-amber-50 text-amber-800 text-xs h-9 font-bold"
              >
                Mark Under Review
              </Button>
              <Button
                onClick={() => handleUpdateTicketStatus('RESOLVED')}
                disabled={updating}
                className="bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs h-9 px-4 gap-1.5"
              >
                <CheckCircle2 className="size-3.5" /> Resolve Ticket
              </Button>
            </div>
          </Card>
        </div>
      )}
    </div>
  )
}
