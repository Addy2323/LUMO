'use client'

import {
  ShieldCheck,
  Lock,
  Smartphone,
  MapPin,
  Clock,
  UserCheck,
  FileCheck,
} from 'lucide-react'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { useAgentStore } from '@/lib/stores/agent-store'

export default function AgentSettingsPage() {
  const { auditLogs, activeCountry, agentName } = useAgentStore()

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-extrabold font-heading text-white">Security &amp; Non-Repudiation Audit Trail</h1>
        <p className="text-xs text-slate-400 font-mono">
          Security Protocol: <strong className="text-brand-400">Enterprise Encrypted Audit Log</strong> · Device &amp; GPS Telemetry Enabled
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card className="bg-slate-900 border-slate-800">
          <CardContent className="p-4 flex items-center gap-3">
            <div className="size-10 rounded-xl bg-emerald-500/20 text-emerald-400 font-extrabold flex items-center justify-center border border-emerald-500/30 shrink-0">
              <ShieldCheck className="size-5" />
            </div>
            <div>
              <span className="text-[10px] text-slate-400 font-mono uppercase block">Identity &amp; Terminal</span>
              <strong className="text-xs text-white font-bold block">{agentName}</strong>
              <span className="text-[10px] text-emerald-400 font-mono">Biometric Verified</span>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-slate-900 border-slate-800">
          <CardContent className="p-4 flex items-center gap-3">
            <div className="size-10 rounded-xl bg-brand-500/20 text-brand-400 font-extrabold flex items-center justify-center border border-brand-500/30 shrink-0">
              <MapPin className="size-5" />
            </div>
            <div>
              <span className="text-[10px] text-slate-400 font-mono uppercase block">GPS Location Lock</span>
              <strong className="text-xs text-white font-bold block">Active Location</strong>
              <span className="text-[10px] text-brand-400 font-mono">{activeCountry} Field Hub</span>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-slate-900 border-slate-800">
          <CardContent className="p-4 flex items-center gap-3">
            <div className="size-10 rounded-xl bg-purple-500/20 text-purple-400 font-extrabold flex items-center justify-center border border-purple-500/30 shrink-0">
              <Smartphone className="size-5" />
            </div>
            <div>
              <span className="text-[10px] text-slate-400 font-mono uppercase block">Device Telemetry</span>
              <strong className="text-xs text-white font-bold block">LUMO Handheld Terminal v4</strong>
              <span className="text-[10px] text-purple-400 font-mono">Encrypted Operations Portal</span>
            </div>
          </CardContent>
        </Card>
      </div>

      <Card className="bg-slate-900 border-slate-800">
        <CardHeader className="p-5 border-b border-slate-800 flex flex-row items-center justify-between">
          <div>
            <CardTitle className="text-base font-extrabold text-white flex items-center gap-2">
              <Lock className="size-5 text-brand-400" />
              Field Action Audit Log Table
            </CardTitle>
            <p className="text-xs text-slate-400">Cryptographically signed logs of all inspections, uploads &amp; approvals</p>
          </div>
          <Badge className="bg-slate-800 text-slate-300 border border-slate-700 text-xs font-mono">
            {auditLogs.length} Signed Events
          </Badge>
        </CardHeader>

        <CardContent className="p-0">
          {auditLogs.length === 0 ? (
            <div className="p-8 text-center space-y-2">
              <Lock className="size-8 text-slate-600 mx-auto" />
              <p className="text-xs font-bold text-slate-300">No Audit Events Logged Yet</p>
              <p className="text-[11px] text-slate-500">
                Actions taken in {activeCountry} Hub (inspection submissions, photo uploads, shipment creation) will generate tamper-proof audit records here.
              </p>
            </div>
          ) : (
            <div className="divide-y divide-slate-800">
              {auditLogs.map((log) => (
                <div key={log.id} className="p-5 flex flex-col md:flex-row md:items-center justify-between gap-4 hover:bg-slate-800/40 transition-colors">
                  <div className="space-y-1">
                    <div className="flex items-center gap-2 font-mono text-xs">
                      <span className="font-bold text-brand-400">{log.action}</span>
                      <Badge variant="outline" className="text-[10px] border-slate-700 text-slate-300">
                        {log.country} Hub
                      </Badge>
                      <span className="text-slate-500">{log.timestamp}</span>
                    </div>

                    <p className="text-xs font-bold text-white">{log.details}</p>

                    <div className="flex flex-wrap items-center gap-4 text-[10px] text-slate-400 font-mono pt-1">
                      <span>Agent: <strong className="text-slate-300">{log.agentName}</strong></span>
                      <span>GPS: <strong className="text-emerald-400">{log.gpsLocation}</strong></span>
                      <span>Device: <strong className="text-slate-300">{log.deviceInfo}</strong></span>
                    </div>
                  </div>

                  <div className="shrink-0">
                    <Badge className="bg-emerald-500/10 text-emerald-400 border border-emerald-500/30 text-[10px] font-mono">
                      <FileCheck className="size-3 mr-1" /> AUDIT VERIFIED
                    </Badge>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
