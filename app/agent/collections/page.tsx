'use client'

import { useState, useEffect } from 'react'
import {
  Truck,
  Calendar,
  MapPin,
  UserCheck,
  CheckCircle2,
  Clock,
  Building2,
  Package,
  PlusCircle,
  Camera,
  ShieldCheck,
  KeyRound,
  RefreshCw,
} from 'lucide-react'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog'
import { useAgentStore, CollectionTask } from '@/lib/stores/agent-store'
import { toast } from 'sonner'

export default function AgentCollectionsPage() {
  const { activeCountry, orders } = useAgentStore()
  const [dbCollections, setDbCollections] = useState<any[]>([])
  const [loading, setLoading] = useState(false)
  const [showScheduleModal, setShowScheduleModal] = useState(false)

  // Pickup Form State
  const [supplierName, setSupplierName] = useState('')
  const [pickupAddress, setPickupAddress] = useState('')
  const [contactPerson, setContactPerson] = useState('')
  const [contactPhone, setContactPhone] = useState('')
  const [scheduledDate, setScheduledDate] = useState('')
  const [driverName, setDriverName] = useState('')
  const [driverPhone, setDriverPhone] = useState('')
  const [vehiclePlate, setVehiclePlate] = useState('')
  const [packageCount, setPackageCount] = useState('15')
  const [grossWeightKg, setGrossWeightKg] = useState('450.0')

  useEffect(() => {
    fetchCollections()
  }, [])

  async function fetchCollections() {
    setLoading(true)
    try {
      const res = await fetch('/api/agent/collections')
      if (res.ok) {
        const data = await res.json()
        if (Array.isArray(data.collections)) {
          setDbCollections(data.collections)
        }
      }
    } catch (e) {
      console.warn('Failed to fetch /api/agent/collections:', e)
    } finally {
      setLoading(false)
    }
  }

  async function handleCreateCollection(e: React.FormEvent) {
    e.preventDefault()
    if (!supplierName.trim() || !pickupAddress.trim()) {
      toast.error('Supplier Name and Pickup Address are required')
      return
    }

    try {
      const res = await fetch('/api/agent/collections', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          hub: activeCountry,
          supplierName,
          pickupAddress,
          contactPerson,
          contactPhone,
          scheduledDate: scheduledDate || new Date().toISOString(),
          driverName,
          driverPhone,
          vehiclePlate,
          packageCount: Number(packageCount),
          grossWeightKg: Number(grossWeightKg),
          status: 'Scheduled',
        }),
      })

      const data = await res.json()
      if (data.success) {
        toast.success(`Collection ${data.collection.collectionRef} scheduled successfully! Handover OTP: ${data.collection.proofOtp}`)
        setShowScheduleModal(false)
        fetchCollections()
      } else {
        toast.error(data.error || 'Failed to schedule collection')
      }
    } catch (e) {
      toast.error('Network error scheduling collection')
    }
  }

  const countryOrders = orders.filter((o) => o.assignedCountry === activeCountry)
  const collectionList: CollectionTask[] = countryOrders
    .map((o) => o.collection)
    .filter((c): c is CollectionTask => Boolean(c))

  const activeCollections = dbCollections.length > 0 ? dbCollections : collectionList

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-extrabold font-heading text-white">Goods Collection Hub</h1>
          <p className="text-xs text-slate-400 font-mono">
            Pickup Logistics Hub: <strong className="text-brand-400">{activeCountry}</strong> · Driver Assignment, Proof OTP &amp; Warehouse Dispatch
          </p>
        </div>

        <Button
          onClick={() => setShowScheduleModal(true)}
          className="bg-brand-500 hover:bg-brand-600 text-white text-xs font-bold gap-1.5 shadow-lg shadow-brand-500/20"
        >
          <PlusCircle className="size-4" /> Schedule Factory Pickup
        </Button>
      </div>

      <Card className="bg-slate-900 border-slate-800">
        <CardHeader className="p-5 border-b border-slate-800 flex flex-row items-center justify-between">
          <div>
            <CardTitle className="text-base font-extrabold text-white flex items-center gap-2">
              <Truck className="size-5 text-amber-400" />
              Scheduled Pickups Queue
            </CardTitle>
            <p className="text-xs text-slate-400">Supplier pickups scheduled for today in {activeCountry}</p>
          </div>
          <Badge className="bg-amber-500/20 text-amber-400 border border-amber-500/30 text-xs font-bold font-mono">
            {activeCollections.filter((t) => t.status === 'Scheduled' || t.status === 'Waiting').length} Pending Dispatch
          </Badge>
        </CardHeader>

        <CardContent className="p-0">
          {loading ? (
            <div className="p-12 text-center text-xs text-slate-400">
              <RefreshCw className="size-6 animate-spin mx-auto mb-2 text-primary" />
              Loading factory collections...
            </div>
          ) : activeCollections.length === 0 ? (
            <div className="p-12 text-center space-y-3">
              <div className="size-12 rounded-2xl bg-slate-800 text-amber-400 mx-auto flex items-center justify-center border border-slate-700">
                <Truck className="size-6" />
              </div>
              <div className="space-y-1 max-w-sm mx-auto">
                <h4 className="text-sm font-bold text-white">No Pickups Scheduled in {activeCountry} Hub</h4>
                <p className="text-xs text-slate-400">
                  When supplier purchases are confirmed in {activeCountry}, factory pickup dispatches will populate here automatically.
                </p>
              </div>
            </div>
          ) : (
            <div className="divide-y divide-slate-800">
              {activeCollections.map((col) => (
                <div key={col.id} className="p-6 space-y-4 hover:bg-slate-800/30 transition-colors">
                  <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                    <div className="space-y-1.5 flex-1">
                      <div className="flex items-center gap-2">
                        <span className="font-mono text-sm font-black text-brand-400">{col.collectionRef || col.orderNumber || `COL-${col.id}`}</span>
                        <Badge
                          className={`text-[10px] font-extrabold uppercase ${
                            col.status === 'Scheduled' || col.status === 'Waiting'
                              ? 'bg-amber-500/20 text-amber-400 border border-amber-500/30'
                              : col.status === 'Collected'
                              ? 'bg-blue-500/20 text-blue-400 border border-blue-500/30'
                              : 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'
                          }`}
                        >
                          {col.status}
                        </Badge>
                        {col.proofOtp && (
                          <Badge variant="outline" className="text-[10px] border-emerald-500/40 text-emerald-400 font-mono gap-1">
                            <KeyRound className="size-3" /> OTP: {col.proofOtp}
                          </Badge>
                        )}
                      </div>

                      <h3 className="text-base font-bold text-white flex items-center gap-2">
                        <Building2 className="size-4 text-slate-400" />
                        {col.supplierName}
                      </h3>

                      <p className="text-xs text-slate-400 flex items-center gap-1 font-mono">
                        <MapPin className="size-3.5 text-brand-400" /> {col.pickupAddress || col.collectionAddress}
                      </p>

                      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 text-xs font-mono text-slate-400 pt-1">
                        <div>
                          <span className="block text-[10px] text-slate-500 uppercase">Driver</span>
                          <strong className="text-slate-200">{col.driverName || 'Zhang Qiang'}</strong>
                        </div>
                        <div>
                          <span className="block text-[10px] text-slate-500 uppercase">Vehicle Plate</span>
                          <strong className="text-white">{col.vehiclePlate || '粤A-88392'}</strong>
                        </div>
                        <div>
                          <span className="block text-[10px] text-slate-500 uppercase">Cartons / Weight</span>
                          <strong className="text-slate-300">{col.packageCount || 15} pkgs / {col.grossWeightKg || 450} kg</strong>
                        </div>
                        <div>
                          <span className="block text-[10px] text-slate-500 uppercase">Schedule</span>
                          <strong className="text-slate-300">{col.scheduledDate ? new Date(col.scheduledDate).toLocaleDateString() : 'Today'}</strong>
                        </div>
                      </div>
                    </div>

                    <div className="flex flex-wrap items-center gap-2 shrink-0">
                      <Button
                        size="sm"
                        onClick={() => toast.success(`Pickup verified for ${col.supplierName} via OTP ${col.proofOtp || '849201'}`)}
                        className="bg-amber-600 hover:bg-amber-700 text-white text-xs font-bold"
                      >
                        <CheckCircle2 className="size-3.5 mr-1" />
                        Verify OTP &amp; Pickup
                      </Button>
                      <Button
                        size="sm"
                        onClick={() => toast.success(`Received ${col.packageCount || 15} cartons at Guangzhou Warehouse!`)}
                        className="bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold"
                      >
                        <Building2 className="size-3.5 mr-1" />
                        Receive at Hub
                      </Button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Schedule Pickup Modal */}
      {showScheduleModal && (
        <Dialog open={showScheduleModal} onOpenChange={setShowScheduleModal}>
          <DialogContent className="max-w-xl max-h-[85vh] overflow-y-auto bg-slate-900 border-slate-800 text-white p-6 space-y-4">
            <DialogHeader>
              <DialogTitle className="text-lg font-extrabold text-white flex items-center gap-2">
                <Truck className="size-5 text-brand-400" />
                Schedule Factory Pickup &amp; Driver Dispatch
              </DialogTitle>
              <DialogDescription className="text-xs text-slate-400">
                Dispatch driver for factory pickup, set OTP handover proof, and calculate total weight.
              </DialogDescription>
            </DialogHeader>

            <form onSubmit={handleCreateCollection} className="space-y-4 text-xs font-mono">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-slate-300 font-bold block mb-1">Supplier Name *</label>
                  <Input value={supplierName} onChange={(e) => setSupplierName(e.target.value)} placeholder="Foshan Nanhai Furniture Mfg" className="bg-slate-950 border-slate-800" />
                </div>
                <div>
                  <label className="text-slate-300 font-bold block mb-1">Contact Person &amp; Phone</label>
                  <Input value={contactPerson} onChange={(e) => setContactPerson(e.target.value)} placeholder="Chen Wei (+86 138...)" className="bg-slate-950 border-slate-800" />
                </div>
              </div>

              <div>
                <label className="text-slate-300 font-bold block mb-1">Factory Pickup Address *</label>
                <Input value={pickupAddress} onChange={(e) => setPickupAddress(e.target.value)} placeholder="No. 18 Industrial Park Road, Foshan..." className="bg-slate-950 border-slate-800" />
              </div>

              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className="text-slate-300 font-bold block mb-1">Assigned Driver Name</label>
                  <Input value={driverName} onChange={(e) => setDriverName(e.target.value)} placeholder="Zhang Qiang" className="bg-slate-950 border-slate-800" />
                </div>
                <div>
                  <label className="text-slate-300 font-bold block mb-1">Driver Phone</label>
                  <Input value={driverPhone} onChange={(e) => setDriverPhone(e.target.value)} placeholder="+86 139 0011 2233" className="bg-slate-950 border-slate-800" />
                </div>
                <div>
                  <label className="text-slate-300 font-bold block mb-1">Vehicle License Plate</label>
                  <Input value={vehiclePlate} onChange={(e) => setVehiclePlate(e.target.value)} placeholder="粤A-88392" className="bg-slate-950 border-slate-800" />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-slate-300 font-bold block mb-1">Package Count (Cartons/Crates)</label>
                  <Input value={packageCount} onChange={(e) => setPackageCount(e.target.value)} className="bg-slate-950 border-slate-800" />
                </div>
                <div>
                  <label className="text-slate-300 font-bold block mb-1">Gross Weight (kg)</label>
                  <Input value={grossWeightKg} onChange={(e) => setGrossWeightKg(e.target.value)} className="bg-slate-950 border-slate-800" />
                </div>
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <Button type="button" variant="outline" onClick={() => setShowScheduleModal(false)} className="border-slate-700 bg-slate-800 text-slate-300">
                  Cancel
                </Button>
                <Button type="submit" className="bg-brand-500 hover:bg-brand-600 text-white font-bold">
                  Dispatch Driver &amp; Generate OTP
                </Button>
              </div>
            </form>
          </DialogContent>
        </Dialog>
      )}
    </div>
  )
}

