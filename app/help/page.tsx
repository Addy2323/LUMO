'use client'

import { useState } from 'react'
import Link from 'next/link'
import {
  HelpCircle,
  Search,
  Truck,
  PackageSearch,
  CreditCard,
  RotateCcw,
  ShieldCheck,
  Headphones,
  ArrowRight,
  ChevronDown,
  MessageSquare,
  FileText,
  Building2,
  CheckCircle2,
} from 'lucide-react'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'

interface FAQItem {
  id: string
  question: string
  answer: string
  category: string
}

const FAQS: FAQItem[] = [
  {
    id: 'faq_1',
    category: 'sourcing',
    question: 'How does Lumo direct factory sourcing work?',
    answer:
      'Lumo connects buyers directly with verified manufacturers in China, Dubai, Turkey, and India. You simply submit a sourcing request (or paste a product link), and our field agents inspect factories, collect goods, perform 10-point quality control, and arrange door-to-door landed freight to Tanzania.',
  },
  {
    id: 'faq_2',
    category: 'shipping',
    question: 'What is the difference between Air Freight and Sea Freight lead times?',
    answer:
      'Air Freight takes approximately 5 to 7 business days from factory dispatch to Dar es Salaam. Sea Freight takes 24 to 30 days and is recommended for heavy bulk cargo due to lower per-kg rates.',
  },
  {
    id: 'faq_3',
    category: 'payments',
    question: 'Can I pay in Tanzanian Shillings (TZS) using LUMO Pay or M-Pesa?',
    answer:
      'Yes! Lumo eliminates foreign exchange risk for Tanzanian buyers. You can pay in local TZS via Mobile Money (M-Pesa, TigoPesa, Airtel Money) or bank transfer, and Lumo handles international supplier settlements directly.',
  },
  {
    id: 'faq_4',
    category: 'quality',
    question: 'What happens if a product fails quality inspection at the field hub?',
    answer:
      'Our field agent uploads 10 inspection photos and a video proof. If you reject the inspection report, Lumo returns the items to the supplier in China/Dubai before international shipment, guaranteeing zero defect delivery.',
  },
  {
    id: 'faq_5',
    category: 'refunds',
    question: 'How are returns and refunds handled?',
    answer:
      'If an item is defective or incorrect upon arrival, submit a return request under your account within 7 days. Refunds are processed directly back to your original payment method within 3 business days of approval.',
  },
]

