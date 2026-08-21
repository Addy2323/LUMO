'use client'

import { useEffect, useMemo, useState } from 'react'
import Link from 'next/link'
import { usePathname, useRouter, useSearchParams } from 'next/navigation'
import { AlertCircle, Filter, PackageSearch, RefreshCw, Search, Sparkles, X } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Empty, EmptyDescription, EmptyHeader, EmptyMedia, EmptyTitle } from '@/components/ui/empty'
import { InputGroup, InputGroupAddon, InputGroupInput } from '@/components/ui/input-group'
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from '@/components/ui/sheet'
import { FilterPanel, type FilterState } from '@/components/marketplace/filter-panel'
import { ProductCard, ProductCardSkeleton } from '@/components/marketplace/product-card'
import { AmazingConfirmModal } from '@/components/ui/amazing-confirm-modal'
import { useProducts, type ProductQuery } from '@/lib/api/hooks'
import { useT } from '@/lib/i18n/use-locale'

export function MarketplaceBrowser() {
  const t = useT()
  const router = useRouter()
  const pathname = usePathname()
  const searchParams = useSearchParams()

  const sortOptions = [
    { value: 'relevance', label: t('marketplace.mostPopular') },
    { value: 'newest', label: t('marketplace.newest') },
    { value: 'price_asc', label: t('marketplace.priceLowHigh') },
    { value: 'price_desc', label: t('marketplace.priceHighLow') },
    { value: 'rating', label: t('marketplace.topRated') },
  ] as const

  const sortItems = Object.fromEntries(sortOptions.map((option) => [option.value, option.label]))

  const initialQuery = searchParams.get('q') || ''
  const initialCategory = searchParams.get('category') || undefined
  const initialSort = (searchParams.get('sort') as NonNullable<ProductQuery['sort']>) || 'relevance'

  const [search, setSearch] = useState(initialQuery)
  const [sort, setSort] = useState<NonNullable<ProductQuery['sort']>>(initialSort)
  const [showClearConfirm, setShowClearConfirm] = useState(false)
  const [filters, setFilters] = useState<FilterState>({
    inStockOnly: false,
    categoryId: initialCategory,
  })

  // Sync state to URL search parameters
  useEffect(() => {
    const params = new URLSearchParams()
    if (search.trim()) params.set('q', search.trim())
    if (filters.categoryId) params.set('category', filters.categoryId)
    if (sort && sort !== 'relevance') params.set('sort', sort)

    const queryString = params.toString()
    const targetUrl = queryString ? `${pathname}?${queryString}` : pathname
    router.replace(targetUrl, { scroll: false })
  }, [search, filters, sort, pathname, router])

  const query = useMemo<ProductQuery>(
    () => ({ q: search.trim(), sort, ...filters }),
    [search, sort, filters],
  )
  const { data: products, isLoading, isError, refetch } = useProducts(query)

  const activeFilterCount =
    (filters.categoryId ? 1 : 0) +
    (filters.minPrice !== undefined || filters.maxPrice !== undefined ? 1 : 0) +
    (filters.minRating !== undefined ? 1 : 0) +
    (filters.inStockOnly ? 1 : 0)

  const hasActiveSearchOrFilter =
    Boolean(search.trim()) ||
    Boolean(filters.categoryId) ||
    filters.minPrice !== undefined ||
    filters.maxPrice !== undefined ||
    filters.minRating !== undefined ||
    filters.inStockOnly

  const filterPanel = (
    <FilterPanel
      value={filters}
      onChange={setFilters}
      onReset={() => setFilters({ inStockOnly: false })}
    />
  )

  return (
    <div className="flex min-w-0 flex-col gap-5 lg:flex-row lg:gap-8 lg:h-[calc(100vh-6rem)] lg:overflow-hidden">
      <aside className="hidden w-72 shrink-0 lg:block lg:h-full lg:overflow-y-auto custom-scrollbar pr-1 pb-10">
        {filterPanel}
      </aside>

      <div className="flex min-w-0 flex-1 flex-col gap-4 lg:h-full lg:overflow-y-auto custom-scrollbar pr-2 pb-10">
        {/* Can't find product sourcing banner */}
        <div className="bg-orange-50/90 dark:bg-orange-950/30 border border-orange-200 dark:border-orange-500/30 rounded-xl p-3.5 sm:p-4 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 text-xs shadow-2xs">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-full bg-orange-600 text-white shrink-0 shadow-xs">
              <Sparkles className="size-4" aria-hidden="true" />
            </div>
            <div>
              <span className="font-extrabold text-[#0B1F3A] dark:text-white block text-sm tracking-tight">{t('marketplace.cantFindBannerTitle')}</span>
              <span className="text-slate-600 dark:text-slate-300 text-[11px] font-medium leading-relaxed block">
                {t('marketplace.cantFindBannerDesc')}
              </span>
            </div>
          </div>

          <Button size="sm" className="bg-primary hover:bg-primary/80 text-white font-bold text-xs shrink-0 rounded-lg px-4 shadow-xs" render={<Link href="/sourcing/paste-link" />}>
            {t('marketplace.requestGlobalSourcing')}
          </Button>
        </div>

        {/* 19. Search and Sort Bar */}
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
          <InputGroup className="sm:flex-1 relative">
            <InputGroupInput
              placeholder={t('marketplace.searchPlaceholder')}
              aria-label={t('marketplace.searchPlaceholder')}
              value={search}
              onChange={(event) => setSearch(event.target.value)}
            />
            {search ? (
              <button
                type="button"
                onClick={() => setSearch('')}
                className="absolute right-9 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-200 p-1"
                aria-label="Clear search query"
              >
                <X className="size-4" />
              </button>
            ) : null}
            <InputGroupAddon>
              <Search aria-hidden="true" />
            </InputGroupAddon>
          </InputGroup>

          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setShowClearConfirm(true)}
              className="text-xs font-bold border-red-200 text-red-600 hover:bg-red-50 dark:border-red-900/50 dark:text-red-400 dark:hover:bg-red-950/40 cursor-pointer"
            >
              Clear All Products
            </Button>
            <Sheet>
              <SheetTrigger
                render={
                  <Button variant="outline" className="lg:hidden">
                    <Filter data-icon="inline-start" aria-hidden="true" />
                    {t('marketplace.categories')}
                    {activeFilterCount > 0 ? ` (${activeFilterCount})` : ''}
                  </Button>
                }
              />
              <SheetContent side="left" className="w-[85vw] max-w-sm overflow-y-auto">
                <SheetHeader>
                  <SheetTitle>{t('marketplace.categories')}</SheetTitle>
                </SheetHeader>
                <div className="px-4 pb-6">{filterPanel}</div>
              </SheetContent>
            </Sheet>

            <Select
              items={sortItems}
              value={sort}
              onValueChange={(value) => setSort(value as NonNullable<ProductQuery['sort']>)}
            >
              <SelectTrigger className="w-full sm:w-48" aria-label={t('marketplace.sortLabel')}>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectGroup>
                  {sortOptions.map((option) => (
                    <SelectItem key={option.value} value={option.value}>
                      {option.label}
                    </SelectItem>
                  ))}
                </SelectGroup>
              </SelectContent>
            </Select>
          </div>
        </div>

        {/* 17. Marketplace States */}
        {!isLoading && !isError && (
          <p aria-live="polite" className="text-sm text-slate-400 font-medium">
            {t('marketplace.productsFound', { count: products?.length ?? 0 })}
          </p>
        )}

        {/* Loading State */}
        {isLoading ? (
          <div>
            <p aria-live="polite" className="text-sm text-slate-400 mb-4 animate-pulse">
              {t('common.loading')}
            </p>
            <div className="grid grid-cols-2 sm:grid-cols-2 gap-3 sm:gap-4 md:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-5 3xl:grid-cols-6">
              {Array.from({ length: 12 }).map((_, index) => (
                <ProductCardSkeleton key={index} />
              ))}
            </div>
          </div>
        ) : isError ? (
          /* Error State */
          <Empty className="animate-fade-in border border-slate-800 bg-slate-900/50 p-8 rounded-2xl">
            <EmptyHeader>
              <EmptyMedia variant="icon">
                <AlertCircle className="text-red-400" />
              </EmptyMedia>
              <EmptyTitle className="text-white font-bold text-lg">{t('marketplace.loadErrorTitle')}</EmptyTitle>
              <EmptyDescription className="text-slate-400 text-sm">
                {t('marketplace.loadErrorDesc')}
              </EmptyDescription>
            </EmptyHeader>
            <div className="flex flex-wrap justify-center gap-3 mt-4">
              <Button variant="outline" onClick={() => refetch()} className="border-slate-700">
                <RefreshCw className="size-4 mr-2" />
                {t('common.tryAgain')}
              </Button>
              <Button className="bg-orange-500 hover:bg-orange-600 text-white font-bold" render={<Link href="/sourcing/paste-link" />}>
                {t('marketplace.requestGlobalSourcing')}
              </Button>
            </div>
          </Empty>
        ) : products && products.length > 0 ? (
          /* Successful Products State */
          <div className="grid grid-cols-2 sm:grid-cols-2 gap-3 sm:gap-4 md:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-5 3xl:grid-cols-6">
            {products.map((product) => (
              <ProductCard key={product.id} product={product} />
            ))}
          </div>
        ) : hasActiveSearchOrFilter ? (
          /* Empty Search / Filter Results */
          <Empty className="animate-fade-in border border-slate-800 bg-slate-900/50 p-8 rounded-2xl">
            <EmptyHeader>
              <EmptyMedia variant="icon">
                <Search className="text-orange-400" />
              </EmptyMedia>
              <EmptyTitle className="text-white font-bold text-lg">{t('marketplace.noProductsMatch')}</EmptyTitle>
              <EmptyDescription className="text-slate-400 text-sm">
                {t('marketplace.noProductsDescription')}
              </EmptyDescription>
            </EmptyHeader>
            <div className="flex flex-wrap justify-center gap-3 mt-4">
              <Button
                variant="outline"
                onClick={() => {
                  setSearch('')
                  setFilters({ inStockOnly: false })
                }}
                className="border-slate-700"
              >
                {t('marketplace.clearFilters')}
              </Button>
              <Button className="bg-orange-500 hover:bg-orange-600 text-white font-bold" render={<Link href="/sourcing/paste-link" />}>
                {t('marketplace.requestGlobalSourcing')}
              </Button>
            </div>
          </Empty>
        ) : (
          /* Valid Empty Database State */
          <Empty className="border border-slate-800 bg-slate-900/50 p-8 rounded-2xl">
            <EmptyHeader>
              <EmptyMedia variant="icon">
                <PackageSearch className="text-orange-400" />
              </EmptyMedia>
              <EmptyTitle className="text-white font-bold text-lg">{t('marketplace.productsPreparing')}</EmptyTitle>
              <EmptyDescription className="text-slate-400 text-sm">
                {t('marketplace.productsPreparingDesc')}
              </EmptyDescription>
            </EmptyHeader>
            <div className="flex flex-wrap justify-center gap-3 mt-4">
              <Button variant="outline" onClick={() => refetch()} className="border-slate-700">
                <RefreshCw className="size-4 mr-2" />
                {t('marketplace.refreshProducts')}
              </Button>
              <Button className="bg-orange-500 hover:bg-orange-600 text-white font-bold" render={<Link href="/sourcing/paste-link" />}>
                {t('marketplace.requestGlobalSourcing')}
              </Button>
            </div>
          </Empty>
        )}
      </div>

      <AmazingConfirmModal
        isOpen={showClearConfirm}
        onClose={() => setShowClearConfirm(false)}
        title="Clear Entire Catalog & Database?"
        description="Are you sure you want to completely delete all imported products from catalog & database? This action cannot be undone."
        confirmText="Yes, Clear All Products"
        cancelText="Cancel"
        variant="destructive"
        onConfirm={async () => {
          try {
            await fetch('/api/products', { method: 'DELETE' })
            if (typeof window !== 'undefined') {
              localStorage.removeItem('lumoo-supplier-store-v2')
              localStorage.removeItem('lumo_published_products')
              window.dispatchEvent(new Event('lumo_catalog_updated'))
              window.location.reload()
            }
          } catch (err) {
            console.error('Failed to delete catalog:', err)
          }
        }}
      />
    </div>
  )
}

