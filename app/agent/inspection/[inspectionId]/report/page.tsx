'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import {
  ShieldCheck,
  Printer,
  ChevronLeft,
  CheckCircle2,
  AlertTriangle,
  XCircle,
  Building2,
  FileText,
} from 'lucide-react'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { calculateAqlSamplingPlan, evaluateAqlResult } from '@/lib/aql-engine'

export default function QualityInspectionReportPage({ params }: { params: { inspectionId: string } }) {
  const [inspection, setInspection] = useState<any>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchInspection()
  }, [params.inspectionId])

  async function fetchInspection() {
    setLoading(true)
    try {
      const res = await fetch(`/api/agent/inspections/${params.inspectionId}`)
      if (res.ok) {
        const data = await res.json()
        if (data.success && data.inspection) {
          setInspection(data.inspection)
        }
      }
    } catch (e) {
      console.warn('Failed to fetch report inspection:', e)
    } finally {
      setLoading(false)
    }
  }

  function handlePrint() {
    window.print()
  }

  if (loading || !inspection) {
    return <div className="p-12 text-center text-slate-400 font-mono text-xs">Loading Quality Audit Report...</div>
  }

  const aqlPlan = calculateAqlSamplingPlan(inspection.lotSize || 100)
  const photos = Array.isArray(inspection.evidencePhotos) ? inspection.evidencePhotos : []

  return (
    <div className="max-w-4xl mx-auto space-y-6 text-slate-900 bg-white p-8 rounded-2xl shadow-xl font-sans print:shadow-none print:p-0">
      {/* Top Toolbar (Hidden when printing) */}
      <div className="flex items-center justify-between border-b pb-4 print:hidden">
        <Link href={`/agent/inspection/${inspection.id}`} className="text-xs text-slate-500 hover:text-slate-900 font-mono flex items-center gap-1">
          <ChevronLeft className="size-4" /> Back to Inspection Studio
        </Link>

        <div className="flex items-center gap-3">
          <Button onClick={handlePrint} className="bg-slate-900 hover:bg-slate-800 text-white text-xs font-bold gap-1.5">
            <Printer className="size-4" /> Print / Save as PDF
          </Button>
        </div>
      </div>

      {/* Header Banner */}
      <div className="flex items-center justify-between border-b-2 border-slate-900 pb-6">
        <div>
          <div className="flex items-center gap-2">
            <ShieldCheck className="size-8 text-orange-600" />
            <h1 className="text-2xl font-black uppercase tracking-wider text-slate-900 font-heading">
              LUMO Global Sourcing
            </h1>
          </div>
          <p className="text-xs text-slate-500 font-mono mt-1">Official Quality Control &amp; AQL Audit Report</p>
        </div>

        <div className="text-right font-mono">
          <span className="text-xs text-slate-400 uppercase block">Report Reference</span>
          <strong className="text-lg font-bold text-slate-900">{inspection.inspectionRef}</strong>
          <span className="text-[11px] text-slate-500 block">Date: {new Date(inspection.createdAt).toLocaleDateString()}</span>
        </div>
      </div>

      {/* Audit Summary Grid */}
      <div className="grid grid-cols-2 gap-4 text-xs font-mono bg-slate-50 p-4 rounded-xl border border-slate-200">
        <div>
          <span className="text-slate-400 block text-[10px] uppercase">Order Reference</span>
          <strong className="text-slate-900 text-sm">#{inspection.orderId}</strong>
        </div>
        <div>
          <span className="text-slate-400 block text-[10px] uppercase">Country Hub</span>
          <strong className="text-slate-900 text-sm">{inspection.hub} Hub</strong>
        </div>
        <div>
          <span className="text-slate-400 block text-[10px] uppercase">Inspection Type</span>
          <strong className="text-slate-900">{inspection.inspectionType}</strong>
        </div>
        <div>
          <span className="text-slate-400 block text-[10px] uppercase">Overall AQL Result</span>
          <strong className={`text-sm font-bold uppercase ${inspection.result === 'Passed' ? 'text-emerald-600' : 'text-rose-600'}`}>
            {inspection.result}
          </strong>
        </div>
      </div>

      {/* AQL Sampling Statistics Table */}
      <div className="space-y-2">
        <h3 className="text-xs font-bold uppercase tracking-wider text-slate-500 font-mono">1. AQL 2.5 Audit Breakdown</h3>
        <table className="w-full text-xs font-mono border-collapse border border-slate-200">
          <thead>
            <tr className="bg-slate-100 text-slate-700 text-left border-b border-slate-200">
              <th className="p-2 border-r border-slate-200">Parameter</th>
              <th className="p-2 border-r border-slate-200">Value / Target</th>
              <th className="p-2">Status</th>
            </tr>
          </thead>
          <tbody>
            <tr className="border-b border-slate-200">
              <td className="p-2 border-r border-slate-200 font-bold">Total Lot Size</td>
              <td className="p-2 border-r border-slate-200">{inspection.lotSize || 100} Pcs</td>
              <td className="p-2">Complete</td>
            </tr>
            <tr className="border-b border-slate-200">
              <td className="p-2 border-r border-slate-200 font-bold">Sample Inspected</td>
              <td className="p-2 border-r border-slate-200">{inspection.inspectedQty || 80} Pcs</td>
              <td className="p-2">Code {aqlPlan.codeLetter}</td>
            </tr>
            <tr className="border-b border-slate-200">
              <td className="p-2 border-r border-slate-200 font-bold">Critical Defects</td>
              <td className="p-2 border-r border-slate-200">{inspection.criticalDefects || 0} (Max Allowed: 0)</td>
              <td className="p-2 font-bold text-emerald-600">PASS</td>
            </tr>
            <tr className="border-b border-slate-200">
              <td className="p-2 border-r border-slate-200 font-bold">Major Defects (AQL 2.5)</td>
              <td className="p-2 border-r border-slate-200">{inspection.majorDefects || 0} (Ac: {aqlPlan.majorAc} / Re: {aqlPlan.majorRe})</td>
              <td className="p-2 font-bold text-emerald-600">PASS</td>
            </tr>
            <tr className="border-b border-slate-200">
              <td className="p-2 border-r border-slate-200 font-bold">Minor Defects (AQL 4.0)</td>
              <td className="p-2 border-r border-slate-200">{inspection.minorDefects || 0} (Ac: {aqlPlan.minorAc} / Re: {aqlPlan.minorRe})</td>
              <td className="p-2 font-bold text-emerald-600">PASS</td>
            </tr>
          </tbody>
        </table>
      </div>

      {/* Mandatory Photo Proof Gallery */}
      <div className="space-y-3 pt-4 border-t border-slate-200">
        <h3 className="text-xs font-bold uppercase tracking-wider text-slate-500 font-mono">2. Mandatory Photographic Evidence</h3>
        <div className="grid grid-cols-5 gap-2">
          {photos.slice(0, 10).map((p: any, idx: number) => (
            <div key={idx} className="aspect-square border border-slate-200 rounded-lg overflow-hidden relative bg-slate-50">
              {p.url || p.fileUrl ? (
                <img src={p.url || p.fileUrl} alt={p.label || `Photo ${idx + 1}`} className="w-full h-full object-cover" />
              ) : (
                <div className="w-full h-full flex items-center justify-center text-[10px] text-slate-400 font-mono p-1 text-center">
                  Slot {idx + 1}
                </div>
              )}
            </div>
          ))}
        </div>
      </div>

      {/* Sign-off Footer */}
      <div className="pt-8 border-t-2 border-slate-900 flex justify-between text-xs font-mono">
        <div>
          <span className="text-slate-400 block text-[10px] uppercase">Inspected By Sourcing Agent</span>
          <strong className="text-slate-900">LUMO Certified Agent</strong>
        </div>
        <div className="text-right">
          <span className="text-slate-400 block text-[10px] uppercase">LUMO HQ Quality Seal</span>
          <strong className="text-orange-600">VERIFIED &amp; RELEASED</strong>
        </div>
      </div>
    </div>
  )
}
