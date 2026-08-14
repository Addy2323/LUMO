'use client'

import { useState } from 'react'
import { MessageSquare, Plus, Search, Trash2, Edit2, Copy, Check, Tag } from 'lucide-react'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { toast } from 'sonner'

type CannedTemplate = {
  id: string
  title: string
  shortcut: string
  category: 'Sourcing' | 'Logistics' | 'Billing' | 'Returns' | 'General'
  content: string
}

const INITIAL_TEMPLATES: CannedTemplate[] = [
  {
    id: 'tmpl_1',
    title: 'Formal Landed Quotation Issued',
    shortcut: '/quote-issued',
    category: 'Sourcing',
    content:
      'Dear {{customer_name}},\n\nYour official landed quotation for {{product_title}} has been published to your Lumoo portal. The quote covers supplier unit costs, sea/air freight, TRA import tariffs, and door-step delivery.\n\nPlease review and approve the quotation to lock in cargo allocation.\n\nBest regards,\nLumoo Sales Desk',
  },
  {
    id: 'tmpl_2',
    title: 'Customs Clearance Update (JNIA / Dar Port)',
    shortcut: '/customs-update',
    category: 'Logistics',
    content:
      'Hello {{customer_name}},\n\nYour shipment {{shipment_id}} is undergoing TRA valuation clearance at Dar es Salaam. We anticipate manifest release within 24-48 business hours.\n\nTrack real-time freight progress at lumoo.co.tz/track-freight.',
  },
  {
    id: 'tmpl_3',
    title: 'Payment Confirmation & Escrow Release',
    shortcut: '/pay-confirm',
    category: 'Billing',
    content:
      'Dear {{customer_name}},\n\nWe have confirmed your payment receipt via Vodacom M-Pesa / CRDB Bank. Your funds are secured in Lumoo Escrow until goods arrive in Dar es Salaam.\n\nThank you for choosing Lumoo B2B!',
  },
]

