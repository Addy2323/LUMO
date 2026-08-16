'use client'

import { useState, useEffect, useRef } from 'react'
import Link from 'next/link'
import {
  ArrowRight,
  Building2,
  Check,
  CheckCircle2,
  Clock,
  CreditCard,
  Download,
  FileText,
  Globe,
  Loader2,
  Lock,
  MessageSquare,
  Package,
  Plus,
  Search,
  Send,
  ShieldCheck,
  Sparkles,
  Truck,
  UserCheck,
  Zap,
} from 'lucide-react'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { useSourcingStore, SourcingItem, SourcingSubmittedDocument } from '@/lib/stores/sourcing-store'
import { formatTZS, formatDate } from '@/lib/format'
import { toast } from 'sonner'

import { useSessionStore } from '@/lib/stores/session-store'

export default function CustomerSourcingPage() {
  const user = useSessionStore((s) => s.user)
  const isDemoUser =
    user?.id === 'usr_cus_001' ||
    user?.id === 'cust_01' ||
    user?.email === 'amina.hassan@example.co.tz'

  const allItems = useSourcingStore((s) => s.items)
  const userItems = user
    ? allItems.filter(
        (i) =>
          !i.customerEmail ||
          i.customerEmail.toLowerCase() === user.email?.toLowerCase() ||
          i.customerName?.toLowerCase() === (user.fullName || '').toLowerCase()
      )
    : allItems

  const items = userItems.length > 0 ? userItems : allItems

  const downloadDocument = useSourcingStore((s) => s.downloadDocument)
  const addMessage = useSourcingStore((s) => s.addMessage)
  const payQuotation = useSourcingStore((s) => s.payQuotation)

  const [filter, setFilter] = useState<'all' | 'quoted' | 'paid' | 'assigned' | 'open'>('all')
  const [search, setSearch] = useState('')
  const [selectedItemId, setSelectedItemId] = useState<string | null>(null)
  const [payingItem, setPayingItem] = useState<SourcingItem | null>(null)

  const selectedItem = items.find((i) => i.id === selectedItemId || i.reference === selectedItemId) ?? null

  const filteredItems = items.filter((item) => {
    const matchesFilter = filter === 'all' || item.status === filter
    const matchesSearch =
      search.trim() === '' ||
      item.reference.toLowerCase().includes(search.toLowerCase()) ||
      item.productName.toLowerCase().includes(search.toLowerCase()) ||
      (item.brand && item.brand.toLowerCase().includes(search.toLowerCase()))
    return matchesFilter && matchesSearch
  })

  // Quick metrics
  const totalCount = items.length
  const quotedCount = items.filter((i) => i.status === 'quoted').length
  const paidCount = items.filter((i) => i.status === 'paid').length
  const assignedCount = items.filter((i) => i.status === 'assigned').length
  const openCount = items.filter((i) => i.status === 'open').length

  return (
    <div className="flex flex-col gap-8 antialiased">
      {/* Header & Metric Cards */}
      <div className="flex flex-col gap-6">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex flex-col gap-1">
            <h1 className="text-2xl font-extrabold tracking-tight">My Custom Sourcing Queue</h1>
            <p className="text-sm text-muted-foreground">
              Track global factory sourcing requests, download specification sheets, review landed TZS quotes, and pay via secure Lumo Buyer Protection.
            </p>
          </div>

          <Button
            className="bg-primary hover:bg-primary/90 text-primary-foreground font-bold shadow-md self-start sm:self-auto shrink-0"
            render={<Link href="/sourcing/paste-link" />}
          >
            <Plus className="size-4 mr-1.5" />
            New Sourcing Request
          </Button>
        </div>

        {/* Quick Stat Bar */}
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <Card className="border-l-4 border-l-primary bg-card shadow-xs">
            <CardContent className="p-4 flex items-center justify-between">
              <div className="flex flex-col">
                <span className="text-xs text-muted-foreground font-medium">Total Requests</span>
                <span className="text-2xl font-extrabold tnum">{totalCount}</span>
              </div>
              <div className="rounded-lg bg-primary/10 p-2.5 text-primary">
                <Package className="size-5" />
              </div>
            </CardContent>
          </Card>

          <Card className="border-l-4 border-l-emerald-500 bg-card shadow-xs">
            <CardContent className="p-4 flex items-center justify-between">
              <div className="flex flex-col">
                <span className="text-xs text-muted-foreground font-medium">Quotes Ready / Paid</span>
                <div className="flex items-center gap-2 mt-0.5">
                  <span className="text-2xl font-extrabold text-emerald-600 tnum">{quotedCount}</span>
                  {paidCount > 0 && (
                    <span className="text-xs font-bold text-emerald-700 bg-emerald-100 dark:bg-emerald-950/80 px-2 py-0.5 rounded-full">
                      {paidCount} Paid
                    </span>
                  )}
                </div>
              </div>
              <div className="rounded-lg bg-emerald-50 dark:bg-emerald-950/60 p-2.5 text-emerald-600">
                <CheckCircle2 className="size-5" />
              </div>
            </CardContent>
          </Card>

          <Card className="border-l-4 border-l-blue-500 bg-card shadow-xs">
            <CardContent className="p-4 flex items-center justify-between">
              <div className="flex flex-col">
                <span className="text-xs text-muted-foreground font-medium">In Sourcing / Agent Assigned</span>
                <span className="text-2xl font-extrabold text-blue-600 tnum">{assignedCount}</span>
              </div>
              <div className="rounded-lg bg-blue-50 dark:bg-blue-950/60 p-2.5 text-blue-600">
                <UserCheck className="size-5" />
              </div>
            </CardContent>
          </Card>

          <Card className="border-l-4 border-l-amber-500 bg-card shadow-xs">
            <CardContent className="p-4 flex items-center justify-between">
              <div className="flex flex-col">
                <span className="text-xs text-muted-foreground font-medium">Open / Pending Review</span>
                <span className="text-2xl font-extrabold text-amber-600 tnum">{openCount}</span>
              </div>
              <div className="rounded-lg bg-amber-50 dark:bg-amber-950/60 p-2.5 text-amber-600">
                <Clock className="size-5" />
              </div>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Filter and Search Controls */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between border-b pb-4">
        <Tabs value={filter} onValueChange={(v) => setFilter(v as any)} className="w-full sm:w-auto">
          <TabsList className="flex-wrap h-auto gap-1 bg-muted/60 p-1">
            <TabsTrigger value="all" className="text-xs font-semibold px-3 py-1.5">All ({totalCount})</TabsTrigger>
            <TabsTrigger value="quoted" className="text-xs font-semibold px-3 py-1.5">Quotes Ready ({quotedCount})</TabsTrigger>
            <TabsTrigger value="paid" className="text-xs font-semibold px-3 py-1.5">Protected &amp; Paid ({paidCount})</TabsTrigger>
            <TabsTrigger value="assigned" className="text-xs font-semibold px-3 py-1.5">In Sourcing ({assignedCount})</TabsTrigger>
            <TabsTrigger value="open" className="text-xs font-semibold px-3 py-1.5">Open ({openCount})</TabsTrigger>
          </TabsList>
        </Tabs>

        <div className="relative w-full sm:w-72">
          <Search className="absolute left-3 top-2.5 size-4 text-muted-foreground" />
          <Input
            placeholder="Search request, product or brand..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-9 text-xs h-9"
          />
        </div>
      </div>

      {/* Request Cards Grid / Empty State */}
      {filteredItems.length === 0 ? (
        <Card className="p-12 text-center border-dashed border-2 border-border bg-card/50">
          <div className="flex flex-col items-center justify-center max-w-sm mx-auto space-y-3">
            <div className="size-12 rounded-full bg-primary/10 text-primary flex items-center justify-center">
              <Package className="size-6" />
            </div>
            <h3 className="text-lg font-bold text-foreground">No Sourcing Requests Found</h3>
            <p className="text-xs text-muted-foreground leading-relaxed">
              You haven't submitted any custom factory sourcing requests yet. Click below to paste a 1688, Taobao, or Alibaba link to get a landed TZS quotation!
            </p>
            <Button
              className="bg-primary hover:bg-primary/90 text-primary-foreground font-bold text-xs mt-2"
              render={<Link href="/sourcing/paste-link" />}
            >
              <Plus className="size-4 mr-1.5" />
              Create First Sourcing Request
            </Button>
          </div>
        </Card>
      ) : (
        <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {filteredItems.map((item) => (
          <Card key={item.id} className="border border-border shadow-xs hover:border-primary/50 hover:shadow-md transition-all flex flex-col justify-between">
            <CardHeader className="p-5 pb-3 border-b bg-muted/30">
              <div className="flex items-center justify-between gap-2">
                <span className="font-mono text-xs font-extrabold text-primary">{item.reference}</span>
                <Badge
                  variant={
                    item.status === 'paid'
                      ? 'default'
                      : item.status === 'quoted'
                      ? 'default'
                      : item.status === 'assigned'
                      ? 'secondary'
                      : 'outline'
                  }
                  className={`text-[10px] font-extrabold uppercase ${
                    item.status === 'paid'
                      ? 'bg-emerald-700 hover:bg-emerald-700 text-white flex items-center gap-1'
                      : item.status === 'quoted'
                      ? 'bg-emerald-600 hover:bg-emerald-600 text-white'
                      : ''
                  }`}
                >
                  {item.status === 'paid' ? (
                    <>
                      <ShieldCheck className="size-3 text-emerald-200" />
                      PAYMENT PROTECTED
                    </>
                  ) : item.status === 'quoted' ? (
                    'Quote Ready'
                  ) : (
                    item.status
                  )}
                </Badge>
              </div>
              <CardTitle className="text-base font-bold text-foreground line-clamp-1 mt-1">
                {item.productName}
              </CardTitle>
            </CardHeader>

            <CardContent className="p-5 space-y-4 text-xs flex-1">
              <div className="space-y-1.5">
                {item.brand && (
                  <div className="flex items-center justify-between text-muted-foreground">
                    <span>Brand / Model:</span>
                    <strong className="text-foreground">{item.brand} {item.modelNumber}</strong>
                  </div>
                )}
                <div className="flex items-center justify-between text-muted-foreground">
                  <span>Quantity Needed:</span>
                  <strong className="text-foreground font-mono">{item.quantity} Units</strong>
                </div>
                <div className="flex items-center justify-between text-muted-foreground">
                  <span>Target Budget:</span>
                  <strong className="text-primary font-mono">{item.currency} {Number(item.targetBudget).toLocaleString()}</strong>
                </div>
                <div className="flex items-center justify-between text-muted-foreground">
                  <span>Destination:</span>
                  <strong className="text-foreground">{item.destination}</strong>
                </div>
              </div>

              {/* Submitted File indicator */}
              {item.submittedDocument && (
                <div className="p-2.5 rounded-xl border bg-muted/30 flex items-center justify-between text-[11px]">
                  <div className="flex items-center gap-2 truncate">
                    <FileText className="size-4 text-primary shrink-0" />
                    <span className="font-bold text-foreground truncate">{item.submittedDocument.name}</span>
                  </div>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => {
                      downloadDocument(item.submittedDocument!)
                      toast.success(`Downloading ${item.submittedDocument!.name}`)
                    }}
                    className="h-7 px-2 text-primary hover:bg-primary/10"
                  >
                    <Download className="size-3.5 mr-1" />
                    Download
                  </Button>
                </div>
              )}

              {/* Quoted Callout */}
              {item.quotation && item.status === 'quoted' && (
                <div className="p-3.5 rounded-xl border border-emerald-500/40 bg-emerald-50/60 dark:bg-emerald-950/40 space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-[11px] font-extrabold text-emerald-900 dark:text-emerald-300">Landed Quote Issued:</span>
                    <strong className="text-sm font-extrabold text-emerald-600 font-mono">
                      TZS {item.quotation.totalLandedTZS.toLocaleString()}
                    </strong>
                  </div>
                  <p className="text-[10px] text-emerald-800 dark:text-emerald-400">
                    ETA: {item.quotation.deliveryEta}
                  </p>

                  <Button
                    onClick={() => setPayingItem(item)}
                    className="w-full h-8 text-xs font-extrabold bg-emerald-600 hover:bg-emerald-700 text-white shadow-xs"
                  >
                    <ShieldCheck className="size-3.5 mr-1 text-emerald-200" />
                    Accept &amp; Pay Landed Quote
                  </Button>
                </div>
              )}

              {/* Paid Escrow Callout */}
              {item.status === 'paid' && item.paymentDetails && (
                <div className="p-3 rounded-xl border border-emerald-500/40 bg-emerald-500/10 text-emerald-800 dark:text-emerald-300 space-y-1 text-[11px]">
                  <div className="flex items-center justify-between font-bold">
                    <span className="flex items-center gap-1">
                      <ShieldCheck className="size-4 text-emerald-600" />
                      Paid via {item.paymentDetails.method}
                    </span>
                    <span className="font-mono text-emerald-600">Ref: {item.paymentDetails.transactionRef}</span>
                  </div>
                  <p className="text-[10px] text-muted-foreground">Order dispatched to supplier factory hub.</p>
                </div>
              )}
            </CardContent>

            <div className="p-4 pt-0 border-t border-border mt-auto flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setSelectedItemId(item.id)}
                className="w-full text-xs font-bold border-primary/30 hover:bg-primary/5 text-primary"
              >
                <MessageSquare className="size-3.5 mr-1.5" />
                View Specs &amp; Chat ({item.messages.length})
              </Button>
            </div>
          </Card>
        ))}
      </div>
      )}

      {/* Customer Sourcing Request Inspector & Real-Time Messaging Dialog */}
      {selectedItem && (
        <SourcingDetailDialog
          item={selectedItem}
          onClose={() => setSelectedItemId(null)}
          downloadDocument={downloadDocument}
          addMessage={addMessage}
          onOpenPayModal={(itemToPay) => setPayingItem(itemToPay)}
        />
      )}

      {/* Sourcing Quotation Escrow Payment Dialog */}
      {payingItem && (
        <SourcingPaymentDialog
          item={payingItem}
          onClose={() => setPayingItem(null)}
          payQuotation={payQuotation}
        />
      )}
    </div>
  )
}

