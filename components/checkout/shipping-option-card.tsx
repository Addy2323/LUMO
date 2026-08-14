'use client'

import { Truck, Plane, Store } from 'lucide-react'
import { formatTZS } from '@/lib/format'
import { cn } from '@/lib/utils'

export interface ShippingOption {
  id: string
  name: string
  detail: string
  fee: number
  badge: string
}

export interface ShippingOptionCardProps {
  option: ShippingOption
  isSelected: boolean
  onSelect: (id: string) => void
}

function getShippingIcon(id: string) {
  if (id.includes('express') || id.includes('air') || id.includes('plane')) {
    return Plane
  }
  if (id.includes('pickup') || id.includes('hub') || id.includes('store')) {
    return Store
  }
  return Truck
}

export function ShippingOptionCard({ option, isSelected, onSelect }: ShippingOptionCardProps) {
  const Icon = getShippingIcon(option.id)

  return (
    <label
      htmlFor={`ship-${option.id}`}
      onClick={() => onSelect(option.id)}
      className={cn(
        'w-full max-w-full relative flex items-center justify-between gap-2.5 sm:gap-3 rounded-2xl border p-3 sm:p-4 cursor-pointer transition-all duration-200 min-h-[44px] overflow-hidden',
        isSelected
          ? 'border-[#F95700] bg-[#FFF8F3] shadow-2xs'
          : 'border-[#E2E8F0] bg-white hover:bg-slate-50/50'
      )}
    >
      <div className="flex items-start sm:items-center gap-2.5 sm:gap-3 min-w-0 flex-1 overflow-hidden">
        {/* Radio Input */}
        <div className="shrink-0 pt-0.5 sm:pt-0">
          <input
            type="radio"
            id={`ship-${option.id}`}
            name="shipping-speed"
            checked={isSelected}
            onChange={() => onSelect(option.id)}
            className="sr-only"
          />
          <div
            className={cn(
              'size-5 rounded-full border-2 flex items-center justify-center transition-colors',
              isSelected ? 'border-[#F95700] bg-[#F95700]' : 'border-slate-300 bg-white'
            )}
          >
            {isSelected && <div className="size-2 rounded-full bg-white" />}
          </div>
        </div>

        {/* Shipping Icon */}
        <div className="shrink-0 pt-0.5 sm:pt-0 text-[#F95700]">
          <Icon className="size-5" />
        </div>

        {/* Shipping Details */}
        <div className="flex flex-col gap-0.5 min-w-0 flex-1 overflow-hidden">
          <div className="flex items-center gap-1.5 sm:gap-2 flex-wrap">
            <span className="font-extrabold text-xs sm:text-sm text-[#0F172A] leading-tight">{option.name}</span>
            <span className="shrink-0 rounded-full bg-slate-100 px-2 py-0.5 text-[10px] font-bold text-[#475569] border border-slate-200">
              {option.badge}
            </span>
          </div>
          <span className="text-xs text-[#64748B] font-medium leading-tight break-words">{option.detail}</span>
        </div>
      </div>

      {/* Price Aligned Right */}
      <span className="text-xs sm:text-sm font-black tnum shrink-0 text-[#0F172A] pl-1.5">
        {option.fee === 0 ? (
          <span className="text-[#137333]">FREE</span>
        ) : (
          formatTZS(option.fee)
        )}
      </span>
    </label>
  )
}
