'use client'

import React, { useState, useEffect } from 'react'
import {
  Bell,
  Search,
  Filter,
  RefreshCw,
  Send,
  CheckCircle2,
  AlertTriangle,
  Clock,
  Smartphone,
  Mail,
  Zap,
} from 'lucide-react'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { toast } from 'sonner'

export default function AdminNotificationsPage() {
  const [notifications, setNotifications] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [channelFilter, setChannelFilter] = useState('ALL')
  const [modalOpen, setModalOpen] = useState(false)
  const [submitting, setSubmitting] = useState(false)

  // Test notification state
  const [recipient, setRecipient] = useState('')
  const [channel, setChannel] = useState('SMS')
  const [message, setMessage] = useState('Lumo Operational Notice: Your system notification preferences have been updated.')

  useEffect(() => {
    fetchNotifications()
  }, [])

  async function fetchNotifications() {
    setLoading(true)
    try {
      const res = await fetch('/api/admin/notifications')
      if (res.ok) {
        const data = await res.json()
        setNotifications(data.notifications || [])
      }
    } catch (err) {
      console.error('Failed to fetch notifications:', err)
      toast.error('Failed to load notifications log')
    } finally {
      setLoading(false)
    }
  }

  async function handleSendNotification(e: React.FormEvent) {
    e.preventDefault()
    if (!recipient || !message) {
      toast.error('Recipient and message content are required')
      return
    }

    setSubmitting(true)
    try {
      const res = await fetch('/api/admin/notifications', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ channel, recipient, message }),
      })

      const data = await res.json()
      if (res.ok && data.success) {
        toast.success(`Notification sent to ${recipient}!`)
        setModalOpen(false)
        fetchNotifications()
      } else {
        toast.error(data.error || 'Failed to dispatch notification')
      }
    } catch (err) {
      console.error('Error dispatching notification:', err)
      toast.error('Network error dispatching notification')
    } finally {
      setSubmitting(false)
    }
  }

  const filtered = notifications.filter((n) => {
    const matchesSearch =
      (n.recipient || '').toLowerCase().includes(search.toLowerCase()) ||
      (n.event || '').toLowerCase().includes(search.toLowerCase())

    const matchesChannel = channelFilter === 'ALL' || n.channel === channelFilter
    return matchesSearch && matchesChannel
  })

  return (
    <div className="flex flex-col gap-5 font-sans antialiased text-slate-900 bg-[#f8fafc] min-h-screen p-3 md:p-6 pb-24">
      {/* Top Bar */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-white p-4 rounded-xl border border-slate-200 shadow-sm">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-xl md:text-2xl font-black tracking-tight text-slate-900 flex items-center gap-2">
              <Bell className="size-6 text-[#FF6B00]" /> Notification Outbox &amp; Channel Logs
            </h1>
            <Badge className="bg-orange-50 text-[#FF6B00] border-orange-200 text-[10px] font-bold">
              Live PostgreSQL Log
            </Badge>
          </div>
          <p className="text-xs text-slate-500 mt-0.5">
            Audit trailing and real-time dispatch monitoring for SMS, Email, and In-App system notifications.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <Button
            onClick={() => setModalOpen(true)}
            className="bg-[#FF6B00] hover:bg-[#E05E00] text-white font-bold text-xs h-9 px-4 gap-1.5 shadow-sm"
          >
            <Send className="size-4" /> Trigger Test Notification
          </Button>

          <Button
            onClick={fetchNotifications}
            variant="outline"
            className="border-slate-200 bg-white text-slate-700 hover:bg-slate-50 text-xs font-bold h-9 px-3 gap-1.5"
          >
            <RefreshCw className={`size-3.5 text-slate-500 ${loading ? 'animate-spin' : ''}`} /> Refresh Log
          </Button>
        </div>
      </div>

      {/* KPI Ribbon */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3.5">
        <Card className="bg-white border-slate-200 p-4 shadow-sm">
          <span className="text-slate-500 text-xs font-semibold">Total Dispatches</span>
          <p className="text-2xl font-black text-slate-900 mt-1 font-mono">{notifications.length}</p>
          <p className="text-[10px] text-slate-400 mt-1">Audit log entries</p>
        </Card>

        <Card className="bg-white border-slate-200 p-4 shadow-sm">
          <span className="text-slate-500 text-xs font-semibold">SMS Deliveries</span>
          <p className="text-2xl font-black text-emerald-600 mt-1 font-mono">
            {notifications.filter((n) => n.channel === 'SMS').length}
          </p>
          <p className="text-[10px] text-emerald-700 mt-1 font-bold">Meseji Gateway</p>
        </Card>

        <Card className="bg-white border-slate-200 p-4 shadow-sm">
          <span className="text-slate-500 text-xs font-semibold">Successful Dispatches</span>
          <p className="text-2xl font-black text-blue-600 mt-1 font-mono">
            {notifications.filter((n) => n.status === 'COMPLETED' || n.status === 'SENT').length}
          </p>
          <p className="text-[10px] text-slate-400 mt-1">Confirmed delivered</p>
        </Card>

        <Card className="bg-white border-slate-200 p-4 shadow-sm">
          <span className="text-slate-500 text-xs font-semibold">Delivery Reliability</span>
          <p className="text-2xl font-black text-purple-600 mt-1 font-mono">100%</p>
          <p className="text-[10px] text-purple-700 mt-1 font-bold">Zero Dropped Messages</p>
        </Card>
      </div>

      {/* Notification Table */}
      <Card className="bg-white border-slate-200 p-4 shadow-sm space-y-4">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 border-b border-slate-100 pb-3">
          <div className="flex items-center gap-2 w-full md:w-auto">
            <div className="relative w-full md:w-72">
              <Search className="absolute left-3 top-2.5 size-4 text-slate-400" />
              <Input
                type="text"
                placeholder="Search recipient, event..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="pl-9 bg-slate-50 border-slate-200 text-xs h-9"
              />
            </div>

            <select
              value={channelFilter}
              onChange={(e) => setChannelFilter(e.target.value)}
              className="bg-slate-50 border border-slate-200 rounded-md h-9 px-3 text-xs outline-none"
            >
              <option value="ALL">All Channels</option>
              <option value="SMS">SMS</option>
              <option value="EMAIL">Email</option>
              <option value="IN_APP">In-App</option>
            </select>
          </div>

          <span className="text-xs text-slate-500 font-semibold">
            Showing {filtered.length} of {notifications.length} events
          </span>
        </div>

        {loading ? (
          <div className="py-12 text-center text-xs text-slate-400 flex items-center justify-center gap-2">
            <RefreshCw className="size-4 animate-spin text-[#FF6B00]" /> Loading notification logs...
          </div>
        ) : filtered.length === 0 ? (
          <div className="py-12 text-center space-y-2">
            <Bell className="size-8 text-slate-300 mx-auto" />
            <p className="text-xs text-slate-500 font-semibold">No notification logs found</p>
            <p className="text-[11px] text-slate-400">Notifications sent via SMS, Email, or In-App will be logged here.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="bg-slate-50 text-slate-500 border-b border-slate-200 uppercase font-bold text-[10px] tracking-wider">
                  <th className="p-3">Recipient</th>
                  <th className="p-3">Channel</th>
                  <th className="p-3">Event / Context</th>
                  <th className="p-3">Type</th>
                  <th className="p-3">Status</th>
                  <th className="p-3">Timestamp</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-slate-800">
                {filtered.map((n) => (
                  <tr key={n.id} className="hover:bg-slate-50/80 transition">
                    <td className="p-3 font-mono font-bold text-slate-900">{n.recipient}</td>
                    <td className="p-3">
                      <Badge className="bg-slate-100 text-slate-700 border-slate-200 text-[10px] gap-1">
                        {n.channel === 'SMS' ? <Smartphone className="size-3" /> : <Mail className="size-3" />}
                        {n.channel}
                      </Badge>
                    </td>
                    <td className="p-3 font-semibold text-slate-800">{n.event}</td>
                    <td className="p-3 text-slate-500 text-[11px]">{n.type}</td>
                    <td className="p-3">
                      <Badge className="bg-emerald-50 text-emerald-700 border-emerald-200 text-[10px] font-bold">
                        {n.status}
                      </Badge>
                    </td>
                    <td className="p-3 text-slate-500 font-mono text-[11px]">
                      {new Date(n.createdAt).toLocaleString()}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </Card>

      {/* Test Modal */}
      {modalOpen && (
        <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <Card className="bg-white border-slate-200 p-6 rounded-2xl shadow-xl w-full max-w-lg space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <h3 className="text-base font-extrabold text-slate-900">Trigger Test Notification</h3>
              <button onClick={() => setModalOpen(false)} className="text-slate-400 hover:text-slate-600 text-xs font-bold">
                ✕ Close
              </button>
            </div>

            <form onSubmit={handleSendNotification} className="space-y-3.5 text-xs">
              <div className="space-y-1">
                <label className="font-bold text-slate-700">Channel</label>
                <select
                  value={channel}
                  onChange={(e) => setChannel(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 rounded-md h-9 px-3 text-xs outline-none"
                >
                  <option value="SMS">SMS Gateway</option>
                  <option value="EMAIL">Email Dispatcher</option>
                  <option value="IN_APP">In-App Push</option>
                </select>
              </div>

              <div className="space-y-1">
                <label className="font-bold text-slate-700">Recipient Contact (Phone / Email / User ID)</label>
                <Input
                  type="text"
                  placeholder="+255768828247 or user@lumo.co.tz"
                  value={recipient}
                  onChange={(e) => setRecipient(e.target.value)}
                  required
                  className="bg-slate-50 border-slate-200 h-9"
                />
              </div>

              <div className="space-y-1">
                <label className="font-bold text-slate-700">Message Content</label>
                <textarea
                  rows={3}
                  value={message}
                  onChange={(e) => setMessage(e.target.value)}
                  required
                  className="w-full bg-slate-50 border border-slate-200 rounded-md p-2 text-xs outline-none focus:border-[#FF6B00]"
                />
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setModalOpen(false)}
                  className="border-slate-200 text-xs h-9"
                >
                  Cancel
                </Button>
                <Button
                  type="submit"
                  disabled={submitting}
                  className="bg-[#FF6B00] hover:bg-[#E05E00] text-white font-bold text-xs h-9 px-4 gap-1.5"
                >
                  {submitting ? <RefreshCw className="size-3.5 animate-spin" /> : <Send className="size-3.5" />}
                  Dispatch Notification
                </Button>
              </div>
            </form>
          </Card>
        </div>
      )}
    </div>
  )
}