function SourcingDetailDialog({
  item,
  onClose,
  downloadDocument,
  addMessage,
  onOpenPayModal,
}: {
  item: SourcingItem
  onClose: () => void
  downloadDocument: (doc: SourcingSubmittedDocument) => void
  addMessage: (requestId: string, msg: any) => void
  onOpenPayModal?: (item: SourcingItem) => void
}) {
  const [chatInput, setChatInput] = useState('')
  const chatEndRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [item.messages.length])

  function handleSendMessage(e: React.FormEvent) {
    e.preventDefault()
    if (!chatInput.trim()) return
    addMessage(item.id, {
      senderRole: 'customer',
      senderName: 'Amina Hassan (Buyer)',
      content: chatInput.trim(),
    })
    setChatInput('')
    toast.success('Message sent to Sourcing Officer')
  }

  return (
    <Dialog open onOpenChange={() => onClose()}>
      <DialogContent className="max-w-2xl p-6 border-border shadow-2xl overflow-y-auto max-h-[90vh]">
        <DialogHeader className="border-b pb-3">
          <DialogTitle className="flex items-center justify-between text-base font-extrabold">
            <div className="flex items-center gap-2">
              <span>Sourcing Request</span>
              <Badge variant="outline" className="font-mono text-xs text-primary border-primary/30">
                {item.reference}
              </Badge>
            </div>
            <Badge className="capitalize text-xs">{item.status}</Badge>
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-6 text-xs mt-2">
          {/* Item Specs Overview */}
          <div className="p-4 rounded-2xl border bg-muted/30 space-y-3">
            <h4 className="font-bold text-sm text-foreground">{item.productName}</h4>
            <div className="grid sm:grid-cols-2 gap-2 text-muted-foreground">
              <div>Brand: <strong className="text-foreground">{item.brand || 'N/A'}</strong></div>
              <div>Model: <strong className="text-foreground">{item.modelNumber || 'N/A'}</strong></div>
              <div>Quantity: <strong className="text-foreground font-mono">{item.quantity} Units</strong></div>
              <div>Target Budget: <strong className="text-primary font-mono">{item.currency} {Number(item.targetBudget).toLocaleString()}</strong></div>
              <div>Destination: <strong className="text-foreground">{item.destination}</strong></div>
              <div>Assigned Officer: <strong className="text-foreground">{item.assignedAgent || 'Pending Assignment'}</strong></div>
            </div>

            {item.techSpecs && (
              <div className="pt-2 border-t text-muted-foreground">
                <span className="font-bold text-foreground block mb-0.5">Technical Specs:</span>
                <p className="leading-relaxed">{item.techSpecs}</p>
              </div>
            )}

            {/* Submitted Document Download Section */}
            {item.submittedDocument && (
              <div className="pt-2 border-t flex items-center justify-between p-3 rounded-xl bg-card border border-border">
                <div className="flex items-center gap-2.5">
                  <FileText className="size-5 text-primary shrink-0" />
                  <div>
                    <p className="font-bold text-foreground text-xs">{item.submittedDocument.name}</p>
                    <p className="text-[10px] text-muted-foreground">{item.submittedDocument.size}</p>
                  </div>
                </div>
                <Button
                  size="sm"
                  onClick={() => {
                    downloadDocument(item.submittedDocument!)
                    toast.success(`Downloading ${item.submittedDocument!.name}`)
                  }}
                  className="bg-primary hover:bg-primary/90 text-primary-foreground font-bold text-xs"
                >
                  <Download className="size-3.5 mr-1" />
                  Download Document
                </Button>
              </div>
            )}
          </div>

          {/* Quotation Breakdown if Quoted */}
          {item.quotation && (
            <div className="p-4 rounded-2xl border border-emerald-500/40 bg-emerald-50/50 dark:bg-emerald-950/30 space-y-3">
              <div className="flex items-center justify-between border-b pb-2">
                <h4 className="font-extrabold text-sm text-emerald-800 dark:text-emerald-300">
                  Formal Landed TZS Quotation
                </h4>
                <Badge className="bg-emerald-600 text-white font-mono text-xs">
                  TZS {item.quotation.totalLandedTZS.toLocaleString()}
                </Badge>
              </div>

              <div className="grid grid-cols-3 gap-2 text-center py-1">
                <div className="p-2 rounded-lg bg-card border text-[11px]">
                  <span className="text-muted-foreground block text-[10px]">Unit Cost</span>
                  <strong className="font-mono">TZS {item.quotation.unitCostTZS.toLocaleString()}</strong>
                </div>
                <div className="p-2 rounded-lg bg-card border text-[11px]">
                  <span className="text-muted-foreground block text-[10px]">Freight Charge</span>
                  <strong className="font-mono">TZS {item.quotation.shippingCostTZS.toLocaleString()}</strong>
                </div>
                <div className="p-2 rounded-lg bg-card border text-[11px]">
                  <span className="text-muted-foreground block text-[10px]">Customs &amp; Duty</span>
                  <strong className="font-mono">TZS {item.quotation.customsDutyTZS.toLocaleString()}</strong>
                </div>
              </div>

              <p className="text-xs text-emerald-700 dark:text-emerald-400 font-medium">
                <strong>Delivery ETA:</strong> {item.quotation.deliveryEta}
              </p>
              {item.quotation.notes && (
                <p className="text-[11px] text-muted-foreground italic">
                  Note: {item.quotation.notes}
                </p>
              )}

              {item.status === 'quoted' && onOpenPayModal && (
                <Button
                  onClick={() => {
                    onClose()
                    onOpenPayModal(item)
                  }}
                  className="w-full bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs py-2 shadow-xs mt-2"
                >
                  <ShieldCheck className="size-4 mr-1 text-emerald-200" />
                  Accept &amp; Pay Landed Quote via Buyer Protection
                </Button>
              )}

              {item.status === 'paid' && item.paymentDetails && (
                <div className="p-3 rounded-xl bg-emerald-500/10 border border-emerald-500/40 text-emerald-900 dark:text-emerald-300 space-y-1">
                  <div className="flex items-center justify-between font-bold text-xs">
                    <span>Payment Receipt: Paid &amp; Protected</span>
                    <span className="font-mono">{item.paymentDetails.transactionRef}</span>
                  </div>
                  <p className="text-[11px] text-muted-foreground">
                    Paid via <strong>{item.paymentDetails.method}</strong> on {formatDate(item.paymentDetails.paidAt)}
                  </p>
                </div>
              )}
            </div>
          )}

          {/* Real-Time Interactive Communication Thread */}
          <div className="space-y-3 pt-2 border-t">
            <h4 className="font-bold text-xs text-foreground uppercase tracking-wider flex items-center justify-between">
              <span>Sourcing Communication Thread</span>
              <span className="text-[11px] font-normal text-muted-foreground">{item.messages.length} Messages</span>
            </h4>

            <div className="space-y-3 max-h-60 overflow-y-auto p-3 rounded-2xl bg-muted/20 border border-border">
              {item.messages.map((msg) => (
                <div
                  key={msg.id}
                  className={`p-3 rounded-xl max-w-[85%] text-xs space-y-1 ${
                    msg.senderRole === 'customer'
                      ? 'ml-auto bg-primary text-primary-foreground'
                      : msg.senderRole === 'admin'
                      ? 'mr-auto bg-amber-500/10 border border-amber-500/30 text-foreground'
                      : 'mr-auto bg-card border text-foreground'
                  }`}
                >
                  <div className="flex items-center justify-between gap-3 text-[10px] opacity-80">
                    <span className="font-bold">{msg.senderName}</span>
                    <span>{formatDate(msg.sentAt)}</span>
                  </div>
                  <p className="leading-relaxed whitespace-pre-wrap">{msg.content}</p>
                </div>
              ))}
              <div ref={chatEndRef} />
            </div>

            {/* Send Message Input */}
            <form onSubmit={handleSendMessage} className="flex gap-2">
              <Input
                placeholder="Ask officer a question or request quotation changes..."
                value={chatInput}
                onChange={(e) => setChatInput(e.target.value)}
                className="text-xs h-10"
              />
              <Button type="submit" className="bg-primary hover:bg-primary/90 text-primary-foreground font-bold h-10 px-4">
                <Send className="size-4 mr-1" />
                Send
              </Button>
            </form>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}

