'use client'

import { useState } from 'react'
import { Users, Truck, Plus, Trash2, Edit2, ShieldCheck, Wrench } from 'lucide-react'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { toast } from 'sonner'

type FleetVehicle = {
  id: string
  registrationNumber: string
  model: string
  capacity: string
  assignedDriver: string
  phone: string
  status: 'Active' | 'Maintenance' | 'Idle'
}

const INITIAL_FLEET: FleetVehicle[] = [
  {
    id: 'fl_1',
    registrationNumber: 'TZ 881 ABC',
    model: 'Scania R500 28-Ton Heavy Hauler',
    capacity: '28,000 KG / 60 CBM',
    assignedDriver: 'Juma Hassan',
    phone: '+255 712 345 678',
    status: 'Active',
  },
  {
    id: 'fl_2',
    registrationNumber: 'TZ 492 XYZ',
    model: 'ISUZU FTR 10-Ton Box Cargo Truck',
    capacity: '10,000 KG / 25 CBM',
    assignedDriver: 'Emmanuel Mollel',
    phone: '+255 755 987 654',
    status: 'Active',
  },
  {
    id: 'fl_3',
    registrationNumber: 'TZ 102 EFG',
    model: 'Toyota HiAce 1.5-Ton City Express Van',
    capacity: '1,500 KG / 6 CBM',
    assignedDriver: 'Baraka Saidi',
    phone: '+255 784 112 233',
    status: 'Maintenance',
  },
]

export default function LogisticsFleetPage() {
  const [fleet, setFleet] = useState<FleetVehicle[]>(INITIAL_FLEET)
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [regNum, setRegNum] = useState('')
  const [model, setModel] = useState('')
  const [capacity, setCapacity] = useState('')
  const [driver, setDriver] = useState('')
  const [phone, setPhone] = useState('')

  function handleAddVehicle() {
    if (!regNum.trim() || !model.trim() || !driver.trim()) {
      toast.error('Registration, Model, and Driver Name are required')
      return
    }

    const newVehicle: FleetVehicle = {
      id: `fl_${Date.now()}`,
      registrationNumber: regNum.trim().toUpperCase(),
      model: model.trim(),
      capacity: capacity.trim() || '5,000 KG',
      assignedDriver: driver.trim(),
      phone: phone.trim() || '+255 7XX XXX XXX',
      status: 'Active',
    }

    setFleet([...fleet, newVehicle])
    toast.success(`Vehicle ${newVehicle.registrationNumber} added to fleet!`)
    setIsModalOpen(false)
  }

  function handleToggleStatus(id: string) {
    setFleet(
      fleet.map((f) =>
        f.id === id ? { ...f, status: f.status === 'Active' ? 'Maintenance' : 'Active' } : f,
      ),
    )
    toast.success('Vehicle maintenance status updated!')
  }

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-extrabold tracking-tight">Fleet &amp; Drivers Management</h1>
          <p className="text-sm text-muted-foreground">
            Register truck fleets, monitor maintenance schedules, and manage driver contact profiles.
          </p>
        </div>
        <Button onClick={() => setIsModalOpen(true)} className="bg-brand-500 hover:bg-brand-600 text-white font-bold text-xs">
          <Plus className="size-4 mr-1.5" />
          Add Vehicle to Fleet
        </Button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {fleet.map((veh) => (
          <Card key={veh.id} className="flex flex-col justify-between hover:shadow-md transition-shadow">
            <CardHeader className="pb-2 space-y-1">
              <div className="flex items-center justify-between">
                <span className="font-mono font-extrabold text-sm text-brand-500">{veh.registrationNumber}</span>
                <Badge
                  className={`text-[10px] font-bold ${
                    veh.status === 'Active' ? 'bg-emerald-600 text-white' : 'bg-amber-500 text-white'
                  }`}
                >
                  {veh.status}
                </Badge>
              </div>
              <CardTitle className="text-xs font-extrabold text-foreground">{veh.model}</CardTitle>
            </CardHeader>

            <CardContent className="space-y-4">
              <div className="bg-muted/40 p-3 rounded-lg border text-xs space-y-1 font-mono">
                <div className="flex justify-between text-muted-foreground">
                  <span>Cargo Capacity:</span>
                  <span className="font-bold text-foreground">{veh.capacity}</span>
                </div>
                <div className="flex justify-between text-muted-foreground">
                  <span>Assigned Driver:</span>
                  <span className="font-bold text-foreground">{veh.assignedDriver}</span>
                </div>
                <div className="flex justify-between text-muted-foreground">
                  <span>Driver Phone:</span>
                  <span className="font-bold text-brand-500">{veh.phone}</span>
                </div>
              </div>

              <Button
                variant="outline"
                size="sm"
                onClick={() => handleToggleStatus(veh.id)}
                className="w-full text-xs font-bold"
              >
                <Wrench className="size-3.5 mr-1" />
                {veh.status === 'Active' ? 'Mark for Maintenance' : 'Set to Active Service'}
              </Button>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Add Vehicle Modal */}
      {isModalOpen && (
        <Dialog open onOpenChange={setIsModalOpen}>
          <DialogContent className="max-w-md p-6">
            <DialogHeader>
              <DialogTitle className="text-base font-extrabold">Register Fleet Vehicle &amp; Driver</DialogTitle>
            </DialogHeader>

            <div className="space-y-4 text-xs">
              <div className="space-y-1">
                <label className="font-bold">License Plate Number</label>
                <Input
                  placeholder="e.g. TZ 990 MNB"
                  value={regNum}
                  onChange={(e) => setRegNum(e.target.value)}
                  className="text-xs font-mono uppercase"
                />
              </div>

              <div className="space-y-1">
                <label className="font-bold">Vehicle Make &amp; Model</label>
                <Input
                  placeholder="e.g. Scania R450 Flatbed"
                  value={model}
                  onChange={(e) => setModel(e.target.value)}
                  className="text-xs"
                />
              </div>

              <div className="space-y-1">
                <label className="font-bold">Capacity (KG / CBM)</label>
                <Input
                  placeholder="e.g. 15,000 KG / 35 CBM"
                  value={capacity}
                  onChange={(e) => setCapacity(e.target.value)}
                  className="text-xs font-mono"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="font-bold">Driver Full Name</label>
                  <Input
                    placeholder="Baraka Saidi"
                    value={driver}
                    onChange={(e) => setDriver(e.target.value)}
                    className="text-xs"
                  />
                </div>

                <div className="space-y-1">
                  <label className="font-bold">Driver Phone</label>
                  <Input
                    placeholder="+255 7XX XXX XXX"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    className="text-xs font-mono"
                  />
                </div>
              </div>
            </div>

            <DialogFooter className="mt-4">
              <Button variant="outline" size="sm" onClick={() => setIsModalOpen(false)}>
                Cancel
              </Button>
              <Button size="sm" onClick={handleAddVehicle} className="bg-brand-500 hover:bg-brand-600 text-white font-bold">
                Save Vehicle
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      )}
    </div>
  )
}
