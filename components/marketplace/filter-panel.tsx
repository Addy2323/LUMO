'use client'

import { Checkbox } from '@/components/ui/checkbox'
import { Button } from '@/components/ui/button'
import { Field, FieldLabel, FieldSet, FieldLegend, FieldGroup } from '@/components/ui/field'
import { Input } from '@/components/ui/input'
import { Separator } from '@/components/ui/separator'
import { CATEGORIES } from '@/lib/mock/products'
import type { ProductQuery } from '@/lib/api/hooks'
import { Filter, Layers, RotateCcw, Star, Tag, CheckCircle2 } from 'lucide-react'

export type FilterState = Required<Pick<ProductQuery, 'inStockOnly'>> & {
  categoryId?: string
  minPrice?: number
  maxPrice?: number
  minRating?: number
}

export function FilterPanel({
  value,
  onChange,
  onReset,
}: {
  value: FilterState
  onChange: (next: FilterState) => void
  onReset: () => void
}) {
  const hasActiveFilters =
    Boolean(value.categoryId) ||
    value.minPrice !== undefined ||
    value.maxPrice !== undefined ||
    value.minRating !== undefined ||
    value.inStockOnly

  return (
    <div className="flex flex-col gap-4 bg-white dark:bg-[#0B1F3A]/90 border border-slate-200/80 dark:border-slate-800 p-4 rounded-2xl shadow-xs backdrop-blur-xs">
      {/* Header section with Filter badge */}
      <div className="flex items-center justify-between pb-2 border-b border-slate-100 dark:border-slate-800/80">
        <div className="flex items-center gap-2">
          <div className="p-1.5 rounded-lg bg-orange-50 dark:bg-orange-950/40 text-primary">
            <Filter className="size-4" />
          </div>
          <span className="font-extrabold text-sm text-[#0B1F3A] dark:text-white tracking-tight">
            Filters
          </span>
        </div>
        {hasActiveFilters && (
          <button
            type="button"
            onClick={onReset}
            className="flex items-center gap-1 text-[11px] font-bold text-primary hover:text-primary/80 transition-colors cursor-pointer"
          >
            <RotateCcw className="size-3" />
            Reset
          </button>
        )}
      </div>

      {/* Category Section */}
      <FieldSet className="space-y-2">
        <div className="flex items-center justify-between">
          <FieldLegend variant="label" className="text-[#0B1F3A] dark:text-slate-200 font-extrabold text-xs flex items-center gap-1.5">
            <Layers className="size-3.5 text-slate-400" />
            Category
          </FieldLegend>
          {value.categoryId && (
            <button
              type="button"
              onClick={() => onChange({ ...value, categoryId: undefined })}
              className="text-[10px] text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 font-semibold"
            >
              All Categories
            </button>
          )}
        </div>

        <div className="flex flex-col gap-1 mt-1 max-h-64 overflow-y-auto pr-1 custom-scrollbar">
          {/* All Categories Option */}
          <button
            type="button"
            onClick={() => onChange({ ...value, categoryId: undefined })}
            className={`w-full flex items-center justify-between text-left text-xs px-2.5 py-1.5 rounded-lg transition-all cursor-pointer font-medium ${
              !value.categoryId
                ? 'bg-primary/10 text-primary font-bold border border-primary/20'
                : 'text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800/60'
            }`}
          >
            <span>All Categories</span>
            <span className="text-[10px] font-bold opacity-70 bg-slate-200/50 dark:bg-slate-800 px-1.5 py-0.5 rounded-md">
              {CATEGORIES.reduce((acc, c) => acc + c.productCount, 0)}
            </span>
          </button>

          {CATEGORIES.map((category) => {
            const isSelected = value.categoryId === category.id
            return (
              <button
                key={category.id}
                type="button"
                onClick={() =>
                  onChange({
                    ...value,
                    categoryId: isSelected ? undefined : category.id,
                  })
                }
                className={`w-full flex items-center justify-between text-left text-xs px-2.5 py-1.5 rounded-lg transition-all cursor-pointer ${
                  isSelected
                    ? 'bg-primary text-white font-bold shadow-2xs'
                    : 'text-[#0B1F3A] dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800/60'
                }`}
              >
                <span className="truncate flex items-center gap-1.5">
                  {isSelected && <CheckCircle2 className="size-3 shrink-0" />}
                  <span className="truncate">{category.name}</span>
                </span>
                <span
                  className={`text-[10px] font-bold px-1.5 py-0.5 rounded-md shrink-0 ${
                    isSelected
                      ? 'bg-white/20 text-white'
                      : 'text-slate-500 dark:text-slate-400 bg-slate-100 dark:bg-slate-800'
                  }`}
                >
                  {category.productCount}
                </span>
              </button>
            )
          })}
        </div>
      </FieldSet>

      <Separator className="bg-slate-200/70 dark:bg-slate-800" />

      {/* Price Range Section */}
      <FieldSet className="space-y-2">
        <FieldLegend variant="label" className="text-[#0B1F3A] dark:text-slate-200 font-extrabold text-xs flex items-center gap-1.5">
          <Tag className="size-3.5 text-slate-400" />
          Price Range (TZS)
        </FieldLegend>
        <div className="grid grid-cols-2 gap-2 mt-1">
          <div className="relative flex items-center">
            <span className="absolute left-2.5 text-[10px] font-bold text-slate-400 select-none">
              Min
            </span>
            <Input
              type="number"
              inputMode="numeric"
              min={0}
              placeholder="0"
              aria-label="Minimum price in TZS"
              className="bg-slate-50 dark:bg-slate-900 border-slate-200 dark:border-slate-800 text-xs h-8.5 pl-9 font-medium focus:border-primary"
              value={value.minPrice ?? ''}
              onChange={(event) =>
                onChange({
                  ...value,
                  minPrice: event.target.value ? Number(event.target.value) : undefined,
                })
              }
            />
          </div>
          <div className="relative flex items-center">
            <span className="absolute left-2.5 text-[10px] font-bold text-slate-400 select-none">
              Max
            </span>
            <Input
              type="number"
              inputMode="numeric"
              min={0}
              placeholder="Any"
              aria-label="Maximum price in TZS"
              className="bg-slate-50 dark:bg-slate-900 border-slate-200 dark:border-slate-800 text-xs h-8.5 pl-9 font-medium focus:border-primary"
              value={value.maxPrice ?? ''}
              onChange={(event) =>
                onChange({
                  ...value,
                  maxPrice: event.target.value ? Number(event.target.value) : undefined,
                })
              }
            />
          </div>
        </div>
      </FieldSet>

      <Separator className="bg-slate-200/70 dark:bg-slate-800" />

      {/* Customer Rating Section with Golden Stars */}
      <FieldSet className="space-y-2">
        <FieldLegend variant="label" className="text-[#0B1F3A] dark:text-slate-200 font-extrabold text-xs flex items-center gap-1.5">
          <Star className="size-3.5 text-amber-500 fill-amber-500" />
          Customer Rating
        </FieldLegend>
        <div className="flex flex-col gap-1 mt-1">
          {[4, 3, 2].map((rating) => {
            const isSelected = value.minRating === rating
            return (
              <button
                key={rating}
                type="button"
                onClick={() =>
                  onChange({
                    ...value,
                    minRating: isSelected ? undefined : rating,
                  })
                }
                className={`flex items-center justify-between text-xs px-2.5 py-1.5 rounded-lg transition-colors cursor-pointer ${
                  isSelected
                    ? 'bg-amber-500/10 text-amber-700 dark:text-amber-400 font-bold border border-amber-500/30'
                    : 'text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800/60'
                }`}
              >
                <div className="flex items-center gap-1.5">
                  <div className="flex items-center gap-0.5 text-amber-500">
                    {Array.from({ length: 5 }).map((_, i) => (
                      <Star
                        key={i}
                        className={`size-3 ${
                          i < rating ? 'fill-amber-400 text-amber-400' : 'text-slate-300 dark:text-slate-700'
                        }`}
                      />
                    ))}
                  </div>
                  <span className="text-[11px] font-semibold">&amp; up</span>
                </div>
                {isSelected && <span className="text-[10px] font-extrabold text-amber-600 dark:text-amber-400">Selected</span>}
              </button>
            )
          })}
        </div>
      </FieldSet>

      <Separator className="bg-slate-200/70 dark:bg-slate-800" />

      {/* In Stock Toggle */}
      <div className="flex items-center justify-between pt-0.5">
        <label htmlFor="in-stock-toggle" className="text-xs font-bold text-[#0B1F3A] dark:text-slate-200 cursor-pointer">
          In Stock Only
        </label>
        <input
          id="in-stock-toggle"
          type="checkbox"
          checked={value.inStockOnly}
          onChange={(e) => onChange({ ...value, inStockOnly: e.target.checked })}
          className="size-4 rounded border-slate-300 text-primary focus:ring-primary cursor-pointer accent-primary"
        />
      </div>

      {hasActiveFilters && (
        <Button
          variant="outline"
          size="sm"
          onClick={onReset}
          className="w-full mt-1 border-slate-300 dark:border-slate-700 text-slate-700 dark:text-slate-200 font-bold text-xs hover:bg-slate-100 dark:hover:bg-slate-800 cursor-pointer"
        >
          Clear All Filters
        </Button>
      )}
    </div>
  )
}
