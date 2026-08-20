'use client'

import { useState } from 'react'
import { Truck, Package, Search, DollarSign, MapPin, CheckCircle2, ShieldCheck, ArrowRight } from 'lucide-react'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { formatTZS } from '@/lib/format'
import { toast } from 'sonner'

type JobOffer = {
  id: string
  jobRef: string
  origin: string
  destination: string
  cargoType: string
  weightKg: number
  volumeCbm: number
  proposedPayoutTZS: number
  deadline: string
  status: 'Open for Bids' | 'Accepted'
}

const AVAILABLE_JOBS: JobOffer[] = [
  {
    id: 'job-501',
    jobRef: 'JOB-TZ-77101',
    origin: 'Guangzhou Port 🇨🇳',
    destination: 'Dar es Salaam Port 🇹🇿',
    cargoType: 'Sanitaryware & Ceramic Tiles (40ft Container)',
    weightKg: 18500,
    volumeCbm: 58,
    proposedPayoutTZS: 14500000,
    deadline: '20 August 2026',
    status: 'Open for Bids',
  },
  {
    id: 'job-502',
    jobRef: 'JOB-TZ-77102',
    origin: 'Dubai Jebel Ali 🇦🇪',
    destination: 'Zanzibar Port 🇹🇿',
    cargoType: 'Apparel & Textiles Air Freight',
    weightKg: 2400,
    volumeCbm: 12,
    proposedPayoutTZS: 6800000,
    deadline: '17 August 2026',
    status: 'Open for Bids',
  },
]

export default function LogisticsJobMarketplacePage() {
  const [jobs, setJobs] = useState<JobOffer[]>(AVAILABLE_JOBS)
  const [search, setSearch] = useState('')

  function acceptJob(id: string) {
    setJobs((prev) =>
      prev.map((j) => (j.id === id ? { ...j, status: 'Accepted' } : j))
    )
    toast.success(`Shipment Contract Accepted! Cargo assigned to your fleet.`)
  }

  return (
    <div className="flex flex-col gap-6 font-sans antialiased text-foreground">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between border-b pb-4">
        <div>
          <h1 className="text-2xl font-extrabold tracking-tight">Shipment Job Marketplace</h1>
          <p className="text-xs text-muted-foreground mt-1">
            Bidding &amp; Contract Portal for Logistics Carrier Partners. Review origin, destination, cargo weight, and payout terms.
          </p>
        </div>
      </div>

      <div className="space-y-4">
        <div className="relative w-full sm:w-80">
          <Search className="absolute left-3 top-2.5 size-4 text-muted-foreground" />
          <Input
            placeholder="Search origin, destination, or cargo..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-9 text-xs h-9"
          />
        </div>

        <div className="grid gap-4">
          {jobs.map((job) => (
            <Card key={job.id} className="p-5 flex flex-col md:flex-row md:items-center justify-between gap-4">
              <div className="space-y-1.5 min-w-0 text-xs">
                <div className="flex items-center gap-2">
                  <span className="font-mono font-extrabold text-xs text-primary">{job.jobRef}</span>
                  <Badge
                    className={`text-[10px] uppercase ${
                      job.status === 'Accepted' ? 'bg-emerald-600 text-white' : 'bg-blue-600 text-white'
                    }`}
                  >
                    {job.status}
                  </Badge>
                </div>

                <h3 className="font-bold text-sm text-foreground">{job.cargoType}</h3>

                <p className="text-muted-foreground">
                  Route: <strong>{job.origin}</strong> → <strong>{job.destination}</strong>
                </p>

                <div className="flex flex-wrap gap-3 font-mono text-[11px] text-muted-foreground pt-1">
                  <span>Weight: <strong className="text-foreground">{job.weightKg.toLocaleString()} kg</strong></span>
                  <span>Volume: <strong className="text-foreground">{job.volumeCbm} CBM</strong></span>
                  <span>Deadline: <strong className="text-foreground">{job.deadline}</strong></span>
                </div>
              </div>

              <div className="flex flex-col sm:items-end gap-2 shrink-0">
                <span className="font-mono font-extrabold text-lg text-emerald-600">
                  {formatTZS(job.proposedPayoutTZS)}
                </span>

                {job.status === 'Open for Bids' ? (
                  <Button
                    onClick={() => acceptJob(job.id)}
                    className="bg-primary hover:bg-primary/80 text-white font-bold text-xs"
                  >
                    <Truck className="size-3.5 mr-1" /> Accept &amp; Assign to Fleet
                  </Button>
                ) : (
                  <Badge className="bg-emerald-600 text-white font-bold text-xs py-1">
                    <CheckCircle2 className="size-3.5 mr-1" /> Contract Secured
                  </Badge>
                )}
              </div>
            </Card>
          ))}
        </div>
      </div>
    </div>
  )
}