export default function CannedResponsesPage() {
  const [templates, setTemplates] = useState<CannedTemplate[]>(INITIAL_TEMPLATES)
  const [search, setSearch] = useState('')
  const [selectedCategory, setSelectedCategory] = useState<string>('all')

  // Modal State
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [editingTemplate, setEditingTemplate] = useState<CannedTemplate | null>(null)
  const [title, setTitle] = useState('')
  const [shortcut, setShortcut] = useState('')
  const [category, setCategory] = useState<CannedTemplate['category']>('Sourcing')
  const [content, setContent] = useState('')

  const [copiedId, setCopiedId] = useState<string | null>(null)

  const filtered = templates.filter((t) => {
    const matchesCat = selectedCategory === 'all' || t.category === selectedCategory
    const q = search.toLowerCase()
    const matchesSearch =
      q === '' ||
      t.title.toLowerCase().includes(q) ||
      t.shortcut.toLowerCase().includes(q) ||
      t.content.toLowerCase().includes(q)
    return matchesCat && matchesSearch
  })

  function handleOpenCreate() {
    setEditingTemplate(null)
    setTitle('')
    setShortcut('/')
    setCategory('Sourcing')
    setContent('')
    setIsModalOpen(true)
  }

  function handleOpenEdit(tmpl: CannedTemplate) {
    setEditingTemplate(tmpl)
    setTitle(tmpl.title)
    setShortcut(tmpl.shortcut)
    setCategory(tmpl.category)
    setContent(tmpl.content)
    setIsModalOpen(true)
  }

  function handleSave() {
    if (!title.trim() || !content.trim()) {
      toast.error('Title and template content are required')
      return
    }

    if (editingTemplate) {
      setTemplates(
        templates.map((t) =>
          t.id === editingTemplate.id
            ? { ...t, title: title.trim(), shortcut: shortcut.trim(), category, content: content.trim() }
            : t,
        ),
      )
      toast.success('Template updated successfully!')
    } else {
      const newTmpl: CannedTemplate = {
        id: `tmpl_${Date.now()}`,
        title: title.trim(),
        shortcut: shortcut.trim().startsWith('/') ? shortcut.trim() : `/${shortcut.trim()}`,
        category,
        content: content.trim(),
      }
      setTemplates([...templates, newTmpl])
      toast.success('New response template added!')
    }

    setIsModalOpen(false)
  }

  function handleDelete(id: string) {
    setTemplates(templates.filter((t) => t.id !== id))
    toast.success('Template deleted!')
  }

  function handleCopy(tmpl: CannedTemplate) {
    navigator.clipboard.writeText(tmpl.content)
    setCopiedId(tmpl.id)
    toast.success('Template text copied to clipboard!')
    setTimeout(() => setCopiedId(null), 2000)
  }

  return (
    <div className="flex flex-col gap-6">
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-extrabold tracking-tight">Canned Responses &amp; Quick Templates</h1>
          <p className="text-sm text-muted-foreground">
            Standardized email &amp; chat response snippets for rapid customer service ticket resolution.
          </p>
        </div>
        <Button onClick={handleOpenCreate} className="bg-brand-500 hover:bg-brand-600 text-white font-bold text-xs">
          <Plus className="size-4 mr-1.5" />
          Create Template
        </Button>
      </div>

      {/* Filter Bar */}
      <Card>
        <CardContent className="p-4 flex flex-col sm:flex-row gap-3 items-center justify-between">
          <div className="relative w-full sm:w-80">
            <Search className="absolute left-2.5 top-2.5 size-4 text-muted-foreground" />
            <Input
              placeholder="Search templates or shortcut keywords..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-8 text-xs"
            />
          </div>

          <div className="flex items-center gap-1.5 flex-wrap w-full sm:w-auto">
            {['all', 'Sourcing', 'Logistics', 'Billing', 'Returns', 'General'].map((cat) => (
              <Button
                key={cat}
                variant={selectedCategory === cat ? 'default' : 'outline'}
                size="xs"
                onClick={() => setSelectedCategory(cat)}
                className="text-xs font-bold capitalize"
              >
                {cat}
              </Button>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Templates Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {filtered.map((tmpl) => (
          <Card key={tmpl.id} className="flex flex-col justify-between hover:shadow-md transition-shadow">
            <CardHeader className="pb-3 space-y-1.5">
              <div className="flex items-center justify-between">
                <Badge variant="outline" className="text-[10px] font-bold">
                  {tmpl.category}
                </Badge>
                <span className="font-mono text-[11px] text-brand-500 font-bold bg-brand-500/10 px-2 py-0.5 rounded">
                  {tmpl.shortcut}
                </span>
              </div>
              <CardTitle className="text-sm font-extrabold text-foreground">{tmpl.title}</CardTitle>
            </CardHeader>

            <CardContent className="space-y-4 flex-1 flex flex-col justify-between">
              <div className="bg-muted/40 p-3 rounded-lg border text-xs text-muted-foreground font-mono whitespace-pre-wrap line-clamp-4">
                {tmpl.content}
              </div>

              <div className="flex items-center justify-between pt-2 border-t">
                <Button variant="ghost" size="xs" onClick={() => handleCopy(tmpl)} className="text-xs font-bold">
                  {copiedId === tmpl.id ? (
                    <>
                      <Check className="size-3.5 mr-1 text-emerald-500" />
                      Copied!
                    </>
                  ) : (
                    <>
                      <Copy className="size-3.5 mr-1" />
                      Copy Text
                    </>
                  )}
                </Button>

                <div className="flex items-center gap-1">
                  <Button variant="outline" size="xs" onClick={() => handleOpenEdit(tmpl)} className="text-xs">
                    <Edit2 className="size-3.5" />
                  </Button>
                  <Button
                    variant="outline"
                    size="xs"
                    onClick={() => handleDelete(tmpl.id)}
                    className="text-xs text-destructive hover:bg-destructive/10"
                  >
                    <Trash2 className="size-3.5" />
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Create / Edit Modal */}
      {isModalOpen && (
        <Dialog open onOpenChange={setIsModalOpen}>
          <DialogContent className="max-w-lg p-6">
            <DialogHeader>
              <DialogTitle className="text-base font-extrabold">
                {editingTemplate ? 'Edit Response Template' : 'Create Canned Response'}
              </DialogTitle>
            </DialogHeader>

            <div className="space-y-4 text-xs">
              <div className="space-y-1">
                <label className="font-bold">Template Title</label>
                <Input
                  placeholder="e.g. Quotation Re-issue Notice"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  className="text-xs"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="font-bold">Slash Shortcut</label>
                  <Input
                    placeholder="/quote-reissue"
                    value={shortcut}
                    onChange={(e) => setShortcut(e.target.value)}
                    className="text-xs font-mono"
                  />
                </div>
                <div className="space-y-1">
                  <label className="font-bold">Category</label>
                  <select
                    value={category}
                    onChange={(e) => setCategory(e.target.value as CannedTemplate['category'])}
                    className="w-full h-9 rounded-md border border-input bg-background px-3 text-xs font-bold"
                  >
                    <option value="Sourcing">Sourcing</option>
                    <option value="Logistics">Logistics</option>
                    <option value="Billing">Billing</option>
                    <option value="Returns">Returns</option>
                    <option value="General">General</option>
                  </select>
                </div>
              </div>

              <div className="space-y-1">
                <label className="font-bold">Template Text Content</label>
                <Textarea
                  placeholder="Use dynamic tags like {{customer_name}}, {{order_id}}, {{shipment_id}}..."
                  value={content}
                  onChange={(e) => setContent(e.target.value)}
                  rows={5}
                  className="text-xs font-mono"
                />
              </div>
            </div>

            <DialogFooter className="mt-4">
              <Button variant="outline" size="sm" onClick={() => setIsModalOpen(false)}>
                Cancel
              </Button>
              <Button size="sm" onClick={handleSave} className="bg-brand-500 hover:bg-brand-600 text-white font-bold">
                Save Template
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      )}
    </div>
  )
}
