'use client'

import React, { useState, useEffect } from 'react'
import {
  Scale,
  Search,
  Filter,
  RefreshCw,
  AlertTriangle,
  CheckCircle2,
  FileText,
  Clock,
  ShieldCheck,
  Package,
  Truck,
  Building2,
  Lock,
  ArrowRight,
} from 'lucide-react'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { formatTZS } from '@/lib/format'
import { toast } from 'sonner'

export default function SalesDisputeDeskPage() {
  const [disputes, setDisputes] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [selectedDispute, setSelectedDispute] = useState<any>(null)
  const [updating, setUpdating] = useState(false)
  const [recommendationMsg, setRecommendationMsg] = useState('')

  const DISPUTE_STAGES = [
    'New',
    'Evidence Collection',
    'Under Investigation',
    'Supplier Response',
    'Logistics Response',
    'Resolution Proposed',
    'Customer Decision',
    'Closed',
  ]

  useEffect(() => {
    fetchDisputes()
  }, [])

  async function fetchDisputes() {
    setLoading(true)
    try {
      const res = await fetch('/api/admin/disputes')
      if (res.ok) {
        const data = await res.json()
        setDisputes(data.disputes || [])
        if (data.disputes && data.disputes.length > 0) {
          setSelectedDispute(data.disputes[0])
        }
      }
    } catch (err) {
      console.error('Failed to fetch disputes:', err)
      toast.error('Failed to load dispute desk')
    } finally {
      setLoading(false)
    }
  }

  async function handleRecommendResolution(actionType: string) {
    if (!selectedDispute) return
    setUpdating(true)
    try {
      const res = await fetch('/api/admin/disputes', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          disputeId: selectedDispute.id,
          status: 'RESOLVED',
          adminComment: `Sales Recommendation: ${actionType}. ${recommendationMsg}`,
        }),
      })

      if (res.ok) {
        toast.success(`Resolution (${actionType}) submitted for Dispute #${selectedDispute.id.slice(0, 8)}!`)
        fetchDisputes()
      } else {
        toast.error('Failed to record resolution decision')
      }
    } catch (err) {
      console.error('Error submitting resolution:', err)
      toast.error('Failed to submit resolution')
    } finally {
      setUpdating(false)
    }
  }

  const filtered = disputes.filter(
    (d) =>
      (d.reason || '').toLowerCase().includes(search.toLowerCase()) ||
      (d.orderId || '').toLowerCase().includes(search.toLowerCase()) ||
      (d.buyerId || '').toLowerCase().includes(search.toLowerCase())
  )

  return (
    <div className="flex flex-col gap-5 font-sans antialiased text-slate-900 bg-[#f8fafc] min-h-screen p-3 md:p-6 pb-24">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-white p-4 rounded-xl border border-slate-200 shadow-sm">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-xl md:text-2xl font-black tracking-tight text-slate-900 flex items-center gap-2">
              <Scale className="size-6 text-[#FF6B00]" /> 8-Stage Dispute Resolution Workspace
            </h1>
            <Badge className="bg-rose-50 text-rose-700 border-rose-200 text-[10px] font-bold">
              Escrow Safeguard Active
            </Badge>
          </div>
          <p className="text-xs text-slate-500 mt-0.5">
            Structured 8-step mediation workspace for investigating merchant claims, supplier evidence, and authorizing escrow refunds.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <Button
            onClick={fetchDisputes}
            variant="outline"
            className="border-slate-200 bg-white text-slate-700 hover:bg-slate-50 text-xs font-bold h-9 px-3 gap-1.5"
          >
            <RefreshCw className={`size-3.5 text-slate-500 ${loading ? 'animate-spin' : ''}`} /> Refresh Workspace
          </Button>
        </div>
      </div>

      {/* 8-Stage Progression Banner */}
      <Card className="bg-white border-slate-200 p-4 shadow-sm space-y-2">
        <span className="text-xs font-extrabold uppercase tracking-wider text-slate-500">
          8-Stage Mediation Workflow
        </span>
        <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-8 gap-2 text-center text-[10px]">
          {DISPUTE_STAGES.map((stg, i) => (
            <div
              key={stg}
              className={`p-2 rounded-lg border font-bold ${
                i === 2
                  ? 'bg-orange-50 border-[#FF6B00] text-[#FF6B00]'
                  : 'bg-slate-50 border-slate-200 text-slate-600'
              }`}
            >
              <div className="text-[9px] text-slate-400 font-mono">Stage {i + 1}</div>
              <div className="truncate">{stg}</div>
            </div>
          ))}
        </div>
      </Card>

      {/* Grid: Dispute List & Investigation Workspace */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column: Dispute Directory */}
        <Card className="bg-white border-slate-200 p-4 shadow-sm space-y-3">
          <div className="relative">
            <Search className="absolute left-3 top-2.5 size-4 text-slate-400" />
            <Input
              type="text"
              placeholder="Search dispute reason, order ID..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-9 bg-slate-50 border-slate-200 text-xs h-9"
            />
          </div>

          <div className="space-y-2 max-h-[600px] overflow-y-auto pr-1">
            {loading ? (
              <div className="py-8 text-center text-xs text-slate-400">Loading dispute queue...</div>
            ) : filtered.length === 0 ? (
              <div className="py-8 text-center text-xs text-slate-400">No active disputes</div>
            ) : (
              filtered.map((disp) => (
                <div
                  key={disp.id}
                  onClick={() => setSelectedDispute(disp)}
                  className={`p-3 rounded-lg border text-xs cursor-pointer transition space-y-1 ${
                    selectedDispute?.id === disp.id
                      ? 'bg-rose-50/80 border-rose-400 shadow-xs'
                      : 'bg-white border-slate-200 hover:bg-slate-50'
                  }`}
                >
                  <div className="flex items-center justify-between font-bold text-slate-900">
                    <span className="font-mono text-[#FF6B00]">DSP-{disp.id.slice(0, 8)}</span>
                    <Badge className="bg-rose-100 text-rose-800 text-[9px] uppercase font-bold">
                      {disp.status}
                    </Badge>
                  </div>
                  <div className="font-semibold text-slate-800 truncate">{disp.reason || 'Merchant Claim'}</div>
                  <div className="flex justify-between items-center text-[10px] text-slate-500 font-mono pt-1">
                    <span>Order: {disp.orderId ? disp.orderId.slice(0, 8) : 'N/A'}</span>
                    <span className="font-bold text-slate-900">{formatTZS(disp.order?.totalAmountTZS || 4500000)}</span>
                  </div>
                </div>
              ))
            )}
          </div>
        </Card>

        {/* Right 2 Columns: Dispute Investigation Workspace */}
        <Card className="bg-white border-slate-200 p-5 shadow-sm lg:col-span-2 space-y-5">
          {selectedDispute ? (
            <>
              {/* Header Info */}
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-100 pb-4">
                <div>
                  <div className="flex items-center gap-2">
                    <h2 className="text-lg font-black text-slate-900 font-mono">
                      DSP-{selectedDispute.id.slice(0, 8)}
                    </h2>
                    <Badge className="bg-amber-50 text-amber-700 border-amber-200 text-[10px] font-bold">
                      Under Investigation
                    </Badge>
                  </div>
                  <p className="text-xs text-slate-500 font-medium mt-0.5">
                    Disputed Order: {selectedDispute.orderId || 'ORD-9902'} · Risk Amount:{' '}
                    <strong className="text-rose-600 font-mono">{formatTZS(selectedDispute.order?.totalAmountTZS || 4500000)}</strong>
                  </p>
                </div>
              </div>

              {/* Evidence Section */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-3 text-xs">
                <div className="p-3 bg-slate-50 rounded-lg border border-slate-200 space-y-1">
                  <span className="text-[10px] font-bold text-slate-500 uppercase flex items-center gap-1">
                    <FileText className="size-3 text-blue-600" /> Customer Statement
                  </span>
                  <p className="text-slate-800 font-medium">{selectedDispute.reason || 'Goods received damaged during freight transit.'}</p>
                </div>

                <div className="p-3 bg-slate-50 rounded-lg border border-slate-200 space-y-1">
                  <span className="text-[10px] font-bold text-slate-500 uppercase flex items-center gap-1">
                    <Building2 className="size-3 text-purple-600" /> Supplier Response
                  </span>
                  <p className="text-slate-800 font-medium">Factory provided origin packaging inspection photos matching specification.</p>
                </div>

                <div className="p-3 bg-slate-50 rounded-lg border border-slate-200 space-y-1">
                  <span className="text-[10px] font-bold text-slate-500 uppercase flex items-center gap-1">
                    <Truck className="size-3 text-amber-600" /> Logistics Evidence
                  </span>
                  <p className="text-slate-800 font-medium">Electronic Waybill #EWB-881 signed at Dar Port with container seal intact.</p>
                </div>
              </div>

              {/* Resolution Action Panel */}
              <div className="space-y-3 pt-2">
                <label className="font-bold text-slate-700 text-xs">Recommended Resolution Note</label>
                <textarea
                  rows={3}
                  value={recommendationMsg}
                  onChange={(e) => setRecommendationMsg(e.target.value)}
                  placeholder="State evidence findings and justification..."
                  className="w-full bg-slate-50 border border-slate-200 rounded-md p-2 text-xs outline-none focus:border-[#FF6B00]"
                />

                <div className="flex flex-wrap items-center justify-end gap-2 pt-1">
                  <Button
                    onClick={() => handleRecommendResolution('Full Refund')}
                    disabled={updating}
                    className="bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs h-9 px-4 gap-1.5"
                  >
                    <CheckCircle2 className="size-3.5" /> Authorize Escrow Refund
                  </Button>

                  <Button
                    onClick={() => handleRecommendResolution('Replacement Dispatch')}
                    disabled={updating}
                    variant="outline"
                    className="border-blue-200 bg-blue-50 text-blue-800 text-xs h-9 px-4 font-bold"
                  >
                    Authorize Free Replacement
                  </Button>

                  <Button
                    onClick={() => handleRecommendResolution('Dispute Rejected')}
                    disabled={updating}
                    variant="outline"
                    className="border-rose-200 bg-rose-50 text-rose-800 text-xs h-9 px-4 font-bold"
                  >
                    Reject Claim
                  </Button>
                </div>
              </div>
            </>
          ) : (
            <div className="py-20 text-center text-xs text-slate-400">Select a dispute from the left queue</div>
          )}
        </Card>
      </div>
    </div>
  )
}
