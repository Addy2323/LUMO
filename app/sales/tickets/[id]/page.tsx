'use client'

import { useState } from 'react'
import Link from 'next/link'
import { useParams } from 'next/navigation'
import {
  AlertTriangle,
  ArrowLeft,
  CheckCircle2,
  Lock,
  MessageSquare,
  Send,
  ShieldCheck,
  Sparkles,
  UserCheck,
  Users,
} from 'lucide-react'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu'
import { Textarea } from '@/components/ui/textarea'
import { StatusBadge } from '@/components/status-badge'
import { TICKETS, TicketMessage, TicketStatus } from '@/lib/mock/support'
import { formatDate } from '@/lib/format'
import { useSessionStore } from '@/lib/stores/session-store'

const CANNED_RESPONSES = [
  {
    title: 'Logistics Delay Update',
    body: 'Habari, order yako imepitia ukaguzi wa usafirishaji Arusha. Tunatarajia logistics partner wetu aifikishe kwako ndani ya masaa 24 yajayo.',
  },
  {
    title: 'Refund Authorization Notice',
    body: 'Return request yako imepitishwa. Payout currency (TZS) inarejeshwa moja kwa moja kwenye namba yako ya AzamPay / M-Pesa ndani ya siku 2 za kazi.',
  },
  {
    title: 'Supplier Stock Check (Internal)',
    body: 'Internal Note to Merchant: Tafadhali thibitisha ikiwa SKU hii ipo tayari kufungashwa (packed) kwa ajili ya pickup ya kesho asubuhi.',
  },
]

