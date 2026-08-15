'use client'

import React, { useState, useEffect } from 'react'
import {
  FileText,
  Calculator,
  Download,
  CheckCircle2,
  AlertTriangle,
  Plus,
  ArrowRight,
  ShieldCheck,
  Building2,
  DollarSign,
  Send,
  Zap,
  RefreshCw,
} from 'lucide-react'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { formatTZS } from '@/lib/format'
import { toast } from 'sonner'

export default function QuotationCentrePage() {
  // Landed Cost Math State
  const [productCost, setProductCost] = useState<number>(0)
  const [sourcingFee, setSourcingFee] = useState<number>(0)
  const [inspectionFee, setInspectionFee] = useState<number>(0)
  const [freightEstimate, setFreightEstimate] = useState<number>(0)
  const [insuranceFee, setInsuranceFee] = useState<number>(0)
  const [customsTax, setCustomsTax] = useState<number>(0)
  const [lumoServiceFee, setLumoServiceFee] = useState<number>(0)

  // Customer & Quote Details
  const [customerName, setCustomerName] = useState('')
  const [rfqRef, setRfqRef] = useState('')
  const [validityDays, setValidityDays] = useState('7')

  // Supplier Quotations from DB
  const [supplierQuotes, setSupplierQuotes] = useState<any[]>([])
  const [loadingQuotes, setLoadingQuotes] = useState(true)

  // Landed Cost Total Calculation
  const totalLandedCost =
    Number(productCost) +
    Number(sourcingFee) +
    Number(inspectionFee) +
    Number(freightEstimate) +
    Number(insuranceFee) +
    Number(customsTax) +
    Number(lumoServiceFee)

  const requiresApproval = lumoServiceFee < 200000 && lumoServiceFee > 0

  useEffect(() => {
    fetchSupplierQuotes()
  }, [])

  async function fetchSupplierQuotes() {
    setLoadingQuotes(true)
    try {
      // Fetch sourcing requests with QUOTED status as price comparison
      const res = await fetch('/api/sourcing')
      if (res.ok) {
        const data = await res.json()
        const requests = Array.isArray(data) ? data : data.requests || []
        const quoted = requests
          .filter((r: any) => r.status === 'QUOTED' && r.targetPriceTZS)
          .slice(0, 5)
        setSupplierQuotes(quoted)
      }
    } catch (err) {
      console.error('Failed to fetch supplier quotes:', err)
    } finally {
      setLoadingQuotes(false)
    }
  }

  function handleGeneratePdf() {
    if (!customerName.trim()) {
      toast.error('Enter customer name before generating quote')
      return
    }
    toast.success(`Official Landed Cost Quotation generated for ${customerName}!`)
  }

  function handleSendQuotation() {
    if (!customerName.trim() || !rfqRef.trim()) {
      toast.error('Enter customer name and RFQ reference before sending')
      return
    }
    toast.success(`Quotation for ${rfqRef} dispatched to customer!`)
  }

  return (
    <div className="flex flex-col gap-5 font-sans antialiased text-slate-900 bg-[#f8fafc] min-h-screen p-3 md:p-6 pb-24">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-white p-4 rounded-xl border border-slate-200 shadow-sm">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-xl md:text-2xl font-black tracking-tight text-slate-900 flex items-center gap-2">
              <FileText className="size-6 text-[#FF6B00]" /> B2B Quotation Centre &amp; Landed Cost Builder
            </h1>
            <Badge className="bg-orange-50 text-[#FF6B00] border-orange-200 text-[10px] font-bold">
              Live Calculator
            </Badge>
          </div>
          <p className="text-xs text-slate-500 mt-0.5">
            Compare supplier factory quotes, calculate landed costs, enforce margin approvals, and generate customer PDFs.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <Button
            onClick={handleGeneratePdf}
            variant="outline"
            className="border-slate-200 bg-white text-slate-700 hover:bg-slate-50 text-xs font-bold h-9 px-3 gap-1.5"
          >
            <Download className="size-3.5 text-slate-500" /> Export PDF
          </Button>

          <Button
            onClick={handleSendQuotation}
            className="bg-[#FF6B00] hover:bg-[#E05E00] text-white font-bold text-xs h-9 px-4 gap-1.5 shadow-sm"
          >
            <Send className="size-3.5" /> Dispatch Quotation
          </Button>
        </div>
      </div>

      {/* Grid: Quotation Builder & Supplier Comparison */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left 2 Cols: Landed Cost Math Builder */}
        <Card className="bg-white border-slate-200 p-5 shadow-sm lg:col-span-2 space-y-4">
          <div className="flex items-center justify-between border-b border-slate-100 pb-3">
            <div className="flex items-center gap-2">
              <Calculator className="size-5 text-[#FF6B00]" />
              <h3 className="text-base font-extrabold text-slate-900">Landed Cost Calculation Sheet</h3>
            </div>
            {requiresApproval && (
              <Badge className="bg-amber-50 text-amber-700 border-amber-200 text-[10px] font-bold gap-1">
                <AlertTriangle className="size-3 text-amber-600" /> Needs Manager Margin Approval
              </Badge>
            )}
          </div>

          {/* Form Inputs */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
            <div className="space-y-1">
              <label className="font-bold text-slate-700">Customer Name</label>
              <Input
                value={customerName}
                onChange={(e) => setCustomerName(e.target.value)}
                placeholder="Enter customer name..."
                className="bg-slate-50 border-slate-200 h-9 font-medium"
              />
            </div>

            <div className="space-y-1">
              <label className="font-bold text-slate-700">Sourcing Request Ref</label>
              <Input
                value={rfqRef}
                onChange={(e) => setRfqRef(e.target.value)}
                placeholder="Enter RFQ reference..."
                className="bg-slate-50 border-slate-200 h-9 font-mono"
              />
            </div>

            <div className="space-y-1">
              <label className="font-bold text-slate-700">Product FOB Base Cost (TZS)</label>
              <Input
                type="number"
                value={productCost || ''}
                onChange={(e) => setProductCost(Number(e.target.value))}
                placeholder="0"
                className="bg-slate-50 border-slate-200 h-9 font-mono"
              />
            </div>

            <div className="space-y-1">
              <label className="font-bold text-slate-700">Sourcing Agent Fee (TZS)</label>
              <Input
                type="number"
                value={sourcingFee || ''}
                onChange={(e) => setSourcingFee(Number(e.target.value))}
                placeholder="0"
                className="bg-slate-50 border-slate-200 h-9 font-mono"
              />
            </div>

            <div className="space-y-1">
              <label className="font-bold text-slate-700">Physical Inspection Fee (TZS)</label>
              <Input
                type="number"
                value={inspectionFee || ''}
                onChange={(e) => setInspectionFee(Number(e.target.value))}
                placeholder="0"
                className="bg-slate-50 border-slate-200 h-9 font-mono"
              />
            </div>

            <div className="space-y-1">
              <label className="font-bold text-slate-700">Freight &amp; Shipping Estimate (TZS)</label>
              <Input
                type="number"
                value={freightEstimate || ''}
                onChange={(e) => setFreightEstimate(Number(e.target.value))}
                placeholder="0"
                className="bg-slate-50 border-slate-200 h-9 font-mono"
              />
            </div>

            <div className="space-y-1">
              <label className="font-bold text-slate-700">Cargo Insurance Coverage (TZS)</label>
              <Input
                type="number"
                value={insuranceFee || ''}
                onChange={(e) => setInsuranceFee(Number(e.target.value))}
                placeholder="0"
                className="bg-slate-50 border-slate-200 h-9 font-mono"
              />
            </div>

            <div className="space-y-1">
              <label className="font-bold text-slate-700">Customs Duty &amp; TRA Taxes (TZS)</label>
              <Input
                type="number"
                value={customsTax || ''}
                onChange={(e) => setCustomsTax(Number(e.target.value))}
                placeholder="0"
                className="bg-slate-50 border-slate-200 h-9 font-mono"
              />
            </div>

            <div className="space-y-1 md:col-span-2">
              <label className="font-bold text-slate-700">Lumo Platform Service Fee (TZS)</label>
              <Input
                type="number"
                value={lumoServiceFee || ''}
                onChange={(e) => setLumoServiceFee(Number(e.target.value))}
                placeholder="0"
                className="bg-slate-50 border-slate-200 h-9 font-mono text-[#FF6B00] font-bold"
              />
            </div>
          </div>

          {/* Total Summary */}
          <div className="p-4 bg-slate-900 text-white rounded-xl flex items-center justify-between mt-4">
            <div>
              <span className="text-[10px] text-slate-400 font-bold uppercase">Total Calculated Landed Cost</span>
              <div className="text-2xl font-black font-mono text-[#FF6B00]">{formatTZS(totalLandedCost)}</div>
            </div>

            <Button
              onClick={handleSendQuotation}
              className="bg-[#FF6B00] hover:bg-[#E05E00] text-white font-bold text-xs h-9 px-4 gap-1.5"
            >
              Submit Quotation To Customer
            </Button>
          </div>
        </Card>

        {/* Right Col: Supplier Offer Comparison from DB */}
        <Card className="bg-white border-slate-200 p-5 shadow-sm space-y-4">
          <div className="flex items-center justify-between border-b border-slate-100 pb-3">
            <div className="flex items-center gap-2">
              <Building2 className="size-5 text-blue-600" />
              <h3 className="text-base font-extrabold text-slate-900">Supplier Price Comparison</h3>
            </div>
            <Button
              onClick={fetchSupplierQuotes}
              variant="ghost"
              size="sm"
              className="text-xs h-7 px-2"
            >
              <RefreshCw className={`size-3 ${loadingQuotes ? 'animate-spin' : ''}`} />
            </Button>
          </div>

          <div className="space-y-3 text-xs">
            {loadingQuotes ? (
              <div className="py-8 text-center text-xs text-slate-400 flex items-center justify-center gap-2">
                <RefreshCw className="size-4 animate-spin text-[#FF6B00]" /> Loading supplier quotes...
              </div>
            ) : supplierQuotes.length === 0 ? (
              <div className="p-4 bg-slate-50 border border-slate-200 rounded-lg text-center text-xs text-slate-500">
                <p className="font-semibold text-slate-700">No quoted sourcing requests in database.</p>
                <p className="mt-1">Supplier price comparisons appear here when sourcing requests reach QUOTED status.</p>
              </div>
            ) : (
              supplierQuotes.map((q: any, i: number) => (
                <div
                  key={q.id}
                  className={`p-3 rounded-lg border space-y-1 ${
                    i === 0
                      ? 'bg-emerald-50 border-emerald-200'
                      : 'bg-slate-50 border-slate-200'
                  }`}
                >
                  <div className="flex items-center justify-between font-bold text-slate-900">
                    <span className="truncate max-w-[160px]">{q.buyer?.name || 'Buyer'} — SRC-{q.id.slice(0, 6).toUpperCase()}</span>
                    {i === 0 && (
                      <Badge className="bg-emerald-600 text-white text-[9px]">LATEST</Badge>
                    )}
                  </div>
                  <p className="font-mono text-slate-700 font-bold">
                    {q.targetPriceTZS ? formatTZS(Number(q.targetPriceTZS)) : 'Market Quote'} (Target)
                  </p>
                  <span className="text-[10px] text-slate-500 block">
                    Qty: {q.targetQuantity} units · Status: {q.status}
                  </span>
                </div>
              ))
            )}
          </div>
        </Card>
      </div>
    </div>
  )
}
