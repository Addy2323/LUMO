'use client'

import { useState, useRef } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { toast } from 'sonner'
import {
  Anchor,
  ArrowLeft,
  ArrowRight,
  Check,
  CheckCircle2,
  Copy,
  FileText,
  Globe,
  HelpCircle,
  Info,
  Link2,
  Package,
  PackageCheck,
  Plane,
  Search,
  ShieldCheck,
  Sparkles,
  Truck,
  Upload,
  X,
} from 'lucide-react'
import { PublicShell } from '@/components/shell/public-shell'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { useSourcingStore } from '@/lib/stores/sourcing-store'
import { useAgentStore } from '@/lib/stores/agent-store'
import { useSessionStore } from '@/lib/stores/session-store'

type StepId = 1 | 2 | 3 | 4 | 5

const STEPS = [
  { id: 1, title: 'Identify Product', icon: Search },
  { id: 2, title: 'Specifications', icon: FileText },
  { id: 3, title: 'Commercial', icon: Globe },
  { id: 4, title: 'Delivery', icon: Truck },
  { id: 5, title: 'Review', icon: Check },
]

type DemoPreset = {
  label: string
  url: string
  name: string
  brand: string
  model: string
  description: string
  quantity: number
  color: string
  size: string
  budget: string
  shipping: 'express_air' | 'standard_air' | 'sea'
}

const DEMO_PRESETS: DemoPreset[] = [
  {
    label: '1688 Solar Generator',
    url: 'https://detail.1688.com/offer/7421890123.html',
    name: '500W Portable Solar Power Station',
    brand: 'Yexing Solar Tech',
    model: 'YX-500W-PRO',
    description: 'Foldable 100W solar panel + 500Wh lithium battery station with 220V AC output.',
    quantity: 10,
    color: 'Matte Black',
    size: '42 x 28 x 20 cm (4.5 kg)',
    budget: '1,620,000',
    shipping: 'standard_air',
  },
  {
    label: 'Alibaba Smartwatch',
    url: 'https://www.alibaba.com/product-detail/Series-9-Ultra_1601880490.html',
    name: 'Series 9 Ultra Smart Watch 256GB',
    brand: 'HK Tech',
    model: 'HK9-ULTRA-2',
    description: 'AMOLED display, heart rate monitor, IP68 waterproof, wireless charging.',
    quantity: 50,
    color: 'Titanium Grey',
    size: '49mm Dial',
    budget: '1,170,000',
    shipping: 'express_air',
  },
  {
    label: 'Taobao Commercial Mixer',
    url: 'https://item.taobao.com/item.htm?id=689102481923',
    name: '20L Commercial Stainless Steel Dough Mixer',
    brand: 'Baozi Master',
    model: 'BM-20L-3SPD',
    description: '20 Liter heavy duty dough mixer, 1.5kW copper motor, 3-speed gear system.',
    quantity: 2,
    color: 'Stainless Steel',
    size: '75 x 50 x 85 cm (28 kg)',
    budget: '864,000',
    shipping: 'sea',
  },
]

