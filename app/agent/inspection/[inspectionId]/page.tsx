'use client'

import { useState, useEffect } from 'react'
import Image from 'next/image'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import {
  ShieldCheck,
  CheckCircle2,
  Upload,
  Video,
  Camera,
  FileText,
  AlertTriangle,
  Play,
  ArrowRight,
  ClipboardList,
  Calculator,
  XCircle,
  RefreshCw,
  ChevronLeft,
  Coins,
  Check,
  Building2,
  Trash2,
  Send,
  Plus,
  Minus,
} from 'lucide-react'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog'
import { useAgentStore } from '@/lib/stores/agent-store'
import { calculateAqlSamplingPlan, evaluateAqlResult } from '@/lib/aql-engine'
import { toast } from 'sonner'

interface PhotoSlot {
  id: string
  label: string
  required: boolean
  url: string
  caption?: string
  uploadedAt?: string
}

const INITIAL_SLOTS: PhotoSlot[] = [
  { id: 'p1', label: '1. Front View', required: true, url: '' },
  { id: 'p2', label: '2. Back View', required: true, url: '' },
  { id: 'p3', label: '3. Left Side', required: true, url: '' },
  { id: 'p4', label: '4. Right Side', required: true, url: '' },
  { id: 'p5', label: '5. Accessories', required: true, url: '' },
  { id: 'p6', label: '6. Outer Package', required: true, url: '' },
  { id: 'p7', label: '7. Barcode Label', required: true, url: '' },
  { id: 'p8', label: '8. Serial Number', required: true, url: '' },
  { id: 'p9', label: '9. Factory Label', required: true, url: '' },
  { id: 'p10', label: '10. Supplier Invoice', required: true, url: '' },
]

