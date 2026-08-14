'use client'

import { useState } from 'react'
import { Settings, ShieldAlert, Save, Percent, DollarSign, RefreshCw, AlertTriangle } from 'lucide-react'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { toast } from 'sonner'

export default function AdminSettingsPage() {
  const [commissionRate, setCommissionRate] = useState(5.0)
  const [vatRate, setVatRate] = useState(18.0)
  const [usdExchangeRate, setUsdExchangeRate] = useState(2600)
  const [maintenanceMode, setMaintenanceMode] = useState(false)

  function handleSaveSettings(e: React.FormEvent) {
    e.preventDefault()
    toast.success('System configuration & platform fees updated successfully!')
  }

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="text-2xl font-extrabold tracking-tight">System Configurations &amp; Platform Fees</h1>
        <p className="text-sm text-muted-foreground">
          Configure platform commission rates, TRA VAT tax percentages, USD/TZS exchange rates, and maintenance toggles.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle className="text-base font-extrabold flex items-center gap-2">
              <Percent className="size-5 text-brand-500" />
              Platform Fee Tariff Structure
            </CardTitle>
            <CardDescription className="text-xs">
              Global marketplace commission and taxation variables applied across quotes.
            </CardDescription>
          </CardHeader>

          <CardContent>
            <form onSubmit={handleSaveSettings} className="space-y-4 text-xs">
              <div className="space-y-1">
                <label className="font-bold">Platform Take-Rate Commission (%)</label>
                <Input
                  type="number"
                  step="0.1"
                  value={commissionRate}
                  onChange={(e) => setCommissionRate(Number(e.target.value))}
                  className="text-xs font-mono"
                />
              </div>

              <div className="space-y-1">
                <label className="font-bold">Tanzania TRA Statutory VAT Rate (%)</label>
                <Input
                  type="number"
                  step="0.1"
                  value={vatRate}
                  onChange={(e) => setVatRate(Number(e.target.value))}
                  className="text-xs font-mono"
                />
              </div>

              <div className="space-y-1">
                <label className="font-bold">Base USD to TZS Exchange Rate (1 USD = X TZS)</label>
                <Input
                  type="number"
                  value={usdExchangeRate}
                  onChange={(e) => setUsdExchangeRate(Number(e.target.value))}
                  className="text-xs font-mono"
                />
              </div>

              <Button type="submit" className="w-full bg-brand-500 hover:bg-brand-600 text-white font-bold text-xs">
                <Save className="size-4 mr-1.5" />
                Save Global Configurations
              </Button>
            </form>
          </CardContent>
        </Card>

        {/* System Safeguards */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base font-extrabold flex items-center gap-2">
              <AlertTriangle className="size-5 text-amber-500" />
              System Safeguards &amp; Maintenance
            </CardTitle>
            <CardDescription className="text-xs">
              Emergency platform freeze and maintenance mode controls.
            </CardDescription>
          </CardHeader>

          <CardContent className="space-y-4 text-xs">
            <div className="p-4 rounded-xl border bg-muted/40 flex items-center justify-between">
              <div className="space-y-0.5">
                <p className="font-bold text-foreground">Maintenance Mode</p>
                <p className="text-[11px] text-muted-foreground">Restrict marketplace ordering during system updates.</p>
              </div>
              <Button
                variant={maintenanceMode ? 'destructive' : 'outline'}
                size="sm"
                onClick={() => {
                  setMaintenanceMode(!maintenanceMode)
                  toast.success(`Maintenance Mode ${!maintenanceMode ? 'ENABLED' : 'DISABLED'}`)
                }}
                className="text-xs font-bold"
              >
                {maintenanceMode ? 'Active (Disable)' : 'Inactive (Enable)'}
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
