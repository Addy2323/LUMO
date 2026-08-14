'use client'

import { useState } from 'react'
import Link from 'next/link'
import {
  Inbox,
  Search,
  UserCheck,
  Calculator,
  ArrowRight,
  Clock,
  ExternalLink,
  DollarSign,
  Send,
} from 'lucide-react'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { toast } from 'sonner'

type RfqInboxItem = {
  id: string
  reference: string
  customerName: string
  productName: string
  productLink?: string
  quantity: number
  targetBudgetUSD: number
  destination: string
  assignedAgent?: string
  status: 'Unreviewed' | 'Agent Assigned' | 'Quoted'
  createdAt: string
}

const DEMO_RFQS: RfqInboxItem[] = [
  {
    id: 'rfq-001',
    reference: 'RFQ-TZ-44101',
    customerName: 'Amina Hassan (Kigoma Trading)',
    productName: 'Solar Powered Submersible Water Pumps 1.5HP',
    productLink: 'https://detail.1688.com/offer/68492019.html',
    quantity: 50,
    targetBudgetUSD: 12500,
    destination: 'Kigoma Port, Tanzania',
    status: 'Unreviewed',
    createdAt: 'Today at 10:15 AM',
  },
  {
    id: 'rfq-002',
    reference: 'RFQ-TZ-44102',
    customerName: 'Dar Electronics Center',
    productName: 'Heavy Duty Smart Lithium Battery Packs 48V',
    productLink: 'https://alibaba.com/product-detail/48v-lithium_1600.html',
    quantity: 20,
    targetBudgetUSD: 18000,
    destination: 'Dar es Salaam Port, Tanzania',
    assignedAgent: 'Mwanahawa Juma (Guangzhou)',
    status: 'Agent Assigned',
    createdAt: 'Yesterday',
  },
]

export default function SalesRfqInboxPage() {
  const [rfqs, setRfqs] = useState<RfqInboxItem[]>(DEMO_RFQS)
  const [search, setSearch] = useState('')
  const [selectedAgent, setSelectedAgent] = useState('Mwanahawa Juma')

  function assignAgent(rfqId: string) {
    setRfqs((prev) =>
      prev.map((item) => {
        if (item.id === rfqId) {
          return { ...item, assignedAgent: selectedAgent, status: 'Agent Assigned' }
        }
        return item
      })
    )
    toast.success(`Assigned Sourcing Agent ${selectedAgent} to ${rfqId}`)
  }

  return (
    <div className="flex flex-col gap-6 font-sans antialiased text-foreground">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between border-b pb-4">
        <div>
          <h1 className="text-2xl font-extrabold tracking-tight">Sales RFQ Inbox &amp; Sourcing Requests</h1>
          <p className="text-xs text-muted-foreground mt-1">
            Review incoming B2B buyer product links, target budgets, assign regional sourcing agents, and issue landed quotes.
          </p>
        </div>

        <Button
          render={
            <Link href="/sales/quotations">
              <Calculator className="size-4 mr-1.5" /> Open Landed Cost Calculator
            </Link>
          }
          className="bg-[#FF6B00] hover:bg-[#E05E00] text-white font-bold text-xs"
        />
      </div>

      <div className="space-y-4">
        <div className="relative w-full sm:w-80">
          <Search className="absolute left-3 top-2.5 size-4 text-muted-foreground" />
          <Input
            placeholder="Search RFQ # or customer..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-9 text-xs h-9"
          />
        </div>

        <div className="grid gap-4">
          {rfqs.map((rfq) => (
            <Card key={rfq.id} className="p-5 flex flex-col md:flex-row md:items-center justify-between gap-4">
              <div className="space-y-1.5 min-w-0">
                <div className="flex items-center gap-2">
                  <span className="font-mono font-extrabold text-xs text-[#FF6B00]">{rfq.reference}</span>
                  <Badge
                    className={`text-[10px] uppercase ${
                      rfq.status === 'Unreviewed'
                        ? 'bg-amber-500 text-white'
                        : rfq.status === 'Agent Assigned'
                        ? 'bg-blue-600 text-white'
                        : 'bg-emerald-600 text-white'
                    }`}
                  >
                    {rfq.status}
                  </Badge>
                </div>

                <h3 className="font-bold text-sm text-foreground">{rfq.productName}</h3>

                <p className="text-xs text-muted-foreground">
                  Buyer: <strong className="text-foreground">{rfq.customerName}</strong> · Quantity:{' '}
                  <strong className="text-foreground font-mono">{rfq.quantity} Units</strong> · Budget:{' '}
                  <strong className="text-[#FF6B00] font-mono">${rfq.targetBudgetUSD.toLocaleString()} USD</strong>
                </p>

                {rfq.productLink && (
                  <a
                    href={rfq.productLink}
                    target="_blank"
                    rel="noreferrer"
                    className="text-[11px] text-blue-600 font-medium hover:underline flex items-center gap-1 mt-1"
                  >
                    <ExternalLink className="size-3" /> View 1688 / Alibaba Product Source Link
                  </a>
                )}

                {rfq.assignedAgent && (
                  <p className="text-[11px] text-emerald-600 font-semibold mt-1">
                    Assigned Agent: {rfq.assignedAgent}
                  </p>
                )}
              </div>

              <div className="flex items-center gap-2 shrink-0">
                {rfq.status === 'Unreviewed' && (
                  <Button
                    size="sm"
                    onClick={() => assignAgent(rfq.id)}
                    className="bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold"
                  >
                    <UserCheck className="size-3.5 mr-1" /> Assign Agent
                  </Button>
                )}

                <Button
                  render={
                    <Link href="/sales/quotations">
                      <Calculator className="size-3.5 mr-1" /> Build Quote
                    </Link>
                  }
                  size="sm"
                  variant="outline"
                  className="text-xs font-bold border-[#FF6B00]/40 text-[#FF6B00]"
                />
              </div>
            </Card>
          ))}
        </div>
      </div>
    </div>
  )
}
