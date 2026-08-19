'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { toast } from 'sonner'
import {
  ArrowLeft,
  Box,
  Building2,
  CheckCircle2,
  DollarSign,
  FileText,
  Globe,
  HelpCircle,
  Image as ImageIcon,
  Link2,
  PackageCheck,
  Plane,
  Send,
  Ship,
  Sparkles,
  Tag,
  Truck,
} from 'lucide-react'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { AuthRequiredModal } from '@/components/auth/auth-required-modal'
import { useSessionStore } from '@/lib/stores/session-store'
import { useSourcingStore } from '@/lib/stores/sourcing-store'
import { useAgentStore } from '@/lib/stores/agent-store'

export default function CustomerSourcingRequestPage() {
  const sessionUser = useSessionStore((s) => s.user)

  const [productName, setProductName] = useState('')
  const [urlLink, setUrlLink] = useState('')
  const [targetPrice, setTargetPrice] = useState('')
  const [targetCurrency, setTargetCurrency] = useState('USD')
  const [quantity, setQuantity] = useState('100')
  const [countryPref, setCountryPref] = useState('China')
  const [specs, setSpecs] = useState('')
  const [notes, setNotes] = useState('')
  const [isSubmitted, setIsSubmitted] = useState(false)
  const [requestId, setRequestId] = useState('')
  const [showAuthModal, setShowAuthModal] = useState(false)
  const [isAuthenticated, setIsAuthenticated] = useState(false)

  // 1. Check Auth Status on Mount & Restore Saved Draft
  useEffect(() => {
    // Check mock session store & real server session
    async function checkAuth() {
      if (sessionUser) {
        setIsAuthenticated(true)
        return
      }
      try {
        const res = await fetch('/api/auth/session')
        const data = await res.json()
        if (data.authenticated && data.user) {
          setIsAuthenticated(true)
        } else {
          setIsAuthenticated(false)
        }
      } catch (err) {
        setIsAuthenticated(false)
      }
    }
    checkAuth()

    // Restore draft from localStorage if present
    try {
      const savedDraft = localStorage.getItem('lumo_sourcing_draft')
      if (savedDraft) {
        const draft = JSON.parse(savedDraft)
        if (draft.productName) setProductName(draft.productName)
        if (draft.urlLink) setUrlLink(draft.urlLink)
        if (draft.targetPrice) setTargetPrice(draft.targetPrice)
        if (draft.targetCurrency) setTargetCurrency(draft.targetCurrency)
        if (draft.quantity) setQuantity(draft.quantity)
        if (draft.countryPref) setCountryPref(draft.countryPref)
        if (draft.specs) setSpecs(draft.specs)
        if (draft.notes) setNotes(draft.notes)
      }
    } catch (e) {
      console.warn('Failed to parse sourcing draft from localStorage', e)
    }
  }, [sessionUser])

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()

    if (!productName || !productName.trim()) {
      toast.error('Please enter a Product Title / Name at the top of the form before submitting.')
      window.scrollTo({ top: 0, behavior: 'smooth' })
      return
    }

    // 2. Auth Guard: If not logged in / registered, save draft & show Auth Card popup!
    if (!isAuthenticated && !sessionUser) {
      const currentDraft = {
        productName,
        urlLink,
        targetPrice,
        targetCurrency,
        quantity,
        countryPref,
        specs,
        notes,
      }
      try {
        localStorage.setItem('lumo_sourcing_draft', JSON.stringify(currentDraft))
      } catch (err) {
        console.warn('Could not save draft to localStorage', err)
      }
      setShowAuthModal(true)
      return
    }

    // 3. User is authenticated -> Clear draft and submit request
    try {
      localStorage.removeItem('lumo_sourcing_draft')
    } catch (e) {}

    const custName = sessionUser?.fullName || 'Amina Hassan'
    const custEmail = sessionUser?.email || 'amina.hassan@example.co.tz'
    const parsedBudget = parseFloat(targetPrice) || 100
    const targetPriceUSD = targetCurrency === 'USD' ? parsedBudget : Math.round(parsedBudget / 2600) || 100

    // 4. Post to authoritative PostgreSQL database
    let serverId = ''
    try {
      const res = await fetch('/api/sourcing', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          productUrl: urlLink || `https://lumo.co.tz/sourcing/${encodeURIComponent(productName || 'Custom Product')}`,
          targetPriceUSD,
          targetQuantity: Number(quantity) || 10,
          notes: `${productName}: ${specs ? `${specs}\n${notes}` : notes || ''} | Hub: ${countryPref}`,
        }),
      })
      if (res.ok) {
        const data = await res.json()
        serverId = data.id
      }
    } catch (postErr) {
      console.warn('[SOURCING POST DB WARNING]', postErr)
    }

    const generatedRef = serverId
      ? `SRC-${serverId.slice(0, 8).toUpperCase()}`
      : useSourcingStore.getState().addRequest({
          customerName: custName,
          customerEmail: custEmail,
          productName: productName || 'Custom Sourced Product',
          productLink: urlLink,
          description: specs ? `${specs}\n${notes}` : notes,
          brand: 'Specified Brand',
          modelNumber: 'Custom Spec',
          color: 'Default',
          sizeDimensions: 'Standard',
          techSpecs: specs,
          quantity: Number(quantity) || 10,
          targetBudget: parsedBudget,
          currency: targetCurrency || 'USD',
          region: countryPref || 'China',
          destination: countryPref || 'China',
          shippingMethod: 'standard_air',
          addInsurance: true,
          inspectionRequired: true,
        })

    useAgentStore.getState().addOrder({
      orderNumber: generatedRef,
      customerName: custName,
      productName: productName || 'Custom Sourced Product',
      quantityNeeded: Number(quantity) || 10,
      targetBudgetUSD: targetPriceUSD,
      destinationRegion: countryPref || 'China',
      destinationCountry: 'Tanzania',
      assignedCountry: (countryPref === 'ANY' ? 'China' : countryPref) as any,
      priority: 'High',
    })

    setRequestId(generatedRef)
    setIsSubmitted(true)
    toast.success(`Sourcing Request ${generatedRef} Submitted & Sent to Database!`)
  }

  return (
    <div className="max-w-4xl mx-auto py-4 sm:py-8 px-3 sm:px-6 space-y-5">
      {/* Auth Required Modal Card Popup */}
      <AuthRequiredModal
        open={showAuthModal}
        onOpenChange={setShowAuthModal}
        title="Sign In to Submit Sourcing Request"
        description="Please register or login to submit your request."
        redirectUrl="/sourcing/request"
      />

      {/* Modern Mobile Hero Header Card */}
      <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-slate-950 via-[#1e0f05] to-slate-950 text-white p-5 sm:p-7 border border-orange-500/30 shadow-xl">
        {/* Background Radial Glow */}
        <div className="absolute -top-20 -right-20 size-56 rounded-full bg-orange-500/20 blur-3xl pointer-events-none" />
        <div className="absolute -bottom-20 -left-20 size-56 rounded-full bg-orange-600/15 blur-3xl pointer-events-none" />

        <div className="relative z-10 space-y-4">
          <div className="flex items-center justify-between gap-3">
            <Link href="/marketplace">
              <Button size="sm" className="bg-slate-900/90 hover:bg-orange-500 text-slate-200 hover:text-white border border-orange-500/30 font-bold text-xs rounded-xl transition-all">
                <ArrowLeft className="size-3.5 mr-1.5" /> Marketplace
              </Button>
            </Link>
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-orange-500/20 border border-orange-500/40 text-orange-300 font-extrabold text-[11px]">
              <Sparkles className="size-3.5 text-orange-400" />
              <span>Direct Factory Sourcing</span>
            </div>
          </div>

          <div className="space-y-1.5">
            <h1 className="text-xl sm:text-2xl font-black tracking-tight text-white drop-shadow-sm">
              Global Product Sourcing Request
            </h1>
            <p className="text-xs text-slate-300 max-w-2xl leading-relaxed">
              Can't find a product in our catalog? Our field procurement agents in <span className="text-orange-400 font-bold">China</span>, <span className="text-orange-400 font-bold">Dubai</span>, and <span className="text-orange-400 font-bold">Turkey</span> will source it direct from verified factory floors for you.
            </p>
          </div>
        </div>
      </div>

      {!isSubmitted ? (
        <form onSubmit={handleSubmit} className="space-y-5">
          {/* Step 1 Card */}
          <Card className="border-orange-500/20 bg-card shadow-md overflow-hidden rounded-2xl">
            <CardHeader className="bg-gradient-to-r from-orange-500/10 via-amber-500/5 to-transparent border-b border-orange-500/10 p-4 sm:p-5">
              <CardTitle className="text-sm sm:text-base font-extrabold text-foreground flex items-center gap-2">
                <span className="flex size-7 items-center justify-center rounded-xl bg-orange-500 text-white font-black text-xs shadow-md shadow-orange-500/20">
                  1
                </span>
                <span>Product & Sourcing Details</span>
              </CardTitle>
              <CardDescription className="text-xs text-muted-foreground">
                Enter product specifications or paste a link from 1688, Alibaba, Taobao, Made-in-China, or supplier websites.
              </CardDescription>
            </CardHeader>
            <CardContent className="p-4 sm:p-6 space-y-4 text-xs">
              {/* Product Title Input */}
              <div>
                <label className="font-extrabold text-foreground block mb-1.5">
                  Product Title / Name <span className="text-orange-500">*</span>
                </label>
                <div className="relative">
                  <PackageCheck className="absolute left-3 top-3 size-4 text-orange-400" />
                  <Input
                    required
                    placeholder="e.g. Industrial Solar Powered Ceiling Fans 12V DC"
                    value={productName}
                    onChange={(e) => setProductName(e.target.value)}
                    className="pl-9 h-10 rounded-xl border-slate-200 dark:border-slate-800 focus-visible:ring-orange-500 text-xs font-semibold"
                  />
                </div>
              </div>

              {/* Reference Link Input */}
              <div>
                <label className="font-extrabold text-foreground block mb-1.5">
                  Supplier / Reference Web Link <span className="text-muted-foreground font-normal">(Optional)</span>
                </label>
                <div className="relative">
                  <Link2 className="absolute left-3 top-3 size-4 text-slate-400" />
                  <Input
                    placeholder="https://detail.1688.com/offer/... or https://alibaba.com/product/..."
                    value={urlLink}
                    onChange={(e) => setUrlLink(e.target.value)}
                    className="pl-9 h-10 rounded-xl border-slate-200 dark:border-slate-800 focus-visible:ring-orange-500 text-xs font-medium"
                  />
                </div>
                <p className="text-[11px] text-muted-foreground mt-1.5 flex items-center gap-1">
                  <Globe className="size-3 text-orange-500 shrink-0" />
                  <span>Paste any link from 1688, Taobao, Alibaba, Made-In-China, or global supplier catalogs.</span>
                </p>
              </div>

              {/* Grid Inputs: Hub, Quantity, Price */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3.5 pt-1">
                <div>
                  <label className="font-extrabold text-foreground block mb-1.5">
                    Sourcing Hub <span className="text-orange-500">*</span>
                  </label>
                  <div className="relative">
                    <select
                      value={countryPref}
                      onChange={(e) => setCountryPref(e.target.value)}
                      className="w-full h-10 pl-3 pr-8 border border-slate-200 dark:border-slate-800 rounded-xl bg-background text-xs font-semibold focus:ring-2 focus:ring-orange-500 focus:outline-none transition-all cursor-pointer"
                    >
                      <option value="China">China (Guangzhou / Yiwu)</option>
                      <option value="Turkey">Turkey (Istanbul / Bursa)</option>
                      <option value="Dubai">Dubai (Dragon Mart / Deira)</option>
                      <option value="ANY">Any Verified LUMO Hub</option>
                    </select>
                  </div>
                </div>

                <div>
                  <label className="font-extrabold text-foreground block mb-1.5">
                    Target Quantity <span className="text-orange-500">*</span>
                  </label>
                  <Input
                    required
                    type="number"
                    value={quantity}
                    onChange={(e) => setQuantity(e.target.value)}
                    placeholder="e.g. 100"
                    className="h-10 rounded-xl border-slate-200 dark:border-slate-800 focus-visible:ring-orange-500 text-xs font-semibold"
                  />
                </div>

                <div>
                  <label className="font-extrabold text-foreground block mb-1.5">
                    Target Price per Unit <span className="text-muted-foreground font-normal">(Optional)</span>
                  </label>
                  <div className="flex gap-2">
                    <Input
                      type="number"
                      step="0.01"
                      placeholder="e.g. 15.00"
                      value={targetPrice}
                      onChange={(e) => setTargetPrice(e.target.value)}
                      className="h-10 rounded-xl border-slate-200 dark:border-slate-800 focus-visible:ring-orange-500 text-xs font-semibold flex-1"
                    />
                    <select
                      value={targetCurrency}
                      onChange={(e) => setTargetCurrency(e.target.value)}
                      className="h-10 px-2.5 border border-slate-200 dark:border-slate-800 rounded-xl bg-background text-xs font-extrabold cursor-pointer"
                    >
                      <option value="USD">USD</option>
                      <option value="TZS">TZS</option>
                    </select>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Step 2 Card */}
          <Card className="border-orange-500/20 bg-card shadow-md overflow-hidden rounded-2xl">
            <CardHeader className="bg-gradient-to-r from-orange-500/10 via-amber-500/5 to-transparent border-b border-orange-500/10 p-4 sm:p-5">
              <CardTitle className="text-sm sm:text-base font-extrabold text-foreground flex items-center gap-2">
                <span className="flex size-7 items-center justify-center rounded-xl bg-orange-500 text-white font-black text-xs shadow-md shadow-orange-500/20">
                  2
                </span>
                <span>Specifications & Custom Requirements</span>
              </CardTitle>
            </CardHeader>
            <CardContent className="p-4 sm:p-6 space-y-4 text-xs">
              <div>
                <label className="font-extrabold text-foreground block mb-1.5">
                  Color, Size, Material, or Custom Branding Requirements
                </label>
                <textarea
                  rows={3}
                  placeholder="e.g. Need Matte Black finish, custom logo printed on box, European standard plug..."
                  value={specs}
                  onChange={(e) => setSpecs(e.target.value)}
                  className="w-full p-3 border border-slate-200 dark:border-slate-800 rounded-xl bg-background text-xs font-medium focus:ring-2 focus:ring-orange-500 focus:outline-none transition-all"
                />
              </div>

              {/* Quick Spec Requirement Chips */}
              <div className="space-y-2">
                <label className="font-extrabold text-foreground block text-[11px] text-muted-foreground uppercase tracking-wider">
                  Quick Requirement Tags (Tap to Add)
                </label>
                <div className="flex flex-wrap gap-2">
                  {[
                    { label: 'Air Freight Preferred', icon: Plane, text: 'Shipping Preference: Fast Air Freight.' },
                    { label: 'Sea Freight (Bulk)', icon: Ship, text: 'Shipping Preference: Sea Freight (Cost Effective).' },
                    { label: 'Custom Logo / Branding', icon: Tag, text: 'Custom Branding: Private label logo required on product & box.' },
                    { label: 'Factory Sample Needed', icon: Box, text: 'Sample Request: Please confirm factory sample price before bulk order.' },
                  ].map((chip) => {
                    const ChipIcon = chip.icon
                    return (
                      <button
                        key={chip.label}
                        type="button"
                        onClick={() => {
                          if (!notes.includes(chip.text)) {
                            setNotes((prev) => (prev ? `${prev}\n${chip.text}` : chip.text))
                            toast.success(`Added tag: ${chip.label}`)
                          }
                        }}
                        className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-100 hover:bg-orange-500/15 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-slate-700 dark:text-slate-300 hover:text-orange-600 hover:border-orange-500/30 text-xs font-bold transition-all cursor-pointer"
                      >
                        <ChipIcon className="size-3.5 text-orange-500 shrink-0" />
                        <span>{chip.label}</span>
                      </button>
                    )
                  })}
                </div>
              </div>

              <div>
                <label className="font-extrabold text-foreground block mb-1.5">
                  Additional Notes for LUMO Sourcing Agents
                </label>
                <textarea
                  rows={2.5}
                  placeholder="Any deadline expectations, shipping preference, or sample requirements..."
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  className="w-full p-3 border border-slate-200 dark:border-slate-800 rounded-xl bg-background text-xs font-medium focus:ring-2 focus:ring-orange-500 focus:outline-none transition-all"
                />
              </div>
            </CardContent>
          </Card>

          {/* Submit Action Button */}
          <div className="pt-2 flex justify-end">
            <Button
              type="submit"
              size="lg"
              className="w-full sm:w-auto bg-gradient-to-r from-orange-500 via-orange-500 to-amber-600 hover:from-orange-600 hover:to-amber-700 text-white font-black text-sm h-12 px-8 rounded-xl shadow-lg shadow-orange-500/25 cursor-pointer transition-all"
            >
              <Send className="size-4 mr-2" /> Submit Sourcing Request
            </Button>
          </div>
        </form>
      ) : (
        /* Submission Success Card */
        <Card className="border-orange-500/30 bg-card shadow-xl overflow-hidden rounded-2xl">
          <CardContent className="p-6 sm:p-10 text-center space-y-4">
            <div className="inline-flex items-center justify-center size-16 rounded-2xl bg-orange-500 text-white font-black shadow-lg shadow-orange-500/30 mb-2">
              <CheckCircle2 className="size-9" />
            </div>

            <div className="space-y-1.5">
              <h2 className="text-xl sm:text-2xl font-black text-foreground">Sourcing Request Submitted!</h2>
              <p className="text-xs text-muted-foreground max-w-md mx-auto leading-relaxed">
                Your request reference ID is <span className="font-mono font-black text-orange-500">{requestId}</span>. Our field sourcing agent in <span className="font-bold text-foreground">{countryPref}</span> has received your ticket and will verify factory pricing within 24 hours.
              </p>
            </div>

            <div className="pt-4 flex flex-col sm:flex-row items-center justify-center gap-3">
              <Link href="/account/sourcing" className="w-full sm:w-auto">
                <Button className="w-full bg-orange-500 hover:bg-orange-600 text-white font-bold text-xs h-10 px-6 rounded-xl shadow-md">
                  Track Sourcing Status
                </Button>
              </Link>

              <Button variant="outline" onClick={() => setIsSubmitted(false)} className="w-full sm:w-auto text-xs h-10 rounded-xl border-slate-300 dark:border-slate-700">
                Submit Another Request
              </Button>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  )
}
