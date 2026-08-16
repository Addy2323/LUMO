'use client'

import { useState } from 'react'
import { MapPin, Plane, Ship, Plus, Trash2, Edit2, ShieldCheck, DollarSign } from 'lucide-react'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { formatTZS } from '@/lib/format'
import { toast } from 'sonner'

type FreightRate = {
  id: string
  route: string
  mode: 'Air Freight' | 'Sea Freight' | 'Local Trucking'
  unitRateUSD: number
  unitRateTZS: number
  estimatedDays: string
}

const INITIAL_RATES: FreightRate[] = []

export default function FreightRatesPage() {
  const [rates, setRates] = useState<FreightRate[]>(INITIAL_RATES)
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [route, setRoute] = useState('')
  const [mode, setMode] = useState<FreightRate['mode']>('Sea Freight')
  const [rateUSD, setRateUSD] = useState(0)
  const [days, setDays] = useState('')

  function handleAddRate() {
    if (!route.trim() || rateUSD <= 0) {
      toast.error('Route title and rate in USD are required')
      return
    }

    const newRate: FreightRate = {
      id: `rate_${Date.now()}`,
      route: route.trim(),
      mode,
      unitRateUSD: rateUSD,
      unitRateTZS: rateUSD * 2600, // 1 USD = 2600 TZS
      estimatedDays: days.trim() || '7-10 Days',
    }

    setRates([...rates, newRate])
    toast.success('Freight rate tariff updated!')
    setIsModalOpen(false)
  }

  function handleDeleteRate(id: string) {
    setRates(rates.filter((r) => r.id !== id))
    toast.success('Rate deleted')
  }

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-extrabold tracking-tight">Freight Rates &amp; Regional Tariff Matrix</h1>
          <p className="text-sm text-muted-foreground">
            Configure Air/Sea freight charges per KG / CBM and local Tanzanian trucking legs.
          </p>
        </div>
        <Button onClick={() => setIsModalOpen(true)} className="bg-brand-500 hover:bg-brand-600 text-white font-bold text-xs">
          <Plus className="size-4 mr-1.5" />
          Add Freight Tariff Rate
        </Button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {rates.map((r) => (
          <Card key={r.id} className="flex flex-col justify-between hover:shadow-md transition-shadow">
            <CardHeader className="pb-2 space-y-1">
              <div className="flex items-center justify-between">
                <Badge className={r.mode === 'Air Freight' ? 'bg-sky-600 text-white' : 'bg-brand-500 text-white'}>
                  {r.mode === 'Air Freight' ? <Plane className="size-3 mr-1" /> : <Ship className="size-3 mr-1" />}
                  {r.mode}
                </Badge>
                <span className="font-mono text-xs font-bold text-muted-foreground">{r.estimatedDays}</span>
              </div>
              <CardTitle className="text-xs font-extrabold text-foreground pt-1">{r.route}</CardTitle>
            </CardHeader>

            <CardContent className="space-y-4">
              <div className="bg-muted/40 p-3 rounded-lg border text-xs space-y-1 font-mono">
                <div className="flex justify-between text-muted-foreground">
                  <span>Tariff USD:</span>
                  <span className="font-bold text-foreground">${r.unitRateUSD}</span>
                </div>
                <div className="flex justify-between text-muted-foreground">
                  <span>Landed TZS Equiv:</span>
                  <span className="font-bold text-brand-500">{formatTZS(r.unitRateTZS)}</span>
                </div>
              </div>

              <Button
                variant="outline"
                size="sm"
                onClick={() => handleDeleteRate(r.id)}
                className="w-full text-xs font-bold text-destructive hover:bg-destructive/10"
              >
                <Trash2 className="size-3.5 mr-1" />
                Remove Tariff Rate
              </Button>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Add Rate Modal */}
      {isModalOpen && (
        <Dialog open onOpenChange={setIsModalOpen}>
          <DialogContent className="max-w-md p-6">
            <DialogHeader>
              <DialogTitle className="text-base font-extrabold">Add Freight Tariff Rate</DialogTitle>
            </DialogHeader>

            <div className="space-y-4 text-xs">
              <div className="space-y-1">
                <label className="font-bold">Shipping Route Name</label>
                <Input
                  placeholder="e.g. Ningbo Port → Dar es Salaam Port"
                  value={route}
                  onChange={(e) => setRoute(e.target.value)}
                  className="text-xs"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="font-bold">Freight Mode</label>
                  <select
                    value={mode}
                    onChange={(e) => setMode(e.target.value as FreightRate['mode'])}
                    className="w-full h-9 rounded-md border border-input bg-background px-3 text-xs font-bold"
                  >
                    <option value="Sea Freight">Sea Freight (per CBM)</option>
                    <option value="Air Freight">Air Freight (per KG)</option>
                    <option value="Local Trucking">Local Trucking</option>
                  </select>
                </div>

                <div className="space-y-1">
                  <label className="font-bold">Unit Rate ($ USD)</label>
                  <Input
                    type="number"
                    value={rateUSD}
                    onChange={(e) => setRateUSD(Number(e.target.value))}
                    className="text-xs font-mono"
                  />
                </div>
              </div>

              <div className="space-y-1">
                <label className="font-bold">Estimated Transit Time</label>
                <Input
                  placeholder="e.g. 20-30 Days"
                  value={days}
                  onChange={(e) => setDays(e.target.value)}
                  className="text-xs"
                />
              </div>
            </div>

            <DialogFooter className="mt-4">
              <Button variant="outline" size="sm" onClick={() => setIsModalOpen(false)}>
                Cancel
              </Button>
              <Button size="sm" onClick={handleAddRate} className="bg-brand-500 hover:bg-brand-600 text-white font-bold">
                Save Rate Tariff
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      )}
    </div>
  )
}
