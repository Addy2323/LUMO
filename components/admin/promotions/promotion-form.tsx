'use client'

import React, { useState, useRef } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import {
  ArrowLeft,
  Save,
  Sparkles,
  Upload,
  Clock,
  Eye,
  CheckCircle2,
  AlertCircle,
  Smartphone,
  Monitor,
  X,
  Palette,
  ExternalLink,
  Layers,
  Calendar,
  Users,
  Image as ImageIcon,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Logo } from '@/components/brand/logo'
import {
  getSafePromotionImageUrl,
  fileToOptimizedDataUrl,
  VERIFIED_PRESET_IMAGES,
  FALLBACK_PROMO_IMAGE,
} from '@/lib/promotions/image-helper'
import { toast } from 'sonner'

export interface PromotionFormData {
  id?: string
  title: string
  subtitle: string
  description: string
  desktopImageUrl: string
  mobileImageUrl: string
  imageAltText: string
  buttonText: string
  buttonUrl: string
  secondaryButtonText: string
  secondaryButtonUrl: string
  backgroundColor: string
  textColor: string
  buttonColor: string
  placement: string
  status: string
  priority: number
  audience: string
  displayFrequency: string
  delaySeconds: number
  startAt: string
  endAt: string
  timezone: string
  dismissible: boolean
  openInNewTab: boolean
}

interface PromotionFormProps {
  initialData?: Partial<PromotionFormData>
  isEdit?: boolean
}

const COLOR_PRESETS = {
  background: ['#FFF8F2', '#FFFFFF', '#0B1F3A', '#F8FAFC', '#FEF3C7', '#F0FDF4'],
  text: ['#0B1F3A', '#1E293B', '#FFFFFF', '#0F172A', '#78350F'],
  button: ['#FF6B00', '#E85F00', '#0B1F3A', '#059669', '#2563EB', '#D97706'],
}