export default function PasteLinkSourcingPage() {
  const router = useRouter()
  const [currentStep, setCurrentStep] = useState<StepId>(1)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [submitted, setSubmitted] = useState(false)

  // Form State
  const [productLink, setProductLink] = useState('')
  const [productName, setProductName] = useState('')
  const [description, setDescription] = useState('')
  
  // Real File Upload State & Handlers
  const fileInputRef = useRef<HTMLInputElement>(null)
  const [uploadedFile, setUploadedFile] = useState<File | null>(null)
  const [uploadedFileName, setUploadedFileName] = useState<string | null>(null)
  const [isDragging, setIsDragging] = useState(false)
  const [imagePreview, setImagePreview] = useState<string | null>(null)

  function handleFileChange(files: FileList | null) {
    if (!files || files.length === 0) return
    const file = files[0]
    if (file.size > 20 * 1024 * 1024) {
      toast.error('File size exceeds 20MB limit')
      return
    }
    setUploadedFile(file)
    setUploadedFileName(file.name)
    if (file.type.startsWith('image/')) {
      const reader = new FileReader()
      reader.onload = (e) => setImagePreview(e.target?.result as string)
      reader.readAsDataURL(file)
    } else {
      setImagePreview(null)
    }
    toast.success(`File attached: ${file.name}`)
  }

  function handleDragOver(e: React.DragEvent) {
    e.preventDefault()
    setIsDragging(true)
  }

  function handleDragLeave(e: React.DragEvent) {
    e.preventDefault()
    setIsDragging(false)
  }

  function handleDrop(e: React.DragEvent) {
    e.preventDefault()
    setIsDragging(false)
    handleFileChange(e.dataTransfer.files)
  }

  function handleRemoveFile(e: React.MouseEvent) {
    e.stopPropagation()
    setUploadedFile(null)
    setUploadedFileName(null)
    setImagePreview(null)
    if (fileInputRef.current) fileInputRef.current.value = ''
    toast.info('Attachment removed')
  }

  // Specs State
  const [brand, setBrand] = useState('')
  const [modelNumber, setModelNumber] = useState('')
  const [color, setColor] = useState('')
  const [sizeDimensions, setSizeDimensions] = useState('')
  const [techSpecs, setTechSpecs] = useState('')
  const [quantity, setQuantity] = useState(1)

  // Commercial State
  const [currency, setCurrency] = useState('TZS')
  const [budget, setBudget] = useState('')
  const [requiredDate, setRequiredDate] = useState('')

  // Delivery State
  const [destination, setDestination] = useState('Dar es Salaam')
  const [shippingMethod, setShippingMethod] = useState<'express_air' | 'standard_air' | 'sea'>('standard_air')
  const [addInsurance, setAddInsurance] = useState(true)
  const [inspectionRequired, setInspectionRequired] = useState(true)

  // Terms State
  const [agreedTerms, setAgreedTerms] = useState(false)

  function handleQuickPreset(preset: DemoPreset) {
    setProductLink(preset.url)
    setProductName(preset.name)
    setBrand(preset.brand)
    setModelNumber(preset.model)
    setDescription(preset.description)
    setQuantity(preset.quantity)
    setColor(preset.color)
    setSizeDimensions(preset.size)
    setBudget(preset.budget)
    setShippingMethod(preset.shipping)
  }

  function handleNext() {
    if (currentStep < 5) {
      setCurrentStep((prev) => (prev + 1) as StepId)
      window.scrollTo({ top: 0, behavior: 'smooth' })
    }
  }

  function handleBack() {
    if (currentStep > 1) {
      setCurrentStep((prev) => (prev - 1) as StepId)
      window.scrollTo({ top: 0, behavior: 'smooth' })
    }
  }

  const [submittedRef, setSubmittedRef] = useState<string>('SR-412')

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setIsSubmitting(true)
    
    try {
      const parsedBudget = parseFloat(budget.replace(/[^0-9.]/g, '')) || 1000000
      const sessionUser = useSessionStore.getState().user
      const custName = sessionUser?.fullName || 'Amina Hassan'
      const custEmail = sessionUser?.email || 'amina.hassan@example.co.tz'

      const ref = useSourcingStore.getState().addRequest({
        customerName: custName,
        customerEmail: custEmail,
        productName: productName || 'Custom Sourced Product',
        productLink,
        description,
        brand,
        modelNumber,
        color,
        sizeDimensions,
        techSpecs,
        quantity,
        targetBudget: parsedBudget,
        currency: currency || 'TZS',
        region: destination || 'Dar es Salaam',
        destination,
        shippingMethod,
        addInsurance,
        inspectionRequired,
        documentFile: uploadedFile,
      })
      // Automatically dispatch order to Agent Portal Hub
      useAgentStore.getState().addOrder({
        orderNumber: ref,
        customerName: custName,
        productName: productName || 'Custom Sourced Product',
        quantityNeeded: quantity,
        targetBudgetUSD: Math.round(parsedBudget / 2600) || 1000,
        destinationRegion: destination || 'Dar es Salaam',
        destinationCountry: 'Tanzania',
        assignedCountry: 'China',
        priority: 'High',
      })

      setSubmittedRef(ref)
      toast.success(`Sourcing Request ${ref} created successfully!`)
    } catch (err) {
      console.error(err)
    }

    setTimeout(() => {
      setIsSubmitting(false)
      setSubmitted(true)
    }, 600)
  }

  return (
    <PublicShell>
      <div className="mx-auto max-w-3xl px-4 py-6 sm:px-6">
        {/* Header Navigation Bar */}
        <div className="flex items-center gap-4 mb-6">
          <Button
            variant="ghost"
            size="icon"
            onClick={handleBack}
            disabled={currentStep === 1 || submitted}
            className="rounded-full"
          >
            <ArrowLeft className="size-5" />
          </Button>
          <div>
            <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
              Step {currentStep} of 5
            </span>
            <h1 className="text-2xl font-serif font-bold text-foreground">Smart Product Request</h1>
          </div>
        </div>

        {/* Responsive Stepper Progress Bar */}
        <div className="mb-6 space-y-2">
          <div className="relative w-full">
            {/* Background Track Line */}
            <div className="absolute top-4 left-4 right-4 h-0.5 bg-border z-0" />
            {/* Active Progress Line */}
            <div
              className="absolute top-4 left-4 h-0.5 bg-primary z-0 transition-all duration-300"
              style={{
                width: `calc(${((currentStep - 1) / (STEPS.length - 1)) * 100}% - 2rem * ${(currentStep - 1) / (STEPS.length - 1)})`,
              }}
            />

            <div className="grid grid-cols-5 relative z-10 w-full">
              {STEPS.map((step) => {
                const isCompleted = currentStep > step.id
                const isCurrent = currentStep === step.id
                const StepIcon = step.icon

                return (
                  <div key={step.id} className="flex flex-col items-center">
                    <button
                      type="button"
                      onClick={() => {
                        if (step.id < currentStep) setCurrentStep(step.id as StepId)
                      }}
                      className={`size-8 sm:size-9 rounded-full flex items-center justify-center transition-all ${
                        isCompleted
                          ? 'bg-primary text-white shadow'
                          : isCurrent
                          ? 'bg-primary text-white ring-4 ring-primary/25 shadow scale-110'
                          : 'bg-card text-muted-foreground border border-border'
                      }`}
                    >
                      {isCompleted ? <Check className="size-4 sm:size-5 stroke-[3]" /> : <StepIcon className="size-3.5 sm:size-4" />}
                    </button>

                    {/* Step Label: Hidden on tiny screens, visible on sm and up */}
                    <span
                      className={`text-[10px] sm:text-[11px] font-medium mt-1.5 text-center transition-colors hidden sm:block ${
                        isCurrent ? 'font-bold text-foreground' : 'text-muted-foreground'
                      }`}
                    >
                      {step.title}
                    </span>
                  </div>
                )
              })}
            </div>
          </div>

          {/* Mobile Active Step Subtitle Label */}
          <div className="sm:hidden flex items-center justify-between text-xs font-bold text-foreground px-3 py-2 rounded-xl bg-muted/40 border border-border">
            <span className="text-primary font-extrabold flex items-center gap-1.5">
              <Sparkles className="size-3.5" />
              {STEPS[currentStep - 1].title}
            </span>
            <span className="text-muted-foreground text-[11px]">Step {currentStep} of 5</span>
          </div>
        </div>

        {/* Main Step Card Form */}
        {submitted ? (
          <Card className="border-primary/30 shadow-xl bg-card">
            <CardContent className="p-8 text-center space-y-4">
              <div className="size-16 rounded-full bg-primary/10 text-primary flex items-center justify-center mx-auto shadow-inner">
                <CheckCircle2 className="size-10" />
              </div>
              <h2 className="text-xl font-bold text-foreground">Sourcing Request Submitted!</h2>
              <p className="text-sm text-muted-foreground max-w-md mx-auto leading-relaxed">
                Your request for <strong>{productName || 'Custom Product'}</strong> has been assigned to Lumo Guangzhou Sourcing Officers. You will receive an all-inclusive landed TZS quotation within 2 hours.
              </p>
              <div className="pt-4 flex items-center justify-center gap-3">
                <Button
                  variant="outline"
                  onClick={() => {
                    setSubmitted(false)
                    setCurrentStep(1)
                  }}
                >
                  Create Another Request
                </Button>
                <Button
                  className="bg-primary hover:bg-primary/90 text-primary-foreground font-bold"
                  render={<Link href="/account/sourcing" />}
                >
                  View My Sourcing Queue ({submittedRef})
                </Button>
              </div>
            </CardContent>
          </Card>
        ) : (
          <Card className="border-border shadow-lg rounded-2xl bg-card overflow-hidden">
            <CardContent className="p-6 sm:p-8 space-y-6">
              {/* STEP 1: IDENTIFY PRODUCT */}
              {currentStep === 1 && (
                <div className="space-y-5">
                  <div>
                    <h3 className="text-lg font-bold text-foreground">Identify Product</h3>
                    <p className="text-xs text-muted-foreground mt-0.5">
                      Tell us what product you need. A link, image, or description is enough to get started.
                    </p>
                  </div>

                  {/* Preset Quick Fill */}
                  <div className="flex flex-wrap items-center gap-2 pt-1 pb-2 border-b">
                    <span className="text-xs font-semibold text-muted-foreground">Demo Presets:</span>
                    {DEMO_PRESETS.map((preset) => (
                      <button
                        key={preset.label}
                        type="button"
                        onClick={() => handleQuickPreset(preset)}
                        className="text-xs px-2.5 py-1 rounded-full bg-muted/60 hover:bg-muted text-foreground border border-border transition-colors font-medium"
                      >
                        <Copy className="inline size-3 mr-1" />
                        {preset.label}
                      </button>
                    ))}
                  </div>

                  {/* Product Link Input */}
                  <div>
                    <label className="text-xs font-bold text-foreground flex items-center gap-1.5">
                      <Link2 className="size-4 text-emerald-700" />
                      Product Link <span className="text-muted-foreground font-normal">(optional)</span>
                    </label>
                    <Input
                      value={productLink}
                      onChange={(e) => setProductLink(e.target.value)}
                      placeholder="https://detail.1688.com/offer/... or https://www.alibaba.com/product-detail/..."
                      className="mt-1.5 h-11 text-sm font-mono"
                    />
                  </div>

                  <div className="relative flex items-center justify-center my-2">
                    <div className="absolute inset-0 flex items-center">
                      <div className="w-full border-t border-border" />
                    </div>
                    <span className="relative bg-card px-3 text-[11px] font-medium text-muted-foreground uppercase">
                      or describe the product
                    </span>
                  </div>

                  {/* Product Name */}
                  <div>
                    <label className="text-xs font-bold text-foreground">
                      Product Name <span className="text-destructive">*</span>
                    </label>
                    <Input
                      required
                      value={productName}
                      onChange={(e) => setProductName(e.target.value)}
                      placeholder="e.g. Samsung Galaxy S24 FE 256GB or 500W Portable Solar Station"
                      className="mt-1.5 h-11 text-sm font-medium"
                    />
                  </div>

                  {/* Description */}
                  <div>
                    <label className="text-xs font-bold text-foreground">Description</label>
                    <Textarea
                      rows={3}
                      value={description}
                      onChange={(e) => setDescription(e.target.value)}
                      placeholder="Describe the product, its purpose, and any specific requirements..."
                      className="mt-1.5 text-xs leading-relaxed"
                    />
                  </div>

                  {/* File Upload Dropzone */}
                  <div>
                    <label className="text-xs font-bold text-foreground">Upload Image or Document</label>
                    <input
                      ref={fileInputRef}
                      type="file"
                      accept="image/*,.pdf,.doc,.docx"
                      onChange={(e) => handleFileChange(e.target.files)}
                      className="hidden"
                    />
                    <div
                      onClick={() => fileInputRef.current?.click()}
                      onDragOver={handleDragOver}
                      onDragLeave={handleDragLeave}
                      onDrop={handleDrop}
                      className={`mt-1.5 border-2 border-dashed rounded-2xl p-6 text-center cursor-pointer transition-all ${
                        isDragging
                          ? 'border-primary bg-primary/10 ring-4 ring-primary/20'
                          : uploadedFileName || uploadedFile
                          ? 'border-primary bg-primary/5 text-foreground'
                          : 'border-border hover:border-primary/50 bg-muted/20'
                      }`}
                    >
                      {uploadedFileName || uploadedFile ? (
                        <div className="flex items-center justify-between gap-4">
                          <div className="flex items-center gap-3 text-left overflow-hidden">
                            {imagePreview ? (
                              <img src={imagePreview} alt="Preview" className="size-12 rounded-lg object-cover shrink-0 border" />
                            ) : (
                              <div className="size-12 rounded-lg bg-primary/10 text-primary flex items-center justify-center shrink-0">
                                <FileText className="size-6" />
                              </div>
                            )}
                            <div className="truncate">
                              <p className="text-xs font-bold text-foreground truncate">
                                {uploadedFile ? uploadedFile.name : uploadedFileName}
                              </p>
                              <p className="text-[11px] text-muted-foreground font-mono mt-0.5">
                                {uploadedFile ? `${(uploadedFile.size / (1024 * 1024)).toFixed(2)} MB · ` : ''}
                                {uploadedFile?.type || 'Attached Document'}
                              </p>
                            </div>
                          </div>
                          <Button
                            type="button"
                            variant="ghost"
                            size="sm"
                            onClick={handleRemoveFile}
                            className="text-destructive hover:bg-destructive/10 shrink-0 rounded-full"
                          >
                            <X className="size-4 mr-1" />
                            Remove
                          </Button>
                        </div>
                      ) : (
                        <>
                          <Upload className="size-8 text-muted-foreground mx-auto mb-2" />
                          <p className="text-xs font-bold text-foreground">
                            {isDragging ? 'Drop file to upload' : 'Click to select a file or drag & drop here'}
                          </p>
                          <p className="text-[11px] text-muted-foreground mt-0.5">
                            JPG, PNG, PDF, DOCX up to 20MB
                          </p>
                        </>
                      )}
                    </div>
                  </div>
                </div>
              )}

              {/* STEP 2: SPECIFICATIONS */}
              {currentStep === 2 && (
                <div className="space-y-5">
                  <div>
                    <h3 className="text-lg font-bold text-foreground">Specifications</h3>
                    <p className="text-xs text-muted-foreground mt-0.5">
                      Provide technical specifications so we can source exactly what you need.
                    </p>
                  </div>

                  <div className="grid sm:grid-cols-2 gap-4">
                    <div>
                      <label className="text-xs font-bold text-foreground">Brand</label>
                      <Input
                        value={brand}
                        onChange={(e) => setBrand(e.target.value)}
                        placeholder="e.g. Samsung, Apple, LG, Yexing Tech"
                        className="mt-1.5 h-11 text-xs"
                      />
                    </div>
                    <div>
                      <label className="text-xs font-bold text-foreground">Model / Part Number</label>
                      <Input
                        value={modelNumber}
                        onChange={(e) => setModelNumber(e.target.value)}
                        placeholder="e.g. SM-S721B or YX-500W"
                        className="mt-1.5 h-11 text-xs"
                      />
                    </div>
                  </div>

                  <div className="grid sm:grid-cols-2 gap-4">
                    <div>
                      <label className="text-xs font-bold text-foreground">Colour</label>
                      <Input
                        value={color}
                        onChange={(e) => setColor(e.target.value)}
                        placeholder="e.g. Phantom Black, Matte Grey"
                        className="mt-1.5 h-11 text-xs"
                      />
                    </div>
                    <div>
                      <label className="text-xs font-bold text-foreground">Size / Dimensions</label>
                      <Input
                        value={sizeDimensions}
                        onChange={(e) => setSizeDimensions(e.target.value)}
                        placeholder='e.g. 128GB, XL, 55", 42x28 cm'
                        className="mt-1.5 h-11 text-xs"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="text-xs font-bold text-foreground">Technical Specifications</label>
                    <Textarea
                      rows={3}
                      value={techSpecs}
                      onChange={(e) => setTechSpecs(e.target.value)}
                      placeholder="List any specific technical requirements, voltage, frequency, certifications, or standards required..."
                      className="mt-1.5 text-xs leading-relaxed"
                    />
                  </div>

                  <div>
                    <label className="text-xs font-bold text-foreground">
                      Quantity <span className="text-destructive">*</span>
                    </label>
                    <Input
                      type="number"
                      min="1"
                      value={quantity}
                      onChange={(e) => setQuantity(Math.max(1, Number(e.target.value)))}
                      className="mt-1.5 h-11 w-32 font-bold font-mono text-sm"
                    />
                  </div>
                </div>
              )}

              {/* STEP 3: COMMERCIAL */}
              {currentStep === 3 && (
                <div className="space-y-5">
                  <div>
                    <h3 className="text-lg font-bold text-foreground">Commercial</h3>
                    <p className="text-xs text-muted-foreground mt-0.5">
                      Help us focus the sourcing within your commercial requirements.
                    </p>
                  </div>

                  <div>
                    <label className="text-xs font-bold text-foreground">Budget (maximum you would like to pay)</label>
                    <div className="flex gap-2 mt-1.5">
                      <select
                        value={currency}
                        onChange={(e) => setCurrency(e.target.value)}
                        className="h-11 px-3 rounded-lg border border-input bg-card text-xs font-bold text-foreground"
                      >
                        <option value="TZS">TZS</option>
                        <option value="USD">USD</option>
                        <option value="RMB">RMB</option>
                      </select>
                      <Input
                        value={budget}
                        onChange={(e) => setBudget(e.target.value)}
                        placeholder="Enter your budget"
                        className="h-11 text-sm font-mono font-bold flex-1"
                      />
                    </div>
                    <p className="text-[11px] text-muted-foreground mt-1">
                      This helps us focus sourcing within your range. Final quotation may vary based on availability.
                    </p>
                  </div>

                  <div>
                    <label className="text-xs font-bold text-foreground">Required By (Date)</label>
                    <Input
                      type="date"
                      value={requiredDate}
                      onChange={(e) => setRequiredDate(e.target.value)}
                      className="mt-1.5 h-11 text-xs"
                    />
                  </div>

                  {/* Lumo Info Callout */}
                  <div className="p-4 rounded-xl bg-primary/5 border border-primary/20 text-xs text-foreground flex items-start gap-3">
                    <Info className="size-5 text-primary shrink-0 mt-0.5" />
                    <p className="leading-relaxed text-muted-foreground">
                      LUMO will prepare a comprehensive quotation including product cost, sourcing fee, inspection, shipping, insurance, customs, local delivery, and expected Lumo Rewards. All charges will be clearly itemized.
                    </p>
                  </div>
                </div>
              )}

              {/* STEP 4: DELIVERY */}
              {currentStep === 4 && (
                <div className="space-y-5">
                  <div>
                    <h3 className="text-lg font-bold text-foreground">Delivery</h3>
                    <p className="text-xs text-muted-foreground mt-0.5">
                      Choose how and where you want your product delivered.
                    </p>
                  </div>

                  <div>
                    <label className="text-xs font-bold text-foreground">Delivery Destination</label>
                    <select
                      value={destination}
                      onChange={(e) => setDestination(e.target.value)}
                      className="mt-1.5 w-full h-11 px-3 rounded-lg border border-input bg-card text-xs font-bold text-foreground"
                    >
                      <option value="Dar es Salaam">Dar es Salaam</option>
                      <option value="Arusha">Arusha</option>
                      <option value="Mwanza">Mwanza</option>
                      <option value="Dodoma">Dodoma</option>
                      <option value="Zanzibar">Zanzibar</option>
                      <option value="Tanga">Tanga</option>
                    </select>
                  </div>

                  <div>
                    <label className="text-xs font-bold text-foreground">Preferred Shipping Method</label>
                    <div className="space-y-2.5 mt-2">
                      <label
                        onClick={() => setShippingMethod('express_air')}
                        className={`flex items-center justify-between p-3.5 rounded-xl border cursor-pointer transition-all ${
                          shippingMethod === 'express_air'
                            ? 'border-primary bg-primary/5 font-bold'
                            : 'border-border hover:bg-muted/40'
                        }`}
                      >
                        <div className="flex items-center gap-3">
                          <input
                            type="radio"
                            name="shipping"
                            checked={shippingMethod === 'express_air'}
                            onChange={() => setShippingMethod('express_air')}
                            className="accent-primary size-4"
                          />
                          <div>
                            <span className="text-xs font-bold text-foreground block">Express Air</span>
                            <span className="text-[11px] text-muted-foreground font-normal">7–14 days</span>
                          </div>
                        </div>
                        <span className="text-xs text-muted-foreground font-medium">Higher cost</span>
                      </label>

                      <label
                        onClick={() => setShippingMethod('standard_air')}
                        className={`flex items-center justify-between p-3.5 rounded-xl border cursor-pointer transition-all ${
                          shippingMethod === 'standard_air'
                            ? 'border-primary bg-primary/5 font-bold'
                            : 'border-border hover:bg-muted/40'
                        }`}
                      >
                        <div className="flex items-center gap-3">
                          <input
                            type="radio"
                            name="shipping"
                            checked={shippingMethod === 'standard_air'}
                            onChange={() => setShippingMethod('standard_air')}
                            className="accent-primary size-4"
                          />
                          <div>
                            <span className="text-xs font-bold text-foreground block">Standard Air</span>
                            <span className="text-[11px] text-muted-foreground font-normal">14–21 days</span>
                          </div>
                        </div>
                        <span className="text-xs text-muted-foreground font-medium">Moderate cost</span>
                      </label>

                      <label
                        onClick={() => setShippingMethod('sea')}
                        className={`flex items-center justify-between p-3.5 rounded-xl border cursor-pointer transition-all ${
                          shippingMethod === 'sea'
                            ? 'border-primary bg-primary/5 font-bold'
                            : 'border-border hover:bg-muted/40'
                        }`}
                      >
                        <div className="flex items-center gap-3">
                          <input
                            type="radio"
                            name="shipping"
                            checked={shippingMethod === 'sea'}
                            onChange={() => setShippingMethod('sea')}
                            className="accent-primary size-4"
                          />
                          <div>
                            <span className="text-xs font-bold text-foreground block">Sea Freight</span>
                            <span className="text-[11px] text-muted-foreground font-normal">30–60 days</span>
                          </div>
                        </div>
                        <span className="text-xs text-muted-foreground font-medium">Most economical</span>
                      </label>
                    </div>
                  </div>

                  <div className="space-y-3 pt-2">
                    <label className="flex items-start gap-3 p-3.5 rounded-xl border border-border cursor-pointer hover:bg-muted/30">
                      <input
                        type="checkbox"
                        checked={addInsurance}
                        onChange={(e) => setAddInsurance(e.target.checked)}
                        className="mt-0.5 accent-primary size-4 rounded"
                      />
                      <div>
                        <span className="text-xs font-bold text-foreground block">Add Shipment Insurance</span>
                        <span className="text-[11px] text-muted-foreground leading-relaxed block">
                          Protect your goods during international transit
                        </span>
                      </div>
                    </label>

                    <label className="flex items-start gap-3 p-3.5 rounded-xl border border-border cursor-pointer hover:bg-muted/30">
                      <input
                        type="checkbox"
                        checked={inspectionRequired}
                        onChange={(e) => setInspectionRequired(e.target.checked)}
                        className="mt-0.5 accent-primary size-4 rounded"
                      />
                      <div>
                        <span className="text-xs font-bold text-foreground block">Pre-Shipment Inspection Required</span>
                        <span className="text-[11px] text-muted-foreground leading-relaxed block">
                          We verify your product before it leaves the origin warehouse
                        </span>
                      </div>
                    </label>
                  </div>
                </div>
              )}

              {/* STEP 5: REVIEW */}
              {currentStep === 5 && (
                <div className="space-y-5">
                  <div>
                    <h3 className="text-lg font-bold text-foreground">Review</h3>
                    <p className="text-xs text-muted-foreground mt-0.5">
                      Review your request before submitting. You can edit any section before sending.
                    </p>
                  </div>

                  {/* Summary Table */}
                  <div className="space-y-4 rounded-xl border border-border p-4 bg-muted/20">
                    <div>
                      <span className="text-[11px] font-bold text-muted-foreground uppercase tracking-wider block mb-2">
                        PRODUCT
                      </span>
                      <div className="grid grid-cols-2 gap-2 text-xs py-1 border-b border-border">
                        <span className="text-muted-foreground">Product Name</span>
                        <span className="font-semibold text-foreground text-right">{productName || '—'}</span>
                      </div>
                      <div className="grid grid-cols-2 gap-2 text-xs py-1 border-b border-border">
                        <span className="text-muted-foreground">Brand</span>
                        <span className="font-semibold text-foreground text-right">{brand || '—'}</span>
                      </div>
                      <div className="grid grid-cols-2 gap-2 text-xs py-1 border-b border-border">
                        <span className="text-muted-foreground">Model</span>
                        <span className="font-semibold text-foreground text-right">{modelNumber || '—'}</span>
                      </div>
                      <div className="grid grid-cols-2 gap-2 text-xs py-1 border-b border-border">
                        <span className="text-muted-foreground">Quantity</span>
                        <span className="font-bold text-foreground text-right">{quantity}</span>
                      </div>
                      <div className="grid grid-cols-2 gap-2 text-xs py-1 border-b border-border">
                        <span className="text-muted-foreground">Colour</span>
                        <span className="font-semibold text-foreground text-right">{color || '—'}</span>
                      </div>
                      <div className="grid grid-cols-2 gap-2 text-xs py-1 border-b border-border">
                        <span className="text-muted-foreground">Size</span>
                        <span className="font-semibold text-foreground text-right">{sizeDimensions || '—'}</span>
                      </div>
                    </div>

                    <div>
                      <span className="text-[11px] font-bold text-muted-foreground uppercase tracking-wider block mb-2">
                        COMMERCIAL
                      </span>
                      <div className="grid grid-cols-2 gap-2 text-xs py-1 border-b border-border">
                        <span className="text-muted-foreground">Budget</span>
                        <span className="font-semibold text-foreground text-right">
                          {budget ? `${currency} ${budget}` : '—'}
                        </span>
                      </div>
                      <div className="grid grid-cols-2 gap-2 text-xs py-1 border-b border-border">
                        <span className="text-muted-foreground">Required By</span>
                        <span className="font-semibold text-foreground text-right">{requiredDate || '—'}</span>
                      </div>
                    </div>

                    <div>
                      <span className="text-[11px] font-bold text-muted-foreground uppercase tracking-wider block mb-2">
                        DELIVERY
                      </span>
                      <div className="grid grid-cols-2 gap-2 text-xs py-1 border-b border-border">
                        <span className="text-muted-foreground">Destination</span>
                        <span className="font-semibold text-foreground text-right">{destination}</span>
                      </div>
                      <div className="grid grid-cols-2 gap-2 text-xs py-1 border-b border-border">
                        <span className="text-muted-foreground">Shipping Method</span>
                        <span className="font-semibold text-foreground text-right capitalize">
                          {shippingMethod.replace('_', ' ')}
                        </span>
                      </div>
                      <div className="grid grid-cols-2 gap-2 text-xs py-1 border-b border-border">
                        <span className="text-muted-foreground">Insurance</span>
                        <span className="font-semibold text-foreground text-right">
                          {addInsurance ? 'Yes' : 'No'}
                        </span>
                      </div>
                      <div className="grid grid-cols-2 gap-2 text-xs py-1">
                        <span className="text-muted-foreground">Pre-Shipment Inspection</span>
                        <span className="font-semibold text-foreground text-right">
                          {inspectionRequired ? 'Required' : 'Optional'}
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Confirmation Checkbox */}
                  <label className="flex items-start gap-3 p-4 rounded-xl border border-border cursor-pointer bg-card">
                    <input
                      type="checkbox"
                      checked={agreedTerms}
                      onChange={(e) => setAgreedTerms(e.target.checked)}
                      className="mt-0.5 accent-primary size-4 rounded"
                    />
                    <span className="text-xs text-muted-foreground leading-relaxed">
                      I confirm that the information provided is accurate and I agree to LUMO&apos;s{' '}
                      <span className="underline text-primary font-bold">Terms of Service</span> and{' '}
                      <span className="underline text-primary font-bold">Procurement Policy</span>.
                    </span>
                  </label>
                </div>
              )}

              {/* Bottom Action Controls Bar */}
              <div className="pt-4 border-t border-border flex flex-col sm:flex-row items-center justify-between gap-3">
                <Button
                  type="button"
                  variant="outline"
                  onClick={handleBack}
                  disabled={currentStep === 1}
                  className="w-full sm:w-auto rounded-full font-bold px-6"
                >
                  <ArrowLeft className="size-4 mr-1" />
                  Back
                </Button>

                {currentStep < 5 ? (
                  <Button
                    type="button"
                    onClick={handleNext}
                    disabled={currentStep === 1 && !productName.trim()}
                    className="w-full sm:w-auto rounded-full font-extrabold px-8 bg-primary hover:bg-primary/90 text-primary-foreground shadow-md"
                  >
                    Continue
                    <ArrowRight className="size-4 ml-1" />
                  </Button>
                ) : (
                  <Button
                    type="button"
                    onClick={handleSubmit}
                    disabled={!agreedTerms || isSubmitting}
                    className="w-full sm:w-auto rounded-full font-extrabold px-8 bg-primary hover:bg-primary/90 text-primary-foreground shadow-md"
                  >
                    {isSubmitting ? 'Submitting Request...' : 'Submit Request'}
                    <ArrowRight className="size-4 ml-1" />
                  </Button>
                )}
              </div>

              <p className="text-[11px] text-muted-foreground text-center font-medium">
                Your request is saved as a draft automatically
              </p>
            </CardContent>
          </Card>
        )}
      </div>
    </PublicShell>
  )
}

