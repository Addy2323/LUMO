'use client'

import { useState } from 'react'
import Image from 'next/image'
import Link from 'next/link'
import {
  ShieldCheck,
  CheckCircle2,
  Upload,
  Video,
  Camera,
  FileText,
  AlertTriangle,
  Play,
  Sparkles,
  ArrowRight,
  ClipboardList,
  PlusCircle,
} from 'lucide-react'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { useAgentStore, QualityChecklist, InspectionPhotoSlot } from '@/lib/stores/agent-store'
import { toast } from 'sonner'

const INITIAL_SLOTS: InspectionPhotoSlot[] = [
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

export default function AgentInspectionPage() {
  const { orders, updateInspection, activeCountry, seedSampleOrder } = useAgentStore()
  
  // Find order in active country hub
  const hubOrders = orders.filter((o) => o.assignedCountry === activeCountry)
  const currentOrder = hubOrders[0]

  const [checklist, setChecklist] = useState<QualityChecklist>({
    quantityCorrect: false,
    productMatchesRequest: false,
    colorCorrect: false,
    sizeCorrect: false,
    logoCorrect: false,
    packagingGood: false,
    noDamage: false,
    accessoriesIncluded: false,
    powerTestPassed: false,
  })

  const [photoSlots, setPhotoSlots] = useState<InspectionPhotoSlot[]>(INITIAL_SLOTS)
  const [videoUrl, setVideoUrl] = useState<string | null>(null)

  const isAllChecked = Object.values(checklist).every(Boolean)
  const uploadedCount = photoSlots.filter((p) => Boolean(p.url)).length

  function handleCheckToggle(key: keyof QualityChecklist) {
    setChecklist((prev) => ({ ...prev, [key]: !prev[key] }))
  }

  function handleUploadPhotoSlot(slotId: string) {
    // Simulate uploading a photo
    setPhotoSlots((prev) =>
      prev.map((s) =>
        s.id === slotId
          ? { ...s, url: '/images/products/phone-case-armour.png', uploadedAt: new Date().toLocaleTimeString() }
          : s
      )
    )
    toast.success('Inspection photo uploaded successfully!')
  }

  function handleSaveInspection() {
    if (!currentOrder) return
    updateInspection(
      currentOrder.id,
      checklist,
      photoSlots,
      videoUrl || 'https://cdn.lumo.trade/inspections/video-proof.mp4'
    )
    toast.success(`Inspection report & proof photos submitted for Order ${currentOrder.orderNumber}!`)
  }

  if (!currentOrder) {
    return (
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-extrabold font-heading text-white">Quality Inspection &amp; Photo Studio</h1>
          <p className="text-xs text-slate-400 font-mono">
            Field Operations Hub: <strong className="text-brand-400">{activeCountry}</strong> · Physical Inspection Verification
          </p>
        </div>

        <Card className="bg-slate-900 border-slate-800">
          <CardContent className="p-12 text-center space-y-4">
            <div className="size-14 rounded-2xl bg-slate-800 text-brand-400 mx-auto flex items-center justify-center border border-slate-700">
              <ShieldCheck className="size-7" />
            </div>
            <div className="space-y-1 max-w-md mx-auto">
              <h3 className="text-base font-bold text-white">No Active Orders Ready for Inspection</h3>
              <p className="text-xs text-slate-400 leading-relaxed">
                There are currently no orders pending quality inspection in the {activeCountry} Hub queue. Once an order is assigned and collected, you can record proof photos and videos here.
              </p>
            </div>
            <div className="pt-2 flex flex-wrap items-center justify-center gap-3">
              <Button
                render={
                  <Link href="/agent/orders">
                    <ClipboardList className="size-4 mr-1.5" />
                    View Orders Queue
                  </Link>
                }
                className="bg-brand-500 hover:bg-brand-600 text-white text-xs font-bold"
              />
              <Button
                onClick={() => {
                  seedSampleOrder()
                  toast.success(`Created order in ${activeCountry} Hub for inspection testing.`)
                }}
                variant="outline"
                className="border-slate-700 bg-slate-800 text-slate-300 hover:bg-slate-700 text-xs font-bold"
              >
                <PlusCircle className="size-4 mr-1.5" />
                Add Test Order
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="space-y-8">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-extrabold font-heading text-white">Quality Inspection &amp; Photo Studio</h1>
          <p className="text-xs text-slate-400 font-mono">
            Order: <strong className="text-brand-400">#{currentOrder.orderNumber}</strong> · Product: <strong className="text-white">{currentOrder.productName}</strong> · Hub: <strong className="text-white">{activeCountry}</strong>
          </p>
        </div>

        <Badge className="bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 px-3 py-1 text-xs font-bold font-mono">
          {uploadedCount} / 10 Proof Photos Uploaded
        </Badge>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* 10-Point Inspection Checklist */}
        <Card className="bg-slate-900 border-slate-800 lg:col-span-1 flex flex-col justify-between">
          <CardHeader className="p-5 border-b border-slate-800">
            <CardTitle className="text-base font-extrabold text-white flex items-center gap-2">
              <ShieldCheck className="size-5 text-brand-400" />
              10-Point Physical Verification
            </CardTitle>
            <p className="text-xs text-slate-400">Check each criteria before sealing the carton</p>
          </CardHeader>

          <CardContent className="p-5 space-y-3 flex-1">
            {[
              { id: 'quantityCorrect', label: 'Quantity Correct' },
              { id: 'productMatchesRequest', label: 'Product Matches Request' },
              { id: 'colorCorrect', label: 'Color Correct' },
              { id: 'sizeCorrect', label: 'Size & Model Correct' },
              { id: 'logoCorrect', label: 'Logo / Brand Print Correct' },
              { id: 'packagingGood', label: 'Packaging Good' },
              { id: 'noDamage', label: 'No Physical Damage' },
              { id: 'accessoriesIncluded', label: 'Accessories & Cables Included' },
              { id: 'powerTestPassed', label: 'Power & Functionality Test Passed' },
            ].map((item) => {
              const key = item.id as keyof QualityChecklist
              const isChecked = checklist[key]
              return (
                <div
                  key={item.id}
                  onClick={() => handleCheckToggle(key)}
                  className={`flex items-center justify-between p-3 rounded-xl border cursor-pointer transition-all ${
                    isChecked
                      ? 'bg-emerald-500/10 border-emerald-500/40 text-emerald-300'
                      : 'bg-slate-950 border-slate-800 text-slate-400'
                  }`}
                >
                  <span className="text-xs font-bold">{item.label}</span>
                  {isChecked ? (
                    <CheckCircle2 className="size-4 text-emerald-400 shrink-0" />
                  ) : (
                    <span className="size-4 rounded-full border border-slate-700" />
                  )}
                </div>
              )
            })}
          </CardContent>

          <div className="p-5 border-t border-slate-800 bg-slate-950/40">
            <Button
              onClick={handleSaveInspection}
              disabled={!isAllChecked}
              className="w-full bg-brand-500 hover:bg-brand-600 text-white font-extrabold text-xs shadow-lg shadow-brand-500/20"
            >
              <CheckCircle2 className="size-4 mr-1.5" />
              Submit Inspection to Customer
            </Button>
          </div>
        </Card>

        {/* 10 Mandatory Photo Slots Grid */}
        <div className="lg:col-span-2 space-y-6">
          <Card className="bg-slate-900 border-slate-800">
            <CardHeader className="p-5 border-b border-slate-800 flex flex-row items-center justify-between">
              <div>
                <CardTitle className="text-base font-extrabold text-white flex items-center gap-2">
                  <Camera className="size-5 text-brand-400" />
                  Mandatory 10 Photo Slots Studio
                </CardTitle>
                <p className="text-xs text-slate-400">High-resolution evidence for customer inspection approval</p>
              </div>

              <Badge variant="outline" className="text-xs border-slate-700 text-slate-300 font-mono">
                Mandatory Requirement
              </Badge>
            </CardHeader>

            <CardContent className="p-5">
              <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
                {photoSlots.map((slot) => (
                  <div
                    key={slot.id}
                    className="group relative rounded-xl border border-slate-800 bg-slate-950 p-2 text-center space-y-2 flex flex-col justify-between hover:border-brand-500/60 transition-all"
                  >
                    <div className="relative aspect-square rounded-lg bg-slate-900 overflow-hidden flex items-center justify-center border border-slate-800">
                      {slot.url ? (
                        <Image
                          src={slot.url}
                          alt={slot.label}
                          fill
                          className="object-cover group-hover:scale-105 transition-transform"
                        />
                      ) : (
                        <Camera className="size-6 text-slate-600" />
                      )}
                      {slot.url && (
                        <div className="absolute top-1 right-1 bg-emerald-500 text-white p-0.5 rounded-full">
                          <CheckCircle2 className="size-3" />
                        </div>
                      )}
                    </div>

                    <div className="space-y-1">
                      <span className="block text-[10px] font-bold text-white truncate">{slot.label}</span>
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => handleUploadPhotoSlot(slot.id)}
                        className="w-full h-6 text-[10px] bg-slate-900 hover:bg-slate-800 text-brand-400 border border-slate-800 font-bold"
                      >
                        <Upload className="size-2.5 mr-1" />
                        {slot.url ? 'Replace' : 'Upload'}
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Inspection Video Player Card */}
          <Card className="bg-slate-900 border-slate-800">
            <CardHeader className="p-5 border-b border-slate-800 flex flex-row items-center justify-between">
              <div>
                <CardTitle className="text-base font-extrabold text-white flex items-center gap-2">
                  <Video className="size-5 text-rose-400" />
                  Product Test Video Proof
                </CardTitle>
                <p className="text-xs text-slate-400">Short video proof showing box opening, power test &amp; serial number</p>
              </div>

              <Badge className="bg-rose-500/20 text-rose-400 border border-rose-500/30 text-xs font-bold">
                {videoUrl ? 'Video Uploaded' : 'Pending Upload'}
              </Badge>
            </CardHeader>

            <CardContent className="p-5">
              <div className="relative aspect-video rounded-2xl bg-slate-950 border border-slate-800 overflow-hidden flex items-center justify-center group">
                {videoUrl ? (
                  <div className="relative z-10 flex flex-col items-center space-y-3 text-center p-4">
                    <button
                      onClick={() => toast.info('Playing inspection video...')}
                      className="size-14 rounded-full bg-brand-500 hover:bg-brand-600 text-white flex items-center justify-center shadow-xl shadow-brand-500/40 transition-transform hover:scale-110"
                    >
                      <Play className="size-6 fill-current ml-1" />
                    </button>
                    <p className="text-xs font-extrabold text-white font-mono">
                      {currentOrder.orderNumber}_INSPECTION_VIDEO.MP4
                    </p>
                  </div>
                ) : (
                  <div className="flex flex-col items-center space-y-3 text-center p-4">
                    <Video className="size-10 text-slate-600" />
                    <p className="text-xs text-slate-400 max-w-xs">Record or upload a short field inspection video proof for customer approval</p>
                    <Button
                      onClick={() => {
                        setVideoUrl('https://cdn.lumo.trade/inspections/video-proof.mp4')
                        toast.success('Inspection video recorded and uploaded!')
                      }}
                      className="bg-rose-600 hover:bg-rose-700 text-white text-xs font-bold"
                    >
                      <Upload className="size-3.5 mr-1.5" />
                      Upload Video Recording
                    </Button>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}
