'use client'

import React from 'react'
import { Settings, Globe, Shield, Moon } from 'lucide-react'
import { Badge } from '@/components/ui/badge'
import { Card } from '@/components/ui/card'

export default function CustomerPreferencesPage() {
  return (
    <div className="flex flex-col gap-5 font-sans antialiased text-slate-900 bg-[#f8fafc] min-h-screen p-3 md:p-6 pb-24">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-white p-4 rounded-xl border border-slate-200 shadow-sm">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-xl md:text-2xl font-black tracking-tight text-slate-900 flex items-center gap-2">
              <Settings className="size-6 text-slate-700" /> Account Preferences &amp; Regional Settings
            </h1>
            <Badge className="bg-slate-100 text-slate-700 border-slate-200 text-[10px] font-bold">
              System Settings
            </Badge>
          </div>
          <p className="text-xs text-slate-500 mt-0.5">
            Default currency (TZS / USD), language (Swahili / English), and timezone configuration.
          </p>
        </div>
      </div>

      <Card className="bg-white border-slate-200 p-5 shadow-sm space-y-4 text-xs">
        <div className="flex justify-between items-center py-2 border-b border-slate-100">
          <div>
            <div className="font-bold text-slate-900">Default Currency</div>
            <p className="text-slate-500 text-[11px]">Tanzanian Shilling (TZS)</p>
          </div>
          <Badge variant="outline" className="font-mono">TZS (Shilling)</Badge>
        </div>

        <div className="flex justify-between items-center py-2 border-b border-slate-100">
          <div>
            <div className="font-bold text-slate-900">Language</div>
            <p className="text-slate-500 text-[11px]">Swahili &amp; English (Bilingual)</p>
          </div>
          <Badge variant="outline">English / Swahili</Badge>
        </div>

        <div className="flex justify-between items-center py-2">
          <div>
            <div className="font-bold text-slate-900">Time Zone</div>
            <p className="text-slate-500 text-[11px]">East Africa Time (EAT - UTC+3)</p>
          </div>
          <Badge variant="outline" className="font-mono">EAT (Dar es Salaam)</Badge>
        </div>
      </Card>
    </div>
  )
}
