'use client'

import { useState } from 'react'
import Link from 'next/link'
import {
  Mail,
  Phone,
  MapPin,
  Clock,
  Send,
  CheckCircle2,
  Headphones,
  Building2,
  Globe,
  MessageSquare,
  Sparkles,
  ArrowRight,
  ShieldCheck,
} from 'lucide-react'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'

const GLOBAL_OFFICES = [
  {
    country: 'Tanzania (Headquarters)',
    city: 'Dar es Salaam',
    address: 'Victoria Place, 3rd Floor, Bagamoyo Road, Victoria, Dar es Salaam',
    phone: '+255 712 345 678',
    email: 'dar.hq@lumo.co.tz',
    hours: 'Mon - Sat: 8:00 AM - 6:00 PM (EAT)',
    flag: '🇹🇿',
    type: 'East Africa Gateway HQ',
  },
  {
    country: 'China Field Hub',
    city: 'Shenzhen & Yiwu',
    address: 'Huaqiangbei Electronics Tower & District 3 Yiwu International Trade City',
    phone: '+86 755 8890 1234',
    email: 'china.hub@lumo.co.tz',
    hours: 'Mon - Sun: 9:00 AM - 8:00 PM (CST)',
    flag: '🇨🇳',
    type: 'Factory QC & Dispatch Hub',
  },
  {
    country: 'Dubai (UAE) Field Hub',
    city: 'Dubai',
    address: 'Section A, Dragon Mart 1, International City, Dubai, UAE',
    phone: '+971 4 438 0000',
    email: 'dubai.hub@lumo.co.tz',
    hours: 'Mon - Sat: 9:00 AM - 7:00 PM (GST)',
    flag: '🇦🇪',
    type: 'Wholesale & Trade Hub',
  },
  {
    country: 'Turkey Field Hub',
    city: 'Istanbul',
    address: 'Laleli Commercial Plaza, Fatih, Istanbul, Turkey',
    phone: '+90 212 519 1234',
    email: 'turkey.hub@lumo.co.tz',
    hours: 'Mon - Fri: 9:00 AM - 6:00 PM (TRT)',
    flag: '🇹🇷',
    type: 'Textile & Garment Hub',
  },
]

