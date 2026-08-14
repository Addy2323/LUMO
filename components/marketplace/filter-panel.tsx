'use client'

import { Checkbox } from '@/components/ui/checkbox'
import { Button } from '@/components/ui/button'
import { Field, FieldLabel, FieldSet, FieldLegend, FieldGroup } from '@/components/ui/field'
import { Input } from '@/components/ui/input'
import { Separator } from '@/components/ui/separator'
import { CATEGORIES } from '@/lib/mock/products'
import type { ProductQuery } from '@/lib/api/hooks'

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
  return (
    <div className="flex flex-col gap-5 bg-[#EAF1F8] dark:bg-slate-900 border border-[#D9E2EC] dark:border-slate-800 p-4.5 rounded-2xl shadow-2xs">
      <FieldSet>
        <FieldLegend variant="label" className="text-[#0B1F3A] dark:text-white font-bold text-xs">Category</FieldLegend>
        <FieldGroup className="gap-2.5 mt-2">
          {CATEGORIES.map((category) => (
            <Field key={category.id} orientation="horizontal">
              <Checkbox
                id={`cat-${category.id}`}
                checked={value.categoryId === category.id}
                onCheckedChange={(checked) =>
                  onChange({ ...value, categoryId: checked ? category.id : undefined })
                }
              />
              <FieldLabel htmlFor={`cat-${category.id}`} className="font-normal text-xs text-[#0B1F3A] dark:text-slate-200">
                <span className="flex w-full items-center justify-between gap-2">
                  <span className="truncate">{category.name}</span>
                  <span className="text-xs text-[#64748B] dark:text-slate-400 font-semibold">{category.productCount}</span>
                </span>
              </FieldLabel>
            </Field>
          ))}
        </FieldGroup>
      </FieldSet>

      <Separator className="bg-[#D9E2EC] dark:bg-slate-800" />

      <FieldSet>
        <FieldLegend variant="label" className="text-[#0B1F3A] dark:text-white font-bold text-xs">Price range (TZS)</FieldLegend>
        <div className="flex items-center gap-2 mt-2">
          <Input
            type="number"
            inputMode="numeric"
            min={0}
            placeholder="Min"
            aria-label="Minimum price"
            className="bg-white dark:bg-slate-950 border-[#D9E2EC] text-xs h-9"
            value={value.minPrice ?? ''}
            onChange={(event) =>
              onChange({
                ...value,
                minPrice: event.target.value ? Number(event.target.value) : undefined,
              })
            }
          />
          <span aria-hidden="true" className="text-[#64748B]">
            –
          </span>
          <Input
            type="number"
            inputMode="numeric"
            min={0}
            placeholder="Max"
            aria-label="Maximum price"
            className="bg-white dark:bg-slate-950 border-[#D9E2EC] text-xs h-9"
            value={value.maxPrice ?? ''}
            onChange={(event) =>
              onChange({
                ...value,
                maxPrice: event.target.value ? Number(event.target.value) : undefined,
              })
            }
          />
        </div>
      </FieldSet>

      <Separator className="bg-[#D9E2EC] dark:bg-slate-800" />

      <FieldSet>
        <FieldLegend variant="label" className="text-[#0B1F3A] dark:text-white font-bold text-xs">Customer rating</FieldLegend>
        <FieldGroup className="gap-2.5 mt-2">
          {[4, 3, 2].map((rating) => (
            <Field key={rating} orientation="horizontal">
              <Checkbox
                id={`rating-${rating}`}
                checked={value.minRating === rating}
                onCheckedChange={(checked) =>
                  onChange({ ...value, minRating: checked ? rating : undefined })
                }
              />
              <FieldLabel htmlFor={`rating-${rating}`} className="font-normal text-xs text-[#0B1F3A] dark:text-slate-200">
                {rating} stars &amp; up
              </FieldLabel>
            </Field>
          ))}
        </FieldGroup>
      </FieldSet>

      <Separator className="bg-[#D9E2EC] dark:bg-slate-800" />

      <Field orientation="horizontal">
        <Checkbox
          id="in-stock"
          checked={value.inStockOnly}
          onCheckedChange={(checked) => onChange({ ...value, inStockOnly: checked === true })}
        />
        <FieldLabel htmlFor="in-stock" className="font-normal text-xs text-[#0B1F3A] dark:text-slate-200">
          In stock only
        </FieldLabel>
      </Field>

      <Button variant="outline" size="sm" onClick={onReset} className="border-[#0B1F3A] text-[#0B1F3A] dark:text-slate-200 font-bold text-xs bg-white dark:bg-slate-900">
        Clear all filters
      </Button>
    </div>
  )
}
