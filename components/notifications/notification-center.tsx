'use client'

import { useState } from 'react'
import { Bell, Check, Info, ShieldCheck, Truck, FileText, AlertTriangle } from 'lucide-react'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover'
import { toast } from 'sonner'

export type MatrixNotification = {
  id: string
  event:
    | 'New RFQ'
    | 'Agent assigned'
    | 'Quotation ready'
    | 'Payment confirmed'
    | 'Inspection requested'
    | 'Inspection passed'
    | 'Shipment assigned'
    | 'In transit'
    | 'Delivered'
    | 'Dispute opened'
  targetRole: 'Customer' | 'Admin' | 'Sales' | 'Agent' | 'Supplier' | 'Logistics'
  title: string
  description: string
  time: string
  read: boolean
}

const DEFAULT_NOTIFICATIONS: MatrixNotification[] = [
  {
    id: 'notif-01',
    event: 'New RFQ',
    targetRole: 'Sales',
    title: 'New RFQ Submitted',
    description: 'Amina Hassan submitted RFQ for Solar Submersible Water Pumps.',
    time: '10 mins ago',
    read: false,
  },
  {
    id: 'notif-02',
    event: 'Quotation ready',
    targetRole: 'Customer',
    title: 'Landed TZS Quote Issued',
    description: 'Sales Officer issued TZS 65,000,000 quote for Sanitaryware.',
    time: '30 mins ago',
    read: false,
  },
  {
    id: 'notif-03',
    event: 'Payment confirmed',
    targetRole: 'Admin',
    title: 'Master Escrow Payment Received',
    description: 'Buyer paid TZS 18,500,000 via AzamPay M-Pesa.',
    time: '1 hour ago',
    read: false,
  },
  {
    id: 'notif-04',
    event: 'Inspection passed',
    targetRole: 'Agent',
    title: 'Guangzhou Cargo Inspection Passed',
    description: 'Signed inspection report attached. Pass score: 100%.',
    time: '2 hours ago',
    read: true,
  },
  {
    id: 'notif-05',
    event: 'Delivered',
    targetRole: 'Customer',
    title: 'Shipment Delivered at Bandari DAR',
    description: 'Waybill WB-TZ-99218 confirmed via Delivery OTP.',
    time: '3 hours ago',
    read: true,
  },
]

export function NotificationCenter({ currentRole = 'Customer' }: { currentRole?: string }) {
  const [notifications, setNotifications] = useState<MatrixNotification[]>(DEFAULT_NOTIFICATIONS)

  const unreadCount = notifications.filter((n) => !n.read).length

  function markAllRead() {
    setNotifications((prev) => prev.map((n) => ({ ...n, read: true })))
    toast.success('All notifications marked as read')
  }

  return (
    <Popover>
      <PopoverTrigger>
        <Button variant="ghost" size="icon" className="relative">
          <Bell className="size-5" />
          {unreadCount > 0 && (
            <span className="absolute top-1 right-1 size-2 rounded-full bg-[#FF6B00] animate-pulse" />
          )}
        </Button>
      </PopoverTrigger>

      <PopoverContent className="w-80 sm:w-96 p-0 border border-border shadow-xl">
        <div className="p-3 border-b flex items-center justify-between bg-muted/30">
          <div className="flex items-center gap-2">
            <h4 className="font-extrabold text-xs text-foreground uppercase tracking-wide">
              {currentRole} Notification Center
            </h4>
            {unreadCount > 0 && (
              <Badge className="bg-[#FF6B00] text-white text-[10px]">{unreadCount} New</Badge>
            )}
          </div>
          <Button variant="ghost" size="sm" onClick={markAllRead} className="text-[11px] h-7 px-2 font-bold">
            Mark all read
          </Button>
        </div>

        <div className="divide-y max-h-80 overflow-y-auto text-xs">
          {notifications.map((n) => (
            <div
              key={n.id}
              className={`p-3 space-y-1 transition-colors ${
                !n.read ? 'bg-[#FF6B00]/5 font-medium' : 'hover:bg-muted/30'
              }`}
            >
              <div className="flex items-center justify-between">
                <Badge variant="outline" className="text-[9px] font-mono">
                  {n.event}
                </Badge>
                <span className="text-[10px] text-muted-foreground">{n.time}</span>
              </div>
              <p className="font-bold text-foreground">{n.title}</p>
              <p className="text-[11px] text-muted-foreground leading-snug">{n.description}</p>
            </div>
          ))}
        </div>
      </PopoverContent>
    </Popover>
  )
}
