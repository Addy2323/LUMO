'use client'

import Link from 'next/link'
import {
  AlertTriangle,
  ArrowRight,
  CheckCircle2,
  Clock,
  DollarSign,
  FileCheck,
  Package,
  ShieldCheck,
  Sparkles,
  TrendingUp,
  Users,
} from 'lucide-react'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { PRODUCTS } from '@/lib/mock/products'
import { ORDERS } from '@/lib/mock/orders'
import { formatTZS } from '@/lib/format'

export function AdminDashboard() {
  const gmvTotal = ORDERS.reduce((acc, o) => acc + o.total, 0)
  const totalProducts = PRODUCTS.length
  const totalOrders = ORDERS.length

  return (
    <div className="flex flex-col gap-6">
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-2xl font-extrabold tracking-tight">Admin Governance Console</h1>
            <Badge className="bg-brand-500/10 text-brand-500 border border-brand-500/20 text-xs font-bold gap-1">
              <Sparkles className="size-3 text-brand-500" />
              Executive Level
            </Badge>
          </div>
          <p className="text-xs text-muted-foreground mt-1">
            Global B2B platform governance, supplier KYC compliance, catalog approval machine, and Escrow payout settlements.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" className="gap-1.5 text-xs font-semibold" render={<Link href="/admin/products" />}>
            <FileCheck className="size-3.5 text-brand-500" />
            Product Queue
          </Button>
          <Button size="sm" className="bg-brand-500 hover:bg-brand-600 text-white gap-1.5 text-xs font-bold shadow-sm" render={<Link href="/admin/settlements" />}>
            <DollarSign className="size-3.5" />
            AzamPay Payouts
          </Button>
        </div>
      </div>

      {/* Compliance Overview Banner */}
      <div className="rounded-xl border border-info-400/30 bg-info-50/50 dark:bg-info-950/30 p-3.5 flex items-center justify-between gap-3 text-xs text-info-800 dark:text-info-300 shadow-xs">
        <div className="flex items-center gap-2.5">
          <ShieldCheck className="size-5 shrink-0 text-info-400" />
          <span>
            <strong>Platform Financial Standard:</strong> All transactions are settled strictly in whole Tanzanian Shillings (TZS) via AzamPay escrow with daily merchant automated batch runs.
          </span>
        </div>
        <Badge variant="outline" className="hidden sm:inline-flex border-info-400/40 text-info-400 text-[10px] font-bold uppercase">
          0% Forex Surcharge
        </Badge>
      </div>

      {/* Modern KPI Cards Grid (Veloce Style) */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <Card className="relative overflow-hidden border-border/80 bg-card card-hover-lift">
          <div className="absolute top-0 right-0 p-3 opacity-10">
            <DollarSign className="size-16 text-success" />
          </div>
          <CardHeader className="pb-1">
            <CardTitle className="text-[11px] font-bold text-muted-foreground uppercase tracking-widest">
              Gross Merchandise Value (GMV)
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-1">
            <div className="text-2xl font-extrabold tnum text-success">
              {formatTZS(gmvTotal)}
            </div>
            <div className="flex items-center gap-1 text-[11px] font-semibold text-success">
              <TrendingUp className="size-3" />
              <span>+18.4% MoM Growth</span>
            </div>
          </CardContent>
        </Card>

        <Card className="relative overflow-hidden border-border/80 bg-card card-hover-lift">
          <CardHeader className="pb-1">
            <CardTitle className="text-[11px] font-bold text-muted-foreground uppercase tracking-widest">
              Verified Factory Suppliers
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-1">
            <div className="text-2xl font-extrabold tnum text-foreground">
              0 Active
            </div>
            <div className="flex items-center gap-1 text-[11px] text-muted-foreground">
              <span className="inline-block size-2 rounded-full bg-slate-400" />
              <span>China, UAE &amp; East Africa</span>
            </div>
          </CardContent>
        </Card>

        <Card className="relative overflow-hidden border-border/80 bg-card card-hover-lift">
          <CardHeader className="pb-1">
            <CardTitle className="text-[11px] font-bold text-muted-foreground uppercase tracking-widest">
              Listed Products Matrix
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-1">
            <div className="text-2xl font-extrabold tnum text-foreground">
              {totalProducts} Items
            </div>
            <div className="flex items-center gap-1 text-[11px] text-muted-foreground font-semibold">
              <span>0 Pending Review</span>
            </div>
          </CardContent>
        </Card>

        <Card className="relative overflow-hidden border-border/80 bg-card card-hover-lift">
          <CardHeader className="pb-1">
            <CardTitle className="text-[11px] font-bold text-muted-foreground uppercase tracking-widest">
              Escrow Orders Completed
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-1">
            <div className="text-2xl font-extrabold tnum text-foreground">
              {totalOrders} Orders
            </div>
            <div className="flex items-center gap-1 text-[11px] text-muted-foreground">
              <CheckCircle2 className="size-3 text-success inline" />
              <span>100% AzamPay Paid</span>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Main Split: Recent Governance Activity & Module Quick Access */}
      <div className="grid gap-6 lg:grid-cols-3">
        {/* Governance Activity Stream (2 Columns) */}
        <Card className="lg:col-span-2 border-border/80">
          <CardHeader className="flex flex-row items-center justify-between pb-3">
            <div>
              <CardTitle className="text-sm font-extrabold">Recent Platform Audit &amp; Approvals</CardTitle>
              <CardDescription className="text-xs">Real-time merchant KYC, product approvals, and escrow releases</CardDescription>
            </div>
            <Button variant="ghost" size="sm" className="text-xs text-brand-500 font-semibold" render={<Link href="/admin/audit" />}>
              View All Logs
            </Button>
          </CardHeader>
          <CardContent className="p-6 text-center text-xs text-muted-foreground space-y-1">
            <Clock className="size-8 text-muted-foreground/40 mx-auto" />
            <p className="font-semibold text-foreground">No recent audit logs recorded</p>
            <p className="text-[11px]">Merchant KYC submissions, product approvals, and payouts will log here automatically.</p>
          </CardContent>
        </Card>


        {/* Quick Admin Modules Card (1 Column) */}
        <div className="flex flex-col gap-4">
          <Card className="border-border/80 hover:border-brand-500/40 transition-colors">
            <CardHeader className="pb-2">
              <CardTitle className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Catalog Approvals</CardTitle>
            </CardHeader>
            <CardContent className="flex flex-col gap-2 text-xs">
              <p className="text-muted-foreground">Review merchant pricing tiers &amp; specifications before publishing.</p>
              <Button size="sm" variant="outline" className="w-full justify-between font-semibold" render={<Link href="/admin/products" />}>
                <span>Open Catalog Queue</span>
                <ArrowRight className="size-3.5" />
              </Button>
            </CardContent>
          </Card>

          <Card className="border-border/80 hover:border-brand-500/40 transition-colors">
            <CardHeader className="pb-2">
              <CardTitle className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Merchant KYC Desk</CardTitle>
            </CardHeader>
            <CardContent className="flex flex-col gap-2 text-xs">
              <p className="text-muted-foreground">Verify TIN, VRN, and TRA business license compliance.</p>
              <Button size="sm" variant="outline" className="w-full justify-between font-semibold" render={<Link href="/admin/users" />}>
                <span>Manage Merchant KYC</span>
                <ArrowRight className="size-3.5" />
              </Button>
            </CardContent>
          </Card>

          <Card className="border-border/80 hover:border-brand-500/40 transition-colors">
            <CardHeader className="pb-2">
              <CardTitle className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Financial Ledger</CardTitle>
            </CardHeader>
            <CardContent className="flex flex-col gap-2 text-xs">
              <p className="text-muted-foreground">Audit delivered order payouts &amp; platform fee ledger.</p>
              <Button size="sm" variant="outline" className="w-full justify-between font-semibold" render={<Link href="/admin/settlements" />}>
                <span>View AzamPay Ledger</span>
                <ArrowRight className="size-3.5" />
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}

