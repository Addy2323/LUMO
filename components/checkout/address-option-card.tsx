'use client'

import { Home, Building2, Store } from 'lucide-react'
import type { Address } from '@/lib/mock/orders'
import { cn } from '@/lib/utils'

export interface AddressOptionCardProps {
  address: Address
  isSelected: boolean
  onSelect: (id: string) => void
}

function getAddressIcon(label: string) {
  const lower = label.toLowerCase()
  if (lower.includes('work') || lower.includes('office') || lower.includes('company')) {
    return Building2
  }
  if (lower.includes('store') || lower.includes('shop') || lower.includes('warehouse')) {
    return Store
  }
  return Home
}

export function AddressOptionCard({ address, isSelected, onSelect }: AddressOptionCardProps) {
  const Icon = getAddressIcon(address.label)

  return (
    <label
      htmlFor={`addr-${address.id}`}
      onClick={() => onSelect(address.id)}
      className={cn(
        'w-full max-w-full relative flex items-start gap-3 rounded-2xl border p-3.5 sm:p-4 cursor-pointer transition-all duration-200 min-h-[44px] overflow-hidden',
        isSelected
          ? 'border-[#F95700] bg-[#FFF8F3] shadow-2xs'
          : 'border-[#E2E8F0] bg-white hover:bg-slate-50/50'
      )}
    >
      {/* Radio Input */}
      <div className="pt-0.5 shrink-0">
        <input
          type="radio"
          id={`addr-${address.id}`}
          name="delivery-address"
          checked={isSelected}
          onChange={() => onSelect(address.id)}
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

      {/* Address Icon */}
      <div className="pt-0.5 shrink-0 text-[#F95700]">
        <Icon className="size-5" />
      </div>

      {/* Address Details */}
      <div className="flex flex-col gap-0.5 min-w-0 flex-1 text-xs overflow-hidden">
        <div className="flex items-center gap-2 flex-wrap">
          <span className="font-extrabold text-sm text-[#0F172A]">{address.label}</span>
          {address.isDefault && (
            <span className="shrink-0 rounded-full bg-[#FFF0E6] px-2 py-0.5 text-[10px] font-bold text-[#F95700] border border-[#FFD9C2]">
              Default Address
            </span>
          )}
        </div>

        <div className="text-xs font-semibold text-[#0F172A] truncate">
          {address.recipient} <span className="text-[#64748B] font-mono">• {address.phone}</span>
        </div>

        <div className="text-xs text-[#475569] leading-snug font-medium break-words">
          {address.street}, {address.ward}, {address.district}, {address.region}
        </div>
      </div>
    </label>
  )
}
