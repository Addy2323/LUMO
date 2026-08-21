'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import {
  Search,
  CheckCircle2,
  XCircle,
  ShieldCheck,
  Building2,
  RefreshCw,
  Eye,
  FileText,
  Truck,
  Package,
  Ship,
  MessageSquare,
  Clock,
  AlertTriangle,
  ArrowRight,
  Filter,
  Download,
} from 'lucide-react'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog'
import { useAgentStore } from '@/lib/stores/agent-store'
import { toast } from 'sonner'

type DatabaseAgentOrder = {
  id: string
  orderNumber: string
  status: string
  priority?: string
  totalAmountTZS: number
  targetBudgetUSD?: number
  createdAt: string
  productName?: string
  customerName?: string
  destination?: string
  currentStep?: string
  supplierName?: string
}

export default function AgentOrdersPage() {
  const [orders, setOrders] = useState<DatabaseAgentOrder[]>([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')
  const [statusFilter, setStatusFilter] = useState('ALL')
  const [selectedOrder, setSelectedOrder] = useState<DatabaseAgentOrder | null>(null)
  const [activeTab, setActiveTab] = useState<'overview' | 'requirements' | 'suppliers' | 'quotations' | 'collection' | 'inspection' | 'packaging' | 'shipment' | 'messages' | 'documents' | 'timeline'>('overview')

  const fetchAgentOrders = async () => {
    setLoading(true)
    try {
      let dbOrders: DatabaseAgentOrder[] = []

      // 1. Fetch live orders from PostgreSQL database
      try {
        const res = await fetch('/api/orders?role=AGENT')
        if (res.ok) {
          const data = await res.json()
          if (Array.isArray(data.data)) {
            dbOrders = data.data.map((o: any) => ({
              id: o.id,
              orderNumber: o.orderNumber || o.ref || o.id.slice(0, 8),
              status: (o.status || 'New').replace(/_/g, ' '),
              priority: o.priority || 'Normal',
              totalAmountTZS: Number(o.totalAmountTZS || 0),
              targetBudgetUSD: Math.round(Number(o.totalAmountTZS || 0) / 2600),
              createdAt: o.createdAt ? new Date(o.createdAt).toLocaleDateString() : new Date().toLocaleDateString(),
              productName: o.productName || o.items?.[0]?.product?.title || 'Wholesale B2B Goods',
              customerName: o.customerName || o.buyer?.companyName || o.buyer?.name || 'LUMO Customer',
              destination: 'Dar es Salaam, Tanzania',
              currentStep: 'Field Agent Sourcing',
              supplierName: 'Foshan Nanhai Furniture Mfg Co., Ltd',
            }))
          }
        }
      } catch (e) {
        console.warn('Failed to fetch /api/orders:', e)
      }

      // 2. Fetch live assignments from PostgreSQL database
      try {
        const assignRes = await fetch('/api/assignments')
        if (assignRes.ok) {
          const assignData = await assignRes.json()
          if (Array.isArray(assignData.assignments)) {
            assignData.assignments.forEach((a: any) => {
              if (!dbOrders.some((c) => c.id === a.orderId || c.orderNumber === a.orderId)) {
                dbOrders.push({
                  id: a.id,
                  orderNumber: `LUMO-${a.orderId.slice(-6).toUpperCase()}`,
                  status: (a.status || 'New').replace(/_/g, ' '),
                  priority: a.priority || 'Normal',
                  totalAmountTZS: 146340,
                  targetBudgetUSD: 1500,
                  createdAt: new Date(a.createdAt).toLocaleDateString(),
                  productName: a.instructions || 'Wholesale Goods Sourcing',
                  customerName: 'Tanzanian Merchant',
                  destination: 'Dar es Salaam, Tanzania',
                  currentStep: 'Field Agent Action Required',
                  supplierName: 'Pending Agent Recommendation',
                })
              }
            })
          }
        }
      } catch (e) {
        console.warn('Failed to fetch /api/assignments:', e)
      }

      // 3. Merge with agent client store fallback orders
      const storeOrders = useAgentStore.getState().orders || []
      const combined = [...dbOrders]

      storeOrders.forEach((so) => {
        if (!combined.some((c) => c.id === so.id || c.orderNumber === so.orderNumber)) {
          combined.push({
            id: so.id,
            orderNumber: so.orderNumber,
            status: so.status.replace(/_/g, ' '),
            priority: so.priority || 'Normal',
            totalAmountTZS: Math.round(so.targetBudgetUSD * 2600),
            targetBudgetUSD: so.targetBudgetUSD,
            createdAt: so.createdAt,
            productName: so.productName,
            customerName: so.customerName,
            destination: `${so.destinationRegion}, ${so.destinationCountry}`,
            currentStep: 'Field Operations',
            supplierName: so.selectedSupplier?.name || 'Not Selected',
          })
        }
      })

      setOrders(combined)
    } catch (error) {
      console.error('Failed to fetch agent database orders:', error)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchAgentOrders()
  }, [])

  async function handleWorkflowTransition(nextStatus: string, reason?: string) {
    if (!selectedOrder) return
    try {
      const res = await fetch(`/api/agent/orders/${selectedOrder.id}/transition`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          currentStatus: selectedOrder.status,
          nextStatus,
          reason,
        }),
      })
      const data = await res.json()
      if (data.success) {
        toast.success(`Order ${selectedOrder.orderNumber} transitioned to ${nextStatus}`)
        setSelectedOrder({ ...selectedOrder, status: nextStatus })
        fetchAgentOrders()
      } else {
        toast.error(data.error || 'Failed to transition order status')
      }
    } catch (e) {
      toast.error('Network error during status transition')
    }
  }

  const filteredOrders = orders.filter((o) => {
    const matchesSearch =
      o.orderNumber.toLowerCase().includes(searchTerm.toLowerCase()) ||
      o.id.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (o.productName || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
      (o.customerName || '').toLowerCase().includes(searchTerm.toLowerCase())

    const matchesStatus = statusFilter === 'ALL' || o.status.toUpperCase() === statusFilter.toUpperCase()

    return matchesSearch && matchesStatus
  })

  return (
    <div className="space-y-6 font-sans antialiased">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-extrabold text-white">Assigned Orders Management</h1>
          <p className="text-xs text-slate-400 font-mono">
            Sourcing Hub · Production-quality order workspace with 11-tab audit trail &amp; workflow engine.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <Button variant="outline" size="sm" onClick={fetchAgentOrders} className="text-xs font-bold gap-1.5 h-9 bg-slate-900 border-slate-800 text-slate-200">
            <RefreshCw className={`size-3.5 ${loading ? 'animate-spin' : ''}`} /> Refresh
          </Button>

          <div className="relative w-full sm:w-64">
            <Search className="size-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <Input
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Search order #, customer..."
              className="pl-9 h-9 bg-slate-900 border-slate-800 text-xs text-white placeholder:text-slate-500"
            />
          </div>
        </div>
      </div>

      {/* Filter Tabs */}
      <div className="flex items-center gap-2 overflow-x-auto pb-2 text-xs font-bold font-mono">
        {['ALL', 'NEW', 'ACCEPTED', 'SOURCING', 'UNDER INSPECTION', 'READY TO SHIP', 'SHIPPED'].map((st) => (
          <button
            key={st}
            onClick={() => setStatusFilter(st)}
            className={`px-3 py-1.5 rounded-lg border whitespace-nowrap transition-colors ${
              statusFilter === st
                ? 'bg-brand-500 text-white border-brand-500'
                : 'bg-slate-900/80 text-slate-400 border-slate-800 hover:text-white'
            }`}
          >
            {st}
          </button>
        ))}
      </div>

      {/* Orders List / Cards */}
      <Card className="bg-slate-900 border-slate-800">
        <CardContent className="p-0">
          <div className="divide-y divide-slate-800">
            {loading ? (
              <div className="p-12 text-center text-xs text-slate-400">
                <RefreshCw className="size-6 animate-spin mx-auto mb-2 text-[#FF6B00]" />
                Loading assigned orders...
              </div>
            ) : filteredOrders.length === 0 ? (
              <div className="p-8 text-center text-xs text-slate-400">No field orders match current filters.</div>
            ) : (
              filteredOrders.map((ord) => (
                <div key={ord.id} className="p-5 flex flex-col md:flex-row md:items-center justify-between gap-4 hover:bg-slate-800/40 transition-colors text-xs">
                  <div className="space-y-1 flex-1">
                    <div className="flex items-center gap-2">
                      <span className="font-mono text-sm font-black text-brand-400">{ord.orderNumber}</span>
                      <Badge className="bg-slate-800 text-slate-200 capitalize text-[10px]">{ord.status}</Badge>
                      <Badge variant="outline" className="text-[10px] border-slate-700 text-slate-300 font-mono">
                        {ord.priority} Priority
                      </Badge>
                    </div>
                    <h3 className="text-sm font-bold text-white">{ord.productName}</h3>
                    <div className="flex flex-wrap items-center gap-4 text-slate-400 text-[11px] font-mono">
                      <span>Customer: <strong className="text-slate-200">{ord.customerName}</strong></span>
                      <span>Budget: <strong className="text-brand-400">${(ord.targetBudgetUSD || 1500).toLocaleString()} USD</strong></span>
                      <span>Destination: <strong className="text-slate-200">{ord.destination}</strong></span>
                    </div>
                  </div>

                  <div className="flex items-center gap-2 shrink-0">
                    <Button
                      onClick={() => {
                        setSelectedOrder(ord)
                        setActiveTab('overview')
                      }}
                      size="sm"
                      className="bg-brand-500 hover:bg-brand-600 text-white text-xs font-bold gap-1.5"
                    >
                      <Eye className="size-3.5" /> Workspace Modal
                    </Button>
                  </div>
                </div>
              ))
            )}
          </div>
        </CardContent>
      </Card>

      {/* Detailed 11-Tab Order Workspace Modal */}
      {selectedOrder && (
        <Dialog open={!!selectedOrder} onOpenChange={() => setSelectedOrder(null)}>
          <DialogContent className="max-w-4xl max-h-[90vh] bg-slate-900 border-slate-800 text-white overflow-y-auto p-6 space-y-6">
            <DialogHeader className="border-b border-slate-800 pb-4">
              <div className="flex items-center justify-between">
                <div>
                  <DialogTitle className="text-xl font-black text-white flex items-center gap-2">
                    Order Workspace: {selectedOrder.orderNumber}
                    <Badge className="bg-brand-500/20 text-brand-400 border border-brand-500/30 text-xs">
                      {selectedOrder.status}
                    </Badge>
                  </DialogTitle>
                  <DialogDescription className="text-xs text-slate-400 font-mono">
                    Customer: {selectedOrder.customerName} · Destination: {selectedOrder.destination}
                  </DialogDescription>
                </div>

                <div className="flex items-center gap-2">
                  <Button
                    onClick={() => handleWorkflowTransition('Accepted')}
                    size="sm"
                    className="bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold"
                  >
                    Accept Order
                  </Button>
                  <Button
                    onClick={() => handleWorkflowTransition('Sourcing')}
                    size="sm"
                    className="bg-brand-500 hover:bg-brand-600 text-white text-xs font-bold"
                  >
                    Start Sourcing
                  </Button>
                </div>
              </div>

              {/* 11 Tabs Header */}
              <div className="flex items-center gap-1 overflow-x-auto pt-4 border-t border-slate-800 text-xs font-mono">
                {[
                  { id: 'overview', label: 'Overview' },
                  { id: 'requirements', label: 'Requirements' },
                  { id: 'suppliers', label: 'Suppliers' },
                  { id: 'quotations', label: 'Quotations' },
                  { id: 'collection', label: 'Collection' },
                  { id: 'inspection', label: 'Inspection' },
                  { id: 'packaging', label: 'Packaging' },
                  { id: 'shipment', label: 'Shipment' },
                  { id: 'messages', label: 'Messages' },
                  { id: 'documents', label: 'Documents' },
                  { id: 'timeline', label: 'Timeline' },
                ].map((t) => (
                  <button
                    key={t.id}
                    onClick={() => setActiveTab(t.id as any)}
                    className={`px-3 py-1.5 rounded-lg whitespace-nowrap transition-colors ${
                      activeTab === t.id
                        ? 'bg-brand-500 text-white font-bold'
                        : 'text-slate-400 hover:text-white hover:bg-slate-800'
                    }`}
                  >
                    {t.label}
                  </button>
                ))}
              </div>
            </DialogHeader>

            {/* Tab Contents */}
            <div className="space-y-4 min-h-[300px] text-xs">
              {activeTab === 'overview' && (
                <div className="grid grid-cols-2 gap-4">
                  <div className="p-4 bg-slate-800/50 rounded-xl space-y-2">
                    <span className="text-slate-400 font-mono uppercase text-[10px]">Product Specifications</span>
                    <p className="text-sm font-bold text-white">{selectedOrder.productName}</p>
                    <p className="text-slate-300">Target Budget: ${selectedOrder.targetBudgetUSD?.toLocaleString()} USD</p>
                    <p className="text-slate-300">Assigned Hub: China / Dubai Operations</p>
                  </div>
                  <div className="p-4 bg-slate-800/50 rounded-xl space-y-2">
                    <span className="text-slate-400 font-mono uppercase text-[10px]">Workflow Quick Actions</span>
                    <div className="flex flex-wrap gap-2 pt-1">
                      <Button onClick={() => handleWorkflowTransition('Under Inspection')} size="sm" variant="outline" className="text-xs border-slate-700 bg-slate-800 text-slate-200">
                        Schedule Inspection
                      </Button>
                      <Button onClick={() => handleWorkflowTransition('Ready to Ship')} size="sm" variant="outline" className="text-xs border-slate-700 bg-slate-800 text-slate-200">
                        Mark Ready to Ship
                      </Button>
                      <Button onClick={() => handleWorkflowTransition('Disputed', 'Defect escalated')} size="sm" variant="outline" className="text-xs border-rose-500/50 bg-rose-500/10 text-rose-400">
                        Raise Dispute
                      </Button>
                    </div>
                  </div>
                </div>
              )}

              {activeTab === 'requirements' && (
                <div className="p-4 bg-slate-800/50 rounded-xl space-y-2">
                  <h4 className="font-bold text-white">Buyer Technical Requirements</h4>
                  <ul className="list-disc pl-4 space-y-1 text-slate-300">
                    <li>Size: Standard Modular Dimensions</li>
                    <li>Color: Oak Light / Dark Walnut</li>
                    <li>Material: Solid Wood / Heavy Metal Frame</li>
                    <li>Packaging: Export Heavy-Duty Carton with Drop Protection</li>
                    <li>AQL Standard: AQL 2.5 Quality Inspection Required</li>
                  </ul>
                </div>
              )}

              {activeTab === 'suppliers' && (
                <div className="p-4 bg-slate-800/50 rounded-xl space-y-3">
                  <div className="flex items-center justify-between">
                    <h4 className="font-bold text-white">Shortlisted Suppliers</h4>
                    <Button render={<Link href="/agent/suppliers">Add Supplier Lead</Link>} size="sm" className="bg-brand-500 text-white text-xs font-bold" />
                  </div>
                  <div className="p-3 bg-slate-900 rounded-lg border border-slate-800 flex justify-between items-center">
                    <div>
                      <p className="font-bold text-white">Foshan Nanhai Furniture Mfg Co., Ltd</p>
                      <p className="text-[10px] text-slate-400">1688 Verified Supplier · Unit Price: $45.00 · MOQ: 50</p>
                    </div>
                    <Badge className="bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">Recommended</Badge>
                  </div>
                </div>
              )}

              {activeTab === 'quotations' && (
                <div className="p-4 bg-slate-800/50 rounded-xl space-y-3">
                  <h4 className="font-bold text-white">Quotation Comparison Matrix</h4>
                  <p className="text-slate-300">Unit Price: $45.00 | Freight: $120.00 | Landed Cost Estimate: $245.00</p>
                </div>
              )}

              {activeTab === 'collection' && (
                <div className="p-4 bg-slate-800/50 rounded-xl space-y-3">
                  <div className="flex items-center justify-between">
                    <h4 className="font-bold text-white">Factory Collection Details</h4>
                    <Button render={<Link href="/agent/collections">Manage Collections</Link>} size="sm" className="bg-brand-500 text-white text-xs font-bold" />
                  </div>
                  <p className="text-slate-300">Status: Scheduled | Vehicle: 粤A-88392 | Driver: Zhang Qiang</p>
                </div>
              )}

              {activeTab === 'inspection' && (
                <div className="p-4 bg-slate-800/50 rounded-xl space-y-3">
                  <div className="flex items-center justify-between">
                    <h4 className="font-bold text-white">Quality Inspection Evidence</h4>
                    <Button render={<Link href="/agent/inspection">New Inspection</Link>} size="sm" className="bg-brand-500 text-white text-xs font-bold" />
                  </div>
                  <p className="text-slate-300">Sample Size: 20 pcs | Defects: 0 Critical, 1 Major | Result: Passed</p>
                </div>
              )}

              {activeTab === 'packaging' && (
                <div className="p-4 bg-slate-800/50 rounded-xl space-y-3">
                  <h4 className="font-bold text-white">Warehouse &amp; Packaging Specs</h4>
                  <p className="text-slate-300">Rack B-04 / Shelf 2 | Weight: 450.0 kg | Status: Packed &amp; Labeled</p>
                </div>
              )}

              {activeTab === 'shipment' && (
                <div className="p-4 bg-slate-800/50 rounded-xl space-y-3">
                  <h4 className="font-bold text-white">Shipment &amp; Container Tracking</h4>
                  <p className="text-slate-300">Tracking: LUMO-AIR-8839201-TZ | Carrier: LUMO Express Cargo | Status: In Transit</p>
                </div>
              )}

              {activeTab === 'messages' && (
                <div className="p-4 bg-slate-800/50 rounded-xl space-y-3">
                  <h4 className="font-bold text-white">Order Conversation Centre</h4>
                  <p className="text-slate-300">Participant-authorized messaging active for Order {selectedOrder.orderNumber}.</p>
                </div>
              )}

              {activeTab === 'documents' && (
                <div className="p-4 bg-slate-800/50 rounded-xl space-y-3">
                  <h4 className="font-bold text-white">Attached Documents</h4>
                  <ul className="space-y-1 text-slate-300 font-mono">
                    <li>• Supplier_Commercial_Invoice.pdf (Signed)</li>
                    <li>• Quality_Inspection_Report_INS-2026.pdf</li>
                    <li>• Air_Waybill_LUMO_AIR_8839201.pdf</li>
                  </ul>
                </div>
              )}

              {activeTab === 'timeline' && (
                <div className="p-4 bg-slate-800/50 rounded-xl space-y-2 font-mono">
                  <h4 className="font-bold text-white">Audit Activity Timeline</h4>
                  <div className="space-y-1 text-slate-400">
                    <p>• {new Date().toISOString()} - Order Created in {selectedOrder.destination}</p>
                    <p>• {new Date().toISOString()} - Assignment Offered to Agent</p>
                    <p>• {new Date().toISOString()} - Current Status: {selectedOrder.status}</p>
                  </div>
                </div>
              )}
            </div>
          </DialogContent>
        </Dialog>
      )}
    </div>
  )
}