export default function QualityInspectionStudioPage({ params }: { params: { inspectionId: string } }) {
  const router = useRouter()
  const { orders, activeCountry } = useAgentStore()

  const [inspection, setInspection] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [isSaving, setIsSaving] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)

  // Inspection Workspace State
  const [lotSize, setLotSize] = useState(100)
  const [inspectedQty, setInspectedQty] = useState(80)
  const [criticalDefects, setCriticalDefects] = useState(0)
  const [majorDefects, setMajorDefects] = useState(1)
  const [minorDefects, setMinorDefects] = useState(2)
  const [notes, setNotes] = useState('')

  const [checklist, setChecklist] = useState<Record<string, boolean>>({
    quantityCorrect: true,
    productMatchesRequest: true,
    colorCorrect: true,
    sizeCorrect: true,
    logoCorrect: true,
    packagingGood: true,
    noDamage: true,
    accessoriesIncluded: true,
    powerTestPassed: true,
  })

  const [photoSlots, setPhotoSlots] = useState<PhotoSlot[]>(INITIAL_SLOTS)
  const [videoUrl, setVideoUrl] = useState<string>('')
  const [videoCaption, setVideoCaption] = useState('Short video proof showing box opening and power test')

  // Modals state
  const [showHqModal, setShowHqModal] = useState(false)
  const [hqDecision, setHqDecision] = useState('Approved by HQ')
  const [overrideReason, setOverrideReason] = useState('')

  useEffect(() => {
    fetchInspection()
  }, [params.inspectionId])

  async function fetchInspection() {
    setLoading(true)
    try {
      const res = await fetch(`/api/agent/inspections/${params.inspectionId}`)
      if (res.ok) {
        const data = await res.json()
        if (data.success && data.inspection) {
          const ins = data.inspection
          setInspection(ins)
          setLotSize(ins.lotSize || 100)
          setInspectedQty(ins.inspectedQty || 80)
          setCriticalDefects(ins.criticalDefects || 0)
          setMajorDefects(ins.majorDefects || 1)
          setMinorDefects(ins.minorDefects || 2)
          setNotes(ins.notes || '')
          if (ins.checklist) setChecklist(ins.checklist)

          // Load photo slots if existing
          if (Array.isArray(ins.evidencePhotos) && ins.evidencePhotos.length > 0) {
            setPhotoSlots((prev) =>
              prev.map((slot) => {
                const match = ins.evidencePhotos.find((p: any) => p.slotId === slot.id || p.id === slot.id)
                return match ? { ...slot, url: match.url || match.fileUrl, caption: match.caption } : slot
              })
            )
          }

          if (ins.evidenceVideos?.videoUrl) {
            setVideoUrl(ins.evidenceVideos.videoUrl)
          }
        }
      }
    } catch (e) {
      console.warn('Failed to fetch inspection:', e)
    } finally {
      setLoading(false)
    }
  }

  // AQL Math Calculations
  const aqlPlan = calculateAqlSamplingPlan(lotSize)
  const uploadedPhotosCount = photoSlots.filter((p) => Boolean(p.url)).length

  const aqlEval = evaluateAqlResult({
    lotSize,
    inspectedQty,
    criticalDefects,
    majorDefects,
    minorDefects,
    uploadedPhotosCount,
    requiredPhotosCount: 10,
  })

  // Checkbox Toggle
  function handleCheckToggle(key: string) {
    setChecklist((prev) => ({ ...prev, [key]: !prev[key] }))
  }

  // Photo Slot Upload Handler
  async function handlePhotoUpload(slotId: string, e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) return

    const formData = new FormData()
    formData.append('file', file)
    formData.append('slotId', slotId)
    formData.append('inspectionId', params.inspectionId)

    try {
      const res = await fetch('/api/agent/inspections/upload', {
        method: 'POST',
        body: formData,
      })
      const data = await res.json()
      if (data.success && data.fileAsset) {
        setPhotoSlots((prev) =>
          prev.map((s) =>
            s.id === slotId
              ? { ...s, url: data.fileAsset.fileUrl, uploadedAt: new Date().toLocaleTimeString() }
              : s
          )
        )
        toast.success(`Uploaded ${slotId} proof photograph!`)
      } else {
        // Fallback local preview if mock storage
        const mockUrl = URL.createObjectURL(file)
        setPhotoSlots((prev) =>
          prev.map((s) => (s.id === slotId ? { ...s, url: mockUrl, uploadedAt: new Date().toLocaleTimeString() } : s))
        )
        toast.success('Uploaded proof photograph!')
      }
    } catch (err) {
      toast.error('Error uploading photograph')
    }
  }

  // Clear Photo Slot
  function handleRemovePhoto(slotId: string) {
    setPhotoSlots((prev) => prev.map((s) => (s.id === slotId ? { ...s, url: '' } : s)))
    toast.info('Removed proof photograph slot.')
  }

  // Video Upload Handler
  async function handleVideoUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) return

    const formData = new FormData()
    formData.append('file', file)
    formData.append('slotId', 'video')

    try {
      const res = await fetch('/api/agent/inspections/upload', { method: 'POST', body: formData })
      const data = await res.json()
      if (data.success && data.fileAsset) {
        setVideoUrl(data.fileAsset.fileUrl)
        toast.success('Product test video uploaded successfully!')
      } else {
        setVideoUrl(URL.createObjectURL(file))
        toast.success('Product test video uploaded!')
      }
    } catch (err) {
      toast.error('Failed to upload video proof')
    }
  }

  // Autosave Draft
  async function handleSaveDraft() {
    setIsSaving(true)
    try {
      const res = await fetch(`/api/agent/inspections/${params.inspectionId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          lotSize,
          inspectedQty,
          criticalDefects,
          majorDefects,
          minorDefects,
          checklist,
          evidencePhotos: photoSlots.map((p) => ({ slotId: p.id, url: p.url, caption: p.caption })),
          evidenceVideos: { videoUrl, caption: videoCaption },
          notes,
        }),
      })

      const data = await res.json()
      if (data.success) {
        toast.success('Inspection draft saved to server database!')
      } else {
        toast.error(data.error || 'Failed to save draft.')
      }
    } catch (err) {
      toast.error('Network error saving draft.')
    } finally {
      setIsSaving(false)
    }
  }

  // Submit Inspection to HQ
  async function handleSubmitInspection() {
    if (uploadedPhotosCount < 10) {
      toast.error(`All 10 mandatory proof photos are required (${uploadedPhotosCount}/10 uploaded).`)
      return
    }

    setIsSubmitting(true)
    try {
      const res = await fetch(`/api/agent/inspections/${params.inspectionId}/submit`, {
        method: 'POST',
      })
      const data = await res.json()
      if (data.success) {
        toast.success(data.message || 'Inspection submitted successfully!')
        fetchInspection()
      } else {
        toast.error(data.error || 'Failed to submit inspection.')
      }
    } catch (err) {
      toast.error('Network error submitting inspection.')
    } finally {
      setIsSubmitting(false)
    }
  }

  // HQ Reviewer Decision
  async function handleHqReviewSubmit() {
    try {
      const res = await fetch(`/api/agent/inspections/${params.inspectionId}/review`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          decision: hqDecision,
          overrideReason,
        }),
      })
      const data = await res.json()
      if (data.success) {
        toast.success(`HQ Review decision recorded: ${hqDecision}!`)
        setShowHqModal(false)
        fetchInspection()
      } else {
        toast.error(data.error || 'Failed to record HQ decision')
      }
    } catch (err) {
      toast.error('Network error recording HQ decision')
    }
  }

  const currentOrder = orders.find((o) => o.id === inspection?.orderId) || orders[0]

  if (loading) {
    return (
      <div className="p-12 text-center text-slate-400 font-mono text-xs">
        <RefreshCw className="size-6 animate-spin mx-auto mb-2 text-brand-400" />
        Loading Quality Inspection Studio...
      </div>
    )
  }

  return (
    <div className="space-y-8 text-white font-sans">
      {/* Sticky Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 p-4 rounded-2xl bg-slate-900 border border-slate-800 sticky top-0 z-20 shadow-2xl">
        <div>
          <div className="flex items-center gap-2">
            <Link href="/agent/inspection" className="text-slate-400 hover:text-white">
              <ChevronLeft className="size-4" />
            </Link>
            <h1 className="text-xl font-extrabold font-heading text-white">
              Quality Inspection &amp; Photo Studio
            </h1>
            <Badge className="bg-brand-500/20 text-brand-400 border border-brand-500/30 text-xs font-mono">
              {inspection?.inspectionRef || params.inspectionId}
            </Badge>
          </div>
          <p className="text-xs text-slate-400 font-mono mt-0.5">
            Order: <strong className="text-brand-400">#{inspection?.orderId || currentOrder?.orderNumber}</strong> · Product:{' '}
            <strong className="text-slate-200">{currentOrder?.productName || 'Armour Shield Rugged Case'}</strong> · Hub:{' '}
            <strong>{activeCountry}</strong>
          </p>
        </div>

        <div className="flex items-center gap-3">
          <Badge
            className={`font-mono text-xs px-3 py-1 font-bold ${
              aqlEval.decision === 'Passed'
                ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'
                : aqlEval.decision === 'Conditionally Passed'
                ? 'bg-amber-500/20 text-amber-400 border border-amber-500/30'
                : 'bg-rose-500/20 text-rose-400 border border-rose-500/30'
            }`}
          >
            AQL Result: {aqlEval.decision.toUpperCase()}
          </Badge>

          <Badge className="bg-slate-950 text-brand-400 border border-slate-800 font-mono text-xs">
            {uploadedPhotosCount} / 10 Proof Photos
          </Badge>

          <Button
            onClick={handleSaveDraft}
            disabled={isSaving}
            variant="outline"
            size="sm"
            className="bg-slate-950 border-slate-800 text-xs font-mono text-slate-300 hover:text-white"
          >
            {isSaving ? 'Saving...' : 'Save Draft'}
          </Button>

          <Button
            onClick={handleSubmitInspection}
            disabled={isSubmitting}
            size="sm"
            className="bg-brand-500 hover:bg-brand-600 text-white text-xs font-bold gap-1.5 shadow-lg shadow-brand-500/20"
          >
            <Send className="size-3.5" /> Submit to HQ
          </Button>
        </div>
      </div>

      {/* Main Studio Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left Column: AQL Defect Math & Checklist Matrix (5 cols) */}
        <div className="lg:col-span-5 space-y-6">
          {/* AQL 2.5 Defect & Checklist Matrix Card */}
          <Card className="bg-slate-900 border-slate-800">
            <CardHeader className="p-5 border-b border-slate-800">
              <CardTitle className="text-base font-extrabold text-white flex items-center gap-2">
                <Calculator className="size-5 text-brand-400" />
                AQL 2.5 Defect &amp; Checklist Matrix
              </CardTitle>
              <p className="text-xs text-slate-400 font-mono">ISO 2859-1 Physical quality audit parameters</p>
            </CardHeader>

            <CardContent className="p-5 space-y-4">
              {/* Sample & Lot Size */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[11px] font-mono text-slate-400 mb-1">Lot Size (Total Order)</label>
                  <Input
                    type="number"
                    value={lotSize}
                    onChange={(e) => setLotSize(Number(e.target.value) || 100)}
                    className="h-9 bg-slate-950 border-slate-800 text-xs font-bold text-white font-mono"
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-mono text-slate-400 mb-1">Sample Size (Pcs)</label>
                  <Input
                    type="number"
                    value={inspectedQty}
                    onChange={(e) => setInspectedQty(Number(e.target.value) || 80)}
                    className="h-9 bg-slate-950 border-slate-800 text-xs font-bold text-white font-mono"
                  />
                </div>
              </div>

              {/* Defect Counters */}
              <div className="grid grid-cols-3 gap-2">
                <div className="p-3 rounded-xl bg-slate-950 border border-slate-800 text-center space-y-1">
                  <span className="block text-[10px] text-slate-400 uppercase font-mono">Critical (0 Max)</span>
                  <div className="flex items-center justify-center gap-2">
                    <button
                      onClick={() => setCriticalDefects(Math.max(0, criticalDefects - 1))}
                      className="size-6 rounded bg-slate-800 text-slate-300 font-bold flex items-center justify-center"
                    >
                      -
                    </button>
                    <span className="font-extrabold text-rose-400 font-mono text-base">{criticalDefects}</span>
                    <button
                      onClick={() => setCriticalDefects(criticalDefects + 1)}
                      className="size-6 rounded bg-slate-800 text-slate-300 font-bold flex items-center justify-center"
                    >
                      +
                    </button>
                  </div>
                </div>

                <div className="p-3 rounded-xl bg-slate-950 border border-slate-800 text-center space-y-1">
                  <span className="block text-[10px] text-slate-400 uppercase font-mono">Major (Ac {aqlPlan.majorAc})</span>
                  <div className="flex items-center justify-center gap-2">
                    <button
                      onClick={() => setMajorDefects(Math.max(0, majorDefects - 1))}
                      className="size-6 rounded bg-slate-800 text-slate-300 font-bold flex items-center justify-center"
                    >
                      -
                    </button>
                    <span className="font-extrabold text-amber-400 font-mono text-base">{majorDefects}</span>
                    <button
                      onClick={() => setMajorDefects(majorDefects + 1)}
                      className="size-6 rounded bg-slate-800 text-slate-300 font-bold flex items-center justify-center"
                    >
                      +
                    </button>
                  </div>
                </div>

                <div className="p-3 rounded-xl bg-slate-950 border border-slate-800 text-center space-y-1">
                  <span className="block text-[10px] text-slate-400 uppercase font-mono">Minor (Ac {aqlPlan.minorAc})</span>
                  <div className="flex items-center justify-center gap-2">
                    <button
                      onClick={() => setMinorDefects(Math.max(0, minorDefects - 1))}
                      className="size-6 rounded bg-slate-800 text-slate-300 font-bold flex items-center justify-center"
                    >
                      -
                    </button>
                    <span className="font-extrabold text-blue-400 font-mono text-base">{minorDefects}</span>
                    <button
                      onClick={() => setMinorDefects(minorDefects + 1)}
                      className="size-6 rounded bg-slate-800 text-slate-300 font-bold flex items-center justify-center"
                    >
                      +
                    </button>
                  </div>
                </div>
              </div>

              {/* Defect Rate & Explanation Bar */}
              <div className="p-3 rounded-xl bg-slate-950 border border-slate-800 space-y-1 text-xs font-mono">
                <div className="flex justify-between text-slate-400">
                  <span>Calculated Defect Rate:</span>
                  <strong className="text-amber-400">{aqlEval.defectRatePercent}%</strong>
                </div>
                <p className="text-[11px] text-slate-400 border-t border-slate-800/80 pt-1 mt-1 font-sans">
                  {aqlEval.reason}
                </p>
              </div>

              {/* Physical Product Verification Checklist Matrix */}
              <div className="space-y-2 pt-2 border-t border-slate-800">
                <h4 className="text-xs font-extrabold uppercase text-slate-400 font-mono">
                  Physical Quality Verification Matrix
                </h4>

                {Object.entries({
                  quantityCorrect: 'Quantity Correct',
                  productMatchesRequest: 'Product Matches Request',
                  colorCorrect: 'Color Correct',
                  sizeCorrect: 'Size & Model Correct',
                  logoCorrect: 'Logo / Brand Print Correct',
                  packagingGood: 'Packaging Good',
                  noDamage: 'No Physical Damage',
                  accessoriesIncluded: 'Accessories & Cables Included',
                  powerTestPassed: 'Power & Functionality Test Passed',
                }).map(([key, label]) => (
                  <div
                    key={key}
                    onClick={() => handleCheckToggle(key)}
                    className="p-3 rounded-xl bg-slate-950 border border-slate-800 flex items-center justify-between cursor-pointer hover:border-slate-700 transition-colors"
                  >
                    <span className="text-xs font-bold text-slate-200">{label}</span>
                    <div
                      className={`size-6 rounded-full flex items-center justify-center border ${
                        checklist[key]
                          ? 'bg-emerald-500/20 border-emerald-500 text-emerald-400'
                          : 'bg-rose-500/20 border-rose-500 text-rose-400'
                      }`}
                    >
                      {checklist[key] ? <Check className="size-3.5" /> : <XCircle className="size-3.5" />}
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Right Column: Mandatory 10 Photo Slots Studio & Video Proof (7 cols) */}
        <div className="lg:col-span-7 space-y-6">
          {/* Mandatory 10 Photo Slots Studio Card */}
          <Card className="bg-slate-900 border-slate-800">
            <CardHeader className="p-5 border-b border-slate-800 flex flex-row items-center justify-between">
              <div>
                <CardTitle className="text-base font-extrabold text-white flex items-center gap-2">
                  <Camera className="size-5 text-brand-400" />
                  Mandatory 10 Photo Slots Studio
                </CardTitle>
                <p className="text-xs text-slate-400">High-resolution evidence for customer inspection approval</p>
              </div>
              <Badge className="bg-brand-500/20 text-brand-400 border border-brand-500/30 text-xs font-mono font-bold">
                {uploadedPhotosCount} / 10 Uploaded
              </Badge>
            </CardHeader>

            <CardContent className="p-5">
              <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
                {photoSlots.map((slot) => (
                  <div
                    key={slot.id}
                    className="relative aspect-square rounded-2xl bg-slate-950 border border-slate-800 flex flex-col items-center justify-center p-2 text-center group hover:border-brand-500 transition-colors overflow-hidden"
                  >
                    {slot.url ? (
                      <>
                        <img src={slot.url} alt={slot.label} className="absolute inset-0 size-full object-cover" />
                        <div className="absolute inset-0 bg-slate-950/70 opacity-0 group-hover:opacity-100 flex flex-col items-center justify-center gap-1 transition-opacity p-2">
                          <span className="text-[10px] text-white font-bold truncate">{slot.label}</span>
                          <button
                            onClick={() => handleRemovePhoto(slot.id)}
                            className="p-1 rounded bg-rose-500/80 text-white text-[10px] flex items-center gap-1 font-mono"
                          >
                            <Trash2 className="size-3" /> Remove
                          </button>
                        </div>
                      </>
                    ) : (
                      <label className="cursor-pointer size-full flex flex-col items-center justify-center gap-1">
                        <Camera className="size-6 text-slate-600 group-hover:text-brand-400 transition-colors" />
                        <span className="text-[10px] font-bold text-slate-300 line-clamp-2">{slot.label}</span>
                        <span className="text-[9px] text-slate-500 font-mono">Upload</span>
                        <input
                          type="file"
                          accept="image/*"
                          onChange={(e) => handlePhotoUpload(slot.id, e)}
                          className="hidden"
                        />
                      </label>
                    )}
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Product Test Video Proof Card */}
          <Card className="bg-slate-900 border-slate-800">
            <CardHeader className="p-5 border-b border-slate-800">
              <CardTitle className="text-base font-extrabold text-white flex items-center gap-2">
                <Video className="size-5 text-brand-400" />
                Product Test Video Proof
              </CardTitle>
              <p className="text-xs text-slate-400">Short video proof showing box opening, power test &amp; serial number</p>
            </CardHeader>

            <CardContent className="p-5 space-y-4">
              {videoUrl ? (
                <div className="space-y-3">
                  <div className="aspect-video bg-slate-950 rounded-xl overflow-hidden border border-slate-800 relative flex items-center justify-center">
                    <video src={videoUrl} controls className="w-full h-full object-cover" />
                  </div>
                  <div className="flex items-center justify-between text-xs font-mono">
                    <span className="text-slate-400">{videoCaption}</span>
                    <Button
                      onClick={() => setVideoUrl('')}
                      variant="outline"
                      size="sm"
                      className="bg-slate-950 border-slate-800 text-rose-400 text-xs gap-1"
                    >
                      <Trash2 className="size-3" /> Replace Video
                    </Button>
                  </div>
                </div>
              ) : (
                <label className="border-2 border-dashed border-slate-800 hover:border-brand-500 rounded-2xl p-8 flex flex-col items-center justify-center gap-2 cursor-pointer transition-colors text-center">
                  <Video className="size-8 text-slate-500" />
                  <span className="text-xs font-bold text-slate-200">Upload Product Testing Video Proof (MP4 / WebM)</span>
                  <span className="text-[10px] text-slate-500 font-mono">Max file size 50MB</span>
                  <input type="file" accept="video/*" onChange={handleVideoUpload} className="hidden" />
                </label>
              )}
            </CardContent>
          </Card>

          {/* HQ Reviewer Controls Bar (If Admin/HQ) */}
          <Card className="bg-slate-900 border-slate-800">
            <CardContent className="p-5 flex items-center justify-between gap-4">
              <div>
                <h4 className="text-xs font-extrabold text-white uppercase font-mono">HQ Operations Review Panel</h4>
                <p className="text-[11px] text-slate-400">LUMO HQ approval authorization and corrective action requests</p>
              </div>

              <div className="flex items-center gap-3">
                <Button
                  onClick={() => setShowHqModal(true)}
                  className="bg-slate-800 hover:bg-slate-700 text-white text-xs font-bold border border-slate-700"
                >
                  HQ Review Actions
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* HQ Review Modal */}
      <Dialog open={showHqModal} onOpenChange={setShowHqModal}>
        <DialogContent className="bg-slate-900 border-slate-800 text-white max-w-md">
          <DialogHeader>
            <DialogTitle className="text-base font-extrabold text-white">LUMO HQ Review Decision</DialogTitle>
            <DialogDescription className="text-xs text-slate-400 font-mono">
              Authorize inspection result or issue override with mandatory audit log reason.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 pt-2">
            <div>
              <label className="block text-xs font-mono text-slate-400 mb-1">HQ Decision</label>
              <select
                value={hqDecision}
                onChange={(e) => setHqDecision(e.target.value)}
                className="w-full h-9 bg-slate-950 border border-slate-800 rounded-lg text-xs font-bold text-white px-3"
              >
                <option value="Approved by HQ">Approved by HQ (Authorize Shipment)</option>
                <option value="Conditionally Passed">Conditionally Passed</option>
                <option value="Rejected by HQ">Rejected by HQ (Block Shipment)</option>
                <option value="Clarification Requested">Clarification Requested</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-mono text-slate-400 mb-1">Audit Notes / Mandatory Override Reason</label>
              <textarea
                value={overrideReason}
                onChange={(e) => setOverrideReason(e.target.value)}
                placeholder="Reason for decision or override..."
                className="w-full h-20 bg-slate-950 border border-slate-800 rounded-xl text-xs text-white p-3 font-sans"
              />
            </div>

            <div className="flex justify-end gap-3 pt-2">
              <Button onClick={() => setShowHqModal(false)} variant="outline" className="bg-slate-950 border-slate-800 text-xs">
                Cancel
              </Button>
              <Button onClick={handleHqReviewSubmit} className="bg-brand-500 hover:bg-brand-600 text-white text-xs font-bold">
                Record HQ Decision
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  )
}