export default function ContactPage() {
  const [fullName, setFullName] = useState('')
  const [email, setEmail] = useState('')
  const [phone, setPhone] = useState('')
  const [inquiryType, setInquiryType] = useState('sourcing')
  const [orderRef, setOrderRef] = useState('')
  const [message, setMessage] = useState('')
  const [submittedTicket, setSubmittedTicket] = useState<string | null>(null)

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!fullName.trim() || !email.trim() || !message.trim()) return
    const ticketId = `TKT-${Math.floor(100000 + Math.random() * 900000)}`
    setSubmittedTicket(ticketId)
  }

  return (
    <div className="flex flex-col gap-10 max-w-6xl mx-auto py-6 px-4">
      {/* Hero Banner */}
      <div className="relative rounded-3xl bg-gradient-to-r from-slate-950 via-slate-900 to-[#ea580c] p-8 sm:p-12 text-white overflow-hidden shadow-xl border border-slate-800 text-center">
        <div className="absolute inset-0 bg-[radial-gradient(#ffffff_1px,transparent_1px)] [background-size:28px_28px] opacity-10 pointer-events-none" />
        <div className="relative z-10 max-w-2xl mx-auto space-y-3">
          <Badge className="bg-brand-500/20 text-brand-400 border border-brand-500/40 px-3 py-1 text-xs font-bold uppercase tracking-wider">
            24/7 Operations &amp; Support
          </Badge>
          <h1 className="text-3xl sm:text-5xl font-black tracking-tight font-heading">
            Get in Touch with LUMO
          </h1>
          <p className="text-xs sm:text-sm text-slate-300">
            Have questions about factory sourcing, landed freight quotes, supplier verification, or LUMO Pay payment protection? Our team is ready to assist.
          </p>
        </div>
      </div>

      {/* Main Grid: Form + Direct Contact Cards */}
      <div className="grid lg:grid-cols-3 gap-8">
        {/* Left 2 Cols: Interactive Contact Form */}
        <div className="lg:col-span-2">
          {submittedTicket ? (
            <Card className="border-emerald-500/30 bg-emerald-500/10 p-8 text-center space-y-4">
              <div className="size-14 rounded-full bg-emerald-500 text-white flex items-center justify-center mx-auto shadow-lg">
                <CheckCircle2 className="size-8" />
              </div>
              <div className="space-y-1">
                <h2 className="text-xl font-bold text-foreground">Message Received!</h2>
                <p className="text-xs text-muted-foreground max-w-md mx-auto">
                  Thank you <span className="font-semibold text-foreground">{fullName}</span>. Your inquiry has been routed to our Sales &amp; Sourcing Department under Ticket Ref:{' '}
                  <span className="font-extrabold text-brand-500">{submittedTicket}</span>.
                </p>
              </div>
              <p className="text-[11px] text-muted-foreground">
                We typically respond within <span className="font-bold text-foreground">2 to 4 hours</span> during business operational hours.
              </p>
              <div className="pt-2 flex justify-center gap-3">
                <Button variant="outline" size="sm" onClick={() => setSubmittedTicket(null)}>
                  Send Another Message
                </Button>
                <Button size="sm" className="bg-brand-500 hover:bg-brand-600 text-white" render={<Link href="/account/support" />}>
                  Go to Support Desk
                </Button>
              </div>
            </Card>
          ) : (
            <Card className="border-border shadow-xs">
              <CardHeader>
                <CardTitle className="text-lg font-bold font-heading">Send Us a Direct Message</CardTitle>
                <CardDescription className="text-xs">
                  Fill in your details below and our team will get back to you promptly.
                </CardDescription>
              </CardHeader>
              <CardContent>
                <form onSubmit={handleSubmit} className="space-y-4">
                  <div className="grid sm:grid-cols-2 gap-4">
                    <div className="space-y-1.5">
                      <label className="text-xs font-medium">Full Name</label>
                      <Input
                        placeholder="e.g. Amina Hassan"
                        value={fullName}
                        onChange={(e) => setFullName(e.target.value)}
                        required
                        className="text-xs"
                      />
                    </div>
                    <div className="space-y-1.5">
                      <label className="text-xs font-medium">Email Address</label>
                      <Input
                        type="email"
                        placeholder="you@company.co.tz"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        required
                        className="text-xs"
                      />
                    </div>
                  </div>

                  <div className="grid sm:grid-cols-2 gap-4">
                    <div className="space-y-1.5">
                      <label className="text-xs font-medium">Phone Number (TZ / WhatsApp)</label>
                      <Input
                        placeholder="+255 712 345 678"
                        value={phone}
                        onChange={(e) => setPhone(e.target.value)}
                        className="text-xs"
                      />
                    </div>
                    <div className="space-y-1.5">
                      <label className="text-xs font-medium">Inquiry Subject</label>
                      <select
                        value={inquiryType}
                        onChange={(e) => setInquiryType(e.target.value)}
                        className="flex h-9 w-full rounded-md border border-input bg-background px-3 py-1 text-xs shadow-xs transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
                      >
                        <option value="sourcing">Bulk Factory Sourcing Request</option>
                        <option value="shipping">Air &amp; Sea Landed Freight Status</option>
                        <option value="supplier">Supplier Registration &amp; Verification</option>
                        <option value="billing">LUMO Mobile Payment &amp; Protection</option>
                        <option value="other">General Inquiry</option>
                      </select>
                    </div>
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-xs font-medium">Order / Quote Reference (Optional)</label>
                    <Input
                      placeholder="e.g. LM-202600319"
                      value={orderRef}
                      onChange={(e) => setOrderRef(e.target.value)}
                      className="text-xs"
                    />
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-xs font-medium">Message Details</label>
                    <Textarea
                      placeholder="Describe your sourcing requirements, product quantities, or inquiry..."
                      value={message}
                      onChange={(e) => setMessage(e.target.value)}
                      rows={5}
                      required
                      className="text-xs"
                    />
                  </div>

                  <Button type="submit" className="w-full bg-brand-500 hover:bg-brand-600 text-white font-bold h-10 text-xs">
                    <Send className="size-3.5 mr-2" />
                    Submit Inquiry
                  </Button>
                </form>
              </CardContent>
            </Card>
          )}
        </div>

        {/* Right 1 Col: Direct Channels Card */}
        <div className="space-y-6">
          <Card className="border-brand-500/20 bg-gradient-to-br from-card via-muted/30 to-brand-500/5 p-6 space-y-4">
            <div className="flex items-center gap-3">
              <div className="p-2.5 rounded-xl bg-brand-500 text-white shrink-0">
                <Headphones className="size-5" />
              </div>
              <div>
                <h3 className="text-sm font-bold font-heading">Sales Desk Support</h3>
                <p className="text-[11px] text-muted-foreground">Dar es Salaam HQ Team</p>
              </div>
            </div>

            <div className="space-y-3 pt-2 text-xs border-t border-border">
              <div className="flex items-center gap-2.5 text-muted-foreground">
                <Phone className="size-4 text-brand-500 shrink-0" />
                <div>
                  <span className="font-semibold text-foreground block">+255 712 345 678</span>
                  <span className="text-[10px]">Tanzania Hotline (TZS)</span>
                </div>
              </div>

              <div className="flex items-center gap-2.5 text-muted-foreground">
                <MessageSquare className="size-4 text-emerald-500 shrink-0" />
                <div>
                  <span className="font-semibold text-foreground block">+255 712 345 678</span>
                  <span className="text-[10px]">Direct WhatsApp Sourcing</span>
                </div>
              </div>

              <div className="flex items-center gap-2.5 text-muted-foreground">
                <Mail className="size-4 text-blue-500 shrink-0" />
                <div>
                  <span className="font-semibold text-foreground block">support@lumo.co.tz</span>
                  <span className="text-[10px]">24/7 Email Desk</span>
                </div>
              </div>

              <div className="flex items-center gap-2.5 text-muted-foreground">
                <Clock className="size-4 text-amber-500 shrink-0" />
                <div>
                  <span className="font-semibold text-foreground block">Operating Hours</span>
                  <span className="text-[10px]">Mon - Sat: 8:00 AM - 6:00 PM EAT</span>
                </div>
              </div>
            </div>

            <Button variant="outline" size="sm" className="w-full text-xs font-bold" render={<Link href="/account/support" />}>
              Open Ticket in Support Desk
            </Button>
          </Card>

          <Card className="p-5 border-border text-xs space-y-2">
            <div className="flex items-center gap-2 text-brand-500 font-bold">
              <ShieldCheck className="size-4 shrink-0" />
              <span>Buyer Protection Guarantee</span>
            </div>
            <p className="text-muted-foreground leading-relaxed">
              All transactions submitted through LUMO are covered under our LUMO Trade Protection. Funds are protected until product inspection photo approval.
            </p>
          </Card>
        </div>
      </div>

      {/* Global Offices Section */}
      <div className="space-y-6 pt-4">
        <div className="text-center max-w-xl mx-auto space-y-1">
          <Badge className="bg-brand-500/10 text-brand-500 border border-brand-500/20 px-3 py-0.5 text-xs font-bold uppercase">
            Our Physical Presence
          </Badge>
          <h2 className="text-2xl font-extrabold tracking-tight font-heading">Global Office &amp; Hub Locations</h2>
          <p className="text-xs text-muted-foreground">
            Contact our ground ops teams directly at any of our 4 international hubs.
          </p>
        </div>

        <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {GLOBAL_OFFICES.map((office, i) => (
            <Card key={i} className="p-5 border-border hover:shadow-md transition-all flex flex-col justify-between">
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-2xl">{office.flag}</span>
                  <Badge variant="outline" className="text-[9px] font-extrabold">
                    {office.type}
                  </Badge>
                </div>

                <div>
                  <h3 className="text-sm font-bold font-heading text-foreground">{office.country}</h3>
                  <p className="text-xs font-semibold text-brand-500">{office.city}</p>
                </div>

                <div className="space-y-1.5 pt-2 text-[11px] text-muted-foreground border-t border-border">
                  <p className="flex items-start gap-1.5">
                    <MapPin className="size-3 text-brand-500 shrink-0 mt-0.5" />
                    <span>{office.address}</span>
                  </p>
                  <p className="flex items-center gap-1.5 font-medium text-foreground">
                    <Phone className="size-3 text-brand-500 shrink-0" />
                    <span>{office.phone}</span>
                  </p>
                  <p className="flex items-center gap-1.5">
                    <Mail className="size-3 text-brand-500 shrink-0" />
                    <span>{office.email}</span>
                  </p>
                </div>
              </div>

              <div className="mt-4 pt-2 border-t border-border/60 text-[10px] text-muted-foreground flex items-center gap-1">
                <Clock className="size-3 shrink-0" />
                <span className="truncate">{office.hours}</span>
              </div>
            </Card>
          ))}
        </div>
      </div>
    </div>
  )
}
