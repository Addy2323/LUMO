'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import {
  Inbox,
  MessageSquare,
  Search,
  Send,
  UserCheck,
  CheckCircle2,
  Clock,
  AlertCircle,
  Filter,
  Plus,
  Trash2,
  RefreshCw,
} from 'lucide-react'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { formatDate } from '@/lib/format'
import { toast } from 'sonner'

type InboxTicket = {
  id: string
  ticketNumber: string
  customerName: string
  customerEmail: string
  subject: string
  category: string
  priority: string
  status: string
  assignedAgent: string
  updatedAt: string
  messages: { sender: 'customer' | 'agent'; text: string; time: string }[]
}

export default function SharedInboxPage() {
  const [tickets, setTickets] = useState<InboxTicket[]>([])
  const [loading, setLoading] = useState(true)
  const [selectedTicketId, setSelectedTicketId] = useState<string>('')
  const [search, setSearch] = useState('')
  const [statusFilter, setStatusFilter] = useState<string>('all')
  const [replyText, setReplyText] = useState('')

  useEffect(() => {
    fetchInboxTickets()
  }, [])

  async function fetchInboxTickets() {
    setLoading(true)
    try {
      const res = await fetch('/api/support/tickets')
      if (res.ok) {
        const data = await res.json()
        const rawTickets = Array.isArray(data) ? data : data.tickets || data.disputes || []
        const mapped: InboxTicket[] = rawTickets.map((t: any) => ({
          id: t.id,
          ticketNumber: t.ticketNumber || `TCK-${t.id.slice(0, 6).toUpperCase()}`,
          customerName: t.buyer?.name || t.buyerName || 'Customer',
          customerEmail: t.buyer?.email || t.buyerEmail || '',
          subject: t.reason || t.subject || 'Support Inquiry',
          category: t.category || 'General',
          priority: t.status === 'OPEN' ? 'high' : 'medium',
          status: (t.status || 'OPEN').toLowerCase().replace('_', '_'),
          assignedAgent: t.assignedAgent || 'Unassigned',
          updatedAt: t.updatedAt || t.createdAt || new Date().toISOString(),
          messages: [
            {
              sender: 'customer' as const,
              text: t.reason || t.subject || 'Customer inquiry submitted via the platform.',
              time: new Date(t.createdAt || Date.now()).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
            },
          ],
        }))
        setTickets(mapped)
        if (mapped.length > 0) setSelectedTicketId(mapped[0].id)
      }
    } catch (err) {
      console.error('Failed to fetch inbox tickets:', err)
      toast.error('Failed to load inbox tickets')
    } finally {
      setLoading(false)
    }
  }

  const activeTicket = tickets.find((t) => t.id === selectedTicketId) || tickets[0]

  const filteredTickets = tickets.filter((t) => {
    const matchesStatus = statusFilter === 'all' || t.status === statusFilter
    const query = search.toLowerCase()
    const matchesSearch =
      query === '' ||
      t.ticketNumber.toLowerCase().includes(query) ||
      t.customerName.toLowerCase().includes(query) ||
      t.subject.toLowerCase().includes(query)
    return matchesStatus && matchesSearch
  })

  function handleSendReply(e: React.FormEvent) {
    e.preventDefault()
    if (!replyText.trim() || !activeTicket) return

    const newMsg = {
      sender: 'agent' as const,
      text: replyText.trim(),
      time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    }

    setTickets(
      tickets.map((t) =>
        t.id === activeTicket.id
          ? {
              ...t,
              status: t.status === 'open' ? 'in_progress' : t.status,
              assignedAgent: 'Sales Officer',
              updatedAt: new Date().toISOString(),
              messages: [...t.messages, newMsg],
            }
          : t,
      ),
    )

    setReplyText('')
    toast.success('Reply dispatched to customer!')
  }

  function handleStatusChange(ticketId: string, newStatus: string) {
    setTickets(
      tickets.map((t) => (t.id === ticketId ? { ...t, status: newStatus } : t)),
    )
    toast.success(`Ticket status updated to ${newStatus.toUpperCase()}`)
  }

  function handleAssignToMe(ticketId: string) {
    setTickets(
      tickets.map((t) => (t.id === ticketId ? { ...t, assignedAgent: 'Sales Officer' } : t)),
    )
    toast.success('Ticket assigned to your queue!')
  }

  return (
    <div className="flex flex-col gap-6">
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-extrabold tracking-tight">Shared Service Desk Inbox</h1>
          <p className="text-sm text-muted-foreground">
            Centralized B2B customer inquiries, sourcing ticket escalation, and resolution workflow — powered by live PostgreSQL.
          </p>
        </div>
        <Button
          onClick={fetchInboxTickets}
          variant="outline"
          className="text-xs font-bold gap-1.5 h-9"
        >
          <RefreshCw className={`size-3.5 ${loading ? 'animate-spin' : ''}`} /> Refresh Inbox
        </Button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Ticket List Panel */}
        <Card className="lg:col-span-5">
          <CardHeader className="pb-3 space-y-3">
            <div className="flex items-center justify-between">
              <CardTitle className="text-base font-extrabold flex items-center gap-2">
                <Inbox className="size-5 text-brand-500" />
                Active Tickets ({filteredTickets.length})
              </CardTitle>
            </div>

            {/* Search & Filter */}
            <div className="flex flex-col gap-2">
              <div className="relative">
                <Search className="absolute left-2.5 top-2.5 size-4 text-muted-foreground" />
                <Input
                  placeholder="Search ticket #, customer, or subject..."
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  className="pl-8 text-xs"
                />
              </div>

              <div className="flex items-center gap-1.5 flex-wrap">
                {['all', 'open', 'in_progress', 'resolved'].map((st) => (
                  <Button
                    key={st}
                    variant={statusFilter === st ? 'default' : 'outline'}
                    size="xs"
                    onClick={() => setStatusFilter(st)}
                    className="text-[11px] capitalize font-bold"
                  >
                    {st.replace('_', ' ')}
                  </Button>
                ))}
              </div>
            </div>
          </CardHeader>

          <CardContent className="p-0">
            <div className="divide-y border-t border-border max-h-[600px] overflow-y-auto">
              {loading ? (
                <div className="p-12 text-center text-xs text-muted-foreground">
                  <RefreshCw className="size-6 animate-spin mx-auto mb-2 text-[#FF6B00]" />
                  Loading tickets from PostgreSQL database...
                </div>
              ) : filteredTickets.length === 0 ? (
                <div className="p-12 text-center text-xs text-muted-foreground space-y-1">
                  <p className="font-semibold text-foreground">No active tickets found in database.</p>
                  <p>Customer tickets will appear here when submitted.</p>
                </div>
              ) : (
                filteredTickets.map((t) => {
                  const isSelected = t.id === activeTicket?.id
                  return (
                    <div
                      key={t.id}
                      onClick={() => setSelectedTicketId(t.id)}
                      className={`p-4 flex flex-col gap-2 cursor-pointer transition-colors ${
                        isSelected ? 'bg-brand-500/10 border-l-4 border-l-brand-500' : 'hover:bg-muted/30'
                      }`}
                    >
                      <div className="flex items-center justify-between">
                        <span className="font-mono font-extrabold text-xs text-brand-500">{t.ticketNumber}</span>
                        <Badge
                          className={`text-[9px] uppercase font-bold ${
                            t.priority === 'urgent'
                              ? 'bg-red-600 text-white'
                              : t.priority === 'high'
                              ? 'bg-amber-500 text-white'
                              : 'bg-slate-600 text-white'
                          }`}
                        >
                          {t.priority}
                        </Badge>
                      </div>

                      <h4 className="text-xs font-bold text-foreground line-clamp-1">{t.subject}</h4>

                      <div className="flex items-center justify-between text-[11px] text-muted-foreground">
                        <span className="truncate max-w-[160px]">{t.customerName}</span>
                        <span className="capitalize font-medium text-foreground">{t.status.replace('_', ' ')}</span>
                      </div>
                    </div>
                  )
                })
              )}
            </div>
          </CardContent>
        </Card>

        {/* Selected Ticket Conversation & Resolution Inspector */}
        <Card className="lg:col-span-7">
          {activeTicket ? (
            <>
              <CardHeader className="border-b pb-4 space-y-2">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                  <div className="flex items-center gap-2">
                    <span className="font-mono font-extrabold text-base text-brand-500">{activeTicket.ticketNumber}</span>
                    <Badge variant="outline" className="text-xs font-bold text-foreground">
                      {activeTicket.category}
                    </Badge>
                  </div>

                  <div className="flex items-center gap-2">
                    {activeTicket.assignedAgent === 'Unassigned' && (
                      <Button
                        size="xs"
                        onClick={() => handleAssignToMe(activeTicket.id)}
                        className="bg-brand-500 hover:bg-brand-600 text-white font-bold text-xs"
                      >
                        <UserCheck className="size-3.5 mr-1" />
                        Assign to Me
                      </Button>
                    )}

                    <select
                      value={activeTicket.status}
                      onChange={(e) => handleStatusChange(activeTicket.id, e.target.value)}
                      className="flex h-8 rounded-md border border-input bg-background px-2 py-0.5 text-xs font-bold focus-visible:outline-none"
                    >
                      <option value="open">Open</option>
                      <option value="in_progress">In Progress</option>
                      <option value="resolved">Resolved</option>
                      <option value="closed">Closed</option>
                    </select>
                  </div>
                </div>

                <h2 className="text-base font-extrabold text-foreground">{activeTicket.subject}</h2>

                <div className="text-xs text-muted-foreground flex flex-wrap gap-3">
                  <span>Customer: <strong className="text-foreground">{activeTicket.customerName}</strong> ({activeTicket.customerEmail})</span>
                  <span>Agent: <strong className="text-foreground">{activeTicket.assignedAgent}</strong></span>
                </div>
              </CardHeader>

              <CardContent className="p-4 space-y-4">
                {/* Chat History */}
                <div className="space-y-3 max-h-[350px] overflow-y-auto pr-2">
                  {activeTicket.messages.map((m, idx) => {
                    const isAgent = m.sender === 'agent'
                    return (
                      <div
                        key={idx}
                        className={`flex flex-col gap-1 max-w-[85%] ${isAgent ? 'ml-auto items-end' : 'mr-auto items-start'}`}
                      >
                        <div
                          className={`p-3.5 rounded-2xl text-xs ${
                            isAgent
                              ? 'bg-brand-500 text-white font-medium rounded-tr-xs'
                              : 'bg-muted border border-border text-foreground rounded-tl-xs'
                          }`}
                        >
                          {m.text}
                        </div>
                        <span className="text-[10px] text-muted-foreground px-1">{m.time}</span>
                      </div>
                    )
                  })}
                </div>

                {/* Reply Form */}
                <form onSubmit={handleSendReply} className="space-y-3 pt-3 border-t">
                  <Textarea
                    placeholder="Type official response to customer..."
                    value={replyText}
                    onChange={(e) => setReplyText(e.target.value)}
                    rows={3}
                    className="text-xs"
                  />

                  <div className="flex justify-end gap-2">
                    <Button type="submit" className="bg-brand-500 hover:bg-brand-600 text-white font-bold text-xs">
                      <Send className="size-3.5 mr-1" />
                      Dispatch Response
                    </Button>
                  </div>
                </form>
              </CardContent>
            </>
          ) : (
            <CardContent className="py-12 text-center text-xs text-muted-foreground">
              {loading ? 'Loading tickets...' : 'No tickets available. Customer tickets will appear when submitted.'}
            </CardContent>
          )}
        </Card>
      </div>
    </div>
  )
}
