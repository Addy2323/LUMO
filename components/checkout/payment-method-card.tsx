'use client'

import Image from 'next/image'
import type { PaymentMethod } from '@/lib/mock/payments'
import { cn } from '@/lib/utils'

export interface PaymentMethodCardProps {
  method: PaymentMethod
  isSelected: boolean
  isAvailable: boolean
  statusNote?: string
  onSelect: (id: string) => void
}

export function PaymentMethodCard({
  method,
  isSelected,
  isAvailable,
  statusNote,
  onSelect,
}: PaymentMethodCardProps) {
  const Icon = method.icon

  return (
    <label
      htmlFor={`pay-${method.id}`}
      onClick={() => {
        if (isAvailable) {
          onSelect(method.id)
        }
      }}
      className={cn(
        'relative flex items-start gap-3 rounded-2xl border p-3.5 sm:p-4 transition-all duration-200 min-h-[44px]',
        !isAvailable
          ? 'opacity-60 bg-slate-50 border-slate-200 cursor-not-allowed'
          : isSelected
            ? 'border-primary bg-lumo-orange-light shadow-2xs cursor-pointer'
            : 'border-[#E2E8F0] bg-white hover:bg-slate-50/50 cursor-pointer'
      )}
    >
      {/* Radio Input */}
      <div className="pt-1 shrink-0">
        <input
          type="radio"
          id={`pay-${method.id}`}
          name="payment-method"
          disabled={!isAvailable}
          checked={isSelected && isAvailable}
          onChange={() => isAvailable && onSelect(method.id)}
          className="sr-only"
        />
        <div
          className={cn(
            'size-5 rounded-full border-2 flex items-center justify-center transition-colors',
            !isAvailable
              ? 'border-slate-300 bg-slate-100'
              : isSelected
                ? 'border-primary bg-primary'
                : 'border-slate-300 bg-white'
          )}
        >
          {isSelected && isAvailable && <div className="size-2 rounded-full bg-white" />}
        </div>
      </div>

      {/* Logo or Icon */}
      <div className="shrink-0 pt-0.5">
        {method.logo ? (
          <div className="relative h-6 w-10 sm:w-12 bg-white rounded border border-slate-200 p-0.5 flex items-center justify-center overflow-hidden">
            <Image
              src={method.logo}
              alt={method.name}
              fill
              sizes="48px"
              className="object-contain p-0.5"
            />
          </div>
        ) : (
          <Icon className="size-5 text-primary" />
        )}
      </div>

      {/* Method Details */}
      <div className="flex flex-col gap-0.5 min-w-0 flex-1 text-xs">
        <div className="flex items-center justify-between gap-1 flex-wrap">
          <span className="font-extrabold text-xs sm:text-sm text-[#0F172A]">{method.name}</span>
          {!isAvailable && (
            <span className="rounded-full bg-slate-200 px-2 py-0.5 text-[10px] font-bold text-slate-600">
              {statusNote || 'Coming Soon'}
            </span>
          )}
        </div>
        <span className="text-xs text-[#64748B] leading-tight font-medium">{method.description}</span>
      </div>
    </label>
  )
}
