'use client'

import { useState, useEffect } from 'react'
import { MapPin, Plus, Trash2, CheckCircle2, Loader2, RefreshCw } from 'lucide-react'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { ADDRESSES, Address } from '@/lib/mock/orders'
import { useSessionStore } from '@/lib/stores/session-store'
import { toast } from 'sonner'

export default function CustomerAddressesPage() {
  const user = useSessionStore((s) => s.user)
  const isDemoUser =
    user?.id === 'usr_cus_001' ||
    user?.id === 'cust_01' ||
    user?.email === 'amina.hassan@example.co.tz'

  const [addressList, setAddressList] = useState<Address[]>([])
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [open, setOpen] = useState(false)

  const [label, setLabel] = useState('')
  const [recipient, setRecipient] = useState('')
  const [phone, setPhone] = useState('')
  const [street, setStreet] = useState('')
  const [ward, setWard] = useState('')
  const [district, setDistrict] = useState('')
  const [region, setRegion] = useState('Dar es Salaam')

  const fetchAddresses = async () => {
    setLoading(true)
    try {
      const res = await fetch('/api/account/addresses')
      if (res.ok) {
        const dbData = await res.json()
        if (Array.isArray(dbData) && dbData.length > 0) {
          const formatted: Address[] = dbData.map((d: any) => ({
            id: d.id,
            label: d.label || 'Home / Office',
            recipient: d.fullName || d.recipient || 'Customer',
            phone: d.phone,
            street: d.street,
            ward: d.ward || 'Central',
            district: d.district || 'Kinondoni',
            region: d.region || d.city || 'Dar es Salaam',
            isDefault: Boolean(d.isDefault),
          }))
          setAddressList(formatted)
          setLoading(false)
          return
        }
      }
    } catch (err) {
      console.warn('API addresses fetch fallback:', err)
    }

    // Fallback to demo or local storage
    if (isDemoUser) {
      setAddressList(ADDRESSES)
    } else if (user) {
      try {
        const stored = localStorage.getItem(`lumo_addresses_${user.id}`)
        setAddressList(stored ? JSON.parse(stored) : [])
      } catch {
        setAddressList([])
      }
    } else {
      setAddressList(ADDRESSES)
    }
    setLoading(false)
  }

  useEffect(() => {
    fetchAddresses()
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

  async function handleSetDefault(id: string) {
    try {
      const res = await fetch(`/api/account/addresses/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ isDefault: true }),
      })
      if (res.ok) {
        toast.success('Default delivery address updated!')
      }
    } catch (e) {
      console.warn('Backend default update warning:', e)
    }

    const updated = addressList.map((a) => ({
      ...a,
      isDefault: a.id === id,
    }))
    updateAndPersistAddresses(updated)
  }

  async function handleDelete(id: string) {
    try {
      const res = await fetch(`/api/account/addresses/${id}`, {
        method: 'DELETE',
      })
      if (res.ok) {
        toast.success('Address removed successfully.')
      }
    } catch (e) {
      console.warn('Backend address delete warning:', e)
    }

    const updated = addressList.filter((a) => a.id !== id)
    updateAndPersistAddresses(updated)
  }

  async function handleAddAddress(e: React.FormEvent) {
    e.preventDefault()
    if (!recipient || !phone || !street) return

    setSaving(true)
    const payload = {
      fullName: recipient.trim(),
      phone: phone.trim(),
      street: street.trim(),
      city: region.trim() || 'Dar es Salaam',
      region: region.trim() || 'Dar es Salaam',
      isDefault: addressList.length === 0,
    }

    let createdId = `adr_${Date.now()}`

    try {
      const res = await fetch('/api/account/addresses', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      })
      if (res.ok) {
        const saved = await res.json()
        createdId = saved.id
        toast.success('New delivery address saved to database!')
      }
    } catch (err) {
      console.warn('Backend address create warning:', err)
      toast.info('Address saved locally.')
    }

    const newAddr: Address = {
      id: createdId,
      label: label.trim() || 'Delivery Location',
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
    setSaving(false)
    setOpen(false)
    setLabel('')
    setRecipient('')
    setPhone('')
    setStreet('')
    setWard('')
    setDistrict('')
  }

  return (
    <div className="flex flex-col gap-6 font-sans antialiased text-foreground">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between bg-white dark:bg-slate-900 p-5 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xs">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-xl md:text-2xl font-extrabold tracking-tight flex items-center gap-2">
              <MapPin className="size-6 text-[#FF6B00]" /> Saved Delivery Addresses
            </h1>
            <Badge className="bg-orange-50 text-[#FF6B00] dark:bg-orange-950/40 border-orange-200 text-[10px] font-bold">
              {addressList.length} Saved
            </Badge>
          </div>
          <p className="text-xs text-muted-foreground mt-1">
            Manage your verified delivery destinations across Dar es Salaam, Arusha, Mwanza, and all regions in Tanzania.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={fetchAddresses}
            className="text-xs font-bold border-slate-200 dark:border-slate-700"
          >
            <RefreshCw className={`size-3.5 mr-1 ${loading ? 'animate-spin' : ''}`} /> Refresh
          </Button>

          <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger render={
              <Button size="sm" className="bg-[#FF6B00] hover:bg-[#E05E00] text-white font-bold text-xs h-9 px-4 gap-1.5 rounded-xl shadow-xs">
                <Plus className="size-4" /> Add Delivery Address
              </Button>
            } />
            <DialogContent className="sm:max-w-md">
              <DialogHeader>
                <DialogTitle className="text-base font-extrabold flex items-center gap-2">
                  <MapPin className="size-5 text-[#FF6B00]" /> Add New Delivery Address
                </DialogTitle>
              </DialogHeader>

              <form onSubmit={handleAddAddress} className="flex flex-col gap-4 mt-2">
                <div className="grid grid-cols-2 gap-3">
                  <div className="flex flex-col gap-1.5">
                    <label className="text-xs font-bold text-muted-foreground">Address Label</label>
                    <Input placeholder="Home / Office / Warehouse" value={label} onChange={(e) => setLabel(e.target.value)} required />
                  </div>
                  <div className="flex flex-col gap-1.5">
                    <label className="text-xs font-bold text-muted-foreground">Recipient Name</label>
                    <Input placeholder="Full Name" value={recipient} onChange={(e) => setRecipient(e.target.value)} required />
                  </div>
                </div>

                <div className="flex flex-col gap-1.5">
                  <label className="text-xs font-bold text-muted-foreground">Phone Number (+255)</label>
                  <Input placeholder="+255 7XX XXX XXX" value={phone} onChange={(e) => setPhone(e.target.value)} required />
                </div>

                <div className="flex flex-col gap-1.5">
                  <label className="text-xs font-bold text-muted-foreground">Street / Plot / Landmark</label>
                  <Input placeholder="e.g. Plot 47, Mtaa wa Bahari, Ally Hassan Mwinyi Rd" value={street} onChange={(e) => setStreet(e.target.value)} required />
                </div>

                <div className="grid grid-cols-3 gap-2">
                  <div className="flex flex-col gap-1.5">
                    <label className="text-xs font-bold text-muted-foreground">Ward</label>
                    <Input placeholder="Msasani" value={ward} onChange={(e) => setWard(e.target.value)} required />
                  </div>
                  <div className="flex flex-col gap-1.5">
                    <label className="text-xs font-bold text-muted-foreground">District</label>
                    <Input placeholder="Kinondoni" value={district} onChange={(e) => setDistrict(e.target.value)} required />
                  </div>
                  <div className="flex flex-col gap-1.5">
                    <label className="text-xs font-bold text-muted-foreground">Region</label>
                    <Input placeholder="Dar es Salaam" value={region} onChange={(e) => setRegion(e.target.value)} required />
                  </div>
                </div>

                <div className="flex justify-end gap-2 mt-3 pt-3 border-t">
                  <Button type="button" variant="outline" size="sm" onClick={() => setOpen(false)}>
                    Cancel
                  </Button>
                  <Button type="submit" disabled={saving} size="sm" className="bg-[#FF6B00] hover:bg-[#E05E00] text-white font-bold text-xs">
                    {saving && <Loader2 className="size-3.5 animate-spin mr-1" />}
                    Save Address to DB
                  </Button>
                </div>
              </form>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      {loading ? (
        <Card className="py-12 text-center bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800">
          <CardContent className="space-y-2">
            <Loader2 className="size-8 animate-spin text-[#FF6B00] mx-auto" />
            <p className="text-xs text-muted-foreground font-medium">Loading saved delivery addresses from database...</p>
          </CardContent>
        </Card>
      ) : addressList.length === 0 ? (
        <Card className="py-12 text-center bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 shadow-xs">
          <CardContent className="space-y-4">
            <MapPin className="size-12 text-muted-foreground mx-auto" />
            <div>
              <h3 className="text-base font-extrabold">No saved addresses found</h3>
              <p className="text-xs text-muted-foreground mt-1">Add a delivery destination for fast 1-click AzamPay checkout.</p>
            </div>
            <Button onClick={() => setOpen(true)} className="bg-[#FF6B00] hover:bg-[#E05E00] text-white font-bold text-xs rounded-xl">
              <Plus className="size-4 mr-1.5" />
              Add First Delivery Address
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2">
          {addressList.map((addr) => (
            <Card key={addr.id} className={`bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 shadow-xs transition-shadow ${addr.isDefault ? 'border-[#FF6B00] ring-1 ring-[#FF6B00]/30' : ''}`}>
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <div className="flex items-center gap-2">
                  <MapPin className="size-4 text-[#FF6B00]" />
                  <CardTitle className="text-sm font-extrabold">{addr.label}</CardTitle>
                </div>
                {addr.isDefault && (
                  <Badge className="bg-orange-50 text-[#FF6B00] border-orange-200 text-[10px] font-bold gap-1">
                    <CheckCircle2 className="size-3 text-[#FF6B00]" /> Default Destination
                  </Badge>
                )}
              </CardHeader>
              <CardContent className="flex flex-col gap-3 text-xs text-muted-foreground">
                <div className="flex flex-col gap-1 p-2.5 rounded-lg bg-slate-50 dark:bg-slate-800/60 font-medium">
                  <span className="font-extrabold text-foreground text-sm">{addr.recipient}</span>
                  <span>{addr.street}</span>
                  <span>
                    {addr.ward}, {addr.district}, <strong className="text-foreground">{addr.region}</strong>
                  </span>
                  <span className="font-mono text-foreground font-semibold mt-1">Phone: {addr.phone}</span>
                </div>

                <div className="flex items-center justify-between pt-2 border-t border-slate-100 dark:border-slate-800">
                  {!addr.isDefault ? (
                    <Button variant="ghost" size="sm" className="text-xs font-bold text-[#FF6B00] hover:bg-orange-50" onClick={() => handleSetDefault(addr.id)}>
                      Set as default
                    </Button>
                  ) : (
                    <span className="text-[11px] text-[#FF6B00] font-bold">✓ Primary Checkout Address</span>
                  )}
                  <Button variant="ghost" size="icon" className="text-red-500 hover:bg-red-50" onClick={() => handleDelete(addr.id)}>
                    <Trash2 className="size-4" />
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  )
}
