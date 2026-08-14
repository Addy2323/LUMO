'use client'

import { useEffect, useState } from 'react'
import { Headphones, MessageSquare, Plus, Send, ShieldCheck, User } from 'lucide-react'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { StatusBadge } from '@/components/status-badge'
import { TICKETS } from '@/lib/mock/support'
import { formatDate } from '@/lib/format'
import { useSessionStore } from '@/lib/stores/session-store'

type TicketMessage = {
  id: string
  authorRole: 'customer' | 'sales' | 'supplier' | 'system'
  authorName: string
  body: string
  sentAt?: string
  createdAt?: string
}

export type Ticket = {
  id: string
  reference: string
  subject: string
  status: any
  priority?: string
  category?: string
  createdAt: string
  relatedOrderRef?: string
  customer?: { id: string; name: string; email: string; phone: string }
  assignedAgent?: { id: string; name: string }
  messages: TicketMessage[]
}

export default function CustomerSupportPage() {
  const user = useSessionStore((s) => s.user)
  const isDemoUser =
    user?.id === 'usr_cus_001' ||
    user?.id === 'cust_01' ||
    user?.email === 'amina.hassan@example.co.tz'

  const [ticketsList, setTicketsList] = useState<Ticket[]>([])
  const [activeTicketId, setActiveTicketId] = useState<string>('')
  const [replyText, setReplyText] = useState('')

  useEffect(() => {
    if (!user) {
      setTicketsList([])
      return
    }

    if (isDemoUser) {
      setTicketsList(TICKETS as unknown as Ticket[])
      setActiveTicketId(TICKETS[0]?.id ?? '')
      return
    }

    try {
      const stored = localStorage.getItem(`lumo_tickets_${user.id}`)
      if (stored) {
        const parsed: Ticket[] = JSON.parse(stored)
        setTicketsList(parsed)
        if (parsed.length > 0) {
          setActiveTicketId(parsed[0].id)
        }
      } else {
        setTicketsList([])
      }
    } catch {
      setTicketsList([])
    }
  }, [user, isDemoUser])

  function updateAndPersistTickets(newList: Ticket[]) {
    setTicketsList(newList)
    if (user && !isDemoUser) {
      try {
        localStorage.setItem(`lumo_tickets_${user.id}`, JSON.stringify(newList))
      } catch (e) {
        console.error('Failed to save tickets:', e)
      }
    }
  }

  const activeTicket = ticketsList.find((t) => t.id === activeTicketId) ?? ticketsList[0]

  function handleSendReply() {
    if (!replyText.trim() || !activeTicket) return
    const updated = ticketsList.map((t) => {
      if (t.id === activeTicket.id) {
        return {
          ...t,
          messages: [
            ...t.messages,
            {
              id: `msg_${Date.now()}`,
              authorRole: 'customer' as const,
              authorName: user?.fullName ?? 'Customer',
              body: replyText.trim(),
              sentAt: new Date().toISOString(),
            },
          ],
        }
      }
      return t
    })
    updateAndPersistTickets(updated)
    setReplyText('')
  }

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Sales Department Support</h1>
          <p className="text-sm text-muted-foreground">
            All customer inquiries and order support are handled by Lumo staff.
          </p>
        </div>

        <NewTicketDialog onCreated={(newTkt) => {
          const updated = [newTkt, ...ticketsList]
          updateAndPersistTickets(updated)
          setActiveTicketId(newTkt.id)
        }} />
      </div>

      <Card className="border-info-500/20 bg-info-50/40 dark:bg-info-950/20">
        <CardContent className="flex items-center gap-3 p-4 text-xs text-info-800 dark:text-info-400">
          <ShieldCheck className="size-4 shrink-0 text-info-600" />
          <span>
            Notice: For buyer protection, customers communicate exclusively with the Lumo Sales Department team. Suppliers do not receive direct messages from customers.
          </span>
        </CardContent>
      </Card>

      {ticketsList.length === 0 ? (
        <Card className="py-12 text-center">
          <CardContent className="space-y-4">
            <MessageSquare className="size-12 text-muted-foreground mx-auto" />
            <div>
              <h3 className="text-base font-bold">No support tickets</h3>
              <p className="text-xs text-muted-foreground mt-1">Need help with an order or inquiry? Create a ticket to chat with Lumo staff.</p>
            </div>
            <NewTicketDialog onCreated={(newTkt) => {
              const updated = [newTkt, ...ticketsList]
              updateAndPersistTickets(updated)
              setActiveTicketId(newTkt.id)
            }} />
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-6 lg:grid-cols-3">
        {/* Ticket List Panel */}
        <Card className="lg:col-span-1">
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-semibold">Support Tickets</CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            <div className="divide-y border-t border-border">
              {ticketsList.map((tkt) => {
                const isActive = tkt.id === activeTicket.id
                return (
                  <button
                    key={tkt.id}
                    type="button"
                    onClick={() => setActiveTicketId(tkt.id)}
                    className={`flex flex-col gap-1.5 w-full p-3.5 text-left transition-colors ${
                      isActive ? 'bg-muted font-medium' : 'hover:bg-muted/50'
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <span className="font-semibold text-xs text-muted-foreground">{tkt.reference}</span>
                      <StatusBadge status={tkt.status} />
                    </div>
                    <span className="text-sm font-semibold truncate">{tkt.subject}</span>
                    <span className="text-[11px] text-muted-foreground">
                      Updated {formatDate(tkt.messages[tkt.messages.length - 1]?.createdAt ?? tkt.createdAt)}
                    </span>
                  </button>
                )
              })}
            </div>
          </CardContent>
        </Card>

        {/* Active Conversation Panel */}
        {activeTicket ? (
          <Card className="lg:col-span-2 flex flex-col h-[600px]">
            <CardHeader className="border-b border-border pb-4">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <div className="flex flex-col gap-0.5">
                  <div className="flex items-center gap-2">
                    <CardTitle className="text-base font-semibold">{activeTicket.subject}</CardTitle>
                    <StatusBadge status={activeTicket.status} />
                  </div>
                  <CardDescription className="text-xs">
                    Ticket Ref: {activeTicket.reference} · Related Order: {activeTicket.relatedOrderRef ?? 'General Inquiry'}
                  </CardDescription>
                </div>
              </div>
            </CardHeader>

            {/* Chat Thread Messages */}
            <CardContent className="flex-1 overflow-y-auto p-4 flex flex-col gap-4">
              {activeTicket.messages.map((msg) => {
                const isCustomer = msg.authorRole === 'customer'
                return (
                  <div
                    key={msg.id}
                    className={`flex flex-col gap-1 max-w-[85%] ${
                      isCustomer ? 'ml-auto items-end' : 'mr-auto items-start'
                    }`}
                  >
                    <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                      <span className="font-medium text-foreground">{msg.authorName}</span>
                      <Badge variant="outline" className="text-[10px] px-1 py-0">
                        {isCustomer ? 'Customer' : 'Sales Department'}
                      </Badge>
                      <span>· {formatDate(msg.sentAt ?? msg.createdAt)}</span>
                    </div>

                    <div
                      className={`rounded-lg p-3 text-sm leading-relaxed ${
                        isCustomer
                          ? 'bg-primary-400 text-white dark:text-gray-900'
                          : 'bg-muted text-foreground border border-border'
                      }`}
                    >
                      {msg.body}
                    </div>
                  </div>
                )
              })}
            </CardContent>

            {/* Input Bar */}
            <div className="p-3 border-t border-border bg-background flex gap-2">
              <Textarea
                placeholder="Type your message to Sales Department..."
                value={replyText}
                onChange={(e) => setReplyText(e.target.value)}
                rows={2}
                className="resize-none text-xs flex-1"
                onKeyDown={(e) => {
                  if (e.key === 'Enter' && !e.shiftKey) {
                    e.preventDefault()
                    handleSendReply()
                  }
                }}
              />
              <Button size="icon" className="self-end" onClick={handleSendReply}>
                <Send className="size-4" />
              </Button>
            </div>
          </Card>
        ) : null}
      </div>
      )}
    </div>
  )
}

function NewTicketDialog({ onCreated }: { onCreated: (tkt: Ticket) => void }) {
  const [open, setOpen] = useState(false)
  const [subject, setSubject] = useState('')
  const [orderRef, setOrderRef] = useState('')
  const [message, setMessage] = useState('')

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!subject.trim() || !message.trim()) return

    const newTicket: Ticket = {
      id: `tkt_${Date.now()}`,
      reference: `TKT-${Math.floor(10000 + Math.random() * 90000)}`,
      subject: subject.trim(),
      status: 'open',
      priority: 'normal',
      category: 'Order inquiry',
      createdAt: new Date().toISOString(),
      relatedOrderRef: orderRef.trim() || undefined,
      customer: {
        id: 'usr_cus_001',
        name: 'Amina Hassan',
        email: 'amina.hassan@example.co.tz',
        phone: '+255 712 445 908',
      },
      assignedAgent: { id: 'usr_sal_001', name: 'Devota Moshi' },
      messages: [
        {
          id: `msg_${Date.now()}`,
          authorRole: 'customer',
          authorName: 'Amina Hassan',
          body: message.trim(),
          sentAt: new Date().toISOString(),
        },
      ],
    }

    onCreated(newTicket)
    setOpen(false)
    setSubject('')
    setOrderRef('')
    setMessage('')
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger render={
        <Button size="sm">
          <Plus data-icon="inline-start" />
          Create Support Ticket
        </Button>
      } />
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Contact Sales Department</DialogTitle>
          <DialogDescription>
            Submit an inquiry regarding orders, payments, deliveries, or products.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="flex flex-col gap-4 mt-2">
          <div className="flex flex-col gap-1.5">
            <label className="text-xs font-medium">Subject</label>
            <Input
              placeholder="e.g. Delivery status for LM-24081"
              value={subject}
              onChange={(e) => setSubject(e.target.value)}
              required
            />
          </div>

          <div className="flex flex-col gap-1.5">
            <label className="text-xs font-medium">Order Reference (Optional)</label>
            <Input
              placeholder="e.g. LM-24081"
              value={orderRef}
              onChange={(e) => setOrderRef(e.target.value)}
            />
          </div>

          <div className="flex flex-col gap-1.5">
            <label className="text-xs font-medium">Message</label>
            <Textarea
              placeholder="Describe your question or issue in detail..."
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              rows={4}
              required
            />
          </div>

          <div className="flex justify-end gap-2 mt-2">
            <Button type="button" variant="outline" onClick={() => setOpen(false)}>
              Cancel
            </Button>
            <Button type="submit">Submit Ticket</Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  )
}
