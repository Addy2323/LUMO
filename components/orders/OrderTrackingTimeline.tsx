'use client'

import React from 'react'
import Link from 'next/link'
import {
  CheckCircle2,
  Clock,
  Package,
  Truck,
  ShieldCheck,
  Building2,
  AlertTriangle,
  ArrowRight,
  UserCheck,
  Search,
  CheckCheck,
} from 'lucide-react'

export interface TimelineHistoryItem {
  id: string
  previousStatus: string
  newStatus: string
  actorRole: string
  reason?: string | null
  createdAt: string | Date
}

export interface OrderTrackingTimelineProps {
  orderNumber: string
  currentStatus: string
  totalAmountTZS: number
  history?: TimelineHistoryItem[]
  pickupOtp?: string | null
  deliveryMethod?: 'DOOR_DELIVERY' | 'OFFICE_PICKUP' | null
}

const MILESTONES = [
  { key: 'PAID', label: 'Payment Confirmed', icon: ShieldCheck, desc: 'Lumo Trade Assurance active' },
  { key: 'SOURCING', label: 'Sourcing & Supplier', icon: Search, desc: 'Factory verification' },
  { key: 'QUALITY_INSPECTION', label: 'Quality Inspection', icon: UserCheck, desc: 'Specification audit' },
  { key: 'IN_TRANSIT', label: 'International Freight', icon: Package, desc: 'Transit to Tanzania' },
  { key: 'CUSTOMS_CLEARANCE', label: 'Customs Clearance', icon: Clock, desc: 'TRA & Ports processing' },
  { key: 'DELIVERY', label: 'Final Delivery / Pickup', icon: Truck, desc: 'Door delivery or hub' },
]

