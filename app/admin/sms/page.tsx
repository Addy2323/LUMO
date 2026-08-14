'use client'

import React, { useState, useEffect } from 'react'
import {
  Send,
  Plus,
  Clock,
  CheckCircle2,
  AlertCircle,
  Users,
  Search,
  Filter,
  RefreshCw,
  MessageSquare,
  FileText,
} from 'lucide-react'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { formatTZS } from '@/lib/format'
import { toast } from 'sonner'

export default function AdminSmsCampaignsPage() {
  const [campaigns, setCampaigns] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [modalOpen, setModalOpen] = useState(false)
  const [submitting, setSubmitting] = useState(false)

  // New Campaign Form State
  const [campaignName, setCampaignName] = useState('')
  const [targetRole, setTargetRole] = useState('ALL')
  const [messageContent, setMessageContent] = useState('Habari {{firstName}}, Karibu Lumo Commerce Platform! Tumia huduma zetu za sourcing na logistics kwa urahisi.')

  useEffect(() => {
    fetchCampaigns()
  }, [])

  async function fetchCampaigns() {
    setLoading(true)
    try {
      const res = await fetch('/api/admin/sms/campaigns')
      if (res.ok) {
        const data = await res.json()
        setCampaigns(data.campaigns || [])
      }
    } catch (err) {
      console.error('Failed to fetch campaigns:', err)
      toast.error('Failed to load campaigns from server')
    } finally {
      setLoading(false)
    }
  }

  async function handleCreateCampaign(e: React.FormEvent) {
    e.preventDefault()
    if (!campaignName || !messageContent) {
      toast.error('Campaign name and message content are required.')
      return
    }

    setSubmitting(true)
    try {
      const res = await fetch('/api/admin/sms/campaigns', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          campaignName,
          campaignType: 'SERVICE',
          senderId: 'LUMO',
          language: 'sw',
          messageContent,
          audienceFilter: JSON.stringify({ role: targetRole }),
        }),
      })

      const data = await res.json()
      if (res.ok && data.success) {
        toast.success(`Campaign created! Target Recipients: ${data.recipientCount}`)
        setModalOpen(false)
        setCampaignName('')
        fetchCampaigns()
      } else {
        toast.error(data.error || 'Failed to create campaign')
      }
    } catch (err) {
      console.error('Error creating campaign:', err)
      toast.error('Failed to dispatch campaign')
    } finally {
      setSubmitting(false)
    }
  }

  const filtered = campaigns.filter((c) =>
    (c.campaignName || '').toLowerCase().includes(search.toLowerCase()) ||
    (c.messageContent || '').toLowerCase().includes(search.toLowerCase())
  )

  return (
    <div className="flex flex-col gap-5 font-sans antialiased text-slate-900 bg-[#f8fafc] min-h-screen p-3 md:p-6 pb-24">
      {/* Top Bar */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-white p-4 rounded-xl border border-slate-200 shadow-sm">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-xl md:text-2xl font-black tracking-tight text-slate-900 flex items-center gap-2">
              <Send className="size-6 text-[#FF6B00]" /> Broadcast SMS Campaigns
            </h1>
            <Badge className="bg-orange-50 text-[#FF6B00] border-orange-200 text-[10px] font-bold">
              Live PostgreSQL Data
            </Badge>
          </div>
          <p className="text-xs text-slate-500 mt-0.5">
            Manage, dispatch, and track target audience SMS broadcasts for all platform user roles.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <Button
            onClick={() => setModalOpen(true)}
            className="bg-[#FF6B00] hover:bg-[#E05E00] text-white font-bold text-xs h-9 px-4 gap-1.5 shadow-sm"
          >
            <Plus className="size-4" /> Create Broadcast Campaign
          </Button>

          <Button
            onClick={fetchCampaigns}
            variant="outline"
            className="border-slate-200 bg-white text-slate-700 hover:bg-slate-50 text-xs font-bold h-9 px-3 gap-1.5"
          >
            <RefreshCw className={`size-3.5 text-slate-500 ${loading ? 'animate-spin' : ''}`} /> Refresh
          </Button>
        </div>
      </div>

      {/* KPI Ribbon */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3.5">
        <Card className="bg-white border-slate-200 p-4 shadow-sm">
          <span className="text-slate-500 text-xs font-semibold">Total Campaigns</span>
          <p className="text-2xl font-black text-slate-900 mt-1 font-mono">{campaigns.length}</p>
          <p className="text-[10px] text-slate-400 mt-1">Recorded in database</p>
        </Card>

        <Card className="bg-white border-slate-200 p-4 shadow-sm">
          <span className="text-slate-500 text-xs font-semibold">Total Recipients</span>
          <p className="text-2xl font-black text-emerald-600 mt-1 font-mono">
            {campaigns.reduce((acc, c) => acc + (c.recipientCount || 0), 0)}
          </p>
          <p className="text-[10px] text-emerald-700 mt-1 font-bold">Normalized E.164 phones</p>
        </Card>

        <Card className="bg-white border-slate-200 p-4 shadow-sm">
          <span className="text-slate-500 text-xs font-semibold">Approved Campaigns</span>
          <p className="text-2xl font-black text-blue-600 mt-1 font-mono">
            {campaigns.filter((c) => c.status === 'APPROVED' || c.status === 'COMPLETED').length}
          </p>
          <p className="text-[10px] text-slate-400 mt-1">Ready or dispatched</p>
        </Card>

        <Card className="bg-white border-slate-200 p-4 shadow-sm">
          <span className="text-slate-500 text-xs font-semibold">Pending Approval</span>
          <p className="text-2xl font-black text-amber-600 mt-1 font-mono">
            {campaigns.filter((c) => c.status === 'PENDING_APPROVAL').length}
          </p>
          <p className="text-[10px] text-amber-700 mt-1 font-bold">Requires 2-Person Review</p>
        </Card>
      </div>

      {/* Campaign List & Search */}
      <Card className="bg-white border-slate-200 p-4 shadow-sm space-y-4">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 border-b border-slate-100 pb-3">
          <div className="relative w-full md:w-80">
            <Search className="absolute left-3 top-2.5 size-4 text-slate-400" />
            <Input
              type="text"
              placeholder="Search campaigns..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-9 bg-slate-50 border-slate-200 text-xs h-9"
            />
          </div>

          <span className="text-xs text-slate-500 font-semibold">
            Showing {filtered.length} of {campaigns.length} campaigns
          </span>
        </div>

        {loading ? (
          <div className="py-12 text-center text-xs text-slate-400 flex items-center justify-center gap-2">
            <RefreshCw className="size-4 animate-spin text-[#FF6B00]" /> Loading campaigns from PostgreSQL...
          </div>
        ) : filtered.length === 0 ? (
          <div className="py-12 text-center space-y-2">
            <MessageSquare className="size-8 text-slate-300 mx-auto" />
            <p className="text-xs text-slate-500 font-semibold">No SMS campaigns found in database</p>
            <p className="text-[11px] text-slate-400">Click "Create Broadcast Campaign" to dispatch your first message.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="bg-slate-50 text-slate-500 border-b border-slate-200 uppercase font-bold text-[10px] tracking-wider">
                  <th className="p-3">Campaign Name</th>
                  <th className="p-3">Audience Filter</th>
                  <th className="p-3">Recipients</th>
                  <th className="p-3">Est. Cost</th>
                  <th className="p-3">Status</th>
                  <th className="p-3">Created Date</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-slate-800">
                {filtered.map((c) => (
                  <tr key={c.id} className="hover:bg-slate-50/80 transition">
                    <td className="p-3">
                      <div className="font-bold text-slate-900">{c.campaignName}</div>
                      <div className="text-[11px] text-slate-500 truncate max-w-xs">{c.messageContent}</div>
                    </td>
                    <td className="p-3">
                      <Badge className="bg-slate-100 text-slate-700 border-slate-200 text-[10px]">
                        {c.audienceFilter ? JSON.parse(c.audienceFilter).role || 'ALL' : 'ALL'}
                      </Badge>
                    </td>
                    <td className="p-3 font-mono font-bold text-slate-900">{c.recipientCount || 0}</td>
                    <td className="p-3 font-mono font-semibold text-slate-700">
                      {formatTZS(c.estimatedCostTzs || 0)}
                    </td>
                    <td className="p-3">
                      <Badge
                        className={`text-[10px] font-bold ${
                          c.status === 'APPROVED' || c.status === 'COMPLETED'
                            ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                            : c.status === 'PENDING_APPROVAL'
                            ? 'bg-amber-50 text-amber-700 border-amber-200'
                            : 'bg-slate-100 text-slate-700 border-slate-200'
                        }`}
                      >
                        {c.status}
                      </Badge>
                    </td>
                    <td className="p-3 text-slate-500 font-mono text-[11px]">
                      {new Date(c.createdAt).toLocaleDateString()}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </Card>

      {/* New Campaign Modal */}
      {modalOpen && (
        <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <Card className="bg-white border-slate-200 p-6 rounded-2xl shadow-xl w-full max-w-lg space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <h3 className="text-base font-extrabold text-slate-900">Create Broadcast SMS</h3>
              <button onClick={() => setModalOpen(false)} className="text-slate-400 hover:text-slate-600 text-xs font-bold">
                ✕ Close
              </button>
            </div>

            <form onSubmit={handleCreateCampaign} className="space-y-3.5 text-xs">
              <div className="space-y-1">
                <label className="font-bold text-slate-700">Campaign Title</label>
                <Input
                  type="text"
                  placeholder="e.g. Weekly Sourcing Update Broadcast"
                  value={campaignName}
                  onChange={(e) => setCampaignName(e.target.value)}
                  required
                  className="bg-slate-50 border-slate-200 h-9"
                />
              </div>

              <div className="space-y-1">
                <label className="font-bold text-slate-700">Target Role Audience</label>
                <select
                  value={targetRole}
                  onChange={(e) => setTargetRole(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 rounded-md h-9 px-3 text-xs outline-none"
                >
                  <option value="ALL">All Registered Users</option>
                  <option value="BUYER">Buyers & Retailers</option>
                  <option value="SALES">Sales Representatives</option>
                  <option value="AGENT">Sourcing Agents</option>
                  <option value="SUPPLIER">Suppliers & Factories</option>
                  <option value="LOGISTICS">Logistics Partners</option>
                </select>
              </div>

              <div className="space-y-1">
                <label className="font-bold text-slate-700">Swahili SMS Body (Max 160 chars per segment)</label>
                <textarea
                  rows={4}
                  value={messageContent}
                  onChange={(e) => setMessageContent(e.target.value)}
                  required
                  className="w-full bg-slate-50 border border-slate-200 rounded-md p-2.5 text-xs outline-none focus:border-[#FF6B00]"
                />
                <span className="text-[10px] text-slate-400 block text-right">
                  {messageContent.length} Chars | {Math.ceil(messageContent.length / 160)} Segment(s)
                </span>
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setModalOpen(false)}
                  className="border-slate-200 text-xs h-9"
                >
                  Cancel
                </Button>
                <Button
                  type="submit"
                  disabled={submitting}
                  className="bg-[#FF6B00] hover:bg-[#E05E00] text-white font-bold text-xs h-9 px-4 gap-1.5"
                >
                  {submitting ? <RefreshCw className="size-3.5 animate-spin" /> : <Send className="size-3.5" />}
                  Dispatch Broadcast
                </Button>
              </div>
            </form>
          </Card>
        </div>
      )}
    </div>
  )
}
