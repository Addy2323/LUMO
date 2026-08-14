'use client'

/**
 * Shared 6-digit OTP input. Used in registration, login step-up and checkout
 * confirmation. Auto-advances, supports paste, and fires onComplete once full.
 */

import * as React from 'react'
import { InputOTP, InputOTPGroup, InputOTPSlot } from '@/components/ui/input-otp'
import { cn } from '@/lib/utils'

type OtpFieldProps = {
  value: string
  onChange: (value: string) => void
  onComplete?: (value: string) => void
  length?: number
  disabled?: boolean
  invalid?: boolean
  autoFocus?: boolean
  id?: string
  'aria-describedby'?: string
}

export function OtpField({
  value,
  onChange,
  onComplete,
  length = 6,
  disabled,
  invalid,
  autoFocus,
  id,
  'aria-describedby': describedBy,
}: OtpFieldProps) {
  return (
    <InputOTP
      id={id}
      maxLength={length}
      value={value}
      onChange={onChange}
      onComplete={onComplete}
      disabled={disabled}
      autoFocus={autoFocus}
      aria-invalid={invalid || undefined}
      aria-describedby={describedBy}
      aria-label={`${length}-digit verification code`}
      inputMode="numeric"
      pattern="[0-9]*"
      containerClassName="gap-2"
    >
      <InputOTPGroup className="gap-2">
        {Array.from({ length }).map((_, index) => (
          <InputOTPSlot
            key={index}
            index={index}
            aria-invalid={invalid || undefined}
            className={cn(
              'size-12 rounded-lg border bg-card font-mono text-lg first:rounded-l-lg last:rounded-r-lg',
              invalid && 'border-danger',
            )}
          />
        ))}
      </InputOTPGroup>
    </InputOTP>
  )
}
