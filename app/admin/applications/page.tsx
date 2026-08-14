'use client'

import { useState, useEffect } from 'react'
import { ShieldCheck, Filter, FileText, CheckCircle2, XCircle, AlertCircle, MessageSquare, StickyNote, UserCheck, Play, HelpCircle, PauseCircle } from 'lucide-react'
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'

const STATUS_BADGE: Record<string, string> = {
  DRAFT: 'bg-slate-800 text-slate-300 border-slate-700',
  SUBMITTED: 'bg-blue-500/10 text-blue-400 border-blue-500/30',
  UNDER_REVIEW: 'bg-amber-500/10 text-amber-400 border-amber-500/30',
  MORE_INFORMATION_REQUIRED: 'bg-orange-500/10 text-orange-400 border-orange-500/30',
  APPROVED: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30',
  REJECTED: 'bg-red-500/10 text-red-400 border-red-500/30',
  WITHDRAWN: 'bg-slate-900 text-slate-500 border-slate-800',
}

export default function AdminApplicationsConsole() {
  const [applications, setApplications] = useState<any[]>([])
  const [selectedApp, setSelectedApp] = useState<any | null>(null)
  const [loading, setLoading] = useState(true)

  // Filters
  const [statusFilter, setStatusFilter] = useState<string>('ALL')
  const [typeFilter, setTypeFilter] = useState<string>('ALL')

  // Review state
  const [newNote, setNewNote] = useState('')
  const [publicMsg, setPublicMsg] = useState('')
  const [decisionReason, setDecisionReason] = useState('')
  const [actionError, setActionError] = useState<string | null>(null)
  const [actionSuccess, setActionSuccess] = useState<string | null>(null)

  const fetchQueue = async () => {
    setLoading(true)
    try {
      let url = '/api/admin/applications?'
      if (statusFilter !== 'ALL') url += `status=${statusFilter}&`
      if (typeFilter !== 'ALL') url += `type=${typeFilter}`

      const res = await fetch(url)
      if (res.ok) {
        const data = await res.json()
        setApplications(data.applications || [])
        if (data.applications?.length > 0 && !selectedApp) {
          fetchDetail(data.applications[0].id)
        }
      }
    } catch {
      // silent
    } finally {
      setLoading(false)
    }
  }

  const fetchDetail = async (id: string) => {
    try {
      const res = await fetch(`/api/applications/${id}`)
      if (res.ok) {
        const data = await res.json()
        setSelectedApp(data.application)
      }
    } catch {
      // silent
    }
  }

  useEffect(() => {
    fetchQueue()
  }, [statusFilter, typeFilter])

  const handleReviewAction = async (action: string) => {
    if (!selectedApp) return
    setActionError(null)
    setActionSuccess(null)

    try {
      const res = await fetch(`/api/admin/applications/${selectedApp.id}/review`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action,
          reason: decisionReason,
          messageToApplicant: publicMsg,
        }),
      })

      const data = await res.json()
      if (res.ok) {
        setActionSuccess(`Action ${action} completed successfully.`)
        setDecisionReason('')
        setPublicMsg('')
        fetchQueue()
        fetchDetail(selectedApp.id)
      } else {
        setActionError(data.error || 'Review action failed.')
      }
    } catch {
      setActionError('Network error executing review decision.')
    }
  }

  const handleAddNote = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!newNote.trim() || !selectedApp) return

    try {
      const res = await fetch(`/api/admin/applications/${selectedApp.id}/notes`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ noteText: newNote }),
      })

      if (res.ok) {
        setNewNote('')
        fetchDetail(selectedApp.id)
      }
    } catch {
      setActionError('Failed to save note.')
    }
  }

  const handleToggleDocVerify = async (docId: string, currentStatus: boolean) => {
    if (!selectedApp) return
    try {
      const res = await fetch(`/api/admin/applications/${selectedApp.id}/verify-doc`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          documentId: docId,
          verifiedStatus: !currentStatus,
        }),
      })

      if (res.ok) {
        fetchDetail(selectedApp.id)
      }
    } catch {
      setActionError('Failed to verify document.')
    }
  }

  const handlePartnerStatus = async (partnerType: string, profileId: string, newStatus: string) => {
    try {
      const res = await fetch(`/api/admin/partners/${profileId}/status`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          partnerType,
          status: newStatus,
          reason: 'Administrator manual status toggle',
        }),
      })

      if (res.ok) {
        setActionSuccess(`Partner status updated to ${newStatus}`)
        fetchDetail(selectedApp.id)
      }
    } catch {
      setActionError('Failed to update partner status.')
    }
  }

  return (
    <div className="min-h-screen bg-[#090d16] text-white py-8 px-4 sm:px-6 lg:px-8">
      <div className="max-w-7xl mx-auto">
        {/* Top Header */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8 pb-4 border-b border-slate-800">
          <div>
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-orange-500/10 border border-orange-500/20 text-orange-400 text-xs font-semibold mb-2">
              <ShieldCheck className="size-3.5" />
              Lumo Administrative Security Console
            </div>
            <h1 className="text-2xl font-extrabold text-white">Partner Application Review Console</h1>
          </div>

          {/* Queue Filter Bar */}
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-1.5 bg-slate-900 px-3 py-1.5 rounded-lg border border-slate-800 text-xs">
              <Filter className="size-3.5 text-slate-400" />
              <span className="text-slate-400 font-medium">Status:</span>
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="bg-transparent text-white font-semibold focus:outline-none"
              >
                <option value="ALL" className="bg-slate-900">All Statuses</option>
                <option value="SUBMITTED" className="bg-slate-900">SUBMITTED</option>
                <option value="UNDER_REVIEW" className="bg-slate-900">UNDER_REVIEW</option>
                <option value="MORE_INFORMATION_REQUIRED" className="bg-slate-900">MORE_INFO_REQ</option>
                <option value="APPROVED" className="bg-slate-900">APPROVED</option>
                <option value="REJECTED" className="bg-slate-900">REJECTED</option>
              </select>
            </div>

            <div className="flex items-center gap-1.5 bg-slate-900 px-3 py-1.5 rounded-lg border border-slate-800 text-xs">
              <span className="text-slate-400 font-medium">Type:</span>
              <select
                value={typeFilter}
                onChange={(e) => setTypeFilter(e.target.value)}
                className="bg-transparent text-white font-semibold focus:outline-none"
              >
                <option value="ALL" className="bg-slate-900">All Types</option>
                <option value="SUPPLIER" className="bg-slate-900">SUPPLIER</option>
                <option value="LOGISTICS" className="bg-slate-900">LOGISTICS</option>
              </select>
            </div>
          </div>
        </div>

        {loading ? (
          <div className="text-center py-16 text-slate-400 text-sm">Loading applications queue...</div>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Left Column: Applications Queue List */}
            <div className="space-y-3">
              <h3 className="text-xs font-semibold text-slate-400 uppercase tracking-wider">
                Review Queue ({applications.length})
              </h3>
              {applications.length === 0 ? (
                <div className="p-6 rounded-lg bg-slate-900/60 border border-slate-800 text-center text-xs text-slate-400">
                  No applications match filters.
                </div>
              ) : (
                applications.map((app) => {
                  const isSelected = selectedApp?.id === app.id
                  return (
                    <Card
                      key={app.id}
                      onClick={() => fetchDetail(app.id)}
                      className={`bg-slate-900/80 border transition-all cursor-pointer ${
                        isSelected ? 'border-orange-500/60 bg-slate-900' : 'border-slate-800 hover:border-slate-700'
                      }`}
                    >
                      <CardContent className="p-4">
                        <div className="flex items-center justify-between mb-2">
                          <span className="text-xs font-bold text-white uppercase">{app.applicationType}</span>
                          <span className={`text-[10px] font-semibold px-2 py-0.5 rounded border ${STATUS_BADGE[app.status]}`}>
                            {app.status}
                          </span>
                        </div>
                        <div className="text-xs font-semibold text-slate-200 truncate mb-1">
                          {app.user?.name || app.user?.email}
                        </div>
                        <div className="text-[11px] text-slate-400 flex justify-between">
                          <span>Docs: {app.documents?.length || 0}</span>
                          <span>Submitted: {app.submissionDate ? new Date(app.submissionDate).toLocaleDateString() : 'N/A'}</span>
                        </div>
                      </CardContent>
                    </Card>
                  )
                })
              )}
            </div>

            {/* Right 2 Columns: Application Audit & Decision View */}
            <div className="lg:col-span-2 space-y-6">
              {selectedApp ? (
                <>
                  <Card className="bg-slate-900/80 border-slate-800">
                    <CardHeader className="p-6 border-b border-slate-800 flex flex-row items-center justify-between">
                      <div>
                        <div className="flex items-center gap-2 mb-1">
                          <CardTitle className="text-xl font-bold text-white uppercase">
                            {selectedApp.applicationType} Application — Audit Console
                          </CardTitle>
                          <span className={`text-xs font-semibold px-2.5 py-0.5 rounded border ${STATUS_BADGE[selectedApp.status]}`}>
                            {selectedApp.status}
                          </span>
                        </div>
                        <CardDescription className="text-xs text-slate-400">
                          Applicant: <strong className="text-slate-200">{selectedApp.user?.name}</strong> ({selectedApp.user?.email} | {selectedApp.user?.phone || 'No phone'})
                        </CardDescription>
                      </div>
                    </CardHeader>

                    <CardContent className="p-6 space-y-6">
                      {actionError && (
                        <div className="p-3 rounded-lg bg-red-500/10 border border-red-500/30 text-red-400 text-xs flex items-center gap-2">
                          <AlertCircle className="size-4 shrink-0" />
                          <span>{actionError}</span>
                        </div>
                      )}

                      {actionSuccess && (
                        <div className="p-3 rounded-lg bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 text-xs flex items-center gap-2">
                          <CheckCircle2 className="size-4 shrink-0" />
                          <span>{actionSuccess}</span>
                        </div>
                      )}

                      {/* State Machine Action Controls */}
                      <div className="p-4 rounded-lg bg-slate-950 border border-slate-800 space-y-4">
                        <h4 className="text-xs font-bold text-white uppercase tracking-wider flex items-center gap-2">
                          <ShieldCheck className="size-4 text-orange-400" /> Reviewer State Machine Controls
                        </h4>

                        <div className="flex flex-wrap gap-2">
                          {selectedApp.status === 'SUBMITTED' && (
                            <Button
                              onClick={() => handleReviewAction('START_REVIEW')}
                              className="bg-blue-600 hover:bg-blue-500 text-white font-bold text-xs"
                            >
                              <Play className="size-3.5 mr-1.5" /> Start Review (UNDER_REVIEW)
                            </Button>
                          )}

                          {selectedApp.status === 'UNDER_REVIEW' && (
                            <>
                              <Button
                                onClick={() => handleReviewAction('APPROVE')}
                                className="bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs"
                              >
                                <UserCheck className="size-3.5 mr-1.5" /> Approve & Assign Role
                              </Button>

                              <Button
                                onClick={() => handleReviewAction('REQUEST_INFO')}
                                className="bg-orange-600 hover:bg-orange-500 text-white font-bold text-xs"
                              >
                                <HelpCircle className="size-3.5 mr-1.5" /> Request Information
                              </Button>

                              <Button
                                onClick={() => handleReviewAction('REJECT')}
                                className="bg-red-600 hover:bg-red-500 text-white font-bold text-xs"
                              >
                                <XCircle className="size-3.5 mr-1.5" /> Reject Application
                              </Button>
                            </>
                          )}
                        </div>

                        {/* Reason / Public Message Input */}
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-3 pt-2">
                          <div>
                            <label className="text-[11px] font-semibold text-slate-400 mb-1 block">Decision Reason / Rejection Explanation</label>
                            <Input
                              placeholder="Reason for approval/rejection..."
                              value={decisionReason}
                              onChange={(e) => setDecisionReason(e.target.value)}
                              className="bg-slate-900 border-slate-800 text-xs text-white"
                            />
                          </div>
                          <div>
                            <label className="text-[11px] font-semibold text-slate-400 mb-1 block">Public Message to Applicant</label>
                            <Input
                              placeholder="Message sent to applicant's portal..."
                              value={publicMsg}
                              onChange={(e) => setPublicMsg(e.target.value)}
                              className="bg-slate-900 border-slate-800 text-xs text-white"
                            />
                          </div>
                        </div>
                      </div>

                      {/* Partner Operational Status Toggle (If Approved) */}
                      {selectedApp.status === 'APPROVED' && (selectedApp.supplierProfile || selectedApp.logisticsProfile) && (
                        <div className="p-4 rounded-lg bg-emerald-950/40 border border-emerald-500/30 space-y-2">
                          <h4 className="text-xs font-bold text-emerald-400 uppercase tracking-wider flex items-center gap-2">
                            <CheckCircle2 className="size-4" /> Active Partner Operational Status Management
                          </h4>
                          <div className="flex items-center gap-3 text-xs">
                            <span className="text-slate-300">
                              Current Operational Status:{' '}
                              <strong className="text-white">
                                {selectedApp.supplierProfile?.partnerStatus || selectedApp.logisticsProfile?.partnerStatus}
                              </strong>
                            </span>
                            <div className="flex gap-2">
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() =>
                                  handlePartnerStatus(
                                    selectedApp.applicationType,
                                    selectedApp.supplierProfile?.id || selectedApp.logisticsProfile?.id,
                                    'ACTIVE'
                                  )
                                }
                                className="h-7 text-xs border-emerald-500/40 text-emerald-400 hover:bg-emerald-500/20"
                              >
                                Set ACTIVE
                              </Button>
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() =>
                                  handlePartnerStatus(
                                    selectedApp.applicationType,
                                    selectedApp.supplierProfile?.id || selectedApp.logisticsProfile?.id,
                                    'SUSPENDED'
                                  )
                                }
                                className="h-7 text-xs border-amber-500/40 text-amber-400 hover:bg-amber-500/20"
                              >
                                Set SUSPENDED
                              </Button>
                            </div>
                          </div>
                        </div>
                      )}

                      {/* Documents & Verification Toggles */}
                      <div>
                        <h4 className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-3">
                          Uploaded Application Documents ({selectedApp.documents?.length || 0})
                        </h4>
                        <div className="space-y-2">
                          {selectedApp.documents?.map((doc: any) => (
                            <div key={doc.id} className="flex items-center justify-between p-3 rounded-lg bg-slate-950 border border-slate-800 text-xs">
                              <div className="flex items-center gap-3">
                                <FileText className="size-4 text-orange-400" />
                                <div>
                                  <div className="font-semibold text-white">{doc.documentCategory}</div>
                                  <div className="text-[10px] text-slate-400">{doc.originalName} ({Math.round(doc.fileSize / 1024)} KB)</div>
                                </div>
                              </div>

                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() => handleToggleDocVerify(doc.id, doc.verifiedStatus)}
                                className={`h-7 text-xs font-semibold ${
                                  doc.verifiedStatus
                                    ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-400'
                                    : 'border-slate-800 text-slate-400 hover:text-white'
                                }`}
                              >
                                {doc.verifiedStatus ? 'Verified ✓' : 'Mark Verified'}
                              </Button>
                            </div>
                          ))}
                        </div>
                      </div>

                      {/* Admin Internal Review Notes (Private) */}
                      <div>
                        <h4 className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-3 flex items-center gap-2">
                          <StickyNote className="size-4 text-yellow-400" /> Administrator Internal Review Notes (Private)
                        </h4>

                        <div className="space-y-2 mb-3">
                          {selectedApp.reviewNotes?.map((n: any) => (
                            <div key={n.id} className="p-3 rounded bg-slate-950 border border-slate-800 text-xs">
                              <div className="flex justify-between font-bold text-slate-400 text-[10px] mb-1">
                                <span>{n.authorName}</span>
                                <span>{new Date(n.createdAt).toLocaleTimeString()}</span>
                              </div>
                              <p className="text-slate-200">{n.noteText}</p>
                            </div>
                          ))}
                        </div>

                        <form onSubmit={handleAddNote} className="flex gap-2">
                          <Input
                            placeholder="Add private reviewer note..."
                            value={newNote}
                            onChange={(e) => setNewNote(e.target.value)}
                            className="bg-slate-950 border-slate-800 text-xs text-white"
                          />
                          <Button type="submit" className="bg-slate-800 hover:bg-slate-700 shrink-0 h-9 text-xs">
                            Add Note
                          </Button>
                        </form>
                      </div>
                    </CardContent>
                  </Card>
                </>
              ) : (
                <div className="text-center py-16 text-slate-400">Select an application from queue to audit.</div>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
