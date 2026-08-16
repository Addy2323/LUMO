'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { toast } from 'sonner'
import {
  ArrowLeft,
  Building2,
  CheckCircle2,
  DollarSign,
  FileText,
  Globe,
  HelpCircle,
  Image as ImageIcon,
  Link2,
  PackageCheck,
  Send,
  Sparkles,
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
    <div className="max-w-4xl mx-auto py-8 px-4 sm:px-6">
      {/* Auth Required Modal Card Popup */}
      <AuthRequiredModal
        open={showAuthModal}
        onOpenChange={setShowAuthModal}
        title="Sign In to Submit Sourcing Request"
        description="Please you must register or login to submit your request."
        redirectUrl="/sourcing/request"
      />

      {/* Header */}
      <div className="flex items-center gap-3 mb-6">
        <Button variant="ghost" size="sm" render={<Link href="/marketplace" />}>
          <ArrowLeft className="size-4 mr-1" /> Marketplace
        </Button>
        <div>
          <h1 className="text-2xl font-extrabold tracking-tight text-foreground">Global Product Sourcing Request</h1>
          <p className="text-xs text-muted-foreground">
            Can't find a product in our catalog? Our field procurement agents in China, Dubai, and Turkey will source it direct from verified factory floors for you.
          </p>
        </div>
      </div>

      {!isSubmitted ? (
        <form onSubmit={handleSubmit} className="space-y-6">
          <Card className="border-brand-200">
            <CardHeader className="bg-brand-50/50">
              <CardTitle className="text-base font-bold text-brand-900 flex items-center gap-2">
                <Sparkles className="size-4 text-brand-600" />
                1. Product & Sourcing Details
              </CardTitle>
              <CardDescription className="text-xs">
                Provide product specifications or paste a link from 1688, Alibaba, Taobao, Made-in-China, Amazon, or supplier websites.
              </CardDescription>
            </CardHeader>
            <CardContent className="p-6 space-y-4 text-xs">
              <div>
                <label className="font-bold block mb-1">Product Title / Name *</label>
                <Input
                  required
                  placeholder="e.g. Industrial Solar Powered Ceiling Fans 12V DC"
                  value={productName}
                  onChange={(e) => setProductName(e.target.value)}
                />
              </div>

              <div>
                <label className="font-bold block mb-1">Supplier / Reference Web Link (Optional)</label>
                <div className="relative">
                  <Link2 className="absolute left-2.5 top-2.5 size-4 text-muted-foreground" />
                  <Input
                    placeholder="https://detail.1688.com/offer/... or https://alibaba.com/product/..."
                    value={urlLink}
                    onChange={(e) => setUrlLink(e.target.value)}
                    className="pl-8"
                  />
                </div>
                <p className="text-[11px] text-muted-foreground mt-1">
                  You can paste any URL from 1688, Taobao, Alibaba, Made-In-China, or any global supplier catalog.
                </p>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div>
                  <label className="font-bold block mb-1">Preferred Sourcing Hub *</label>
                  <select
                    value={countryPref}
                    onChange={(e) => setCountryPref(e.target.value)}
                    className="w-full p-2 border rounded-md bg-background text-xs"
                  >
                    <option value="China">China (Guangzhou / Yiwu / Shenzhen)</option>
                    <option value="Turkey">Turkey (Istanbul / Bursa / Izmir)</option>
                    <option value="Dubai">Dubai (Dragon Mart / Deira)</option>
                    <option value="ANY">Any Verified LUMO Sourcing Hub</option>
                  </select>
                </div>

                <div>
                  <label className="font-bold block mb-1">Target Quantity Needed *</label>
                  <Input
                    required
                    type="number"
                    value={quantity}
                    onChange={(e) => setQuantity(e.target.value)}
                    placeholder="e.g. 100"
                  />
                </div>

                <div>
                  <label className="font-bold block mb-1">Target Price per Unit (Optional)</label>
                  <div className="flex gap-2">
                    <Input
                      type="number"
                      step="0.01"
                      placeholder="e.g. 15.00"
                      value={targetPrice}
                      onChange={(e) => setTargetPrice(e.target.value)}
                    />
                    <select
                      value={targetCurrency}
                      onChange={(e) => setTargetCurrency(e.target.value)}
                      className="p-2 border rounded-md bg-background text-xs"
                    >
                      <option value="USD">USD</option>
                      <option value="TZS">TZS</option>
                    </select>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-base font-bold flex items-center gap-2">
                <FileText className="size-4 text-brand-600" />
                2. Specifications & Custom Requirements
              </CardTitle>
            </CardHeader>
            <CardContent className="p-6 space-y-4 text-xs">
              <div>
                <label className="font-bold block mb-1">Color, Size, Material, or Custom Branding Requirements</label>
                <textarea
                  rows={3}
                  placeholder="e.g. Need Matte Black finish, custom logo printed on box, European standard plug..."
                  value={specs}
                  onChange={(e) => setSpecs(e.target.value)}
                  className="w-full p-2.5 border rounded-md bg-background text-xs"
                />
              </div>

              <div>
                <label className="font-bold block mb-1">Additional Notes for LUMO Sourcing Agents</label>
                <textarea
                  rows={2}
                  placeholder="Any deadline expectations, shipping preference (Air vs Sea Freight), or sample requirements..."
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  className="w-full p-2.5 border rounded-md bg-background text-xs"
                />
              </div>
            </CardContent>
          </Card>

          <div className="flex justify-end">
            <Button type="submit" size="lg" className="bg-[#FF6B00] hover:bg-[#E85F00] text-white font-bold gap-2 px-8 shadow-lg shadow-orange-500/20 cursor-pointer">
              <Send className="size-4" /> Submit Sourcing Request
            </Button>
          </div>
        </form>
      ) : (
        /* Submission Success Card */
        <Card className="border-success-200 bg-success-50/40">
          <CardContent className="p-8 text-center space-y-4">
            <div className="inline-flex items-center justify-center size-16 rounded-full bg-success-100 text-success-600 mb-2">
              <CheckCircle2 className="size-10" />
            </div>

            <h2 className="text-2xl font-extrabold text-foreground">Sourcing Request Submitted!</h2>
            <p className="text-xs text-muted-foreground max-w-lg mx-auto">
              Your request ID is <span className="font-mono font-bold text-brand-600">{requestId}</span>. Our dedicated field sourcing agent in <span className="font-bold text-foreground">{countryPref}</span> has received your ticket and will verify factory pricing within 24 hours.
            </p>

            <div className="pt-4 flex flex-wrap items-center justify-center gap-3">
              <Button render={<Link href="/account/sourcing" />} className="bg-brand-600 hover:bg-brand-700 text-white text-xs">
                Track Sourcing Status
              </Button>

              <Button variant="outline" onClick={() => setIsSubmitted(false)} className="text-xs">
                Submit Another Request
              </Button>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  )
}
