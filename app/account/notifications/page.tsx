'use client'

import React, { useState } from 'react'
import { Bell, CheckCircle2, Shield, Smartphone, Mail, AlertTriangle } from 'lucide-react'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { Switch } from '@/components/ui/switch'
import { toast } from 'sonner'

export default function CustomerNotificationsPage() {
  const [sms, setSms] = useState(true)
  const [email, setEmail] = useState(true)
  const [inApp, setInApp] = useState(true)

  return (
    <div className="flex flex-col gap-5 font-sans antialiased text-slate-900 bg-[#f8fafc] min-h-screen p-3 md:p-6 pb-24">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-white p-4 rounded-xl border border-slate-200 shadow-sm">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-xl md:text-2xl font-black tracking-tight text-slate-900 flex items-center gap-2">
              <Bell className="size-6 text-purple-600" /> Notifications &amp; Alert Preferences
            </h1>
            <Badge className="bg-purple-50 text-purple-700 border-purple-200 text-[10px] font-bold">
              Transactional Security
            </Badge>
          </div>
          <p className="text-xs text-slate-500 mt-0.5">
            Manage SMS, Email, and In-App notification channels for order status and delivery updates.
          </p>
        </div>
      </div>

      <Card className="bg-white border-slate-200 p-5 shadow-sm space-y-5">
        <div className="space-y-4">
          <div className="flex items-center justify-between py-2 border-b border-slate-100">
            <div className="space-y-0.5">
              <div className="font-bold text-xs text-slate-900 flex items-center gap-2">
                <Smartphone className="size-4 text-purple-600" /> SMS Mobile Alerts (+255)
              </div>
              <p className="text-[11px] text-slate-500">
                Receive instant SMS notifications for AzamPay receipts and freight delivery OTPs.
              </p>
            </div>
            <Switch checked={sms} onCheckedChange={(v) => { setSms(v); toast.success('SMS preferences updated') }} />
          </div>

          <div className="flex items-center justify-between py-2 border-b border-slate-100">
            <div className="space-y-0.5">
              <div className="font-bold text-xs text-slate-900 flex items-center gap-2">
                <Mail className="size-4 text-purple-600" /> Email Notifications
              </div>
              <p className="text-[11px] text-slate-500">
                Receive commercial invoices, waybill PDFs, and quality inspection reports.
              </p>
            </div>
            <Switch checked={email} onCheckedChange={(v) => { setEmail(v); toast.success('Email preferences updated') }} />
          </div>

          <div className="flex items-center justify-between py-2">
            <div className="space-y-0.5">
              <div className="font-bold text-xs text-slate-900 flex items-center gap-2">
                <Bell className="size-4 text-purple-600" /> In-App Activity Center
              </div>
              <p className="text-[11px] text-slate-500">
                Show real-time updates in topbar bell dropdown.
              </p>
            </div>
            <Switch checked={inApp} onCheckedChange={(v) => { setInApp(v); toast.success('In-App preferences updated') }} />
          </div>
        </div>
      </Card>
    </div>
  )
}
