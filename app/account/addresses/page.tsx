'use client'

import { useState } from 'react'
import { MapPin, Plus, Trash2, CheckCircle2 } from 'lucide-react'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { ADDRESSES, Address } from '@/lib/mock/orders'

import { useSessionStore } from '@/lib/stores/session-store'
import { useEffect } from 'react'

export default function CustomerAddressesPage() {
  const user = useSessionStore((s) => s.user)
  const isDemoUser =
    user?.id === 'usr_cus_001' ||
    user?.id === 'cust_01' ||
    user?.email === 'amina.hassan@example.co.tz'

  const [addressList, setAddressList] = useState<Address[]>([])
  const [open, setOpen] = useState(false)

  const [label, setLabel] = useState('')
  const [recipient, setRecipient] = useState('')
  const [phone, setPhone] = useState('')
  const [street, setStreet] = useState('')
  const [ward, setWard] = useState('')
  const [district, setDistrict] = useState('')
  const [region, setRegion] = useState('Dar es Salaam')

  useEffect(() => {
    if (!user) {
      setAddressList([])
      return
    }

    if (isDemoUser) {
      setAddressList(ADDRESSES)
      return
    }

    try {
      const stored = localStorage.getItem(`lumo_addresses_${user.id}`)
      if (stored) {
        setAddressList(JSON.parse(stored))
      } else {
        setAddressList([])
      }
    } catch {
      setAddressList([])
    }
  }, [user, isDemoUser])

  function updateAndPersistAddresses(newList: Address[]) {
    setAddressList(newList)
    if (user && !isDemoUser) {
      try {
        localStorage.setItem(`lumo_addresses_${user.id}`, JSON.stringify(newList))
      } catch (e) {
        console.error('Failed to save addresses:', e)
      }
    }
  }

  function handleSetDefault(id: string) {
    const updated = addressList.map((a) => ({
      ...a,
      isDefault: a.id === id,
    }))
    updateAndPersistAddresses(updated)
  }

  function handleDelete(id: string) {
    const updated = addressList.filter((a) => a.id !== id)
    updateAndPersistAddresses(updated)
  }

  function handleAddAddress(e: React.FormEvent) {
    e.preventDefault()
    if (!recipient || !phone || !street) return

    const newAddr: Address = {
      id: `adr_${Date.now()}`,
      label: label.trim() || 'Other',
      recipient: recipient.trim(),
      phone: phone.trim(),
      street: street.trim(),
      ward: ward.trim() || 'Central',
      district: district.trim() || 'Kinondoni',
      region: region.trim() || 'Dar es Salaam',
      isDefault: addressList.length === 0,
    }

    const updated = [...addressList, newAddr]
    updateAndPersistAddresses(updated)
    setOpen(false)
    setLabel('')
    setRecipient('')
    setPhone('')
    setStreet('')
    setWard('')
    setDistrict('')
  }

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Saved Addresses</h1>
          <p className="text-sm text-muted-foreground">
            Manage your delivery destinations across Tanzania.
          </p>
        </div>

        <Dialog open={open} onOpenChange={setOpen}>
          <DialogTrigger render={
            <Button size="sm">
              <Plus data-icon="inline-start" />
              Add New Address
            </Button>
          } />
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Add Delivery Address</DialogTitle>
            </DialogHeader>

            <form onSubmit={handleAddAddress} className="flex flex-col gap-4 mt-2">
              <div className="grid grid-cols-2 gap-3">
                <div className="flex flex-col gap-1.5">
                  <label className="text-xs font-medium">Label</label>
                  <Input placeholder="Home / Office" value={label} onChange={(e) => setLabel(e.target.value)} required />
                </div>
                <div className="flex flex-col gap-1.5">
                  <label className="text-xs font-medium">Recipient Name</label>
                  <Input placeholder="Full name" value={recipient} onChange={(e) => setRecipient(e.target.value)} required />
                </div>
              </div>

              <div className="flex flex-col gap-1.5">
                <label className="text-xs font-medium">Phone (+255)</label>
                <Input placeholder="+255 7XX XXX XXX" value={phone} onChange={(e) => setPhone(e.target.value)} required />
              </div>

              <div className="flex flex-col gap-1.5">
                <label className="text-xs font-medium">Street / Plot / Landmark</label>
                <Input placeholder="e.g. Plot 47, Mtaa wa Bahari" value={street} onChange={(e) => setStreet(e.target.value)} required />
              </div>

              <div className="grid grid-cols-3 gap-2">
                <div className="flex flex-col gap-1.5">
                  <label className="text-xs font-medium">Ward</label>
                  <Input placeholder="Msasani" value={ward} onChange={(e) => setWard(e.target.value)} required />
                </div>
                <div className="flex flex-col gap-1.5">
                  <label className="text-xs font-medium">District</label>
                  <Input placeholder="Kinondoni" value={district} onChange={(e) => setDistrict(e.target.value)} required />
                </div>
                <div className="flex flex-col gap-1.5">
                  <label className="text-xs font-medium">Region</label>
                  <Input placeholder="Dar es Salaam" value={region} onChange={(e) => setRegion(e.target.value)} required />
                </div>
              </div>

              <div className="flex justify-end gap-2 mt-2">
                <Button type="button" variant="outline" onClick={() => setOpen(false)}>
                  Cancel
                </Button>
                <Button type="submit">Save Address</Button>
              </div>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      {addressList.length === 0 ? (
        <Card className="py-12 text-center">
          <CardContent className="space-y-4">
            <MapPin className="size-12 text-muted-foreground mx-auto" />
            <div>
              <h3 className="text-base font-bold">No saved addresses</h3>
              <p className="text-xs text-muted-foreground mt-1">Add a delivery destination for faster 1-click checkout.</p>
            </div>
            <Button onClick={() => setOpen(true)} className="bg-primary hover:bg-primary-600 text-white font-bold text-xs">
              <Plus className="size-4 mr-1.5" />
              Add First Delivery Address
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2">
          {addressList.map((addr) => (
            <Card key={addr.id} className={addr.isDefault ? 'border-primary-400' : ''}>
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <div className="flex items-center gap-2">
                  <MapPin className="size-4 text-primary-400" />
                  <CardTitle className="text-sm font-semibold">{addr.label}</CardTitle>
                </div>
                {addr.isDefault ? (
                  <Badge variant="secondary" className="gap-1 text-[11px]">
                    <CheckCircle2 className="size-3 text-primary-400" /> Default
                  </Badge>
                ) : null}
              </CardHeader>
              <CardContent className="flex flex-col gap-3 text-xs text-muted-foreground">
                <div className="flex flex-col gap-0.5">
                  <span className="font-medium text-foreground">{addr.recipient}</span>
                  <span>{addr.street}</span>
                  <span>
                    {addr.ward}, {addr.district}, {region}
                  </span>
                  <span>Phone: {addr.phone}</span>
                </div>

                <div className="flex items-center justify-between pt-2 border-t border-border">
                  {!addr.isDefault ? (
                    <Button variant="ghost" size="sm" onClick={() => handleSetDefault(addr.id)}>
                      Set as default
                    </Button>
                  ) : (
                    <span className="text-[11px] text-primary-400 font-medium">Default delivery address</span>
                  )}
                  {!addr.isDefault ? (
                    <Button variant="ghost" size="icon" className="text-danger" onClick={() => handleDelete(addr.id)}>
                      <Trash2 className="size-4" />
                    </Button>
                  ) : null}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  )
}
