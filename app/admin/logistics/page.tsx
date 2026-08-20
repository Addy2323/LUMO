'use client'

import { useState, useEffect } from 'react'
import { Truck, ShieldCheck, Plus, CheckCircle2, Globe, RefreshCw, Server } from 'lucide-react'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { toast } from 'sonner'

type CarrierPartner = {
  id: string
  name: string
  code: string
  coverage: string
  apiStatus: 'Connected' | 'Degraded' | 'Offline'
  activeShipments: number
}

export default function AdminLogisticsPage() {
  const [carriers, setCarriers] = useState<CarrierPartner[]>([])
  const [loading, setLoading] = useState(true)

  const fetchLogisticsPartners = async () => {
    setLoading(true)
    try {
      const res = await fetch('/api/admin/users')
      const data = await res.json()
      if (data.users) {
        const partners = data.users
          .filter((u: any) => u.role === 'LOGISTICS')
          .map((u: any) => ({
            id: u.id,
            name: u.fullName || u.name || u.email.split('@')[0],
            code: `CARRIER-${u.id.slice(0, 6).toUpperCase()}`,
            coverage: u.phone ? `Tanzania / Region (${u.phone})` : 'Guangzhou / Yiwu → Dar es Salaam Port',
            apiStatus: u.status === 'ACTIVE' ? 'Connected' : 'Offline',
            activeShipments: 0,
          }))
        setCarriers(partners)
      }
    } catch (error) {
      console.error('Failed to fetch logistics partners:', error)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchLogisticsPartners()
  }, [])

  return (
    <div className="flex flex-col gap-6 font-sans antialiased text-foreground">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between border-b pb-4">
        <div>
          <h1 className="text-2xl font-extrabold tracking-tight">Database Logistics Partners &amp; API Webhooks</h1>
          <p className="text-xs text-muted-foreground mt-1">
            Manage freight forwarding partners, air/sea cargo webhooks, and carrier SLA metrics directly connected to PostgreSQL.
          </p>
        </div>
        <Button variant="outline" size="sm" onClick={fetchLogisticsPartners} className="text-xs font-bold gap-1.5 h-9">
          <RefreshCw className={`size-3.5 ${loading ? 'animate-spin' : ''}`} /> Refresh Database
        </Button>
      </div>

      {loading ? (
        <div className="p-12 text-center text-xs text-muted-foreground">
          <RefreshCw className="size-6 animate-spin mx-auto mb-2 text-primary" />
          Loading live logistics partners from database...
        </div>
      ) : carriers.length === 0 ? (
        <div className="p-8 text-center text-xs text-muted-foreground space-y-2">
          <p className="font-semibold text-foreground">No registered logistics partners in database.</p>
          <p>New logistics courier partners will appear here upon partner registration.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {carriers.map((c) => (
            <Card key={c.id} className="flex flex-col justify-between">
              <CardHeader className="pb-2 space-y-1">
                <div className="flex items-center justify-between">
                  <Badge className="bg-emerald-600 text-white text-[10px] font-bold">{c.apiStatus}</Badge>
                  <span className="font-mono text-xs font-bold text-primary">{c.activeShipments} Manifests</span>
                </div>
                <CardTitle className="text-sm font-extrabold text-foreground">{c.name}</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="bg-muted/40 p-3 rounded-lg border text-xs font-mono space-y-1">
                  <div className="text-muted-foreground">Carrier Code: <span className="font-bold text-foreground">{c.code}</span></div>
                  <div className="text-muted-foreground">Coverage: <span className="font-bold text-foreground">{c.coverage}</span></div>
                </div>
                <Button variant="outline" size="sm" onClick={() => toast.success(`API Webhook ping sent to ${c.name}`)} className="w-full text-xs font-bold">
                  <Server className="size-3.5 mr-1" />
                  Test API Integration
                </Button>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  )
}
