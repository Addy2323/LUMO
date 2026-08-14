'use client'

import { useState } from 'react'
import { Route, MapPin, Truck, Calendar, Download, Plus, CheckCircle2, UserCheck } from 'lucide-react'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { toast } from 'sonner'

type DispatchRoute = {
  id: string
  routeCode: string
  origin: string
  destination: string
  driver: string
  vehicle: string
  assignedCargoCount: number
  status: 'Scheduled' | 'In Transit' | 'Completed'
  departureDate: string
}

const INITIAL_ROUTES: DispatchRoute[] = []

export default function LogisticsRoutesPage() {
  const [routes, setRoutes] = useState<DispatchRoute[]>(INITIAL_ROUTES)
  const [search, setSearch] = useState('')

  const filteredRoutes = routes.filter((r) => {
    const q = search.toLowerCase()
    return (
      q === '' ||
      r.routeCode.toLowerCase().includes(q) ||
      r.origin.toLowerCase().includes(q) ||
      r.destination.toLowerCase().includes(q) ||
      r.driver.toLowerCase().includes(q)
    )
  })

  function handleExportManifest(route: DispatchRoute) {
    toast.success(`Exporting cargo dispatch manifest for ${route.routeCode}.csv...`)
  }

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-extrabold tracking-tight">Route Planning &amp; Fleet Dispatch</h1>
          <p className="text-sm text-muted-foreground">
            Optimize regional freight corridors across Tanzania (Dar es Salaam, Mwanza, Arusha, Dodoma, Zanzibar).
          </p>
        </div>
      </div>

      {filteredRoutes.length === 0 ? (
        <Card className="p-8 text-center text-xs text-muted-foreground space-y-2">
          <Route className="size-10 text-muted-foreground/40 mx-auto" />
          <p className="font-bold text-sm text-foreground">No Active Dispatch Routes</p>
          <p className="max-w-md mx-auto">
            Dispatched regional freight corridors and vehicle assignments will populate here in real-time.
          </p>
        </Card>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
          {filteredRoutes.map((r) => (
            <Card key={r.id} className="flex flex-col justify-between hover:shadow-md transition-shadow">
              <CardHeader className="pb-3 space-y-2">
                <div className="flex items-center justify-between">
                  <span className="font-mono font-extrabold text-sm text-brand-500">{r.routeCode}</span>
                  <Badge
                    className={`text-[10px] font-bold ${
                      r.status === 'In Transit' ? 'bg-amber-500 text-white' : 'bg-brand-500 text-white'
                    }`}
                  >
                    {r.status}
                  </Badge>
                </div>

                <div className="space-y-1 pt-1">
                  <div className="flex items-center gap-2 text-xs font-bold text-foreground">
                    <MapPin className="size-3.5 text-red-500 shrink-0" />
                    <span className="truncate">{r.origin}</span>
                  </div>
                  <div className="flex items-center gap-2 text-xs font-bold text-foreground">
                    <MapPin className="size-3.5 text-emerald-500 shrink-0" />
                    <span className="truncate">{r.destination}</span>
                  </div>
                </div>
              </CardHeader>

              <CardContent className="space-y-4">
                <div className="bg-muted/40 p-3 rounded-lg border text-xs space-y-1.5 font-mono">
                  <div className="flex items-center justify-between text-muted-foreground">
                    <span>Assigned Driver:</span>
                    <span className="font-bold text-foreground">{r.driver}</span>
                  </div>
                  <div className="flex items-center justify-between text-muted-foreground">
                    <span>Vehicle:</span>
                    <span className="font-bold text-foreground">{r.vehicle}</span>
                  </div>
                  <div className="flex items-center justify-between text-muted-foreground">
                    <span>Shipments Manifest:</span>
                    <span className="font-bold text-brand-500">{r.assignedCargoCount} Packages</span>
                  </div>
                </div>

                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => handleExportManifest(r)}
                  className="w-full text-xs font-bold"
                >
                  <Download className="size-3.5 mr-1" />
                  Export Dispatch Manifest (CSV)
                </Button>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  )
}