export function PromotionForm({ initialData, isEdit = false }: PromotionFormProps) {
  const router = useRouter()
  const fileInputRef = useRef<HTMLInputElement>(null)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [previewDevice, setPreviewDevice] = useState<'desktop' | 'mobile'>('desktop')

  const now = new Date()
  const defaultStart = now.toISOString().slice(0, 16)
  const defaultEnd = new Date(now.getTime() + 14 * 24 * 60 * 60 * 1000).toISOString().slice(0, 16)

  const [formData, setFormData] = useState<PromotionFormData>({
    title: initialData?.title || 'Something Special Is Waiting for You',
    subtitle: initialData?.subtitle || 'Save up to 25% on selected deals',
    description:
      initialData?.description ||
      'Trusted products. Secure payments. Delivered with care across Tanzania.',
    desktopImageUrl:
      initialData?.desktopImageUrl ||
      'https://images.unsplash.com/photo-1594938298603-c8148c4dae35?auto=format&fit=crop&w=800&q=80',
    mobileImageUrl: initialData?.mobileImageUrl || '',
    imageAltText: initialData?.imageAltText || 'Lumo Promotional Offer',
    buttonText: initialData?.buttonText || 'EXPLORE THE OFFER',
    buttonUrl: initialData?.buttonUrl || '/marketplace',
    secondaryButtonText: initialData?.secondaryButtonText || 'Maybe Later',
    secondaryButtonUrl: initialData?.secondaryButtonUrl || '',
    backgroundColor: initialData?.backgroundColor || '#FFF8F2',
    textColor: initialData?.textColor || '#0B1F3A',
    buttonColor: initialData?.buttonColor || '#FF6B00',
    placement: initialData?.placement || 'ENTRY_POPUP',
    status: initialData?.status || 'ACTIVE',
    priority: initialData?.priority ?? 10,
    audience: initialData?.audience || 'ALL_VISITORS',
    displayFrequency: initialData?.displayFrequency || 'EVERY_VISIT',
    delaySeconds: initialData?.delaySeconds ?? 2,
    startAt: initialData?.startAt ? new Date(initialData.startAt).toISOString().slice(0, 16) : defaultStart,
    endAt: initialData?.endAt ? new Date(initialData.endAt).toISOString().slice(0, 16) : defaultEnd,
    timezone: initialData?.timezone || 'Africa/Dar_es_Salaam',
    dismissible: initialData?.dismissible ?? true,
    openInNewTab: initialData?.openInNewTab ?? false,
  })

  // Client-Side Image Optimizer & Processor
  async function handleImageUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) return

    if (file.size > 10 * 1024 * 1024) {
      toast.error('File size exceeds 10MB limit')
      return
    }

    const toastId = toast.loading('Processing and optimizing image...')
    try {
      // 1. Client-side canvas compression to WebP/JPEG data URL (1200px max, ~150KB)
      const dataUrl = await fileToOptimizedDataUrl(file, 1200, 0.85)

      setFormData((prev) => ({
        ...prev,
        desktopImageUrl: dataUrl,
      }))

      toast.success('Image loaded and optimized successfully!', { id: toastId })
    } catch (err) {
      console.error('[IMAGE OPTIMIZE ERROR]', err)
      toast.error('Failed to process image. Please try another image.', { id: toastId })
    }
  }

  // Submit Handler
  async function handleSubmit(e: React.FormEvent, targetStatus?: string) {
    e.preventDefault()

    if (!formData.title.trim()) {
      toast.error('Please enter a campaign heading/title')
      return
    }
    if (!formData.description.trim()) {
      toast.error('Please enter a promotional description')
      return
    }
    if (!formData.desktopImageUrl.trim()) {
      toast.error('Please provide a promotional image')
      return
    }
    if (!formData.buttonUrl.trim()) {
      toast.error('Please enter a destination button URL')
      return
    }

    const startDate = new Date(formData.startAt)
    const endDate = new Date(formData.endAt)

    if (endDate <= startDate) {
      toast.error('End date must be later than start date')
      return
    }

    setIsSubmitting(true)
    const finalStatus = targetStatus || formData.status

    try {
      const payload = {
        ...formData,
        desktopImageUrl: formData.desktopImageUrl.trim(),
        mobileImageUrl: formData.mobileImageUrl ? formData.mobileImageUrl.trim() : null,
        status: finalStatus,
        priority: Number(formData.priority) || 0,
        delaySeconds: Number(formData.delaySeconds) || 2,
        startAt: new Date(formData.startAt).toISOString(),
        endAt: new Date(formData.endAt).toISOString(),
      }

      const endpoint = isEdit ? `/api/admin/promotions/${initialData?.id}` : '/api/admin/promotions'
      const method = isEdit ? 'PUT' : 'POST'

      const res = await fetch(endpoint, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      })

      const data = await res.json()

      if (res.ok) {
        toast.success(
          isEdit
            ? 'Promotion campaign updated successfully!'
            : finalStatus === 'ACTIVE'
            ? 'Promotion published and live on LUMO!'
            : 'Promotion draft saved!'
        )
        router.push('/admin/promotions')
      } else {
        const errorText = data.message ? `${data.error || 'Error'}: ${data.message}` : data.error || 'Failed to save promotion'
        toast.error(errorText)
      }
    } catch (err: any) {
      console.error(err)
      toast.error(err?.message || 'An unexpected network error occurred')
    } finally {
      setIsSubmitting(false)
    }
  }

  // Resolved safe image URL for preview
  const previewImageUrl = getSafePromotionImageUrl(formData.desktopImageUrl)

  return (
    <form onSubmit={(e) => handleSubmit(e)} className="space-y-6">
      {/* Top Action Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-card border rounded-2xl p-4 shadow-xs">
        <div className="flex items-center gap-3">
          <Button variant="outline" size="icon" render={<Link href="/admin/promotions" />}>
            <ArrowLeft className="size-4" />
          </Button>
          <div>
            <h1 className="text-xl font-black text-foreground tracking-tight flex items-center gap-2">
              {isEdit ? 'Edit Promotional Campaign' : 'Create Promotional Popup & Banner'}
              <Badge className="bg-brand-500/10 text-brand-500 border-brand-500/20 text-xs font-bold">
                {formData.status}
              </Badge>
            </h1>
            <p className="text-xs text-muted-foreground">
              Configure copy, image creative, targeting rules, schedule, and preview in real-time.
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <Button
            type="button"
            variant="outline"
            disabled={isSubmitting}
            onClick={(e) => handleSubmit(e, 'DRAFT')}
            className="text-xs font-bold"
          >
            Save as Draft
          </Button>
          <Button
            type="submit"
            disabled={isSubmitting}
            className="bg-brand-500 hover:bg-brand-600 text-white text-xs font-black shadow-md cursor-pointer"
          >
            <Save className="size-3.5 mr-1.5" />
            {isEdit ? 'Save Changes' : 'Publish Promotion'}
          </Button>
        </div>
      </div>

      {/* Main 2-Column Split: Controls vs Live Interactive Preview */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Left Column: Configuration Form (7 cols) */}
        <div className="lg:col-span-7 space-y-6">
          {/* Section 1: Copy & Headings */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-extrabold flex items-center gap-2">
                <Sparkles className="size-4 text-brand-500" /> 1. Promotional Copy &amp; Messaging
              </CardTitle>
              <CardDescription className="text-xs">
                Visible heading, supporting badge, and description displayed to shoppers.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-1">
                <label className="text-xs font-bold text-foreground">
                  Promotional Heading <span className="text-red-500">*</span>
                </label>
                <Input
                  value={formData.title}
                  onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                  placeholder="e.g. Something Special Is Waiting for You"
                  required
                  className="font-bold text-sm"
                />
              </div>

              <div className="space-y-1">
                <label className="text-xs font-bold text-foreground">Highlight Subtitle / Badge</label>
                <Input
                  value={formData.subtitle}
                  onChange={(e) => setFormData({ ...formData, subtitle: e.target.value })}
                  placeholder="e.g. Save up to 25% on selected deals"
                />
              </div>

              <div className="space-y-1">
                <label className="text-xs font-bold text-foreground">
                  Supporting Description <span className="text-red-500">*</span>
                </label>
                <Textarea
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  placeholder="e.g. Discover selected Lumo deals, trusted products and limited-time savings prepared for you."
                  rows={3}
                  required
                />
              </div>
            </CardContent>
          </Card>

          {/* Section 2: Visual Creative & Media */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-extrabold flex items-center gap-2">
                <Upload className="size-4 text-brand-500" /> 2. Image Creative
              </CardTitle>
              <CardDescription className="text-xs">
                Upload any picture from your device or paste an image URL (Unsplash, Alibaba, AliExpress, etc.).
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <label className="text-xs font-bold text-foreground">
                  Desktop Image (URL or Uploaded Asset) <span className="text-red-500">*</span>
                </label>
                <div className="flex gap-2">
                  <Input
                    value={formData.desktopImageUrl.startsWith('data:') ? '✓ Uploaded image active (data URL)' : formData.desktopImageUrl}
                    onChange={(e) => setFormData({ ...formData, desktopImageUrl: e.target.value })}
                    placeholder="Paste image URL (https://...)"
                    required
                  />
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => fileInputRef.current?.click()}
                    className="shrink-0 text-xs font-bold cursor-pointer"
                  >
                    <Upload className="size-3.5 mr-1 text-brand-500" /> Upload Image
                  </Button>
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept="image/*"
                    className="hidden"
                    onChange={handleImageUpload}
                  />
                </div>
              </div>

              {/* Sample Preset Chooser */}
              <div className="space-y-1.5">
                <span className="text-[11px] font-bold text-muted-foreground flex items-center gap-1">
                  <ImageIcon className="size-3" /> Or Select a Verified Lifestyle Preset:
                </span>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                  {VERIFIED_PRESET_IMAGES.map((img, idx) => (
                    <button
                      key={idx}
                      type="button"
                      onClick={() => setFormData({ ...formData, desktopImageUrl: img.url })}
                      className={`group relative aspect-video rounded-lg overflow-hidden border transition-all text-left cursor-pointer ${
                        formData.desktopImageUrl === img.url
                          ? 'ring-2 ring-brand-500 border-brand-500'
                          : 'hover:border-foreground/30 opacity-75 hover:opacity-100'
                      }`}
                    >
                      <img
                        src={img.url}
                        alt={img.name}
                        className="size-full object-cover"
                        onError={(e) => {
                          ;(e.target as HTMLImageElement).src = FALLBACK_PROMO_IMAGE
                        }}
                      />
                      <span className="absolute inset-x-0 bottom-0 bg-black/70 text-white text-[9px] font-semibold px-1 py-0.5 truncate">
                        {img.name}
                      </span>
                    </button>
                  ))}
                </div>
              </div>

              <div className="space-y-1">
                <label className="text-xs font-bold text-foreground">Image Accessible Alt Text</label>
                <Input
                  value={formData.imageAltText}
                  onChange={(e) => setFormData({ ...formData, imageAltText: e.target.value })}
                  placeholder="e.g. Shopper holding Lumo package with discount offer"
                />
              </div>
            </CardContent>
          </Card>

          {/* Section 3: Call to Action & Destination */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-extrabold flex items-center gap-2">
                <ExternalLink className="size-4 text-brand-500" /> 3. Call to Action (Buttons &amp; Links)
              </CardTitle>
              <CardDescription className="text-xs">
                Configure primary and secondary destination actions.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="text-xs font-bold text-foreground">
                    Primary Button Label <span className="text-red-500">*</span>
                  </label>
                  <Input
                    value={formData.buttonText}
                    onChange={(e) => setFormData({ ...formData, buttonText: e.target.value })}
                    placeholder="EXPLORE THE OFFER"
                    required
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-xs font-bold text-foreground">
                    Primary Destination URL <span className="text-red-500">*</span>
                  </label>
                  <Input
                    value={formData.buttonUrl}
                    onChange={(e) => setFormData({ ...formData, buttonUrl: e.target.value })}
                    placeholder="/marketplace or https://..."
                    required
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="text-xs font-bold text-foreground">Secondary Dismissal Link Text</label>
                  <Input
                    value={formData.secondaryButtonText}
                    onChange={(e) => setFormData({ ...formData, secondaryButtonText: e.target.value })}
                    placeholder="Maybe Later"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-xs font-bold text-foreground">Secondary URL (Optional)</label>
                  <Input
                    value={formData.secondaryButtonUrl}
                    onChange={(e) => setFormData({ ...formData, secondaryButtonUrl: e.target.value })}
                    placeholder="Leave blank to simply close modal"
                  />
                </div>
              </div>

              <div className="flex flex-wrap gap-4 pt-1">
                <label className="flex items-center gap-2 text-xs font-bold cursor-pointer">
                  <input
                    type="checkbox"
                    checked={formData.dismissible}
                    onChange={(e) => setFormData({ ...formData, dismissible: e.target.checked })}
                    className="rounded border-border text-brand-500 focus:ring-brand-500 size-4"
                  />
                  <span>Allow shoppers to close modal with 'X' &amp; Esc key</span>
                </label>

                <label className="flex items-center gap-2 text-xs font-bold cursor-pointer">
                  <input
                    type="checkbox"
                    checked={formData.openInNewTab}
                    onChange={(e) => setFormData({ ...formData, openInNewTab: e.target.checked })}
                    className="rounded border-border text-brand-500 focus:ring-brand-500 size-4"
                  />
                  <span>Open destination URL in a new browser tab</span>
                </label>
              </div>
            </CardContent>
          </Card>

          {/* Section 4: Targeting, Scheduling & Frequency */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-extrabold flex items-center gap-2">
                <Calendar className="size-4 text-brand-500" /> 4. Scheduling &amp; Targeting Rules
              </CardTitle>
              <CardDescription className="text-xs">
                Control start/end dates, target audience, and display frequency caps.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="text-xs font-bold text-foreground">
                    Start Date &amp; Time <span className="text-red-500">*</span>
                  </label>
                  <Input
                    type="datetime-local"
                    value={formData.startAt}
                    onChange={(e) => setFormData({ ...formData, startAt: e.target.value })}
                    required
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-xs font-bold text-foreground">
                    End Date &amp; Time <span className="text-red-500">*</span>
                  </label>
                  <Input
                    type="datetime-local"
                    value={formData.endAt}
                    onChange={(e) => setFormData({ ...formData, endAt: e.target.value })}
                    required
                  />
                  <p className="text-[10px] text-muted-foreground">Timezone: Africa/Dar_es_Salaam (EAT)</p>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div className="space-y-1">
                  <label className="text-xs font-bold text-foreground">Target Audience</label>
                  <select
                    value={formData.audience}
                    onChange={(e) => setFormData({ ...formData, audience: e.target.value })}
                    className="w-full h-9 rounded-lg border border-border bg-background px-3 text-xs font-semibold"
                  >
                    <option value="ALL_VISITORS">All Visitors</option>
                    <option value="GUESTS_ONLY">Guests Only</option>
                    <option value="LOGGED_IN_CUSTOMERS">Logged-in Customers</option>
                    <option value="NEW_CUSTOMERS">New Customers</option>
                    <option value="RETURNING_CUSTOMERS">Returning Customers</option>
                  </select>
                </div>

                <div className="space-y-1">
                  <label className="text-xs font-bold text-foreground">Display Frequency</label>
                  <select
                    value={formData.displayFrequency}
                    onChange={(e) => setFormData({ ...formData, displayFrequency: e.target.value })}
                    className="w-full h-9 rounded-lg border border-border bg-background px-3 text-xs font-semibold"
                  >
                    <option value="EVERY_VISIT">Every Visit (After Delay)</option>
                    <option value="ONCE_PER_SESSION">Once per Session</option>
                    <option value="ONCE_PER_DAY">Once per Day (24h)</option>
                    <option value="ONCE_PER_WEEK">Once per Week</option>
                    <option value="ONCE_PER_PROMOTION">Once per Promotion</option>
                  </select>
                </div>

                <div className="space-y-1">
                  <label className="text-xs font-bold text-foreground">Display Delay (Seconds)</label>
                  <Input
                    type="number"
                    min={0}
                    max={30}
                    value={formData.delaySeconds}
                    onChange={(e) => setFormData({ ...formData, delaySeconds: parseInt(e.target.value, 10) || 0 })}
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="text-xs font-bold text-foreground">Placement</label>
                  <select
                    value={formData.placement}
                    onChange={(e) => setFormData({ ...formData, placement: e.target.value })}
                    className="w-full h-9 rounded-lg border border-border bg-background px-3 text-xs font-semibold"
                  >
                    <option value="ENTRY_POPUP">Entry Popup (Center Modal)</option>
                    <option value="HOMEPAGE_BANNER">Homepage Banner</option>
                    <option value="MARKETPLACE_BANNER">Marketplace Banner</option>
                  </select>
                </div>

                <div className="space-y-1">
                  <label className="text-xs font-bold text-foreground">Campaign Priority (0-100)</label>
                  <Input
                    type="number"
                    min={0}
                    max={100}
                    value={formData.priority}
                    onChange={(e) => setFormData({ ...formData, priority: parseInt(e.target.value, 10) || 0 })}
                  />
                  <p className="text-[10px] text-muted-foreground">Higher priority displays first</p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Section 5: Brand Colors */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-extrabold flex items-center gap-2">
                <Palette className="size-4 text-brand-500" /> 5. Theme &amp; Brand Colors
              </CardTitle>
              <CardDescription className="text-xs">
                Fine-tune modal background, text, and primary button colors.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-foreground">Background Color</label>
                  <div className="flex items-center gap-2">
                    <input
                      type="color"
                      value={formData.backgroundColor}
                      onChange={(e) => setFormData({ ...formData, backgroundColor: e.target.value })}
                      className="size-8 rounded border cursor-pointer"
                    />
                    <Input
                      value={formData.backgroundColor}
                      onChange={(e) => setFormData({ ...formData, backgroundColor: e.target.value })}
                      className="font-mono text-xs"
                    />
                  </div>
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-foreground">Heading &amp; Text Color</label>
                  <div className="flex items-center gap-2">
                    <input
                      type="color"
                      value={formData.textColor}
                      onChange={(e) => setFormData({ ...formData, textColor: e.target.value })}
                      className="size-8 rounded border cursor-pointer"
                    />
                    <Input
                      value={formData.textColor}
                      onChange={(e) => setFormData({ ...formData, textColor: e.target.value })}
                      className="font-mono text-xs"
                    />
                  </div>
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-foreground">CTA Button Color</label>
                  <div className="flex items-center gap-2">
                    <input
                      type="color"
                      value={formData.buttonColor}
                      onChange={(e) => setFormData({ ...formData, buttonColor: e.target.value })}
                      className="size-8 rounded border cursor-pointer"
                    />
                    <Input
                      value={formData.buttonColor}
                      onChange={(e) => setFormData({ ...formData, buttonColor: e.target.value })}
                      className="font-mono text-xs"
                    />
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Right Column: Real-Time Interactive Live Preview (5 cols, sticky) */}
        <div className="lg:col-span-5 sticky top-6 space-y-3">
          <div className="flex items-center justify-between bg-card border rounded-xl p-2.5">
            <div className="flex items-center gap-1.5 text-xs font-bold text-foreground">
              <Eye className="size-4 text-emerald-600" />
              <span>Real-Time Customer Preview</span>
            </div>

            {/* Device Switcher */}
            <div className="flex items-center bg-muted/60 p-0.5 rounded-lg border">
              <button
                type="button"
                onClick={() => setPreviewDevice('desktop')}
                className={`flex items-center gap-1 px-2.5 py-1 rounded-md text-[11px] font-bold transition-all cursor-pointer ${
                  previewDevice === 'desktop' ? 'bg-background shadow-xs text-foreground' : 'text-muted-foreground hover:text-foreground'
                }`}
              >
                <Monitor className="size-3.5" /> Desktop
              </button>
              <button
                type="button"
                onClick={() => setPreviewDevice('mobile')}
                className={`flex items-center gap-1 px-2.5 py-1 rounded-md text-[11px] font-bold transition-all cursor-pointer ${
                  previewDevice === 'mobile' ? 'bg-background shadow-xs text-foreground' : 'text-muted-foreground hover:text-foreground'
                }`}
              >
                <Smartphone className="size-3.5" /> Mobile
              </button>
            </div>
          </div>

          {/* Simulated Browser Viewport */}
          <div className="relative rounded-2xl bg-slate-950/85 p-3 sm:p-4 border shadow-2xl flex items-center justify-center min-h-[460px]">
            {/* Split Desktop Modal Preview */}
            {previewDevice === 'desktop' ? (
              <div
                className="relative w-full max-w-[560px] rounded-2xl shadow-2xl overflow-hidden border border-white/20 grid grid-cols-12"
                style={{
                  backgroundColor: formData.backgroundColor || '#FFF8F2',
                  color: formData.textColor || '#0B1F3A',
                }}
              >
                {/* Close 'X' */}
                {formData.dismissible && (
                  <div className="absolute top-2.5 right-2.5 z-20 flex size-7 items-center justify-center rounded-full bg-white/90 text-slate-700 shadow-md">
                    <X className="size-4" />
                  </div>
                )}

                {/* Left Image */}
                <div className="col-span-5 relative min-h-[260px] bg-slate-200">
                  <img
                    src={previewImageUrl}
                    alt={formData.imageAltText || formData.title}
                    className="size-full object-cover"
                    onError={(e) => {
                      ;(e.target as HTMLImageElement).src = FALLBACK_PROMO_IMAGE
                    }}
                  />
                </div>

                {/* Right Content */}
                <div className="col-span-7 flex flex-col justify-center items-center text-center p-4 sm:p-5 space-y-2.5">
                  <div className="flex items-center gap-1.5">
                    <Logo markOnly className="size-5" />
                    <span className="font-extrabold text-sm tracking-tight uppercase" style={{ color: formData.buttonColor || '#FF6B00' }}>
                      LUMO
                    </span>
                  </div>

                  <div className="space-y-0.5">
                    <h3 className="text-base font-black leading-tight tracking-tight">{formData.title}</h3>
                    {formData.subtitle && (
                      <p className="text-xs font-bold" style={{ color: formData.buttonColor || '#FF6B00' }}>
                        {formData.subtitle}
                      </p>
                    )}
                  </div>

                  <Sparkles className="size-3.5 opacity-70" style={{ color: formData.buttonColor || '#FF6B00' }} />

                  <p className="text-[11px] leading-snug opacity-90 font-medium line-clamp-3">
                    {formData.description}
                  </p>

                  <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] font-bold bg-amber-500/15 border border-amber-500/30 text-amber-900 dark:text-amber-200">
                    <Clock className="size-3 text-amber-600" />
                    <span>Offer ends in <strong>02:14:36</strong></span>
                  </div>

                  <div className="w-full space-y-1 pt-1">
                    <button
                      type="button"
                      className="w-full py-2 px-4 rounded-lg font-black text-xs uppercase tracking-wider text-white shadow-md"
                      style={{ backgroundColor: formData.buttonColor || '#FF6B00' }}
                    >
                      {formData.buttonText || 'Explore the Offer'}
                    </button>
                    {formData.secondaryButtonText && (
                      <p className="text-[10px] text-slate-500 underline">{formData.secondaryButtonText}</p>
                    )}
                  </div>
                </div>
              </div>
            ) : (
              /* Stacked Mobile Modal Preview */
              <div
                className="relative w-full max-w-[320px] rounded-2xl shadow-2xl overflow-hidden border border-white/20 flex flex-col"
                style={{
                  backgroundColor: formData.backgroundColor || '#FFF8F2',
                  color: formData.textColor || '#0B1F3A',
                }}
              >
                {/* Close 'X' */}
                {formData.dismissible && (
                  <div className="absolute top-2 right-2 z-20 flex size-6 items-center justify-center rounded-full bg-white/90 text-slate-700 shadow-md">
                    <X className="size-3.5" />
                  </div>
                )}

                {/* Top Image */}
                <div className="relative aspect-16/10 w-full bg-slate-200">
                  <img
                    src={getSafePromotionImageUrl(formData.mobileImageUrl || formData.desktopImageUrl)}
                    alt={formData.imageAltText || formData.title}
                    className="size-full object-cover"
                    onError={(e) => {
                      ;(e.target as HTMLImageElement).src = FALLBACK_PROMO_IMAGE
                    }}
                  />
                </div>

                {/* Content */}
                <div className="flex flex-col justify-center items-center text-center p-4 space-y-2">
                  <div className="flex items-center gap-1.5">
                    <Logo markOnly className="size-5" />
                    <span className="font-extrabold text-xs tracking-tight uppercase" style={{ color: formData.buttonColor || '#FF6B00' }}>
                      LUMO
                    </span>
                  </div>

                  <h3 className="text-sm font-black leading-tight tracking-tight">{formData.title}</h3>
                  {formData.subtitle && (
                    <p className="text-[11px] font-bold" style={{ color: formData.buttonColor || '#FF6B00' }}>
                      {formData.subtitle}
                    </p>
                  )}

                  <p className="text-[10px] opacity-90 font-medium line-clamp-2">{formData.description}</p>

                  <div className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[9px] font-bold bg-amber-500/15 border border-amber-500/30 text-amber-900">
                    <Clock className="size-2.5 text-amber-600" />
                    <span>Offer ends in <strong>02:14:36</strong></span>
                  </div>

                  <button
                    type="button"
                    className="w-full py-2 px-3 rounded-lg font-black text-xs uppercase text-white shadow-md mt-1"
                    style={{ backgroundColor: formData.buttonColor || '#FF6B00' }}
                  >
                    {formData.buttonText || 'Explore the Offer'}
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </form>
  )
}
