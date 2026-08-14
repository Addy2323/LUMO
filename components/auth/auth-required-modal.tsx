'use client'

import React from 'react'
import { useRouter } from 'next/navigation'
import { AlertTriangle, ArrowRight, Lock, LogIn, ShieldAlert, Sparkles, UserPlus, X } from 'lucide-react'
import { Dialog, DialogContent, DialogTitle, DialogDescription } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'

export type AuthRequiredModalProps = {
  open: boolean
  onOpenChange: (open: boolean) => void
  title?: string
  description?: string
  redirectUrl?: string
}

export function AuthRequiredModal({
  open,
  onOpenChange,
  title = 'Authentication Required',
  description = 'Please, you must register or login to submit your request.',
  redirectUrl = '/sourcing/request',
}: AuthRequiredModalProps) {
  const router = useRouter()

  function handleNavigateToLogin(mode: 'login' | 'register' = 'login') {
    onOpenChange(false)
    const target = mode === 'register' ? '/register' : '/login'
    const fullPath = redirectUrl ? `${target}?redirect=${encodeURIComponent(redirectUrl)}` : target
    router.push(fullPath)
  }

  function handleCancel() {
    onOpenChange(false)
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent showCloseButton={false} className="w-[92vw] max-w-md p-0 overflow-hidden rounded-2xl border border-amber-500/30 bg-[#0f172a] text-white shadow-2xl shadow-black/80 antialiased">
        {/* Glow ambient background effect */}
        <div className="absolute -top-16 -left-16 size-48 bg-amber-500/20 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute -bottom-16 -right-16 size-48 bg-orange-600/20 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute inset-0 bg-[radial-gradient(#ffffff_1px,transparent_1px)] [background-size:24px_24px] opacity-[0.03] pointer-events-none" />

        {/* Top Header Banner */}
        <div className="relative p-6 pb-4 border-b border-slate-800 flex flex-col items-center text-center space-y-3">
          <div className="relative flex items-center justify-center">
            <div className="size-16 rounded-2xl bg-gradient-to-tr from-amber-500 via-orange-500 to-red-500 p-0.5 shadow-lg shadow-orange-500/30 animate-pulse">
              <div className="size-full bg-[#0f172a] rounded-[14px] flex items-center justify-center text-amber-400">
                <ShieldAlert className="size-8 text-amber-400" />
              </div>
            </div>
            <div className="absolute -bottom-1 -right-1 size-6 rounded-full bg-red-600 flex items-center justify-center ring-2 ring-[#0f172a]">
              <Lock className="size-3.5 text-white" />
            </div>
          </div>

          <div className="space-y-1">
            <Badge className="bg-amber-500/15 text-amber-400 border border-amber-500/30 text-[10px] font-extrabold uppercase tracking-wider px-2.5 py-0.5">
              <Sparkles className="size-3 mr-1 text-amber-400" />
              Sign In or Register Required
            </Badge>

            <DialogTitle className="text-xl font-extrabold text-white tracking-tight pt-1 font-heading">
              {title}
            </DialogTitle>

            <DialogDescription className="text-xs text-slate-300 leading-relaxed max-w-sm pt-1">
              {description}
            </DialogDescription>
          </div>
        </div>

        {/* Middle Notice Box */}
        <div className="p-4 sm:p-5 space-y-4">
          <div className="p-3.5 rounded-xl border border-amber-500/30 bg-amber-500/10 flex items-start gap-3 text-xs text-amber-200">
            <AlertTriangle className="size-5 text-amber-400 shrink-0 mt-0.5" />
            <div className="space-y-0.5">
              <span className="font-bold text-amber-300 block">Draft Saved Automatically</span>
              <p className="text-[11px] text-amber-200/90 leading-snug">
                Your request details are saved. Once you log in or create an account, you can submit your request immediately.
              </p>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex flex-col gap-2.5 pt-1">
            {/* OK / Sign In Button -> Navigates to Login */}
            <Button
              onClick={() => handleNavigateToLogin('login')}
              className="w-full h-11 font-extrabold text-xs text-white bg-gradient-to-r from-orange-600 to-amber-600 hover:from-orange-500 hover:to-amber-500 shadow-lg shadow-orange-600/30 rounded-xl transition-all duration-300 hover:scale-[1.02]"
            >
              <LogIn className="size-4 mr-1.5" />
              OK - Proceed to Login
              <ArrowRight className="size-4 ml-1" />
            </Button>

            <div className="grid grid-cols-2 gap-2">
              {/* Register Button */}
              <Button
                variant="outline"
                onClick={() => handleNavigateToLogin('register')}
                className="h-10 font-bold text-xs bg-slate-900 border-slate-700 text-amber-400 hover:bg-slate-800 hover:text-amber-300 rounded-lg gap-1"
              >
                <UserPlus className="size-3.5" />
                Register
              </Button>

              {/* Cancel Button -> Closes modal without navigating */}
              <Button
                variant="outline"
                onClick={handleCancel}
                className="h-10 font-bold text-xs bg-slate-900/60 border-slate-800 text-slate-400 hover:bg-slate-800 hover:text-slate-200 rounded-lg gap-1"
              >
                <X className="size-3.5" />
                Cancel
              </Button>
            </div>

            {/* Subtext info */}
            <div className="text-center text-[11px] text-slate-400 pt-1">
              Need help? Contact{' '}
              <a href="mailto:support@lumo.co.tz" className="font-bold text-orange-400 hover:underline">
                support@lumo.co.tz
              </a>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}
