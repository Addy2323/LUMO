'use client'

import { useState } from 'react'
import { AlertTriangle, Info, Trash2, X, Loader2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'

export interface ConfirmModalProps {
  isOpen: boolean
  onClose: () => void
  onConfirm: () => Promise<void> | void
  title: string
  description: string
  confirmText?: string
  cancelText?: string
  variant?: 'destructive' | 'warning' | 'info'
}

export function AmazingConfirmModal({
  isOpen,
  onClose,
  onConfirm,
  title,
  description,
  confirmText = 'Confirm',
  cancelText = 'Cancel',
  variant = 'destructive',
}: ConfirmModalProps) {
  const [isLoading, setIsLoading] = useState(false)

  if (!isOpen) return null

  const handleConfirm = async () => {
    try {
      setIsLoading(true)
      await onConfirm()
      onClose()
    } catch (error) {
      console.error('Confirmation error:', error)
    } finally {
      setIsLoading(false)
    }
  }

  const iconVariants = {
    destructive: {
      bg: 'bg-red-500/10 text-red-500 border-red-500/20 shadow-red-500/20',
      glow: 'from-red-500/20 via-red-500/5 to-transparent',
      btn: 'bg-red-600 hover:bg-red-700 text-white shadow-lg shadow-red-600/30 border border-red-500/30',
      icon: <Trash2 className="size-6 text-red-500 animate-pulse" />,
    },
    warning: {
      bg: 'bg-amber-500/10 text-amber-500 border-amber-500/20 shadow-amber-500/20',
      glow: 'from-amber-500/20 via-amber-500/5 to-transparent',
      btn: 'bg-amber-600 hover:bg-amber-700 text-white shadow-lg shadow-amber-600/30 border border-amber-500/30',
      icon: <AlertTriangle className="size-6 text-amber-500 animate-bounce" />,
    },
    info: {
      bg: 'bg-blue-500/10 text-blue-500 border-blue-500/20 shadow-blue-500/20',
      glow: 'from-blue-500/20 via-blue-500/5 to-transparent',
      btn: 'bg-blue-600 hover:bg-blue-700 text-white shadow-lg shadow-blue-600/30 border border-blue-500/30',
      icon: <Info className="size-6 text-blue-500" />,
    },
  }

  const currentVariant = iconVariants[variant]

  return (
    <div
      tabIndex={-1}
      className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6 bg-slate-950/80 backdrop-blur-md animate-in fade-in-0 duration-200"
      onClick={(e) => {
        if (e.target === e.currentTarget && !isLoading) onClose()
      }}
    >
      <div
        className={cn(
          'relative w-full max-w-md overflow-hidden rounded-2xl border border-slate-700/60 dark:border-slate-800 bg-slate-900/95 dark:bg-slate-950/95 p-6 shadow-2xl transition-all duration-300 animate-in zoom-in-95 slide-in-from-bottom-4 text-slate-100',
        )}
      >
        {/* Top Vibrant Ambient Radial Glow */}
        <div
          className={cn(
            'absolute -top-24 -left-24 size-56 rounded-full bg-gradient-to-br blur-3xl pointer-events-none opacity-80',
            currentVariant.glow,
          )}
        />

        {/* Close Icon Button */}
        <button
          type="button"
          disabled={isLoading}
          onClick={onClose}
          className="absolute top-4 right-4 text-slate-400 hover:text-white p-1 rounded-full hover:bg-slate-800/60 transition-colors cursor-pointer"
        >
          <X className="size-5" />
        </button>

        <div className="flex flex-col items-center text-center gap-4 relative z-10 pt-2">
          {/* Pulsing Icon Badge */}
          <div
            className={cn(
              'size-16 rounded-2xl border flex items-center justify-center shadow-inner relative group',
              currentVariant.bg,
            )}
          >
            <div className="absolute inset-0 rounded-2xl bg-current opacity-10 animate-ping" />
            {currentVariant.icon}
          </div>

          {/* Title & Description */}
          <div className="flex flex-col gap-1.5 px-2">
            <h3 className="text-lg sm:text-xl font-extrabold tracking-tight text-white">
              {title}
            </h3>
            <p className="text-xs sm:text-sm text-slate-300 font-medium leading-relaxed">
              {description}
            </p>
          </div>

          {/* Action Buttons */}
          <div className="grid grid-cols-2 gap-3 w-full pt-4 border-t border-slate-800/80">
            <Button
              type="button"
              variant="outline"
              disabled={isLoading}
              onClick={onClose}
              className="w-full font-bold text-xs sm:text-sm h-11 rounded-xl border-slate-700 bg-slate-800/60 text-slate-200 hover:bg-slate-800 hover:text-white transition-all cursor-pointer"
            >
              {cancelText}
            </Button>

            <Button
              type="button"
              disabled={isLoading}
              onClick={handleConfirm}
              className={cn(
                'w-full font-extrabold text-xs sm:text-sm h-11 rounded-xl transition-all duration-200 cursor-pointer flex items-center justify-center gap-2 active:scale-95',
                currentVariant.btn,
              )}
            >
              {isLoading ? (
                <>
                  <Loader2 className="size-4 animate-spin" />
                  <span>Processing...</span>
                </>
              ) : (
                <span>{confirmText}</span>
              )}
            </Button>
          </div>
        </div>
      </div>
    </div>
  )
}
