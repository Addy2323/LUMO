'use client'

import React, { useState, useEffect } from 'react'
import { Building2, Search, RefreshCw, UserCheck, Phone, Mail, ShieldCheck } from 'lucide-react'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { toast } from 'sonner'

export default function SourcingAgentsPage() {
  const [agents, setAgents] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')

  useEffect(() => {
    fetchAgents()
  }, [])

  async function fetchAgents() {
    setLoading(true)
    try {
      const res = await fetch('/api/admin/users?role=AGENT')
      if (res.ok) {
        const data = await res.json()
        setAgents(data.users || [])
      }
    } catch (err) {
      console.error('Failed to fetch agents:', err)
      toast.error('Failed to load sourcing agents')
    } finally {
      setLoading(false)
    }
  }

  const filtered = agents.filter(
    (a) =>
      (a.name || '').toLowerCase().includes(search.toLowerCase()) ||
      (a.email || '').toLowerCase().includes(search.toLowerCase())
  )

  return (
    <div className="flex flex-col gap-5 font-sans antialiased text-slate-900 bg-surface-secondary min-h-screen p-3 md:p-6 pb-24">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-white p-4 rounded-xl border border-slate-200 shadow-sm">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-xl md:text-2xl font-black tracking-tight text-slate-900 flex items-center gap-2">
              <Building2 className="size-6 text-primary" /> Sourcing Agents Liaison Desk
            </h1>
            <Badge className="bg-orange-50 text-primary border-orange-200 text-[10px] font-bold">
              Live PostgreSQL
            </Badge>
          </div>
          <p className="text-xs text-slate-500 mt-0.5">
            Directory and job assignment overview for accredited field sourcing agents in Guangzhou, Yiwu, &amp; Dar es Salaam.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <div className="relative w-48">
            <Search className="absolute left-3 top-2.5 size-3.5 text-slate-400" />
            <Input
              type="text"
              placeholder="Search agent name..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-8 bg-slate-50 border-slate-200 text-xs h-9"
            />
          </div>
          <Button
            onClick={fetchAgents}
            variant="outline"
            className="border-slate-200 bg-white text-slate-700 hover:bg-slate-50 text-xs font-bold h-9 px-3 gap-1.5"
          >
            <RefreshCw className={`size-3.5 ${loading ? 'animate-spin' : ''}`} /> Refresh
          </Button>
        </div>
      </div>

      <Card className="bg-white border-slate-200 p-4 shadow-sm space-y-3">
        {loading ? (
          <div className="py-12 text-center text-xs text-slate-400 flex items-center justify-center gap-2">
            <RefreshCw className="size-4 animate-spin text-primary" /> Loading sourcing agents...
          </div>
        ) : filtered.length === 0 ? (
          <div className="py-12 text-center text-xs text-slate-400 space-y-1">
            <p className="font-semibold text-slate-600">No accredited agents in directory</p>
            <p>Field agent profiles will appear here when registered.</p>
          </div>
        ) : (
          <div className="divide-y divide-slate-100">
            {filtered.map((item) => (
              <div key={item.id} className="py-3 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs">
                <div className="space-y-1">
                  <div className="flex items-center gap-2 font-bold text-slate-900">
                    <UserCheck className="size-4 text-primary" />
                    <span>{item.name}</span>
                    <Badge className="bg-emerald-50 text-emerald-700 border-emerald-200 text-[9px]">Verified Agent</Badge>
                  </div>
                  <p className="text-slate-500 text-[11px]">
                    Email: {item.email} · Phone: {item.phone || 'Not listed'}
                  </p>
                </div>

                <Badge className="bg-slate-100 text-slate-700 font-mono text-[10px]">
                  ID: {item.id.slice(0, 8)}
                </Badge>
              </div>
            ))}
          </div>
        )}
      </Card>
    </div>
  )
}
