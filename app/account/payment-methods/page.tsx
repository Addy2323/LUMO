'use client'

import { useState } from 'react'
import { CreditCard, Smartphone, Plus, Trash2, ShieldCheck, CheckCircle2, Star } from 'lucide-react'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { toast } from 'sonner'

import { useSessionStore } from '@/lib/stores/session-store'
import { useEffect } from 'react'

type SavedPaymentMethod = {
  id: string
  type: 'mpesa' | 'tigopesa' | 'airtel' | 'card'
  title: string
  accountIdentifier: string // e.g. +255 754 *** 456 or Visa ending in 4921
  isDefault: boolean
}

const INITIAL_METHODS: SavedPaymentMethod[] = [
  {
    id: 'pm_1',
    type: 'mpesa',
    title: 'Vodacom M-Pesa Business Wallet',
    accountIdentifier: '+255 754 123 456',
    isDefault: true,
  },
  {
    id: 'pm_2',
    type: 'card',
    title: 'CRDB Bank Visa Corporate Card',
    accountIdentifier: '•••• •••• •••• 4921 (Exp 09/28)',
    isDefault: false,
  },
]

export default function CustomerPaymentMethodsPage() {
  const user = useSessionStore((s) => s.user)
  const isDemoUser =
    user?.id === 'usr_cus_001' ||
    user?.id === 'cust_01' ||
    user?.email === 'amina.hassan@example.co.tz'

  const [methods, setMethods] = useState<SavedPaymentMethod[]>([])
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [type, setType] = useState<SavedPaymentMethod['type']>('mpesa')
  const [title, setTitle] = useState('')
  const [identifier, setIdentifier] = useState('')

  useEffect(() => {
    if (!user) {
      setMethods([])
      return
    }

    if (isDemoUser) {
      setMethods(INITIAL_METHODS)
      return
    }

    try {
      const stored = localStorage.getItem(`lumo_pay_methods_${user.id}`)
      if (stored) {
        setMethods(JSON.parse(stored))
      } else {
        setMethods([])
      }
    } catch {
      setMethods([])
    }
  }, [user, isDemoUser])

  function updateAndPersistMethods(newMethods: SavedPaymentMethod[]) {
    setMethods(newMethods)
    if (user && !isDemoUser) {
      try {
        localStorage.setItem(`lumo_pay_methods_${user.id}`, JSON.stringify(newMethods))
      } catch (e) {
        console.error('Failed to save payment methods:', e)
      }
    }
  }

  function handleSetDefault(id: string) {
    const updated = methods.map((m) => ({
      ...m,
      isDefault: m.id === id,
    }))
    updateAndPersistMethods(updated)
    toast.success('Default payment method updated!')
  }

  function handleDelete(id: string) {
    const updated = methods.filter((m) => m.id !== id)
    updateAndPersistMethods(updated)
    toast.success('Payment method removed')
  }

  function handleAddMethod() {
    if (!title.trim() || !identifier.trim()) {
      toast.error('All fields are required')
      return
    }

    const newMethod: SavedPaymentMethod = {
      id: `pm_${Date.now()}`,
      type,
      title: title.trim(),
      accountIdentifier: identifier.trim(),
      isDefault: methods.length === 0,
    }

    const updated = [...methods, newMethod]
    updateAndPersistMethods(updated)
    toast.success('Payment method saved!')
    setIsModalOpen(false)
    setTitle('')
    setIdentifier('')
  }

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-extrabold tracking-tight">Payment Methods &amp; Digital Wallets</h1>
          <p className="text-sm text-muted-foreground">
            Manage your mobile money accounts (M-Pesa, Tigo Pesa, Airtel Money) and corporate credit cards.
          </p>
        </div>
        <Button onClick={() => setIsModalOpen(true)} className="bg-brand-500 hover:bg-brand-600 text-white font-bold text-xs">
          <Plus className="size-4 mr-1.5" />
          Add Payment Method
        </Button>
      </div>

      {methods.length === 0 ? (
        <Card className="py-12 text-center">
          <CardContent className="space-y-4">
            <CreditCard className="size-12 text-muted-foreground mx-auto" />
            <div>
              <h3 className="text-base font-bold">No saved payment methods</h3>
              <p className="text-xs text-muted-foreground mt-1">Save your M-Pesa, Tigo Pesa, or Bank Card for fast 1-click checkout.</p>
            </div>
            <Button onClick={() => setIsModalOpen(true)} className="bg-brand-500 hover:bg-brand-600 text-white font-bold text-xs">
              <Plus className="size-4 mr-1.5" />
              Add Payment Method
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {methods.map((m) => (
          <Card key={m.id} className={`relative border-2 ${m.isDefault ? 'border-brand-500 shadow-md' : 'border-border'}`}>
            <CardHeader className="pb-2 flex flex-row items-center justify-between">
              <div className="flex items-center gap-2">
                {m.type === 'card' ? (
                  <CreditCard className="size-5 text-brand-500" />
                ) : (
                  <Smartphone className="size-5 text-emerald-500" />
                )}
                <CardTitle className="text-sm font-extrabold text-foreground">{m.title}</CardTitle>
              </div>

              {m.isDefault && (
                <Badge className="bg-brand-500 text-white text-[9px] font-bold">Default Payment</Badge>
              )}
            </CardHeader>

            <CardContent className="space-y-4">
              <div className="bg-muted/40 p-3 rounded-lg border font-mono text-xs font-bold text-foreground">
                {m.accountIdentifier}
              </div>

              <div className="flex items-center justify-between pt-2 border-t text-xs">
                {!m.isDefault ? (
                  <Button variant="ghost" size="xs" onClick={() => handleSetDefault(m.id)} className="text-xs font-bold text-brand-500">
                    <Star className="size-3.5 mr-1" />
                    Set as Default
                  </Button>
                ) : (
                  <span className="text-[11px] text-muted-foreground flex items-center gap-1">
                    <ShieldCheck className="size-3.5 text-emerald-500" /> Auto-selected at Checkout
                  </span>
                )}

                <Button variant="outline" size="xs" onClick={() => handleDelete(m.id)} className="text-xs text-destructive">
                  <Trash2 className="size-3.5" />
                </Button>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
      )}

      {/* Add Modal */}
      {isModalOpen && (
        <Dialog open onOpenChange={setIsModalOpen}>
          <DialogContent className="max-w-md p-6">
            <DialogHeader>
              <DialogTitle className="text-base font-extrabold">Add New Payment Method</DialogTitle>
            </DialogHeader>

            <div className="space-y-4 text-xs">
              <div className="space-y-1">
                <label className="font-bold">Payment Type</label>
                <select
                  value={type}
                  onChange={(e) => setType(e.target.value as SavedPaymentMethod['type'])}
                  className="w-full h-9 rounded-md border border-input bg-background px-3 text-xs font-bold"
                >
                  <option value="mpesa">Vodacom M-Pesa</option>
                  <option value="tigopesa">Mix by Yas (Tigo Pesa)</option>
                  <option value="airtel">Airtel Money</option>
                  <option value="card">Credit / Debit Card (Visa / Mastercard)</option>
                </select>
              </div>

              <div className="space-y-1">
                <label className="font-bold">Account Name / Label</label>
                <Input
                  placeholder="e.g. Primary M-Pesa Line or CRDB Visa"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  className="text-xs"
                />
              </div>

              <div className="space-y-1">
                <label className="font-bold">Phone Number or Card Number</label>
                <Input
                  placeholder="+255 7XX XXX XXX or Card Number"
                  value={identifier}
                  onChange={(e) => setIdentifier(e.target.value)}
                  className="text-xs font-mono"
                />
              </div>
            </div>

            <DialogFooter className="mt-4">
              <Button variant="outline" size="sm" onClick={() => setIsModalOpen(false)}>
                Cancel
              </Button>
              <Button size="sm" onClick={handleAddMethod} className="bg-brand-500 hover:bg-brand-600 text-white font-bold">
                Save Payment Method
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      )}
    </div>
  )
}