export function OrderTrackingTimeline({
  orderNumber,
  currentStatus,
  totalAmountTZS,
  history = [],
  pickupOtp,
  deliveryMethod,
}: OrderTrackingTimelineProps) {

  // Helper to calculate progress index
  const getActiveMilestoneIndex = (status: string) => {
    switch (status) {
      case 'PAYMENT_PENDING':
      case 'PAYMENT_VERIFICATION':
        return 0
      case 'PAID':
      case 'ORDER_CONFIRMED':
        return 0
      case 'PENDING_PROCESSING':
      case 'PROCESSING':
      case 'SOURCING':
      case 'SUPPLIER_CONFIRMED':
      case 'PROCUREMENT_IN_PROGRESS':
        return 1
      case 'QUALITY_INSPECTION':
      case 'INSPECTION_PASSED':
      case 'INSPECTION_FAILED':
        return 2
      case 'PACKAGING':
      case 'READY_TO_SHIP':
      case 'SHIPPED':
      case 'IN_TRANSIT':
        return 3
      case 'ARRIVED_IN_TANZANIA':
      case 'CUSTOMS_CLEARANCE':
        return 4
      case 'DELIVERY_SELECTION_REQUIRED':
      case 'OUT_FOR_DELIVERY':
      case 'READY_FOR_PICKUP':
      case 'DELIVERED':
      case 'COMPLETED':
        return 5
      default:
        return 0
    }
  }

  const activeIndex = getActiveMilestoneIndex(currentStatus)
  const isActionRequired = currentStatus === 'DELIVERY_SELECTION_REQUIRED' || currentStatus === 'ARRIVED_IN_TANZANIA'

  return (
    <div className="bg-white rounded-2xl border border-slate-200 p-6 md:p-8 shadow-sm space-y-8">
      {/* Header Info */}
      <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4 border-b border-slate-100 pb-6">
        <div>
          <div className="flex items-center gap-2">
            <h2 className="text-xl font-bold text-[#0B192C]">Order #{orderNumber}</h2>
            <span className="px-3 py-1 bg-[#FF6500]/10 text-[#FF6500] font-bold text-xs rounded-full border border-[#FF6500]/20">
              {currentStatus.replace(/_/g, ' ')}
            </span>
          </div>
          <p className="text-xs text-slate-500 mt-1">
            Total Amount: <span className="font-bold text-[#0B192C]">TZS {totalAmountTZS.toLocaleString()}</span>
          </p>
        </div>

        {/* Action Prompt if selection needed */}
        {isActionRequired && (
          <Link
            href={`/orders/${orderNumber}/delivery-selection`}
            className="w-full md:w-auto px-5 py-2.5 bg-[#FF6500] hover:bg-[#e05800] text-white text-xs font-bold rounded-xl shadow-md transition-all flex items-center justify-center gap-2 animate-pulse"
          >
            Select Delivery Preference
            <ArrowRight className="w-4 h-4" />
          </Link>
        )}
      </div>

      {/* OTP Display if pickup */}
      {pickupOtp && deliveryMethod === 'OFFICE_PICKUP' && (
        <div className="bg-[#0B192C] text-white p-5 rounded-2xl flex flex-col md:flex-row items-center justify-between gap-4 border border-[#FF6500]/30 shadow-md">
          <div className="flex items-center gap-3">
            <div className="p-3 bg-[#FF6500]/20 text-[#FF6500] rounded-xl border border-[#FF6500]/40">
              <Building2 className="w-6 h-6" />
            </div>
            <div>
              <div className="text-xs text-gray-400 font-medium">Ready for Pickup at Lumo Hub</div>
              <div className="text-sm font-bold text-white">Present your OTP to the Station Officer</div>
            </div>
          </div>
          <div className="bg-[#1E293B] px-6 py-2.5 rounded-xl border border-gray-700 font-mono text-2xl font-bold text-[#FF6500] tracking-widest">
            {pickupOtp}
          </div>
        </div>
      )}

      {/* Milestone Progress Bar */}
      <div className="relative">
        <div className="grid grid-cols-2 md:grid-cols-6 gap-4">
          {MILESTONES.map((m, idx) => {
            const IconComponent = m.icon
            const isCompleted = idx < activeIndex
            const isCurrent = idx === activeIndex

            return (
              <div
                key={m.key}
                className={`p-4 rounded-xl border transition-all flex flex-col items-center text-center relative ${
                  isCurrent
                    ? 'border-[#FF6500] bg-[#FF6500]/5 ring-2 ring-[#FF6500]/20'
                    : isCompleted
                    ? 'border-emerald-200 bg-emerald-50/50 text-emerald-900'
                    : 'border-slate-100 bg-slate-50/60 opacity-60'
                }`}
              >
                <div
                  className={`w-10 h-10 rounded-full flex items-center justify-center mb-2 ${
                    isCurrent
                      ? 'bg-[#FF6500] text-white shadow-md'
                      : isCompleted
                      ? 'bg-emerald-500 text-white'
                      : 'bg-slate-200 text-slate-500'
                  }`}
                >
                  {isCompleted ? <CheckCheck className="w-5 h-5" /> : <IconComponent className="w-5 h-5" />}
                </div>

                <div className="text-xs font-bold text-[#0B192C] leading-tight mb-1">{m.label}</div>
                <div className="text-[10px] text-slate-500">{m.desc}</div>
              </div>
            )
          })}
        </div>
      </div>

      {/* Chronological Audit Log History */}
      {history && history.length > 0 && (
        <div className="border-t border-slate-100 pt-6">
          <h3 className="text-sm font-bold text-[#0B192C] mb-4 flex items-center gap-2">
            <Clock className="w-4 h-4 text-[#FF6500]" />
            Detailed Order Audit Timeline
          </h3>

          <div className="space-y-4">
            {history.map((h, i) => (
              <div key={h.id || i} className="flex items-start gap-3 text-xs">
                <div className="w-2 h-2 rounded-full bg-[#FF6500] mt-1.5 shrink-0" />
                <div className="flex-1 bg-slate-50 p-3 rounded-xl border border-slate-200/60">
                  <div className="flex items-center justify-between font-semibold text-[#0B192C]">
                    <span>
                      {h.previousStatus.replace(/_/g, ' ')} → <span className="text-[#FF6500]">{h.newStatus.replace(/_/g, ' ')}</span>
                    </span>
                    <span className="text-slate-400 font-normal text-[11px]">
                      {new Date(h.createdAt).toLocaleString()}
                    </span>
                  </div>
                  {h.reason && <p className="text-slate-600 mt-1">{h.reason}</p>}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
