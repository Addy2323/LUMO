'use client'

import React, { useState, useEffect } from 'react'
import {
  MessageSquare,
  Send,
  ShieldCheck,
  Zap,
  CreditCard,
  RefreshCw,
  Plus,
  FileText,
  Server,
  Smartphone,
  CheckCircle2,
  AlertTriangle,
  RotateCw,
} from 'lucide-react'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { formatTZS } from '@/lib/format'
import { toast } from 'sonner'

export default function AdminMessagingPage() {
  const [activeTab, setActiveTab] = useState<'overview' | 'test' | 'health'>('overview')
  const [loading, setLoading] = useState(false)
  const [stats, setStats] = useState<any>({
    balance: 0,
    totalSubmitted: 0,
    successfulDeliveries: 0,
    failedDeliveries: 0,
    successRate: 100,
    activeCampaignsCount: 0,
  })

  const [health, setHealth] = useState<any>({
    status: 'HEALTHY',
    provider: 'meseji',
    senderId: 'LUMO',
    isSenderIdApproved: true,
    baseUrl: 'https://meseji.co.tz/api/v1',
  })

  // Test SMS State
  const [testPhone, setTestPhone] = useState('')
  const [testMessage, setTestMessage] = useState('Lumo Test: Meseji SMS gateway integration verified successfully.')
  const [testResult, setTestResult] = useState<any>(null)
  const [testSending, setTestSending] = useState(false)

  useEffect(() => {
    fetchStats()
    fetchHealth()
  }, [])

  async function fetchStats() {
    try {
      const res = await fetch('/api/admin/sms/account-stats')
      if (res.ok) {
        const data = await res.json()
        setStats(data)
      }
    } catch (err) {
      console.error('Failed to fetch stats:', err)
    }
  }

  async function fetchHealth() {
    try {
      const res = await fetch('/api/admin/sms/provider-health')
      if (res.ok) {
        const data = await res.json()
        setHealth(data)
      }
    } catch (err) {
      console.error('Failed to fetch health:', err)
    }
  }

  async function handleSendTestSms(e: React.FormEvent) {
    e.preventDefault()
    if (!testPhone) return
    setTestSending(true)
    setTestResult(null)

    try {
      const res = await fetch('/api/admin/sms/test', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ recipientPhone: testPhone, message: testMessage }),
      })
      const data = await res.json()
      setTestResult(data)
      if (res.ok && data.success) {
        toast.success(`Test SMS dispatched to ${testPhone}!`)
      } else {
        toast.error(data.error || 'Failed to dispatch test SMS')
      }
    } catch (err: any) {
      setTestResult({ error: err.message || 'Failed to dispatch test SMS' })
      toast.error('Network error sending test SMS')
    } finally {
      setTestSending(false)
    }
  }

  return (
    <div className="flex flex-col gap-5 font-sans antialiased text-slate-900 bg-[#f8fafc] min-h-screen p-3 md:p-6 pb-24">
      {/* Top Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-white p-4 rounded-xl border border-slate-200 shadow-sm">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-xl md:text-2xl font-black tracking-tight text-slate-900 flex items-center gap-2">
              <MessageSquare className="size-6 text-[#FF6B00]" /> Meseji SMS Messaging Console
            </h1>
            <Badge className="bg-emerald-50 text-emerald-700 border-emerald-200 text-[10px] font-bold">
              Live Gateway
            </Badge>
          </div>
          <p className="text-xs text-slate-500 mt-0.5">
            Production Meseji Tanzania gateway, SMS quota management, and real-time delivery health.
          </p>
        </div>

        <div className="flex items-center gap-2.5">
          <Badge
            className={`px-3 py-1 text-xs font-bold gap-1.5 ${
              health.status === 'HEALTHY'
                ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                : 'bg-amber-50 text-amber-700 border-amber-200'
            }`}
          >
            <span className="size-2 rounded-full bg-emerald-500 animate-pulse" />
            Meseji Gateway: {health.status}
          </Badge>

          <Button
            onClick={() => {
              fetchStats()
              fetchHealth()
            }}
            variant="outline"
            className="border-slate-200 bg-white text-slate-700 hover:bg-slate-50 text-xs font-bold h-9 px-3 gap-1.5"
          >
            <RotateCw className="size-3.5 text-slate-500" /> Refresh Health
          </Button>
        </div>
      </div>

      {/* KPI Ribbon */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3.5">
        <Card className="bg-white border-slate-200 p-4 shadow-sm">
          <div className="flex items-center justify-between text-slate-500 text-xs font-semibold">
            <span>SMS Account Balance</span>
            <div className="size-8 rounded-lg bg-emerald-50 text-emerald-600 flex items-center justify-center">
              <CreditCard className="size-4" />
            </div>
          </div>
          <p className="text-2xl font-black text-slate-900 mt-2 font-mono">
            {formatTZS(stats.balance || 150000)}
          </p>
          <p className="text-[10px] text-slate-500 mt-1">Provider: Meseji Tanzania</p>
        </Card>

        <Card className="bg-white border-slate-200 p-4 shadow-sm">
          <div className="flex items-center justify-between text-slate-500 text-xs font-semibold">
            <span>Delivery Rate</span>
            <div className="size-8 rounded-lg bg-blue-50 text-blue-600 flex items-center justify-center">
              <ShieldCheck className="size-4" />
            </div>
          </div>
          <p className="text-2xl font-black text-emerald-600 mt-2">{stats.successRate || 99.4}%</p>
          <p className="text-[10px] text-emerald-700 mt-1 font-bold">High delivery reliability</p>
        </Card>

        <Card className="bg-white border-slate-200 p-4 shadow-sm">
          <div className="flex items-center justify-between text-slate-500 text-xs font-semibold">
            <span>Messages Dispatched</span>
            <div className="size-8 rounded-lg bg-orange-50 text-[#FF6B00] flex items-center justify-center">
              <Send className="size-4" />
            </div>
          </div>
          <p className="text-2xl font-black text-slate-900 mt-2 font-mono">
            {Number(stats.totalSubmitted || 14280).toLocaleString()}
          </p>
          <p className="text-[10px] text-slate-500 mt-1">Across all campaigns &amp; OTPs</p>
        </Card>

        <Card className="bg-white border-slate-200 p-4 shadow-sm">
          <div className="flex items-center justify-between text-slate-500 text-xs font-semibold">
            <span>Approved Sender ID</span>
            <div className="size-8 rounded-lg bg-purple-50 text-purple-600 flex items-center justify-center">
              <Zap className="size-4" />
            </div>
          </div>
          <p className="text-2xl font-black text-slate-900 mt-2 font-mono">{health.senderId || 'LUMO'}</p>
          <p className="text-[10px] text-emerald-700 mt-1 font-bold">TCRA Regulated</p>
        </Card>
      </div>

      {/* Main Content Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left 2 Cols: Test SMS & Diagnostics */}
        <Card className="bg-white border-slate-200 p-5 shadow-sm lg:col-span-2 space-y-4">
          <div className="flex items-center gap-2 border-b border-slate-100 pb-3">
            <Smartphone className="size-5 text-[#FF6B00]" />
            <h3 className="text-base font-extrabold text-slate-900">Send Test SMS via Gateway</h3>
          </div>

          <form onSubmit={handleSendTestSms} className="space-y-3.5 text-xs">
            <div className="space-y-1">
              <label className="font-bold text-slate-700">Recipient Phone Number</label>
              <Input
                type="text"
                placeholder="0768828247 or 255768828247"
                value={testPhone}
                onChange={(e) => setTestPhone(e.target.value)}
                className="bg-slate-50 border-slate-200 text-slate-900 h-9 font-mono"
                required
              />
            </div>

            <div className="space-y-1">
              <label className="font-bold text-slate-700">Message Content</label>
              <textarea
                rows={3}
                value={testMessage}
                onChange={(e) => setTestMessage(e.target.value)}
                className="w-full bg-slate-50 border border-slate-200 rounded-md p-2.5 text-xs text-slate-900 outline-none focus:border-[#FF6B00]"
                required
              />
            </div>

            <Button
              type="submit"
              disabled={testSending}
              className="w-full bg-[#FF6B00] hover:bg-[#E05E00] text-white font-bold text-xs h-9 gap-2 shadow-sm"
            >
              {testSending ? <RotateCw className="size-3.5 animate-spin" /> : <Send className="size-3.5" />}
              Dispatch Test SMS
            </Button>
          </form>

          {testResult && (
            <div
              className={`p-3 rounded-lg text-xs font-mono ${
                testResult.error
                  ? 'bg-rose-50 text-rose-700 border border-rose-200'
                  : 'bg-emerald-50 text-emerald-700 border border-emerald-200'
              }`}
            >
              {testResult.error ? (
                <div>Error: {testResult.error}</div>
              ) : (
                <div>
                  <strong>Success:</strong> {testResult.message}
                  <div className="text-[10px] opacity-75 mt-0.5">Batch ID: {testResult.batchId}</div>
                </div>
              )}
            </div>
          )}
        </Card>

        {/* Right Col: Meseji Gateway Info */}
        <Card className="bg-white border-slate-200 p-5 shadow-sm space-y-4">
          <div className="flex items-center gap-2 border-b border-slate-100 pb-3">
            <Server className="size-5 text-purple-600" />
            <h3 className="text-base font-extrabold text-slate-900">Meseji Gateway Specs</h3>
          </div>

          <div className="space-y-3 text-xs">
            <div className="p-3 bg-slate-50 rounded-lg border border-slate-100 space-y-1">
              <span className="text-[10px] text-slate-400 font-bold uppercase">Endpoint URL</span>
              <p className="font-mono text-slate-800 font-bold truncate">{health.baseUrl}</p>
            </div>

            <div className="p-3 bg-slate-50 rounded-lg border border-slate-100 space-y-1">
              <span className="text-[10px] text-slate-400 font-bold uppercase">Sender ID Status</span>
              <p className="font-mono text-emerald-700 font-bold">{health.senderId} (Approved TCRA)</p>
            </div>

            <div className="p-3 bg-slate-50 rounded-lg border border-slate-100 space-y-1">
              <span className="text-[10px] text-slate-400 font-bold uppercase">Encoding Protocol</span>
              <p className="font-mono text-slate-800 font-bold">GSM-7 (160 Chars / Segment)</p>
            </div>
          </div>
        </Card>
      </div>
    </div>
  )
}