function SourcingPaymentDialog({
  item,
  onClose,
  payQuotation,
}: {
  item: SourcingItem
  onClose: () => void
  payQuotation: (requestId: string, details: { method: string; transactionRef: string; paidAmountTZS: number }) => void
}) {
  const [selectedMethod, setSelectedMethod] = useState<'mpesa' | 'airtel' | 'halopesa' | 'mixx' | 'crdb' | 'nmb' | 'card'>('mpesa')
  const [phone, setPhone] = useState('+255 712 445 908')
  const [isProcessing, setIsProcessing] = useState(false)
  const [isSuccess, setIsSuccess] = useState(false)
  const [lastRef, setLastRef] = useState('')

  const amountTZS = item.quotation?.totalLandedTZS || 0

  function handlePay() {
    setIsProcessing(true)
    const txRef = `LUMO-PAY-${Math.floor(100000 + Math.random() * 900000)}`
    setLastRef(txRef)

    setTimeout(() => {
      setIsProcessing(false)
      setIsSuccess(true)

      const methodNames: Record<string, string> = {
        mpesa: 'Vodacom M-Pesa',
        airtel: 'Airtel Money',
        halopesa: 'HaloPesa',
        mixx: 'Mixx by YAS',
        crdb: 'CRDB Bank Wire',
        nmb: 'NMB Bank Wire',
        card: 'Visa / Mastercard',
      }

      payQuotation(item.id, {
        method: methodNames[selectedMethod] || selectedMethod,
        transactionRef: txRef,
        paidAmountTZS: amountTZS,
      })

      toast.success(`Buyer Protection Authorized! Reference: ${txRef}`)
    }, 2000)
  }

  return (
    <Dialog open onOpenChange={() => onClose()}>
      <DialogContent className="max-w-xl p-6 border-border shadow-2xl overflow-y-auto max-h-[90vh]">
        <DialogHeader className="border-b pb-3">
          <DialogTitle className="flex items-center justify-between text-base font-extrabold">
            <div className="flex items-center gap-2">
              <ShieldCheck className="size-5 text-emerald-600" />
              <span>Pay Landed Sourcing Quotation</span>
            </div>
            <Badge variant="outline" className="font-mono text-xs">
              {item.reference}
            </Badge>
          </DialogTitle>
        </DialogHeader>

        {isSuccess ? (
          <div className="py-6 flex flex-col items-center text-center space-y-4">
            <div className="size-16 rounded-full bg-emerald-100 dark:bg-emerald-950/80 text-emerald-600 flex items-center justify-center">
              <Check className="size-8 stroke-[3]" />
            </div>

            <div className="space-y-1">
              <h3 className="text-lg font-extrabold text-foreground">Payment Received &amp; Buyer Protected!</h3>
              <p className="text-xs text-muted-foreground">
                Your payment of <strong className="text-foreground font-mono">TZS {amountTZS.toLocaleString()}</strong> has been secured under Lumo Buyer Protection.
              </p>
            </div>

            <div className="w-full p-4 rounded-2xl bg-muted/40 border text-xs text-left space-y-2 font-mono">
              <div className="flex justify-between">
                <span className="text-muted-foreground">Transaction Ref:</span>
                <span className="font-bold text-primary">{lastRef}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Product:</span>
                <span className="truncate max-w-[200px] text-foreground">{item.productName}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Protection Status:</span>
                <span className="text-emerald-600 font-bold">SECURED &amp; VERIFIED</span>
              </div>
            </div>

            <div className="flex gap-3 w-full pt-2">
              <Button
                variant="outline"
                onClick={() => {
                  const content = `LUMO B2B SOURCING PAYMENT RECEIPT\nReference: ${lastRef}\nSourcing Request: ${item.reference}\nProduct: ${item.productName}\nAmount Paid: TZS ${amountTZS.toLocaleString()}\nDate: ${new Date().toLocaleDateString()}\nStatus: PAYMENT PROTECTED & DISPATCHED`
                  const element = document.createElement('a')
                  element.setAttribute('href', `data:text/plain;charset=utf-8,${encodeURIComponent(content)}`)
                  element.setAttribute('download', `Lumo_Escrow_Receipt_${item.reference}.txt`)
                  document.body.appendChild(element)
                  element.click()
                  document.body.removeChild(element)
                }}
                className="flex-1 font-bold text-xs"
              >
                <Download className="size-3.5 mr-1" />
                Download Payment Receipt
              </Button>
              <Button
                onClick={() => onClose()}
                className="flex-1 bg-navy-900 hover:bg-navy-800 text-white font-bold text-xs"
              >
                Done
              </Button>
            </div>
          </div>
        ) : (
          <div className="space-y-5 text-xs mt-2">
            {/* Quotation Summary Box */}
            <div className="p-4 rounded-2xl border bg-emerald-500/10 border-emerald-500/30 space-y-2">
              <div className="flex items-center justify-between">
                <span className="font-bold text-foreground text-sm">{item.productName}</span>
                <span className="font-mono font-extrabold text-sm text-emerald-600">
                  TZS {amountTZS.toLocaleString()}
                </span>
              </div>

              {item.quotation && (
                <div className="grid grid-cols-3 gap-2 text-[11px] pt-1 text-muted-foreground">
                  <div>Unit: <strong className="text-foreground">TZS {item.quotation.unitCostTZS.toLocaleString()}</strong></div>
                  <div>Freight: <strong className="text-foreground">TZS {item.quotation.shippingCostTZS.toLocaleString()}</strong></div>
                  <div>Duty: <strong className="text-foreground">TZS {item.quotation.customsDutyTZS.toLocaleString()}</strong></div>
                </div>
              )}
            </div>

            {/* Select Payment Method */}
            <div className="space-y-3">
              <label className="font-bold text-xs text-foreground uppercase tracking-wider block">
                Select Tanzanian Payment Method:
              </label>

              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                <button
                  type="button"
                  onClick={() => setSelectedMethod('mpesa')}
                  className={`p-3 rounded-xl border text-center transition-all flex flex-col items-center gap-1 ${
                    selectedMethod === 'mpesa'
                      ? 'border-emerald-600 bg-emerald-500/10 font-bold text-emerald-700'
                      : 'border-border hover:bg-muted/50'
                  }`}
                >
                  <span className="text-base">🟢</span>
                  <span className="text-xs font-bold">M-Pesa</span>
                  <span className="text-[10px] text-muted-foreground">Vodacom</span>
                </button>

                <button
                  type="button"
                  onClick={() => setSelectedMethod('airtel')}
                  className={`p-3 rounded-xl border text-center transition-all flex flex-col items-center gap-1 ${
                    selectedMethod === 'airtel'
                      ? 'border-red-600 bg-red-500/10 font-bold text-red-700'
                      : 'border-border hover:bg-muted/50'
                  }`}
                >
                  <span className="text-base">🔴</span>
                  <span className="text-xs font-bold">Airtel Money</span>
                  <span className="text-[10px] text-muted-foreground">Airtel</span>
                </button>

                <button
                  type="button"
                  onClick={() => setSelectedMethod('crdb')}
                  className={`p-3 rounded-xl border text-center transition-all flex flex-col items-center gap-1 ${
                    selectedMethod === 'crdb'
                      ? 'border-sky-600 bg-sky-500/10 font-bold text-sky-700'
                      : 'border-border hover:bg-muted/50'
                  }`}
                >
                  <Building2 className="size-5 text-sky-600" />
                  <span className="text-xs font-bold">CRDB Bank</span>
                  <span className="text-[10px] text-muted-foreground">Bank Wire</span>
                </button>

                <button
                  type="button"
                  onClick={() => setSelectedMethod('card')}
                  className={`p-3 rounded-xl border text-center transition-all flex flex-col items-center gap-1 ${
                    selectedMethod === 'card'
                      ? 'border-blue-600 bg-blue-500/10 font-bold text-blue-700'
                      : 'border-border hover:bg-muted/50'
                  }`}
                >
                  <CreditCard className="size-5 text-blue-600" />
                  <span className="text-xs font-bold">Card</span>
                  <span className="text-[10px] text-muted-foreground">Visa / MC</span>
                </button>
              </div>
            </div>

            {/* Mobile / Account Number Input */}
            <div className="space-y-1.5">
              <label className="font-medium text-xs text-foreground">
                Payment Account / Mobile Money Number:
              </label>
              <Input
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                placeholder="+255 7XX XXX XXX"
                className="font-mono text-xs h-10"
              />
              <p className="text-[10px] text-muted-foreground flex items-center gap-1">
                <Lock className="size-3 text-emerald-600" />
                AzamPay Direct Checkout Gateway · Encrypted 256-bit SSL
              </p>
            </div>

            {/* Action Buttons */}
            <div className="flex gap-3 pt-2 border-t">
              <Button
                variant="outline"
                onClick={() => onClose()}
                disabled={isProcessing}
                className="flex-1 font-bold text-xs h-10"
              >
                Cancel
              </Button>
              <Button
                onClick={handlePay}
                disabled={isProcessing}
                className="flex-1 bg-emerald-600 hover:bg-emerald-700 text-white font-extrabold text-xs h-10 shadow-md"
              >
                {isProcessing ? (
                  <>
                    <Loader2 className="size-4 mr-2 animate-spin" />
                    Sending STK Push...
                  </>
                ) : (
                  <>
                    <ShieldCheck className="size-4 mr-1 text-emerald-200" />
                    Authorize Protected Payment (TZS {amountTZS.toLocaleString()})
                  </>
                )}
              </Button>
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  )
}
