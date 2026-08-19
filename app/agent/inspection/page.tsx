'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import {
  ShieldCheck,
  CheckCircle2,
  AlertTriangle,
  XCircle,
  PlusCircle,
  Search,
  Filter,
  FileText,
  Clock,
  Building2,
  ChevronLeft,
  ChevronRight,
  RefreshCw,
  ExternalLink,
  ClipboardList,
} from 'lucide-react'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { useAgentStore } from '@/lib/stores/agent-store'
import { toast } from 'sonner'

export default function AgentInspectionDashboard() {
  const { activeCountry } = useAgentStore()
  const [inspections, setInspections] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [activeTab, setActiveTab] = useState<'ALL' | 'Draft' | 'Submitted' | 'Failed' | 'Passed'>('ALL')

  // Search & Filter state
  const [searchTerm, setSearchTerm] = useState('')
  const [hubFilter, setHubFilter] = useState<string>('ALL')
  const [resultFilter, setResultFilter] = useState<string>('ALL')

  // Pagination
  const [page, setPage] = useState(1)
  const [totalPages, setTotalPages] = useState(1)
  const [totalCount, setTotalCount] = useState(0)

  useEffect(() => {
    fetchInspections()
  }, [activeTab, hubFilter, resultFilter, page, activeCountry])

  async function fetchInspections() {
    setLoading(true)
    try {
      const queryParams = new URLSearchParams({
        page: page.toString(),
        limit: '8',
        ...(activeTab !== 'ALL' && { status: activeTab }),
        ...(hubFilter !== 'ALL' && { hub: hubFilter }),
        ...(resultFilter !== 'ALL' && { result: resultFilter }),
        ...(searchTerm && { query: searchTerm }),
      })

      const res = await fetch(`/api/agent/inspections?${queryParams.toString()}`)
      if (res.ok) {
        const data = await res.json()
        if (data.success) {
          setInspections(data.inspections || [])
          setTotalPages(data.pagination?.totalPages || 1)
          setTotalCount(data.pagination?.total || 0)
        }
      }
    } catch (e) {
      console.warn('Failed to fetch inspections:', e)
    } finally {
      setLoading(false)
    }
  }

  function getStatusBadge(status: string, result: string) {
    if (result === 'Passed' || status === 'Approved by HQ') {
      return (
        <Badge className="bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 gap-1 font-mono text-[10px]">
          <CheckCircle2 className="size-3" /> PASSED
        </Badge>
      )
    }
    if (result === 'Conditionally Passed') {
      return (
        <Badge className="bg-amber-500/20 text-amber-400 border border-amber-500/30 gap-1 font-mono text-[10px]">
          <AlertTriangle className="size-3" /> CONDITIONAL PASS
        </Badge>
      )
    }
    if (result === 'Failed' || status === 'Rejected by HQ') {
      return (
        <Badge className="bg-rose-500/20 text-rose-400 border border-rose-500/30 gap-1 font-mono text-[10px]">
          <XCircle className="size-3" /> FAILED
        </Badge>
      )
    }
    if (status === 'Submitted') {
      return (
        <Badge className="bg-blue-500/20 text-blue-400 border border-blue-500/30 gap-1 font-mono text-[10px]">
          <Clock className="size-3" /> PENDING HQ REVIEW
        </Badge>
      )
    }
    return (
      <Badge className="bg-slate-800 text-slate-400 border border-slate-700 gap-1 font-mono text-[10px]">
        <ClipboardList className="size-3" /> DRAFT
      </Badge>
    )
  }

  return (
    <div className="space-y-8 text-white font-sans">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-extrabold font-heading text-white flex items-center gap-2">
            <ShieldCheck className="size-6 text-brand-400" />
            Quality Control &amp; Photo Studio Hub
          </h1>
          <p className="text-xs text-slate-400 font-mono">
            Active Country Hub: <strong className="text-brand-400">{activeCountry}</strong> · Enterprise AQL 2.5 Audit Management
          </p>
        </div>

        <div className="flex items-center gap-3">
          <Link href="/agent/inspection/new">
            <Button className="bg-brand-500 hover:bg-brand-600 text-white text-xs font-bold gap-1.5 shadow-lg shadow-brand-500/20">
              <PlusCircle className="size-4" /> Initialize New Inspection
            </Button>
          </Link>
        </div>
      </div>

      {/* Filter & Search Bar */}
      <Card className="bg-slate-900 border-slate-800">
        <CardContent className="p-4 flex flex-col md:flex-row items-center justify-between gap-4">
          {/* Status Tabs */}
          <div className="flex items-center rounded-xl bg-slate-950 p-1 border border-slate-800 text-xs font-mono w-full md:w-auto overflow-x-auto">
            <button
              onClick={() => { setActiveTab('ALL'); setPage(1); }}
              className={`px-3 py-1.5 rounded-lg whitespace-nowrap ${activeTab === 'ALL' ? 'bg-brand-500 text-white font-bold' : 'text-slate-400 hover:text-slate-200'}`}
            >
              All Audits ({totalCount})
            </button>
            <button
              onClick={() => { setActiveTab('Draft'); setPage(1); }}
              className={`px-3 py-1.5 rounded-lg whitespace-nowrap ${activeTab === 'Draft' ? 'bg-brand-500 text-white font-bold' : 'text-slate-400 hover:text-slate-200'}`}
            >
              Drafts
            </button>
            <button
              onClick={() => { setActiveTab('Submitted'); setPage(1); }}
              className={`px-3 py-1.5 rounded-lg whitespace-nowrap ${activeTab === 'Submitted' ? 'bg-brand-500 text-white font-bold' : 'text-slate-400 hover:text-slate-200'}`}
            >
              Pending HQ Review
            </button>
            <button
              onClick={() => { setActiveTab('Failed'); setPage(1); }}
              className={`px-3 py-1.5 rounded-lg whitespace-nowrap ${activeTab === 'Failed' ? 'bg-brand-500 text-white font-bold' : 'text-slate-400 hover:text-slate-200'}`}
            >
              Failed Audits
            </button>
            <button
              onClick={() => { setActiveTab('Passed'); setPage(1); }}
              className={`px-3 py-1.5 rounded-lg whitespace-nowrap ${activeTab === 'Passed' ? 'bg-brand-500 text-white font-bold' : 'text-slate-400 hover:text-slate-200'}`}
            >
              Passed / Approved
            </button>
          </div>

          {/* Search Box & Filters */}
          <div className="flex items-center gap-3 w-full md:w-auto">
            <div className="relative flex-1 md:w-64">
              <Search className="size-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
              <Input
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && fetchInspections()}
                placeholder="Search reference or order..."
                className="pl-9 h-9 bg-slate-950 border-slate-800 text-xs text-white placeholder:text-slate-500"
              />
            </div>

            <Button
              onClick={() => fetchInspections()}
              variant="outline"
              size="sm"
              className="bg-slate-950 border-slate-800 hover:bg-slate-800 text-xs font-mono"
            >
              <RefreshCw className="size-3.5" />
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Inspections Grid */}
      {loading ? (
        <div className="p-12 text-center text-slate-400 font-mono text-xs">
          <RefreshCw className="size-6 animate-spin mx-auto mb-2 text-brand-400" />
          Loading quality inspection database records...
        </div>
      ) : inspections.length === 0 ? (
        <Card className="bg-slate-900 border-slate-800 p-12 text-center space-y-4">
          <ShieldCheck className="size-12 text-slate-600 mx-auto" />
          <h3 className="text-base font-extrabold text-white">No Quality Inspections Found</h3>
          <p className="text-xs text-slate-400 max-w-md mx-auto">
            No audit records match the current tab filter. Create a new inspection for your assigned sourcing orders.
          </p>
          <Link href="/agent/inspection/new">
            <Button className="bg-brand-500 hover:bg-brand-600 text-white text-xs font-bold gap-1.5 mt-2">
              <PlusCircle className="size-4" /> Start First Quality Audit
            </Button>
          </Link>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {inspections.map((ins) => (
            <Card key={ins.id} className="bg-slate-900 border-slate-800 hover:border-slate-700 transition-colors">
              <CardContent className="p-5 space-y-4">
                <div className="flex items-start justify-between">
                  <div>
                    <div className="flex items-center gap-2">
                      <h4 className="font-extrabold text-white text-base font-mono">{ins.inspectionRef}</h4>
                      {getStatusBadge(ins.status, ins.result)}
                    </div>
                    <p className="text-xs text-slate-400 font-mono mt-0.5">
                      Order: <strong className="text-brand-400">#{ins.orderId}</strong> · Hub: <strong>{ins.hub}</strong>
                    </p>
                  </div>
                  <Badge className="bg-slate-950 text-slate-300 border border-slate-800 text-[10px] font-mono">
                    {ins.inspectionType}
                  </Badge>
                </div>

                {/* AQL Defect Stats Bar */}
                <div className="grid grid-cols-4 gap-2 text-xs font-mono bg-slate-950 p-3 rounded-xl border border-slate-800 text-slate-300 text-center">
                  <div>
                    <span className="block text-[10px] text-slate-500">Sample Size</span>
                    <strong>{ins.sampleSize || 80} Pcs</strong>
                  </div>
                  <div>
                    <span className="block text-[10px] text-slate-500">Critical</span>
                    <strong className={ins.criticalDefects > 0 ? 'text-rose-400' : 'text-slate-300'}>
                      {ins.criticalDefects || 0}
                    </strong>
                  </div>
                  <div>
                    <span className="block text-[10px] text-slate-500">Major</span>
                    <strong className={ins.majorDefects > 2 ? 'text-amber-400' : 'text-slate-300'}>
                      {ins.majorDefects || 0}
                    </strong>
                  </div>
                  <div>
                    <span className="block text-[10px] text-slate-500">Minor</span>
                    <strong>{ins.minorDefects || 0}</strong>
                  </div>
                </div>

                {/* Action Footer */}
                <div className="flex items-center justify-between pt-2 border-t border-slate-800/80">
                  <span className="text-[11px] text-slate-500 font-mono">
                    Updated: {new Date(ins.updatedAt).toLocaleDateString()}
                  </span>

                  <div className="flex items-center gap-2">
                    <Link href={`/agent/inspection/${ins.id}/report`}>
                      <Button size="sm" variant="outline" className="bg-slate-950 border-slate-800 text-slate-300 hover:text-white text-xs gap-1">
                        <FileText className="size-3.5 text-brand-400" /> PDF Report
                      </Button>
                    </Link>

                    <Link href={`/agent/inspection/${ins.id}`}>
                      <Button size="sm" className="bg-brand-500 hover:bg-brand-600 text-white text-xs font-bold gap-1">
                        Open Studio <ExternalLink className="size-3" />
                      </Button>
                    </Link>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Pagination Bar */}
      {totalPages > 1 && (
        <div className="flex items-center justify-between border-t border-slate-800 pt-4 font-mono text-xs text-slate-400">
          <span>Page {page} of {totalPages} ({totalCount} items)</span>
          <div className="flex items-center gap-2">
            <Button
              disabled={page <= 1}
              onClick={() => setPage(page - 1)}
              variant="outline"
              size="sm"
              className="bg-slate-900 border-slate-800 text-xs"
            >
              <ChevronLeft className="size-4" /> Prev
            </Button>
            <Button
              disabled={page >= totalPages}
              onClick={() => setPage(page + 1)}
              variant="outline"
              size="sm"
              className="bg-slate-900 border-slate-800 text-xs"
            >
              Next <ChevronRight className="size-4" />
            </Button>
          </div>
        </div>
      )}
    </div>
  )
}
