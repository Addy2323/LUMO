'use client'

import React, { useState } from 'react'
import { Scale, Search, ShoppingCart, CheckCircle2, ArrowRight } from 'lucide-react'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import Link from 'next/link'

export default function ProductComparisonPage() {
  return (
    <div className="flex flex-col gap-5 font-sans antialiased text-slate-900 bg-[#f8fafc] min-h-screen p-3 md:p-6 pb-24">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-white p-4 rounded-xl border border-slate-200 shadow-sm">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-xl md:text-2xl font-black tracking-tight text-slate-900 flex items-center gap-2">
              <Scale className="size-6 text-[#FF6B00]" /> Product &amp; Supplier Comparison Matrix
            </h1>
            <Badge className="bg-orange-50 text-[#FF6B00] border-orange-200 text-[10px] font-bold">
              B2B Sourcing Audit
            </Badge>
          </div>
          <p className="text-xs text-slate-500 mt-0.5">
            Compare MOQ price tiers, supplier ratings, warranty terms, and landed delivery estimates side-by-side.
          </p>
        </div>

        <Button
          size="sm"
          className="bg-[#FF6B00] hover:bg-[#E05E00] text-white font-bold text-xs h-9 px-4 gap-2"
          render={<Link href="/marketplace" />}
        >
          <ShoppingCart className="size-4" /> Browse Marketplace
        </Button>
      </div>

      <Card className="bg-white border-slate-200 p-8 shadow-sm text-center space-y-3">
        <div className="max-w-md mx-auto space-y-2">
          <Scale className="size-10 text-slate-300 mx-auto" />
          <h3 className="text-base font-bold text-slate-800">No products added for comparison</h3>
          <p className="text-xs text-slate-500">
            Click &ldquo;Compare&rdquo; on any marketplace product or supplier quotation to view side-by-side landed cost breakdowns here.
          </p>
          <Button
            variant="outline"
            className="border-slate-200 text-xs font-bold mt-2"
            render={<Link href="/marketplace" />}
          >
            Explore B2B Products
          </Button>
        </div>
      </Card>
    </div>
  )
}