export default function HelpCentrePage() {
  const [searchQuery, setSearchQuery] = useState('')
  const [openFaq, setOpenFaq] = useState<string | null>('faq_1')
  const [selectedCategory, setSelectedCategory] = useState<string>('all')

  const filteredFaqs = FAQS.filter((faq) => {
    const matchesSearch =
      faq.question.toLowerCase().includes(searchQuery.toLowerCase()) ||
      faq.answer.toLowerCase().includes(searchQuery.toLowerCase())
    const matchesCat = selectedCategory === 'all' || faq.category === selectedCategory
    return matchesSearch && matchesCat
  })

  return (
    <div className="flex flex-col gap-8 max-w-5xl mx-auto py-4">
      {/* Hero Search Section */}
      <div className="relative rounded-2xl bg-gradient-to-r from-slate-900 via-slate-800 to-[#ea580c] p-6 sm:p-10 text-white overflow-hidden shadow-xl">
        <div className="absolute inset-0 bg-[radial-gradient(#ffffff_1px,transparent_1px)] [background-size:24px_24px] opacity-10 pointer-events-none" />
        <div className="relative z-10 flex flex-col items-center text-center max-w-2xl mx-auto gap-4">
          <Badge className="bg-white/20 text-white border border-white/30 px-3 py-1 text-xs font-bold uppercase tracking-wider backdrop-blur-xs">
            Lumo Knowledge Base &amp; Support
          </Badge>
          <h1 className="text-2xl sm:text-4xl font-extrabold tracking-tight font-heading">
            How can we help your supply chain today?
          </h1>
          <p className="text-xs sm:text-sm text-slate-200">
            Search sourcing guides, landed freight policies, payment methods, and factory quality standards.
          </p>

          <div className="relative w-full max-w-lg mt-2">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 size-4 text-slate-400" />
            <Input
              type="text"
              placeholder="Search e.g. 'Air freight rates', 'Quality check', 'M-Pesa payment'..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="h-11 pl-10 pr-4 bg-white/95 text-slate-900 placeholder:text-slate-500 rounded-xl text-xs sm:text-sm font-medium shadow-lg border-0 focus-visible:ring-2 focus-visible:ring-brand-500"
            />
          </div>
        </div>
      </div>

      {/* Quick Help Category Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <button
          onClick={() => setSelectedCategory('sourcing')}
          className={`flex flex-col items-center text-center p-4 rounded-xl border transition-all ${
            selectedCategory === 'sourcing'
              ? 'border-brand-500 bg-brand-500/10 shadow-sm'
              : 'border-border bg-card hover:bg-muted/50'
          }`}
        >
          <PackageSearch className="size-6 text-brand-500 mb-2" />
          <span className="text-xs font-bold">Factory Sourcing</span>
          <span className="text-[10px] text-muted-foreground mt-0.5">RFQs &amp; Supplier Verification</span>
        </button>

        <button
          onClick={() => setSelectedCategory('shipping')}
          className={`flex flex-col items-center text-center p-4 rounded-xl border transition-all ${
            selectedCategory === 'shipping'
              ? 'border-brand-500 bg-brand-500/10 shadow-sm'
              : 'border-border bg-card hover:bg-muted/50'
          }`}
        >
          <Truck className="size-6 text-blue-500 mb-2" />
          <span className="text-xs font-bold">Landed Freight</span>
          <span className="text-[10px] text-muted-foreground mt-0.5">Air &amp; Sea Customs Clearance</span>
        </button>

        <button
          onClick={() => setSelectedCategory('payments')}
          className={`flex flex-col items-center text-center p-4 rounded-xl border transition-all ${
            selectedCategory === 'payments'
              ? 'border-brand-500 bg-brand-500/10 shadow-sm'
              : 'border-border bg-card hover:bg-muted/50'
          }`}
        >
          <CreditCard className="size-6 text-emerald-500 mb-2" />
          <span className="text-xs font-bold">Payments &amp; Forex</span>
          <span className="text-[10px] text-muted-foreground mt-0.5">TZS Mobile Money &amp; Invoices</span>
        </button>

        <button
          onClick={() => setSelectedCategory('quality')}
          className={`flex flex-col items-center text-center p-4 rounded-xl border transition-all ${
            selectedCategory === 'quality'
              ? 'border-brand-500 bg-brand-500/10 shadow-sm'
              : 'border-border bg-card hover:bg-muted/50'
          }`}
        >
          <ShieldCheck className="size-6 text-purple-500 mb-2" />
          <span className="text-xs font-bold">Quality Inspection</span>
          <span className="text-[10px] text-muted-foreground mt-0.5">10-Point Photo Verification</span>
        </button>
      </div>

      {/* FAQs Section */}
      <div className="flex flex-col gap-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <HelpCircle className="size-5 text-brand-500" />
            <h2 className="text-lg font-bold tracking-tight font-heading">Frequently Asked Questions</h2>
          </div>
          {selectedCategory !== 'all' && (
            <Button variant="ghost" size="sm" onClick={() => setSelectedCategory('all')} className="text-xs">
              Show All FAQs
            </Button>
          )}
        </div>

        <div className="flex flex-col gap-3">
          {filteredFaqs.map((faq) => {
            const isOpen = openFaq === faq.id
            return (
              <Card key={faq.id} className="overflow-hidden transition-all border-border">
                <button
                  onClick={() => setOpenFaq(isOpen ? null : faq.id)}
                  className="w-full text-left p-4 flex items-center justify-between gap-4 font-semibold text-xs sm:text-sm hover:bg-muted/40 transition-colors"
                >
                  <span className="flex items-center gap-2">
                    <CheckCircle2 className="size-4 text-brand-500 shrink-0" />
                    {faq.question}
                  </span>
                  <ChevronDown className={`size-4 text-muted-foreground transition-transform ${isOpen ? 'rotate-180' : ''}`} />
                </button>
                {isOpen && (
                  <CardContent className="px-4 pb-4 pt-1 text-xs leading-relaxed text-muted-foreground border-t border-border/50 bg-muted/20">
                    {faq.answer}
                  </CardContent>
                )}
              </Card>
            )
          })}
        </div>
      </div>

      {/* Direct Contact Support Banner */}
      <Card className="border-brand-500/30 bg-gradient-to-r from-brand-500/10 via-background to-blue-500/10 p-6">
        <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="p-3 rounded-full bg-brand-500 text-white shrink-0">
              <Headphones className="size-6" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-foreground">Need Dedicated Operations Assistance?</h3>
              <p className="text-xs text-muted-foreground mt-0.5">
                Our Sales Department team in Dar es Salaam is available 24/7 to resolve your inquiries.
              </p>
            </div>
          </div>
          <Button size="sm" className="bg-brand-500 hover:bg-brand-600 text-white font-bold shrink-0" render={<Link href="/account/support" />}>
            <MessageSquare className="size-3.5 mr-1.5" />
            Open Support Ticket
          </Button>
        </div>
      </Card>
    </div>
  )
}
