'use client'

import { Dialog, DialogContent, DialogTitle } from '@/components/ui/dialog'
import { ProductDetail } from '@/components/marketplace/product-detail'

export function ProductDetailModal({
  slug,
  open,
  onOpenChange,
}: {
  slug: string | null
  open: boolean
  onOpenChange: (open: boolean) => void
}) {
  if (!slug) return null

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="w-[94vw] max-w-5xl max-h-[90vh] overflow-y-auto overflow-x-hidden p-5 sm:p-7 rounded-2xl border bg-card text-card-foreground shadow-2xl">
        <DialogTitle className="sr-only">Product Details</DialogTitle>
        <ProductDetail slug={slug} isModal={true} />
      </DialogContent>
    </Dialog>
  )
}
