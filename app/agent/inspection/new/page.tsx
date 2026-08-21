'use client'

import { useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import {
  ShieldCheck,
  Building2,
  ArrowRight,
  ChevronLeft,
  CheckCircle2,
  AlertCircle,
  Calculator,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { useAgentStore } from '@/lib/stores/agent-store'
import { calculateAqlSamplingPlan } from '@/lib/aql-engine'
import { toast } from 'sonner'

export default function NewInspectionPage() {
  const router = useRouter()
  const { orders, activeCountry } = useAgentStore()

  const hubOrders = orders.filter((o) => o.assignedCountry === activeCountry)
  const [selectedOrderId, setSelectedOrderId] = useState<string>(hubOrders[0]?.id || '')
  const [inspectionType, setInspectionType] = useState('Pre-shipment')
  const [lotSize, setLotSize] = useState('100')
  const [inspectionLevel, setInspectionLevel] = useState('Level II')
  const [notes, setNotes] = useState('')
  const [isInitializing, setIsInitializing] = useState(false)

  const selectedOrder = hubOrders.find((o) => o.id === selectedOrderId) || hubOrders[0]
  const aqlPlan = calculateAqlSamplingPlan(Number(lotSize) || 100)

  async function handleCreateInspection(e: React.FormEvent) {
    e.preventDefault()

    if (!selectedOrder) {
      toast.error('Please select an assigned order for inspection.')
      return
    }

    setIsInitializing(true)
    try {
      const res = await fetch('/api/agent/inspections', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          orderId: selectedOrder.id,
          orderNumber: selectedOrder.orderNumber,
          hub: activeCountry,
          inspectionType,
          lotSize: Number(lotSize),
          inspectionLevel,
          notes,
        }),
      })

      const data = await res.json()
      if (data.success && data.inspection) {
        toast.success(`Inspection ${data.inspection.inspectionRef} created! Redirecting to studio...`)
        router.push(`/agent/inspection/${data.inspection.id}`)
      } else {
        toast.error(data.error || 'Failed to initialize inspection.')
      }
    } catch (err) {
      toast.error('Network error initializing inspection.')
    } finally {
      setIsInitializing(false)
    }
  }

  return (
    <div className="max-w-4xl mx-auto space-y-8 text-white font-sans">
      <div className="flex items-center justify-between">
        <div>
          <Link href="/agent/inspection" className="text-xs text-slate-400 hover:text-white font-mono flex items-center gap-1 mb-1">
            <ChevronLeft className="size-3" /> Back to Inspections Dashboard
          </Link>
          <h1 className="text-2xl font-extrabold font-heading text-white flex items-center gap-2">
            <ShieldCheck className="size-6 text-brand-400" />
            Initialize Quality Inspection Wizard
          </h1>
          <p className="text-xs text-slate-400 font-mono">
            Active Country Hub: <strong className="text-brand-400">{activeCountry}</strong> · Server-Authoritative Eligibility Check
          </p>
        </div>
      </div>

      <form onSubmit={handleCreateInspection} className="space-y-6">
        {/* Step 1: Assigned Order Selection */}
        <Card className="bg-slate-900 border-slate-800">
          <CardHeader className="p-5 border-b border-slate-800">
            <CardTitle className="text-base font-extrabold text-white flex items-center gap-2">
              <Building2 className="size-4 text-brand-400" /> 1. Select Assigned Sourcing Order
            </CardTitle>
          </CardHeader>
          <CardContent className="p-6 space-y-4">
            {hubOrders.length === 0 ? (
              <div className="p-6 text-center text-slate-400 text-xs font-mono border border-dashed border-slate-800 rounded-xl">
                No active orders assigned to {activeCountry} Hub requiring inspection.
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {hubOrders.map((ord) => (
                  <div
                    key={ord.id}
                    onClick={() => setSelectedOrderId(ord.id)}
                    className={`p-4 rounded-xl border cursor-pointer transition-all ${
                      selectedOrderId === ord.id
                        ? 'border-brand-500 bg-brand-500/10'
                        : 'border-slate-800 bg-slate-950/60 hover:border-slate-700'
                    }`}
                  >
                    <div className="flex items-start justify-between">
                      <div>
                        <h4 className="font-extrabold text-white text-sm font-mono">#{ord.orderNumber}</h4>
                        <p className="text-xs text-slate-300 font-semibold">{ord.productName}</p>
                      </div>
                      {selectedOrderId === ord.id && <CheckCircle2 className="size-5 text-brand-400" />}
                    </div>
                    <div className="text-[11px] text-slate-400 font-mono mt-2 flex justify-between border-t border-slate-800/80 pt-2">
                      <span>Qty: {ord.quantityNeeded} pcs</span>
                      <span className="text-brand-400">{ord.status}</span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Step 2: Inspection Type & AQL Configuration */}
        <Card className="bg-slate-900 border-slate-800">
          <CardHeader className="p-5 border-b border-slate-800">
            <CardTitle className="text-base font-extrabold text-white flex items-center gap-2">
              <Calculator className="size-4 text-brand-400" /> 2. Inspection Type &amp; AQL Sampling Math
            </CardTitle>
          </CardHeader>
          <CardContent className="p-6 space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <label className="block text-xs font-mono text-slate-400 mb-1">Inspection Type</label>
                <select
                  value={inspectionType}
                  onChange={(e) => setInspectionType(e.target.value)}
                  className="w-full h-9 bg-slate-950 border border-slate-800 rounded-lg text-xs font-bold text-white px-3"
                >
                  <option value="Sample Inspection">Sample Inspection</option>
                  <option value="Pre-production">Pre-production Inspection</option>
                  <option value="During-production">During-production Inspection</option>
                  <option value="Pre-shipment">Pre-shipment Inspection</option>
                  <option value="Container-loading">Container-loading Inspection</option>
                  <option value="Warehouse Receipt">Warehouse Receipt Inspection</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-mono text-slate-400 mb-1">Lot Size (Total Ordered Pcs)</label>
                <Input
                  type="number"
                  value={lotSize}
                  onChange={(e) => setLotSize(e.target.value)}
                  className="h-9 bg-slate-950 border-slate-800 text-xs font-bold text-white font-mono"
                />
              </div>

              <div>
                <label className="block text-xs font-mono text-slate-400 mb-1">General Inspection Level</label>
                <select
                  value={inspectionLevel}
                  onChange={(e) => setInspectionLevel(e.target.value)}
                  className="w-full h-9 bg-slate-950 border border-slate-800 rounded-lg text-xs font-bold text-white px-3"
                >
                  <option value="Level I">Level I (Reduced)</option>
                  <option value="Level II">Level II (Normal Standard)</option>
                  <option value="Level III">Level III (Tightened)</option>
                </select>
              </div>
            </div>

            {/* Calculated AQL sampling plan preview box */}
            <div className="p-4 rounded-xl bg-slate-950 border border-slate-800 flex items-center justify-between font-mono text-xs">
              <div>
                <span className="text-slate-500 block text-[10px]">ISO 2859-1 Code Letter</span>
                <strong className="text-brand-400 text-base">{aqlPlan.codeLetter}</strong>
              </div>
              <div>
                <span className="text-slate-500 block text-[10px]">Required Sample Size</span>
                <strong className="text-white text-base">{aqlPlan.suggestedSampleSize} Pcs</strong>
              </div>
              <div>
                <span className="text-slate-500 block text-[10px]">Major Defect AQL 2.5 (Ac / Re)</span>
                <strong className="text-amber-400 text-base">{aqlPlan.majorAc} / {aqlPlan.majorRe}</strong>
              </div>
              <div>
                <span className="text-slate-500 block text-[10px]">Minor Defect AQL 4.0 (Ac / Re)</span>
                <strong className="text-amber-400 text-base">{aqlPlan.minorAc} / {aqlPlan.minorRe}</strong>
              </div>
            </div>

            <div>
              <label className="block text-xs font-mono text-slate-400 mb-1">Inspection Notes / Scope</label>
              <textarea
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="Specific customer requests or supplier factory notes..."
                className="w-full h-20 bg-slate-950 border border-slate-800 rounded-xl text-xs text-white p-3 font-sans"
              />
            </div>
          </CardContent>
        </Card>

        <div className="flex justify-end gap-3">
          <Link href="/agent/inspection">
            <Button variant="outline" type="button" className="bg-slate-900 border-slate-800 text-slate-300 text-xs">
              Cancel
            </Button>
          </Link>
          <Button
            type="submit"
            disabled={isInitializing}
            className="bg-brand-500 hover:bg-brand-600 text-white text-xs font-bold gap-1.5 shadow-lg shadow-brand-500/20"
          >
            {isInitializing ? 'Initializing Studio...' : 'Proceed to Quality Studio'} <ArrowRight className="size-4" />
          </Button>
        </div>
      </form>
    </div>
  )
}
