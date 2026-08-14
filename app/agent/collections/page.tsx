'use client'

import { useState } from 'react'
import {
  Truck,
  Calendar,
  MapPin,
  UserCheck,
  CheckCircle2,
  Clock,
  Building2,
  Package,
} from 'lucide-react'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { useAgentStore, CollectionTask } from '@/lib/stores/agent-store'
import { toast } from 'sonner'

export default function AgentCollectionsPage() {
  const { activeCountry, orders } = useAgentStore()

  // Derive collections dynamically from assigned active country hub orders
  const countryOrders = orders.filter((o) => o.assignedCountry === activeCountry)
  
  // Extract collections attached to orders or empty array
  const collectionList: CollectionTask[] = countryOrders
    .map((o) => o.collection)
    .filter((c): c is CollectionTask => Boolean(c))

  const [localTasks, setLocalTasks] = useState<CollectionTask[]>(collectionList)

  function updateStatus(id: string, newStatus: CollectionTask['status']) {
    setLocalTasks((prev) =>
      prev.map((t) => (t.id === id ? { ...t, status: newStatus } : t))
    )
    toast.success(`Collection status updated to ${newStatus}`)
  }

  const activeCollections = localTasks.length > 0 ? localTasks : collectionList

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-extrabold font-heading text-white">Goods Collection Hub</h1>
        <p className="text-xs text-slate-400 font-mono">
          Pickup Logistics Hub: <strong className="text-brand-400">{activeCountry}</strong> · Assign Drivers &amp; Track Factory Pickups
        </p>
      </div>

      <Card className="bg-slate-900 border-slate-800">
        <CardHeader className="p-5 border-b border-slate-800 flex flex-row items-center justify-between">
          <div>
            <CardTitle className="text-base font-extrabold text-white flex items-center gap-2">
              <Truck className="size-5 text-amber-400" />
              Scheduled Pickups Queue
            </CardTitle>
            <p className="text-xs text-slate-400">Supplier pickups scheduled for today</p>
          </div>
          <Badge className="bg-amber-500/20 text-amber-400 border border-amber-500/30 text-xs font-bold font-mono">
            {activeCollections.filter((t) => t.status === 'Waiting').length} Pending Dispatch
          </Badge>
        </CardHeader>

        <CardContent className="p-0">
          {activeCollections.length === 0 ? (
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
                    <div className="space-y-1.5">
                      <div className="flex items-center gap-2">
                        <span className="font-mono text-sm font-black text-brand-400">{col.orderNumber}</span>
                        <Badge
                          className={`text-[10px] font-extrabold uppercase ${
                            col.status === 'Waiting'
                              ? 'bg-amber-500/20 text-amber-400 border border-amber-500/30'
                              : col.status === 'Collected'
                              ? 'bg-blue-500/20 text-blue-400 border border-blue-500/30'
                              : 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'
                          }`}
                        >
                          {col.status}
                        </Badge>
                      </div>

                      <h3 className="text-base font-bold text-white flex items-center gap-2">
                        <Building2 className="size-4 text-slate-400" />
                        {col.supplierName}
                      </h3>

                      <p className="text-xs text-slate-400 flex items-center gap-1 font-mono">
                        <MapPin className="size-3.5 text-brand-400" /> {col.collectionAddress}
                      </p>

                      <div className="grid grid-cols-2 sm:grid-cols-3 gap-4 text-xs font-mono text-slate-400 pt-1">
                        <div>
                          <span className="block text-[10px] text-slate-500 uppercase">Assigned Driver</span>
                          <strong className="text-slate-200">{col.driverName}</strong>
                        </div>
                        <div>
                          <span className="block text-[10px] text-slate-500 uppercase">Vehicle Plate</span>
                          <strong className="text-white">{col.vehiclePlate}</strong>
                        </div>
                        <div>
                          <span className="block text-[10px] text-slate-500 uppercase">Collection Date</span>
                          <strong className="text-slate-300">{col.collectionDate}</strong>
                        </div>
                      </div>
                    </div>

                    <div className="flex flex-wrap items-center gap-2 shrink-0">
                      <Button
                        size="sm"
                        onClick={() => updateStatus(col.id, 'Collected')}
                        disabled={col.status === 'Collected' || col.status === 'At Warehouse'}
                        className="bg-amber-600 hover:bg-amber-700 text-white text-xs font-bold"
                      >
                        <CheckCircle2 className="size-3.5 mr-1" />
                        Mark Collected
                      </Button>
                      <Button
                        size="sm"
                        onClick={() => updateStatus(col.id, 'At Warehouse')}
                        disabled={col.status === 'At Warehouse'}
                        className="bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold"
                      >
                        <CheckCircle2 className="size-3.5 mr-1" />
                        Receive at Warehouse
                      </Button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
