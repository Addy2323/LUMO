'use client'

import { useState } from 'react'
import { FileText, Plus, Trash2, Edit2, Sparkles, Image as ImageIcon } from 'lucide-react'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { toast } from 'sonner'

type BannerContent = {
  id: string
  title: string
  subtitle: string
  ctaText: string
  ctaLink: string
  status: 'Active' | 'Draft'
}

const INITIAL_BANNERS: BannerContent[] = [
  {
    id: 'b1',
    title: 'Direct Factory Sourcing from China to Tanzania',
    subtitle: 'Air Freight in 5-7 Days · Sea Freight in 25-35 Days door-to-door.',
    ctaText: 'Paste Product Link',
    ctaLink: '/sourcing/paste-link',
    status: 'Active',
  },
  {
    id: 'b2',
    title: 'Off-Grid Solar Power Systems & Inverters',
    subtitle: 'Wholesale B2B prices for Tanzanian hardware retailers.',
    ctaText: 'Shop Solar Range',
    ctaLink: '/marketplace?category=Solar',
    status: 'Active',
  },
]

export default function AdminContentPage() {
  const [banners, setBanners] = useState<BannerContent[]>(INITIAL_BANNERS)
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [title, setTitle] = useState('')
  const [subtitle, setSubtitle] = useState('')
  const [ctaText, setCtaText] = useState('')
  const [ctaLink, setCtaLink] = useState('')

  function handleAddBanner() {
    if (!title.trim()) return

    const newBanner: BannerContent = {
      id: `b_${Date.now()}`,
      title: title.trim(),
      subtitle: subtitle.trim(),
      ctaText: ctaText.trim() || 'Explore Now',
      ctaLink: ctaLink.trim() || '/marketplace',
      status: 'Active',
    }

    setBanners([...banners, newBanner])
    toast.success('Marketplace promotional banner published!')
    setIsModalOpen(false)
  }

  function handleDelete(id: string) {
    setBanners(banners.filter((b) => b.id !== id))
    toast.success('Banner removed!')
  }

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-extrabold tracking-tight">CMS Banners &amp; Content Promotions</h1>
          <p className="text-sm text-muted-foreground">
            Manage marketplace homepage hero carousels, category spotlights, and promotional CTAs.
          </p>
        </div>
        <Button onClick={() => setIsModalOpen(true)} className="bg-brand-500 hover:bg-brand-600 text-white font-bold text-xs">
          <Plus className="size-4 mr-1.5" />
          Create Hero Banner
        </Button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {banners.map((b) => (
          <Card key={b.id} className="flex flex-col justify-between">
            <CardHeader className="pb-2 space-y-1">
              <div className="flex items-center justify-between">
                <Badge className="bg-emerald-600 text-white text-[10px] font-bold">{b.status}</Badge>
                <span className="font-mono text-xs text-brand-500 font-bold">{b.ctaLink}</span>
              </div>
              <CardTitle className="text-sm font-extrabold text-foreground">{b.title}</CardTitle>
              <CardDescription className="text-xs">{b.subtitle}</CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="flex justify-end">
                <Button variant="outline" size="xs" onClick={() => handleDelete(b.id)} className="text-xs text-destructive">
                  <Trash2 className="size-3.5" />
                </Button>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Modal */}
      {isModalOpen && (
        <Dialog open onOpenChange={setIsModalOpen}>
          <DialogContent className="max-w-md p-6">
            <DialogHeader>
              <DialogTitle className="text-base font-extrabold">Create Promotional Hero Banner</DialogTitle>
            </DialogHeader>

            <div className="space-y-4 text-xs">
              <div className="space-y-1">
                <label className="font-bold">Main Headline</label>
                <Input value={title} onChange={(e) => setTitle(e.target.value)} className="text-xs" />
              </div>

              <div className="space-y-1">
                <label className="font-bold">Subtitle Description</label>
                <Input value={subtitle} onChange={(e) => setSubtitle(e.target.value)} className="text-xs" />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="font-bold">Button Label</label>
                  <Input value={ctaText} onChange={(e) => setCtaText(e.target.value)} className="text-xs" />
                </div>
                <div className="space-y-1">
                  <label className="font-bold">Target Route Link</label>
                  <Input value={ctaLink} onChange={(e) => setCtaLink(e.target.value)} className="text-xs font-mono" />
                </div>
              </div>
            </div>

            <DialogFooter className="mt-4">
              <Button variant="outline" size="sm" onClick={() => setIsModalOpen(false)}>Cancel</Button>
              <Button size="sm" onClick={handleAddBanner} className="bg-brand-500 hover:bg-brand-600 text-white font-bold">Publish Banner</Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      )}
    </div>
  )
}
