'use client'

import Link from 'next/link'
import {
  AlertTriangle,
  ArrowRight,
  CheckCircle2,
  Clock,
  FileText,
  Headphones,
  MessageSquare,
  Search,
  ShieldCheck,
  Sparkles,
  UserCheck,
} from 'lucide-react'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { StatusBadge } from '@/components/status-badge'
import { TICKETS, SOURCING_REQUESTS, NOTIFICATIONS } from '@/lib/mock/support'
import { formatTZS, formatDate } from '@/lib/format'
import { useSessionStore } from '@/lib/stores/session-store'

export function SalesDashboard() {
  const user = useSessionStore((s) => s.user)

  const openTickets = TICKETS.filter((t) => t.status === 'open' || t.status === 'assigned')
  const highPriorityTickets = TICKETS.filter((t) => t.priority === 'high' || t.status === 'escalated')
  const openSourcing = SOURCING_REQUESTS.filter((s) => s.status === 'open' || s.status === 'assigned')

  return (
    <div className="flex flex-col gap-6">
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-2xl font-extrabold tracking-tight">Sales &amp; Dispute Desk</h1>
            <Badge className="bg-brand-500/10 text-brand-500 border border-brand-500/20 text-xs font-bold gap-1">
              <Sparkles className="size-3 text-brand-500" />
              Lumo Staff Desk
            </Badge>
          </div>
          <p className="text-xs text-muted-foreground mt-1">
            Shared customer inbox triage, B2B product sourcing quotation generator, and merchant dispute mediation.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" className="gap-1.5 text-xs font-semibold" render={<Link href="/sales/sourcing" />}>
            <FileText className="size-3.5 text-brand-500" />
            Sourcing Queue ({openSourcing.length})
          </Button>
          <Button size="sm" className="bg-brand-500 hover:bg-brand-600 text-white gap-1.5 text-xs font-bold shadow-sm" render={<Link href="/sales/tickets" />}>
            <Headphones className="size-3.5" />
            Shared Inbox ({openTickets.length})
          </Button>
        </div>
      </div>

      {/* Operational Policy Banner */}
      <div className="rounded-xl border border-info-400/30 bg-info-50/50 dark:bg-info-950/30 p-3.5 flex items-center gap-2.5 text-xs text-info-800 dark:text-info-300 shadow-xs">
        <ShieldCheck className="size-5 shrink-0 text-info-400" />
        <span>
          <strong>Lumo Customer Privacy Standard:</strong> Customer conversations are handled exclusively by Sales Desk staff. Suppliers never receive direct customer phone numbers or messages.
        </span>
      </div>

      {/* Overview Stat Cards */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <Card className="relative overflow-hidden border-border/80 bg-card card-hover-lift">
          <CardHeader className="flex flex-row items-center justify-between pb-1 space-y-0">
            <CardTitle className="text-[11px] font-bold text-muted-foreground uppercase tracking-widest">
              Open Inbox Tickets
            </CardTitle>
            <Headphones className="size-4 text-brand-500" />
          </CardHeader>
          <CardContent className="space-y-1">
            <div className="text-2xl font-extrabold tnum text-foreground">{openTickets.length}</div>
            <p className="text-[11px] text-muted-foreground">Awaiting staff response</p>
          </CardContent>
        </Card>

        <Card className="relative overflow-hidden border-border/80 bg-card card-hover-lift">
          <CardHeader className="flex flex-row items-center justify-between pb-1 space-y-0">
            <CardTitle className="text-[11px] font-bold text-muted-foreground uppercase tracking-widest">
              High Priority Disputes
            </CardTitle>
            <AlertTriangle className="size-4 text-danger" />
          </CardHeader>
          <CardContent className="space-y-1">
            <div className="text-2xl font-extrabold tnum text-danger">
              {highPriorityTickets.length}
            </div>
            <p className="text-[11px] text-muted-foreground">Escrow refund decisions</p>
          </CardContent>
        </Card>

        <Card className="relative overflow-hidden border-border/80 bg-card card-hover-lift">
          <CardHeader className="flex flex-row items-center justify-between pb-1 space-y-0">
            <CardTitle className="text-[11px] font-bold text-muted-foreground uppercase tracking-widest">
              B2B Sourcing Requests
            </CardTitle>
            <FileText className="size-4 text-info" />
          </CardHeader>
          <CardContent className="space-y-1">
            <div className="text-2xl font-extrabold tnum text-foreground">{openSourcing.length}</div>
            <p className="text-[11px] text-muted-foreground">Unquoted buyer links</p>
          </CardContent>
        </Card>

        <Card className="relative overflow-hidden border-border/80 bg-card card-hover-lift">
          <CardHeader className="flex flex-row items-center justify-between pb-1 space-y-0">
            <CardTitle className="text-[11px] font-bold text-muted-foreground uppercase tracking-widest">
              Avg SLA Response
            </CardTitle>
            <Clock className="size-4 text-success" />
          </CardHeader>
          <CardContent className="space-y-1">
            <div className="text-2xl font-extrabold tnum text-success">18 mins</div>
            <p className="text-[11px] text-muted-foreground">Target: under 60 mins</p>
          </CardContent>
        </Card>
      </div>

      {/* Main Content Grid: Urgent Tickets & Sourcing Requests */}
      <div className="grid gap-6 lg:grid-cols-3">
        {/* Left Column: Urgent Tickets Queue */}
        <div className="flex flex-col gap-6 lg:col-span-2">
          <Card className="border-border/80">
            <CardHeader className="flex flex-row items-center justify-between pb-3">
              <div>
                <CardTitle className="text-sm font-extrabold">Priority Shared Inbox Threads</CardTitle>
                <CardDescription className="text-xs">Active support tickets requiring customer update or supplier liaison</CardDescription>
              </div>
              <Button variant="ghost" size="sm" className="text-xs text-brand-500 font-semibold" render={<Link href="/sales/tickets" />}>
                All Tickets
                <ArrowRight className="size-3.5 ml-1" />
              </Button>
            </CardHeader>

            <CardContent className="p-0">
              <div className="divide-y divide-border">
                {TICKETS.slice(0, 4).map((ticket) => (
                  <div
                    key={ticket.id}
                    className="flex flex-col gap-3 p-4 sm:flex-row sm:items-center sm:justify-between hover:bg-muted/30 transition-colors"
                  >
                    <div className="flex flex-col gap-1 min-w-0">
                      <div className="flex flex-wrap items-center gap-2">
                        <span className="font-bold text-xs text-muted-foreground">
                          {ticket.reference}
                        </span>
                        <StatusBadge status={ticket.status} />
                        <Badge variant="outline" className="text-[10px] font-semibold uppercase">
                          {ticket.category}
                        </Badge>
                      </div>

                      <span className="font-bold text-sm truncate text-foreground">{ticket.subject}</span>

                      <span className="text-xs text-muted-foreground">
                        Customer: {ticket.customer.name} ({ticket.customer.phone}) · Order:{' '}
                        {ticket.orderReference ?? 'N/A'}
                      </span>
                    </div>

                    <div className="flex items-center justify-between sm:flex-col sm:items-end gap-2 shrink-0">
                      <span className="text-[11px] text-muted-foreground tnum">
                        {formatDate(ticket.updatedAt)}
                      </span>
                      <Button
                        variant="outline"
                        size="sm"
                        className="font-semibold text-xs"
                        render={<Link href={`/sales/tickets/${ticket.id}`} />}
                      >
                        Open Thread
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Right Column: Custom Sourcing & Quick Actions */}
        <div className="flex flex-col gap-6">
          <Card className="border-border/80">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-xs font-bold uppercase tracking-wider text-muted-foreground">B2B Sourcing Requests</CardTitle>
              <Button variant="ghost" size="sm" className="text-xs text-brand-500 font-semibold" render={<Link href="/sales/sourcing" />}>
                Queue
              </Button>
            </CardHeader>
            <CardContent className="p-0">
              <div className="divide-y divide-border">
                {SOURCING_REQUESTS.slice(0, 3).map((src) => (
                  <div key={src.id} className="flex flex-col gap-1 p-3.5 text-xs hover:bg-muted/20 transition-colors">
                    <div className="flex items-center justify-between">
                      <span className="font-mono font-bold text-muted-foreground">{src.reference}</span>
                      <Badge variant="secondary" className="text-[10px] font-semibold">
                        {src.region}
                      </Badge>
                    </div>
                    <span className="font-bold text-foreground">{src.productDescription}</span>
                    <div className="flex justify-between items-center text-muted-foreground mt-1">
                      <span>Qty: {src.quantity} units</span>
                      <span className="font-extrabold text-foreground tnum">{formatTZS(src.targetBudget)}</span>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Dispute Center Shortcut */}
          <Card className="border-border/80">
            <CardHeader className="pb-2">
              <CardTitle className="text-xs font-bold uppercase tracking-wider text-muted-foreground flex items-center gap-1.5">
                <AlertTriangle className="size-4 text-warning shrink-0" />
                Dispute Mediation Queue
              </CardTitle>
            </CardHeader>
            <CardContent className="flex flex-col gap-3 text-xs">
              <p className="text-muted-foreground leading-relaxed">
                Authorize escrow refunds for returned items or manage supplier fulfillment claims.
              </p>
              <Button variant="secondary" size="sm" className="w-full font-bold text-xs" render={<Link href="/sales/disputes" />}>
                Open Dispute Desk
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}

