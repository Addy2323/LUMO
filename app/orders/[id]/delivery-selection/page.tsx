'use client'

import React, { useState, useEffect } from 'react'
import { useParams, useRouter } from 'next/navigation'
import {
  Truck,
  Building2,
  MapPin,
  Phone,
  User,
  ShieldCheck,
  CheckCircle2,
  ArrowRight,
  Clock,
  QrCode,
  KeyRound,
  Loader2,
  Navigation,
} from 'lucide-react'

interface PickupLocation {
  id: string
  name: string
  address: string
  city: string
  phone: string
  operatingHours: string
}

const TANZANIA_HUBS: PickupLocation[] = [
  {
    id: 'hub_dar_es_salaam',
    name: 'Lumo Central Fulfillment Hub',
    address: 'Plot 42, Sam Nujoma Road, Opposite Mlimani City',
    city: 'Dar es Salaam',
    phone: '+255 768 828 247',
    operatingHours: 'Mon - Sat: 8:00 AM - 7:00 PM',
  },
  {
    id: 'hub_arusha',
    name: 'Lumo Northern Zone Logistics Station',
    address: 'Sokoine Road, Near Clock Tower',
    city: 'Arusha',
    phone: '+255 754 112 233',
    operatingHours: 'Mon - Sat: 8:30 AM - 6:00 PM',
  },
  {
    id: 'hub_mwanza',
    name: 'Lumo Lake Zone Express Center',
    address: 'Nyerere Road, Capri Point Complex',
    city: 'Mwanza',
    phone: '+255 789 445 566',
    operatingHours: 'Mon - Sat: 8:30 AM - 6:00 PM',
  },
  {
    id: 'hub_dodoma',
    name: 'Lumo Capital Distribution Depot',
    address: 'Kikuyu Avenue, Near CBR Plaza',
    city: 'Dodoma',
    phone: '+255 712 998 877',
    operatingHours: 'Mon - Sat: 8:30 AM - 5:30 PM',
  },
]