export default function SalesTicketDetailPage() {
  const params = useParams()
  const ticketId = params.id as string
  const ticket = TICKETS.find((t) => t.id === ticketId) ?? TICKETS[0]

  const user = useSessionStore((s) => s.user)

  const [activeTab, setActiveTab] = useState<'customer' | 'supplier'>('customer')
  const [messages, setMessages] = useState<TicketMessage[]>(ticket.messages)
  const [internalNotes, setInternalNotes] = useState<TicketMessage[]>(ticket.internalNotes ?? [])
  const [ticketStatus, setTicketStatus] = useState<TicketStatus>(ticket.status)

  const [replyText, setReplyText] = useState('')

  function handleSendReply(e: React.FormEvent) {
    e.preventDefault()
    if (!replyText.trim()) return

    const newMessage: TicketMessage = {
      id: `msg_${Date.now()}`,
      authorRole: 'sales',
      authorName: `${user?.fullName ?? 'Neema Kibona'} (Sales Dept)`,
      body: replyText,
      sentAt: new Date().toISOString(),
    }



    if (activeTab === 'customer') {
      setMessages([...messages, newMessage])
    } else {
      setInternalNotes([...internalNotes, newMessage])
    }

    setReplyText('')
  }

  function handleInsertCanned(text: string) {
    setReplyText((prev) => (prev ? `${prev}\n\n${text}` : text))
  }

  return (
    <div className="flex flex-col gap-6 max-w-5xl">
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-3">
          <Button variant="outline" size="icon" render={<Link href="/sales/tickets" />}>
            <ArrowLeft />
          </Button>
          <div>
            <div className="flex items-center gap-2">
              <span className="font-mono text-xs text-muted-foreground">{ticket.reference}</span>
              <StatusBadge status={ticketStatus} />
              <Badge variant="outline" className="text-[10px]">
                {ticket.category}
              </Badge>
            </div>
            <h1 className="text-xl font-semibold tracking-tight">{ticket.subject}</h1>
          </div>
        </div>

        {/* Action Controls */}
        <div className="flex items-center gap-2">
          {ticketStatus !== 'resolved' ? (
            <Button
              variant="outline"
              size="sm"
              onClick={() => setTicketStatus('resolved')}
              className="text-xs"
            >
              <CheckCircle2 data-icon="inline-start" className="text-success-600" />
              Mark Resolved
            </Button>
          ) : (
            <Badge variant="secondary">Resolved</Badge>
          )}
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        {/* Left 2 Columns: Chat & Liaison Threads */}
        <div className="flex flex-col gap-4 lg:col-span-2">
          {/* Thread Switcher Header */}
          <div className="flex items-center justify-between border-b border-border pb-2">
            <div className="flex gap-2">
              <Button
                variant={activeTab === 'customer' ? 'default' : 'outline'}
                size="sm"
                onClick={() => setActiveTab('customer')}
                className="text-xs"
              >
                <Users data-icon="inline-start" />
                Customer Thread ({messages.length})
              </Button>
              <Button
                variant={activeTab === 'supplier' ? 'default' : 'outline'}
                size="sm"
                onClick={() => setActiveTab('supplier')}
                className="text-xs text-warning-700 dark:text-warning-400"
              >
                <Lock data-icon="inline-start" />
                Internal Supplier Notes ({internalNotes.length})
              </Button>
            </div>

            {/* Canned Responses Dropdown */}
            <DropdownMenu>
              <DropdownMenuTrigger render={
                <Button variant="ghost" size="sm" className="text-xs text-muted-foreground">
                  <Sparkles data-icon="inline-start" className="text-primary-500" />
                  Canned Responses
                </Button>
              } />
              <DropdownMenuContent align="end" className="w-72">
                {CANNED_RESPONSES.map((tmpl, idx) => (
                  <DropdownMenuItem
                    key={idx}
                    onClick={() => handleInsertCanned(tmpl.body)}
                    className="flex flex-col items-start gap-1 text-xs cursor-pointer"
                  >
                    <span className="font-semibold text-foreground">{tmpl.title}</span>
                    <span className="text-[11px] text-muted-foreground line-clamp-2">{tmpl.body}</span>
                  </DropdownMenuItem>
                ))}
              </DropdownMenuContent>
            </DropdownMenu>
          </div>

          {/* Active Thread Banner */}
          {activeTab === 'supplier' ? (
            <Card className="border-warning-500/30 bg-warning-50/40 dark:bg-warning-950/20">
              <CardContent className="flex items-center gap-2 p-3 text-xs text-warning-800 dark:text-warning-300">
                <Lock className="size-4 shrink-0 text-warning-600" />
                <span>
                  <strong>Internal Note Mode:</strong> Messages in this thread are strictly visible to Lumo Sales staff and the assigned merchant supplier. The customer cannot see this thread.
                </span>
              </CardContent>
            </Card>
          ) : (
            <Card className="border-info-500/20 bg-info-50/40 dark:bg-info-950/20">
              <CardContent className="flex items-center gap-2 p-3 text-xs text-info-800 dark:text-info-400">
                <ShieldCheck className="size-4 shrink-0 text-info-600" />
                <span>
                  <strong>Customer Thread Mode:</strong> Replies sent here will be delivered directly to the customer inbox.
                </span>
              </CardContent>
            </Card>
          )}

          {/* Message List */}
          <Card className="min-h-[360px] flex flex-col justify-between">
            <CardContent className="flex flex-col gap-4 p-4 max-h-[500px] overflow-y-auto">
              {(activeTab === 'customer' ? messages : internalNotes).map((msg) => {
                const isSales = (msg.authorRole as string) === 'sales' || (msg.authorRole as string) === 'admin'
                return (
                  <div
                    key={msg.id}
                    className={`flex flex-col gap-1 p-3 rounded-lg text-xs max-w-[85%] ${
                      isSales
                        ? 'self-end bg-primary-600 text-white dark:bg-primary-700'
                        : activeTab === 'supplier'
                          ? 'self-start bg-warning-100 dark:bg-warning-950/60 border border-warning-200 dark:border-warning-800/40 text-foreground'
                          : 'self-start bg-muted text-foreground'
                    }`}
                  >
                    <div className="flex items-center justify-between gap-4 text-[11px] opacity-80 border-b border-current/10 pb-1">
                      <span className="font-semibold">{msg.authorName}</span>
                      <span>{formatDate(msg.sentAt ?? (msg as { createdAt?: string }).createdAt)}</span>
                    </div>
                    <p className="whitespace-pre-wrap leading-relaxed mt-1">{msg.body ?? (msg as { content?: string }).content}</p>
                  </div>
                )
              })}
            </CardContent>


            {/* Reply Composer */}
            <form onSubmit={handleSendReply} className="p-3 border-t border-border flex flex-col gap-2">
              <Textarea
                placeholder={
                  activeTab === 'customer'
                    ? 'Write response to customer...'
                    : 'Write internal note to merchant supplier...'
                }
                value={replyText}
                onChange={(e) => setReplyText(e.target.value)}
                rows={3}
                className="text-xs resize-none"
              />
              <div className="flex justify-between items-center">
                <span className="text-[11px] text-muted-foreground">
                  Pressing send posts to {activeTab === 'customer' ? 'Customer' : 'Internal Supplier'} thread
                </span>
                <Button type="submit" size="sm">
                  <Send data-icon="inline-start" />
                  Send {activeTab === 'customer' ? 'Customer Reply' : 'Internal Note'}
                </Button>
              </div>
            </form>
          </Card>
        </div>

        {/* Right Column: Ticket Meta & Order Context */}
        <div className="flex flex-col gap-6">
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-semibold">Customer Details</CardTitle>
            </CardHeader>
            <CardContent className="flex flex-col gap-2 text-xs">
              <div className="flex justify-between">
                <span className="text-muted-foreground">Name:</span>
                <span className="font-semibold">{ticket.customer.name}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Phone:</span>
                <span className="font-semibold">{ticket.customer.phone}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Email:</span>
                <span>{ticket.customer.email}</span>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-semibold">Order Reference</CardTitle>
            </CardHeader>
            <CardContent className="flex flex-col gap-2 text-xs">
              <div className="flex justify-between items-center">
                <span className="text-muted-foreground">Order ID:</span>
                <span className="font-mono font-semibold">{ticket.orderReference ?? 'N/A'}</span>
              </div>
              {ticket.orderReference ? (
                <Button
                  variant="outline"
                  size="sm"
                  className="w-full mt-2"
                  render={<Link href="/account/orders/ord_1001" target="_blank" />}
                >
                  Inspect Order Details
                </Button>
              ) : null}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}
