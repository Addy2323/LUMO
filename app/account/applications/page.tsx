'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { FileText, Clock, AlertCircle, MessageSquare, Send, Upload, ShieldCheck, CheckCircle2, XCircle, ArrowRight } from 'lucide-react'
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'

const STATUS_COLOR: Record<string, string> = {
  DRAFT: 'bg-slate-800 text-slate-300 border-slate-700',
  SUBMITTED: 'bg-blue-500/10 text-blue-400 border-blue-500/30',
  UNDER_REVIEW: 'bg-amber-500/10 text-amber-400 border-amber-500/30',
  MORE_INFORMATION_REQUIRED: 'bg-orange-500/10 text-orange-400 border-orange-500/30',
  APPROVED: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30',
  REJECTED: 'bg-red-500/10 text-red-400 border-red-500/30',
  WITHDRAWN: 'bg-slate-900 text-slate-500 border-slate-800',
}

export default function ApplicantApplicationsPage() {
  const [applications, setApplications] = useState<any[]>([])
  const [selectedApp, setSelectedApp] = useState<any | null>(null)
  const [loading, setLoading] = useState(true)
  const [newMessage, setNewMessage] = useState('')
  const [actionError, setActionError] = useState<string | null>(null)

  const fetchApplications = async () => {
    try {
      const res = await fetch('/api/applications')
      if (res.ok) {
        const data = await res.json()
        setApplications(data.applications || [])
        if (data.applications?.length > 0 && !selectedApp) {
          fetchAppDetail(data.applications[0].id)
        }
      }
    } catch {
      // silent
    } finally {
      setLoading(false)
    }
  }

  const fetchAppDetail = async (id: string) => {
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
    fetchApplications()
  }, [])

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!newMessage.trim() || !selectedApp) return

    try {
      const res = await fetch(`/api/applications/${selectedApp.id}/message`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message: newMessage }),
      })

      if (res.ok) {
        setNewMessage('')
        fetchAppDetail(selectedApp.id)
      }
    } catch {
      setActionError('Failed to send message.')
    }
  }

  const handleWithdraw = async () => {
    if (!selectedApp) return
    if (!confirm('Are you sure you want to withdraw this application? This action cannot be undone.')) return

    try {
      const res = await fetch(`/api/applications/${selectedApp.id}/withdraw`, {
        method: 'POST',
      })

      if (res.ok) {
        fetchApplications()
        fetchAppDetail(selectedApp.id)
      } else {
        const data = await res.json()
        setActionError(data.error || 'Failed to withdraw application.')
      }
    } catch {
      setActionError('Withdrawal error.')
    }
  }

  return (
    <div className="min-h-screen bg-[#090d16] text-white py-10 px-4 sm:px-6 lg:px-8">
      <div className="max-w-6xl mx-auto">
        <div className="flex items-center justify-between mb-8 pb-4 border-b border-slate-800">
          <div>
            <h1 className="text-2xl font-extrabold text-white">Partner Application Dashboard</h1>
            <p className="text-slate-400 text-xs mt-1">Track your onboarding applications and communicate with review teams.</p>
          </div>

          <Link href="/register">
            <Button className="bg-orange-500 hover:bg-orange-600 font-bold text-xs btn-premium">
              Start New Application
            </Button>
          </Link>
        </div>

        {loading ? (
          <div className="text-center py-16 text-slate-400 text-sm">Loading applications...</div>
        ) : applications.length === 0 ? (
          <Card className="bg-slate-900/60 border-slate-800 text-center p-12">
            <FileText className="size-12 text-slate-600 mx-auto mb-3" />
            <CardTitle className="text-lg font-bold text-white mb-2">No Active Partner Applications</CardTitle>
            <CardDescription className="text-slate-400 text-xs max-w-md mx-auto mb-6">
              You haven't submitted any supplier or logistics partner applications yet.
            </CardDescription>
            <Link href="/register">
              <Button className="bg-orange-500 hover:bg-orange-600 font-bold btn-premium">
                Explore Partner Opportunities
              </Button>
            </Link>
          </Card>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Left Column: Applications List */}
            <div className="space-y-3">
              <h3 className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Your Applications</h3>
              {applications.map((app) => {
                const isSelected = selectedApp?.id === app.id
                return (
                  <Card
                    key={app.id}
                    onClick={() => fetchAppDetail(app.id)}
                    className={`bg-slate-900/80 border transition-all cursor-pointer ${
                      isSelected ? 'border-orange-500/60 bg-slate-900' : 'border-slate-800 hover:border-slate-700'
                    }`}
                  >
                    <CardContent className="p-4">
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-xs font-bold text-white uppercase">{app.applicationType} Partner</span>
                        <span className={`text-[10px] font-semibold px-2 py-0.5 rounded border ${STATUS_COLOR[app.status] || 'bg-slate-800'}`}>
                          {app.status}
                        </span>
                      </div>
                      <div className="text-[11px] text-slate-400">
                        Updated: {new Date(app.updatedAt).toLocaleDateString()}
                      </div>
                    </CardContent>
                  </Card>
                )
              })}
            </div>

            {/* Right 2 Columns: Application Detail View */}
            <div className="lg:col-span-2">
              {selectedApp ? (
                <Card className="bg-slate-900/80 border-slate-800">
                  <CardHeader className="p-6 border-b border-slate-800 flex flex-row items-center justify-between">
                    <div>
                      <div className="flex items-center gap-2 mb-1">
                        <CardTitle className="text-xl font-bold text-white uppercase">
                          {selectedApp.applicationType} Application
                        </CardTitle>
                        <span className={`text-xs font-semibold px-2.5 py-0.5 rounded border ${STATUS_COLOR[selectedApp.status]}`}>
                          {selectedApp.status}
                        </span>
                      </div>
                      <CardDescription className="text-xs text-slate-400">
                        Application ID: {selectedApp.id}
                      </CardDescription>
                    </div>

                    {(selectedApp.status === 'DRAFT' || selectedApp.status === 'SUBMITTED') && (
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={handleWithdraw}
                        className="border-red-500/30 text-red-400 hover:bg-red-500/10 text-xs"
                      >
                        Withdraw
                      </Button>
                    )}
                  </CardHeader>

                  <CardContent className="p-6 space-y-6">
                    {actionError && (
                      <div className="p-3 rounded-lg bg-red-500/10 border border-red-500/30 text-red-400 text-xs flex items-center gap-2">
                        <AlertCircle className="size-4 shrink-0" />
                        <span>{actionError}</span>
                      </div>
                    )}

                    {/* Reviewer Message Thread */}
                    <div>
                      <h4 className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-3 flex items-center gap-2">
                        <MessageSquare className="size-4 text-orange-400" /> Reviewer Chat & Communications
                      </h4>

                      <div className="bg-slate-950 rounded-lg border border-slate-800 p-4 space-y-3 max-h-60 overflow-y-auto mb-3">
                        {selectedApp.messages?.length === 0 ? (
                          <div className="text-center py-6 text-slate-500 text-xs">No messages yet.</div>
                        ) : (
                          selectedApp.messages?.map((msg: any) => (
                            <div
                              key={msg.id}
                              className={`p-3 rounded-lg text-xs ${
                                msg.senderRole === 'ADMIN'
                                  ? 'bg-orange-500/10 border border-orange-500/20 text-orange-200 ml-4'
                                  : 'bg-slate-900 border border-slate-800 text-slate-300 mr-4'
                              }`}
                            >
                              <div className="flex items-center justify-between mb-1 font-bold text-[10px]">
                                <span>{msg.senderName} ({msg.senderRole})</span>
                                <span className="text-slate-500">{new Date(msg.createdAt).toLocaleTimeString()}</span>
                              </div>
                              <p className="leading-relaxed">{msg.message}</p>
                            </div>
                          ))
                        )}
                      </div>

                      <form onSubmit={handleSendMessage} className="flex gap-2">
                        <Input
                          placeholder="Type a response to the review team..."
                          value={newMessage}
                          onChange={(e) => setNewMessage(e.target.value)}
                          className="bg-slate-950 border-slate-800 text-xs text-white"
                        />
                        <Button type="submit" className="bg-orange-500 hover:bg-orange-600 shrink-0 h-9">
                          <Send className="size-3.5" />
                        </Button>
                      </form>
                    </div>

                    {/* Uploaded Documents */}
                    <div>
                      <h4 className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-3">
                        Verification Documents ({selectedApp.documents?.length || 0})
                      </h4>
                      <div className="space-y-2">
                        {selectedApp.documents?.map((doc: any) => (
                          <div key={doc.id} className="flex items-center justify-between p-3 rounded-lg bg-slate-950 border border-slate-800 text-xs">
                            <div className="flex items-center gap-2">
                              <FileText className="size-4 text-orange-400" />
                              <span className="font-semibold text-white">{doc.documentCategory}</span>
                              <span className="text-slate-400">({doc.originalName})</span>
                            </div>
                            {doc.verifiedStatus ? (
                              <span className="text-[10px] font-semibold text-emerald-400 flex items-center gap-1">
                                <CheckCircle2 className="size-3" /> Verified
                              </span>
                            ) : (
                              <span className="text-[10px] text-amber-400">Pending Review</span>
                            )}
                          </div>
                        ))}
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ) : (
                <div className="text-center py-16 text-slate-400">Select an application to view details.</div>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
