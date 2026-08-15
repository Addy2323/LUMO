'use client'

import React from 'react'
import { UserCheck, ShieldCheck, Phone, Mail, Building, CheckCircle2 } from 'lucide-react'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { useSessionStore } from '@/lib/stores/session-store'

export default function CustomerProfilePage() {
  const user = useSessionStore((s) => s.user)

  return (
    <div className="flex flex-col gap-5 font-sans antialiased text-slate-900 bg-[#f8fafc] min-h-screen p-3 md:p-6 pb-24">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-white p-4 rounded-xl border border-slate-200 shadow-sm">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-xl md:text-2xl font-black tracking-tight text-slate-900 flex items-center gap-2">
              <UserCheck className="size-6 text-emerald-600" /> Verified Customer Profile &amp; KYC
            </h1>
            <Badge className="bg-emerald-50 text-emerald-700 border-emerald-200 text-[10px] font-bold">
              ✓ Verified Buyer Account
            </Badge>
          </div>
          <p className="text-xs text-slate-500 mt-0.5">
            Your profile details and verified phone number for AzamPay mobile money checkout.
          </p>
        </div>
      </div>

      <Card className="bg-white border-slate-200 p-5 shadow-sm space-y-4">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
          <div className="p-3 bg-slate-50 border border-slate-100 rounded-lg space-y-1">
            <span className="text-[10px] text-slate-400 font-bold uppercase">Full Name</span>
            <div className="font-bold text-slate-900 text-sm">{user?.fullName || 'Amina Hassan'}</div>
          </div>

          <div className="p-3 bg-slate-50 border border-slate-100 rounded-lg space-y-1">
            <span className="text-[10px] text-slate-400 font-bold uppercase">Company / Business Name</span>
            <div className="font-bold text-slate-900 text-sm">{(user as any)?.companyName || 'Hassan General Supplies Ltd'}</div>
          </div>

          <div className="p-3 bg-slate-50 border border-slate-100 rounded-lg space-y-1">
            <span className="text-[10px] text-slate-400 font-bold uppercase">Verified Phone</span>
            <div className="font-bold text-slate-900 text-sm font-mono">{user?.phone || '+255 754 123 456'}</div>
          </div>

          <div className="p-3 bg-slate-50 border border-slate-100 rounded-lg space-y-1">
            <span className="text-[10px] text-slate-400 font-bold uppercase">Email Address</span>
            <div className="font-bold text-slate-900 text-sm font-mono">{user?.email || 'amina@hassan.co.tz'}</div>
          </div>
        </div>
      </Card>
    </div>
  )
}
