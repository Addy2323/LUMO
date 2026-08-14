'use client'

import { useState } from 'react'
import Link from 'next/link'
import { ChevronRight, Sparkles, Package } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { ProductCard, ProductCardSkeleton } from '@/components/marketplace/product-card'
import { useProducts } from '@/lib/api/hooks'
import { useT } from '@/lib/i18n/use-locale'

export function HomeProducts() {
  const t = useT()
  const [selectedCat, setSelectedCat] = useState<string | undefined>(undefined)

  const { data: products = [], isLoading } = useProducts({
    categoryId: selectedCat,
  })

  const categoryTabs = [
    { id: undefined, label: 'All Products' },
    { id: 'electronics', label: 'Electronics & Gadgets' },
    { id: 'home-kitchen', label: 'Home & Kitchen' },
    { id: 'fashion', label: 'Fashion & Apparel' },
    { id: 'health-beauty', label: 'Beauty & Health' },
    { id: 'solar-power', label: 'Solar & Clean Energy' },
  ]

  return (
    <section className="py-10 sm:py-14 bg-[#F4F8FC] border-t border-[#DCE6F0]/80">
      <div className="mx-auto max-w-[1600px] px-4 sm:px-6 lg:px-8">
        {/* Section Header */}
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 mb-6">
          <div>
            <div className="flex items-center gap-2 text-xs font-bold text-orange-600 uppercase tracking-wider mb-1">
              <Sparkles className="size-4" />
              Direct Factory Sourcing
            </div>
            <h2 className="text-xl sm:text-2xl font-extrabold text-[#0B1F3A] tracking-tight">
              Featured Factory Products
            </h2>
            <p className="text-xs sm:text-sm text-slate-500 mt-1">
              Explore verified products ready for air &amp; sea freight to Tanzania.
            </p>
          </div>

          <Link
            href="/marketplace"
            className="inline-flex items-center gap-1.5 text-sm font-bold text-[#164E8C] hover:text-[#0B3E78] transition-colors shrink-0"
          >
            <span>View All Marketplace Products ({products.length})</span>
            <ChevronRight className="size-4" />
          </Link>
        </div>

        {/* Category Filter Pills */}
        <div className="flex items-center gap-2 overflow-x-auto pb-3 mb-6 no-scrollbar">
          {categoryTabs.map((tab) => {
            const isActive = selectedCat === tab.id
            return (
              <button
                key={tab.label}
                type="button"
                onClick={() => setSelectedCat(tab.id)}
                className={`px-3.5 py-1.5 rounded-full text-xs font-bold transition-all whitespace-nowrap cursor-pointer ${
                  isActive
                    ? 'bg-[#0B1F3A] text-white shadow-sm'
                    : 'bg-white border border-[#DCE6F0] text-[#64748B] hover:text-[#0B1F3A] hover:border-[#164E8C]/40'
                }`}
              >
                {tab.label}
              </button>
            )
          })}
        </div>

        {/* Products Grid */}
        {isLoading ? (
          <div className="grid grid-cols-2 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-6 gap-3 sm:gap-4">
            {Array.from({ length: 12 }).map((_, index) => (
              <ProductCardSkeleton key={index} />
            ))}
          </div>
        ) : products.length > 0 ? (
          <div className="grid grid-cols-2 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-6 gap-3 sm:gap-4">
            {products.slice(0, 18).map((product) => (
              <ProductCard key={product.id} product={product} />
            ))}
          </div>
        ) : (
          <div className="bg-white rounded-2xl border border-[#DCE6F0] p-8 text-center flex flex-col items-center justify-center gap-3">
            <Package className="size-10 text-slate-300" />
            <span className="font-bold text-slate-700 text-sm">No products found in this category</span>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setSelectedCat(undefined)}
              className="text-xs font-bold border-[#0B1F3A]"
            >
              Reset Category Filter
            </Button>
          </div>
        )}

        {/* View All CTA Footer */}
        <div className="mt-10 text-center">
          <Button
            size="lg"
            className="bg-[#0B1F3A] hover:bg-[#164E8C] text-white font-bold text-sm px-8 rounded-xl shadow-sm"
            render={<Link href="/marketplace" />}
          >
            Explore Complete Lumo Sourcing Marketplace
            <ChevronRight className="size-4 ml-1" />
          </Button>
        </div>
      </div>
    </section>
  )
}
