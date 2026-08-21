'use client'

import * as React from 'react'
import { EyeIcon, EyeOffIcon } from 'lucide-react'
import { cn } from '@/lib/utils'

export interface PasswordInputProps extends React.ComponentProps<'input'> {
  containerClassName?: string
}

export const PasswordInput = React.forwardRef<HTMLInputElement, PasswordInputProps>(
  ({ className, containerClassName, type, ...props }, ref) => {
    const [visible, setVisible] = React.useState(false)

    return (
      <div className={cn('relative flex items-center w-full', containerClassName)}>
        <input
          ref={ref}
          type={visible ? 'text' : 'password'}
          className={cn(
            'w-full h-11 text-xs font-semibold text-[#0F172A] dark:text-slate-100 bg-[#F0F5FD] dark:bg-slate-900 border border-[#DCE7F5] dark:border-slate-800 rounded-xl px-3.5 pr-10 focus:outline-none focus:ring-1 focus:ring-primary focus:border-primary placeholder:text-slate-400 transition-colors',
            className
          )}
          {...props}
        />
        <button
          type="button"
          tabIndex={-1}
          aria-label={visible ? 'Hide password' : 'Show password'}
          onClick={() => setVisible((prev) => !prev)}
          className="absolute right-3 p-1 rounded-lg text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 transition-colors focus:outline-none flex items-center justify-center cursor-pointer z-10"
        >
          {visible ? <EyeOffIcon className="size-4" /> : <EyeIcon className="size-4" />}
        </button>
      </div>
    )
  }
)

PasswordInput.displayName = 'PasswordInput'