export default function DeliverySelectionPage() {
  const params = useParams()
  const router = useRouter()
  const orderId = (params?.id as string) || ''

  const [method, setMethod] = useState<'DOOR_DELIVERY' | 'OFFICE_PICKUP'>('DOOR_DELIVERY')
  const [selectedHub, setSelectedHub] = useState<string>(TANZANIA_HUBS[0].id)
  
  // Form fields
  const [streetAddress, setStreetAddress] = useState('')
  const [city, setCity] = useState('Dar es Salaam')
  const [landmark, setLandmark] = useState('')
  const [recipientName, setRecipientName] = useState('')
  const [recipientPhone, setRecipientPhone] = useState('')

  const [submitting, setSubmitting] = useState(false)
  const [submitted, setSubmitted] = useState(false)
  const [pickupOtp, setPickupOtp] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setSubmitting(true)
    setError(null)

    try {
      const res = await fetch(`/api/orders/${orderId}/delivery-selection`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          method,
          pickupLocationId: method === 'OFFICE_PICKUP' ? selectedHub : undefined,
          streetAddress: method === 'DOOR_DELIVERY' ? streetAddress : undefined,
          city,
          landmark: method === 'DOOR_DELIVERY' ? landmark : undefined,
          recipientName,
          recipientPhone,
        }),
      })

      const data = await res.json()

      if (!res.ok || !data.success) {
        throw new Error(data.error || 'Failed to record delivery selection')
      }

      setSubmitted(true)
      if (data.pickupOtp) {
        setPickupOtp(data.pickupOtp)
      }
    } catch (err: any) {
      setError(err.message || 'An unexpected error occurred')
    } finally {
      setSubmitting(false)
    }
  }

  const currentHub = TANZANIA_HUBS.find((h) => h.id === selectedHub) || TANZANIA_HUBS[0]

  return (
    <div className="min-h-screen bg-[#F8FAFC] text-[#0F172A]">
      {/* Top Brand Banner */}
      <div className="bg-[#0B192C] text-white py-8 px-4 border-b border-[#1E293B]">
        <div className="max-w-4xl mx-auto flex flex-col md:flex-row items-center justify-between gap-4">
          <div>
            <div className="inline-flex items-center gap-2 px-3 py-1 bg-[#FF6500]/20 border border-[#FF6500]/40 rounded-full text-xs font-semibold text-[#FF6500] mb-3">
              <ShieldCheck className="w-4 h-4" />
              Lumo Trade Assurance Protected
            </div>
            <h1 className="text-2xl md:text-3xl font-bold tracking-tight">Select Delivery Preference</h1>
            <p className="text-sm text-gray-300 mt-1">
              Order Reference: <span className="font-mono text-[#FF6500] font-semibold">{orderId}</span>
            </p>
          </div>
          <div className="flex items-center gap-3 bg-[#1E293B] px-4 py-3 rounded-xl border border-gray-700/60">
            <Clock className="w-5 h-5 text-[#FF6500]" />
            <div className="text-xs">
              <div className="text-gray-400 font-medium">Customs Clearance</div>
              <div className="font-semibold text-emerald-400">Ready for Dispatch</div>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-4 py-8">
        {submitted ? (
          /* Success Screen */
          <div className="bg-white rounded-2xl p-8 border border-emerald-200 shadow-xl text-center space-y-6">
            <div className="w-16 h-16 bg-emerald-100 rounded-full flex items-center justify-center mx-auto text-emerald-600">
              <CheckCircle2 className="w-10 h-10" />
            </div>

            <div>
              <h2 className="text-2xl font-bold text-[#0B192C]">Delivery Preference Confirmed!</h2>
              <p className="text-gray-600 text-sm mt-1 max-w-md mx-auto">
                Your order preference has been locked and dispatch instructions sent to our logistics team.
              </p>
            </div>

            {method === 'OFFICE_PICKUP' && (
              <div className="bg-[#0B192C] text-white p-6 rounded-2xl max-w-md mx-auto space-y-4 border border-[#FF6500]/30 shadow-lg">
                <div className="flex items-center justify-between text-xs text-gray-400">
                  <span>PICKUP VERIFICATION OTP</span>
                  <span className="text-[#FF6500] font-mono">LUMO-SECURE</span>
                </div>
                <div className="bg-[#1E293B] py-4 px-6 rounded-xl border border-gray-700 font-mono text-3xl font-bold tracking-widest text-[#FF6500] flex items-center justify-center gap-3">
                  <KeyRound className="w-6 h-6 text-gray-400" />
                  {pickupOtp || '682910'}
                </div>
                <div className="text-xs text-gray-300 text-left space-y-1">
                  <div className="font-semibold text-white">Hub Location:</div>
                  <div>{currentHub.name}</div>
                  <div className="text-gray-400">{currentHub.address}</div>
                  <div className="text-emerald-400 text-[11px] pt-1">⚡ SMS with OTP has been sent to your phone.</div>
                </div>
              </div>
            )}

            {method === 'DOOR_DELIVERY' && (
              <div className="bg-slate-50 p-6 rounded-2xl max-w-md mx-auto border border-slate-200 text-left space-y-2 text-sm">
                <div className="font-semibold text-[#0B192C] flex items-center gap-2">
                  <Truck className="w-4 h-4 text-[#FF6500]" />
                  Door Delivery Details
                </div>
                <div className="text-gray-600">{streetAddress}, {city}</div>
                {landmark && <div className="text-gray-500 text-xs">Landmark: {landmark}</div>}
                <div className="text-gray-600 text-xs pt-2">
                  Recipient: <span className="font-medium text-[#0B192C]">{recipientName}</span> ({recipientPhone})
                </div>
              </div>
            )}

            <div className="flex flex-col sm:flex-row items-center justify-center gap-4 pt-4">
              <button
                onClick={() => router.push(`/orders/${orderId}`)}
                className="w-full sm:w-auto px-6 py-3 bg-[#FF6500] hover:bg-[#e05800] text-white font-semibold rounded-xl shadow-md transition-all flex items-center justify-center gap-2 text-sm"
              >
                View Live Tracking Timeline
                <ArrowRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        ) : (
          /* Form Screen */
          <form onSubmit={handleSubmit} className="space-y-8">
            {error && (
              <div className="p-4 bg-rose-50 border border-rose-200 text-rose-700 text-sm rounded-xl font-medium">
                {error}
              </div>
            )}

            {/* Method Selection Cards */}
            <div>
              <label className="block text-sm font-bold text-[#0B192C] mb-3">Choose Delivery Option</label>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* Option 1: Door Delivery */}
                <div
                  onClick={() => setMethod('DOOR_DELIVERY')}
                  className={`cursor-pointer rounded-2xl p-5 border-2 transition-all flex items-start gap-4 ${
                    method === 'DOOR_DELIVERY'
                      ? 'border-[#FF6500] bg-white shadow-md ring-2 ring-[#FF6500]/20'
                      : 'border-slate-200 bg-white hover:border-slate-300'
                  }`}
                >
                  <div className={`p-3 rounded-xl ${method === 'DOOR_DELIVERY' ? 'bg-[#FF6500] text-white' : 'bg-slate-100 text-slate-600'}`}>
                    <Truck className="w-6 h-6" />
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center justify-between">
                      <h3 className="font-bold text-[#0B192C]">Door Delivery</h3>
                      <span className="text-xs font-semibold text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded-md">Direct</span>
                    </div>
                    <p className="text-xs text-gray-500 mt-1">
                      Delivered directly to your home, office, or designated landmark anywhere in Tanzania.
                    </p>
                  </div>
                </div>

                {/* Option 2: Office Pickup */}
                <div
                  onClick={() => setMethod('OFFICE_PICKUP')}
                  className={`cursor-pointer rounded-2xl p-5 border-2 transition-all flex items-start gap-4 ${
                    method === 'OFFICE_PICKUP'
                      ? 'border-[#FF6500] bg-white shadow-md ring-2 ring-[#FF6500]/20'
                      : 'border-slate-200 bg-white hover:border-slate-300'
                  }`}
                >
                  <div className={`p-3 rounded-xl ${method === 'OFFICE_PICKUP' ? 'bg-[#FF6500] text-white' : 'bg-slate-100 text-slate-600'}`}>
                    <Building2 className="w-6 h-6" />
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center justify-between">
                      <h3 className="font-bold text-[#0B192C]">Lumo Hub Pickup</h3>
                      <span className="text-xs font-semibold text-[#FF6500] bg-[#FF6500]/10 px-2 py-0.5 rounded-md">OTP Protected</span>
                    </div>
                    <p className="text-xs text-gray-500 mt-1">
                      Collect at your convenience from an official Lumo fulfillment station using a secure SMS OTP code.
                    </p>
                  </div>
                </div>
              </div>
            </div>

            {/* Conditional Form Inputs */}
            {method === 'DOOR_DELIVERY' ? (
              <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-sm space-y-4">
                <h3 className="text-base font-bold text-[#0B192C] flex items-center gap-2 border-b pb-3 border-slate-100">
                  <MapPin className="w-5 h-5 text-[#FF6500]" />
                  Specify Delivery Address
                </h3>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-semibold text-gray-700 mb-1">City / Region *</label>
                    <input
                      type="text"
                      required
                      value={city}
                      onChange={(e) => setCity(e.target.value)}
                      placeholder="e.g. Dar es Salaam"
                      className="w-full px-4 py-2.5 rounded-xl border border-slate-300 text-sm focus:outline-none focus:ring-2 focus:ring-[#FF6500]"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-gray-700 mb-1">Street / Neighborhood *</label>
                    <input
                      type="text"
                      required
                      value={streetAddress}
                      onChange={(e) => setStreetAddress(e.target.value)}
                      placeholder="e.g. Mikocheni B, Mwai Kibaki Road"
                      className="w-full px-4 py-2.5 rounded-xl border border-slate-300 text-sm focus:outline-none focus:ring-2 focus:ring-[#FF6500]"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-gray-700 mb-1">Prominent Landmark / GPS Details</label>
                  <input
                    type="text"
                    value={landmark}
                    onChange={(e) => setLandmark(e.target.value)}
                    placeholder="e.g. Near Shoppers Plaza, Blue House Gate 4"
                    className="w-full px-4 py-2.5 rounded-xl border border-slate-300 text-sm focus:outline-none focus:ring-2 focus:ring-[#FF6500]"
                  />
                </div>
              </div>
            ) : (
              <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-sm space-y-4">
                <h3 className="text-base font-bold text-[#0B192C] flex items-center gap-2 border-b pb-3 border-slate-100">
                  <Building2 className="w-5 h-5 text-[#FF6500]" />
                  Select Collection Hub
                </h3>

                <div>
                  <label className="block text-xs font-semibold text-gray-700 mb-2">Available Lumo Hubs</label>
                  <select
                    value={selectedHub}
                    onChange={(e) => setSelectedHub(e.target.value)}
                    className="w-full px-4 py-3 rounded-xl border border-slate-300 text-sm font-semibold text-[#0B192C] focus:outline-none focus:ring-2 focus:ring-[#FF6500] bg-slate-50"
                  >
                    {TANZANIA_HUBS.map((hub) => (
                      <option key={hub.id} value={hub.id}>
                        {hub.name} — {hub.city}
                      </option>
                    ))}
                  </select>
                </div>

                {/* Hub Information Box */}
                <div className="p-4 bg-slate-50 border border-slate-200 rounded-xl space-y-2 text-xs">
                  <div className="font-bold text-[#0B192C] text-sm">{currentHub.name}</div>
                  <div className="flex items-start gap-2 text-gray-600">
                    <MapPin className="w-4 h-4 text-[#FF6500] shrink-0 mt-0.5" />
                    <span>{currentHub.address}</span>
                  </div>
                  <div className="flex items-center gap-2 text-gray-600">
                    <Phone className="w-4 h-4 text-emerald-600 shrink-0" />
                    <span>{currentHub.phone}</span>
                  </div>
                  <div className="flex items-center gap-2 text-gray-600">
                    <Clock className="w-4 h-4 text-amber-600 shrink-0" />
                    <span>{currentHub.operatingHours}</span>
                  </div>
                </div>
              </div>
            )}

            {/* Recipient Details Box */}
            <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-sm space-y-4">
              <h3 className="text-base font-bold text-[#0B192C] flex items-center gap-2 border-b pb-3 border-slate-100">
                <User className="w-5 h-5 text-[#FF6500]" />
                Recipient Contact Info
              </h3>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-gray-700 mb-1">Full Name *</label>
                  <input
                    type="text"
                    required
                    value={recipientName}
                    onChange={(e) => setRecipientName(e.target.value)}
                    placeholder="Recipient Full Name"
                    className="w-full px-4 py-2.5 rounded-xl border border-slate-300 text-sm focus:outline-none focus:ring-2 focus:ring-[#FF6500]"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-gray-700 mb-1">Mobile Phone (for SMS OTP & Courier Calls) *</label>
                  <input
                    type="tel"
                    required
                    value={recipientPhone}
                    onChange={(e) => setRecipientPhone(e.target.value)}
                    placeholder="07XXXXXXXX or 2557XXXXXXXX"
                    className="w-full px-4 py-2.5 rounded-xl border border-slate-300 text-sm focus:outline-none focus:ring-2 focus:ring-[#FF6500]"
                  />
                </div>
              </div>
            </div>

            {/* Action Button */}
            <button
              type="submit"
              disabled={submitting}
              className="w-full py-4 bg-[#FF6500] hover:bg-[#e05800] text-white font-bold rounded-xl shadow-lg hover:shadow-xl transition-all flex items-center justify-center gap-2 text-base disabled:opacity-50"
            >
              {submitting ? (
                <>
                  <Loader2 className="w-5 h-5 animate-spin" />
                  Saving Delivery Preference...
                </>
              ) : (
                <>
                  Confirm Delivery Selection
                  <ArrowRight className="w-5 h-5" />
                </>
              )}
            </button>
          </form>
        )}
      </div>
    </div>
  )
}
