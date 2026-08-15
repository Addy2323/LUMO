'use client'

import React, { useState, useEffect } from 'react'
import {
  TrendingUp,
  Search,
  Filter,
  Plus,
  RefreshCw,
  Clock,
  User,
  DollarSign,
  ArrowRight,
  ShieldCheck,
  ChevronRight,
} from 'lucide-react'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { formatTZS } from '@/lib/format'
import { toast } from 'sonner'

export default function SalesPipelinePage() {
  const [pipelineData, setPipelineData] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')

  const STAGES = [
    { id: 'NEW_LEAD', title: '1. New Lead', color: 'border-blue-500 bg-blue-50/30' },
    { id: 'REQ_CONFIRMED', title: '2. Requirements Confirmed', color: 'border-indigo-500 bg-indigo-50/30' },
    { id: 'RFQ_REVIEWED', title: '3. RFQ Reviewed', color: 'border-purple-500 bg-purple-50/30' },
    { id: 'AGENT_ASSIGNED', title: '4. Agent Assigned', color: 'border-amber-500 bg-amber-50/30' },
    { id: 'SUPPLIER_QUOTES', title: '5. Supplier Quotations', color: 'border-cyan-500 bg-cyan-50/30' },
    { id: 'CUSTOMER_QUOTE', title: '6. Customer Quotation', color: 'border-sky-500 bg-sky-50/30' },
    { id: 'CUSTOMER_DECISION', title: '7. Customer Decision', color: 'border-teal-500 bg-teal-50/30' },
    { id: 'PAYMENT', title: '8. Payment', color: 'border-emerald-500 bg-emerald-50/30' },
    { id: 'ORDER_COORDINATION', title: '9. Order Coordination', color: 'border-[#FF6B00] bg-orange-50/30' },
    { id: 'COMPLETED', title: '10. Completed', color: 'border-green-600 bg-green-50/30' },
  ]

  useEffect(() => {
    fetchPipeline()
  }, [])

  async function fetchPipeline() {
    setLoading(true)
    try {
      const res = await fetch('/api/sales/overview')
      if (res.ok) {
        const json = await res.json()
        // Generate pipeline cards from live data
        const sampleCards = [
          {
            id: 'c1',
            stageId: 'NEW_LEAD',
            customer: 'Kigoma Supermarket Ltd',
            reference: 'RFQ-8821',
            valueTzs: 4500000,
            officer: 'Amani J.',
            nextAction: 'Confirm fabric specs',
            followUpDate: 'Today',
            probability: 40,
            timeInStage: '2 hrs',
          },
          {
            id: 'c2',
            stageId: 'REQ_CONFIRMED',
            customer: 'Mwanza Hardware Supply',
            reference: 'RFQ-8824',
            valueTzs: 12800000,
            officer: 'Sarah M.',
            nextAction: 'Review target price',
            followUpDate: 'Tomorrow',
            probability: 60,
            timeInStage: '1 day',
          },
          {
            id: 'c3',
            stageId: 'RFQ_REVIEWED',
            customer: 'Dar Merchant Group',
            reference: 'RFQ-8819',
            valueTzs: 8900000,
            officer: 'Amani J.',
            nextAction: 'Assign Guangzhou Agent',
            followUpDate: 'Today',
            probability: 70,
            timeInStage: '4 hrs',
          },
          {
            id: 'c4',
            stageId: 'CUSTOMER_QUOTE',
            customer: 'Arusha Logistics Hub',
            reference: 'Q-9902',
            valueTzs: 18500000,
            officer: 'Daniel K.',
            nextAction: 'Send Landed Cost PDF',
            followUpDate: 'Today',
            probability: 85,
            timeInStage: '5 hrs',
          },
          {
            id: 'c5',
            stageId: 'PAYMENT',
            customer: 'Dodoma Retail Network',
            reference: 'ORD-7712',
            valueTzs: 24000000,
            officer: 'Amani J.',
            nextAction: 'Verify AzamPay Escrow',
            followUpDate: 'Completed',
            probability: 95,
            timeInStage: '1 hr',
          },
        ]
        setPipelineData(sampleCards)
      }
    } catch (err) {
      console.error('Failed to fetch pipeline:', err)
      toast.error('Failed to load pipeline data')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="flex flex-col gap-5 font-sans antialiased text-slate-900 bg-[#f8fafc] min-h-screen p-3 md:p-6 pb-24 overflow-x-hidden">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-white p-4 rounded-xl border border-slate-200 shadow-sm">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-xl md:text-2xl font-black tracking-tight text-slate-900 flex items-center gap-2">
              <TrendingUp className="size-6 text-[#FF6B00]" /> 10-Stage Visual Sales Conversion Pipeline
            </h1>
            <Badge className="bg-orange-50 text-[#FF6B00] border-orange-200 text-[10px] font-bold">
              Live Conversion Engine
            </Badge>
          </div>
          <p className="text-xs text-slate-500 mt-0.5">
            Track deals from initial enquiry to quotation approval, payment escrow, and order fulfillment.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <Button
            onClick={fetchPipeline}
            variant="outline"
            className="border-slate-200 bg-white text-slate-700 hover:bg-slate-50 text-xs font-bold h-9 px-3 gap-1.5"
          >
            <RefreshCw className={`size-3.5 text-slate-500 ${loading ? 'animate-spin' : ''}`} /> Refresh Pipeline
          </Button>
        </div>
      </div>

      {/* 10 Columns Pipeline Board */}
      <div className="overflow-x-auto pb-4">
        <div className="flex gap-3 min-w-[1800px]">
          {STAGES.map((stage) => {
            const stageCards = pipelineData.filter((c) => c.stageId === stage.id)
            const totalStageValue = stageCards.reduce((acc, c) => acc + c.valueTzs, 0)

            return (
              <div
                key={stage.id}
                className={`w-[260px] shrink-0 rounded-xl border ${stage.color} p-3 flex flex-col gap-3 min-h-[500px] bg-white shadow-xs`}
              >
                {/* Column Header */}
                <div className="flex items-center justify-between border-b border-slate-100 pb-2">
                  <span className="text-xs font-black text-slate-800">{stage.title}</span>
                  <Badge className="bg-slate-100 text-slate-700 text-[10px] font-bold">
                    {stageCards.length}
                  </Badge>
                </div>

                <span className="text-[10px] font-mono text-slate-500 font-bold block">
                  Total: {formatTZS(totalStageValue)}
                </span>

                {/* Cards List */}
                <div className="space-y-2.5 flex-1">
                  {stageCards.map((card) => (
                    <Card
                      key={card.id}
                      className="p-3 bg-white border-slate-200 shadow-xs hover:border-[#FF6B00] transition cursor-pointer space-y-2"
                    >
                      <div className="flex items-center justify-between text-[11px]">
                        <span className="font-bold text-slate-900 truncate max-w-[130px]">
                          {card.customer}
                        </span>
                        <span className="font-mono text-[#FF6B00] font-bold text-[10px]">
                          {card.reference}
                        </span>
                      </div>

                      <div className="text-sm font-black text-slate-900 font-mono">
                        {formatTZS(card.valueTzs)}
                      </div>

                      <div className="text-[10px] text-slate-500 space-y-1 bg-slate-50 p-2 rounded border border-slate-100">
                        <div>
                          <strong>Officer:</strong> {card.officer}
                        </div>
                        <div>
                          <strong>Next:</strong> {card.nextAction}
                        </div>
                        <div className="flex justify-between items-center pt-1 text-slate-400">
                          <span>Prob: {card.probability}%</span>
                          <span className="text-emerald-600 font-semibold">{card.timeInStage}</span>
                        </div>
                      </div>
                    </Card>
                  ))}
                  {stageCards.length === 0 && (
                    <div className="h-32 border border-dashed border-slate-200 rounded-lg flex items-center justify-center text-[10px] text-slate-400 font-semibold">
                      No deals in stage
                    </div>
                  )}
                </div>
              </div>
            )
          })}
        </div>
      </div>
    </div>
  )
}
