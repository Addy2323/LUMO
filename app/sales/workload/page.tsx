'use client'

import React, { useState, useEffect } from 'react'
import { Users, Search, RefreshCw, BarChart3, ShieldCheck } from 'lucide-react'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { toast } from 'sonner'

export default function TeamWorkloadPage() {
  const [team, setTeam] = useState<any[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchWorkload()
  }, [])

  async function fetchWorkload() {
    setLoading(true)
    try {
      const res = await fetch('/api/sales/overview')
      if (res.ok) {
        const data = await res.json()
        setTeam(data.teamMembers || [])
      }
    } catch (err) {
      console.error('Failed to fetch team workload:', err)
      toast.error('Failed to load team workload')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="flex flex-col gap-5 font-sans antialiased text-slate-900 bg-[#f8fafc] min-h-screen p-3 md:p-6 pb-24">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-white p-4 rounded-xl border border-slate-200 shadow-sm">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-xl md:text-2xl font-black tracking-tight text-slate-900 flex items-center gap-2">
              <Users className="size-6 text-sky-600" /> Sales Team Workload &amp; Distribution
            </h1>
            <Badge className="bg-sky-50 text-sky-700 border-sky-200 text-[10px] font-bold">
              Live PostgreSQL
            </Badge>
          </div>
          <p className="text-xs text-slate-500 mt-0.5">
            Monitor case load, active customer assignments, and SLA response capacity for sales staff.
          </p>
        </div>

        <Button
          onClick={fetchWorkload}
          variant="outline"
          className="border-slate-200 bg-white text-slate-700 hover:bg-slate-50 text-xs font-bold h-9 px-3 gap-1.5"
        >
          <RefreshCw className={`size-3.5 ${loading ? 'animate-spin' : ''}`} /> Refresh
        </Button>
      </div>

      <Card className="bg-white border-slate-200 p-4 shadow-sm space-y-3">
        {loading ? (
          <div className="py-12 text-center text-xs text-slate-400 flex items-center justify-center gap-2">
            <RefreshCw className="size-4 animate-spin text-sky-600" /> Loading team workload from database...
          </div>
        ) : team.length === 0 ? (
          <div className="py-12 text-center text-xs text-slate-400 space-y-1">
            <p className="font-semibold text-slate-600">No staff workload data</p>
            <p>Active staff case assignments will be reflected here.</p>
          </div>
        ) : (
          <div className="divide-y divide-slate-100">
            {team.map((member, i) => (
              <div key={i} className="py-3 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs">
                <div className="space-y-1">
                  <div className="font-bold text-slate-900">{member.name}</div>
                  <p className="text-slate-500 text-[11px]">
                    Active Cases: {member.cases} · SLA Adherence: {member.sla}
                  </p>
                </div>

                <div className="flex items-center gap-3 w-48">
                  <div className="w-full bg-slate-100 h-2 rounded-full overflow-hidden">
                    <div className={`h-full ${member.workloadColor}`} style={{ width: `${member.workload}%` }} />
                  </div>
                  <span className="font-mono text-slate-600 font-bold">{member.workload}%</span>
                </div>
              </div>
            ))}
          </div>
        )}
      </Card>
    </div>
  )
}
