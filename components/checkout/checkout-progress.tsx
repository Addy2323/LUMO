'use client'

import { Check } from 'lucide-react'
import { cn } from '@/lib/utils'

export interface StepItem {
  id: number
  label: string
}

const STEPS: StepItem[] = [
  { id: 0, label: 'Delivery & Shipping' },
  { id: 1, label: 'Payment & Protection' },
  { id: 2, label: 'Order Review' },
]

export interface CheckoutProgressProps {
  currentStep: 0 | 1 | 2
  onStepClick?: (step: 0 | 1 | 2) => void
}

export function CheckoutProgress({ currentStep, onStepClick }: CheckoutProgressProps) {
  return (
    <nav aria-label="Checkout Progress" className="w-full rounded-2xl bg-white border border-[#E2E8F0] p-3 sm:p-4 shadow-2xs">
      <ol className="grid grid-cols-3 gap-2">
        {STEPS.map((s) => {
          const isDone = s.id < currentStep
          const isCurrent = s.id === currentStep
          const isNavigable = isDone

          return (
            <li
              key={s.id}
              aria-current={isCurrent ? 'step' : undefined}
              className="flex flex-col items-start gap-1.5 min-w-0"
            >
              <button
                type="button"
                disabled={!isNavigable}
                onClick={() => isNavigable && onStepClick?.(s.id as 0 | 1 | 2)}
                className={cn(
                  'w-full text-left focus:outline-hidden focus-visible:ring-2 focus-visible:ring-primary rounded-md transition-colors',
                  isNavigable ? 'cursor-pointer' : 'cursor-default'
                )}
              >
                {/* Top Badge + Label Line */}
                <div className="flex items-center gap-1.5 sm:gap-2 pb-2">
                  <span
                    className={cn(
                      'flex size-6 sm:size-6.5 shrink-0 items-center justify-center rounded-full text-xs font-black transition-colors',
                      isDone
                        ? 'bg-[#137333] text-white'
                        : isCurrent
                          ? 'bg-primary text-white shadow-2xs'
                          : 'bg-[#F1F5F9] text-[#64748B]'
                    )}
                  >
                    {isDone ? <Check className="size-3.5 stroke-[3]" /> : s.id + 1}
                  </span>
                  <span
                    className={cn(
                      'text-xs sm:text-sm truncate font-bold leading-tight',
                      isDone
                        ? 'text-[#137333]'
                        : isCurrent
                          ? 'text-primary'
                          : 'text-[#64748B]'
                    )}
                  >
                    {s.label}
                  </span>
                </div>

                {/* Progress Underline Bar */}
                <div
                  className={cn(
                    'h-1 w-full rounded-full transition-all duration-300',
                    isDone
                      ? 'bg-[#137333]'
                      : isCurrent
                        ? 'bg-primary'
                        : 'bg-[#E2E8F0]'
                  )}
                />
              </button>
            </li>
          )
        })}
      </ol>
    </nav>
  )
}
