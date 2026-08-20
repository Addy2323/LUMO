'use client'

import { useState } from 'react'
import Link from 'next/link'
import { ShieldCheck, Lock, Search, FileText, UserCheck, AlertTriangle } from 'lucide-react'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { formatDate } from '@/lib/format'

type AuditEntry = {
  id: string
  timestamp: string
  actor: string
  action: string
  target: string
  category: 'security' | 'financial' | 'catalog' | 'kyc'
  ipAddress: string
}

const MOCK_AUDIT_LOGS: AuditEntry[] = []

export default function AdminAuditPage() {
  const [logs, setLogs] = useState<AuditEntry[]>(MOCK_AUDIT_LOGS)
  const [search, setSearch] = useState('')

  const filteredLogs = logs.filter(
    (l) =>
      search.trim() === '' ||
      l.action.toLowerCase().includes(search.toLowerCase()) ||
      l.actor.toLowerCase().includes(search.toLowerCase()) ||
      l.target.toLowerCase().includes(search.toLowerCase()),
  )

  return (
    <div className="flex flex-col gap-6 font-heading">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold font-heading tracking-tight">Security &amp; Operational Audit Trail</h1>
          <p className="text-sm text-muted-foreground">
            Immutable system logs tracking financial settlements, delivery scans, role changes, and KYC approvals.
          </p>
        </div>
      </div>

      <Card className="border-info-500/20 bg-info-50/40 dark:bg-info-950/20">
        <CardContent className="flex items-center gap-3 p-4 text-xs text-info-800 dark:text-info-400">
          <ShieldCheck className="size-4 shrink-0 text-info-600" />
          <span>
            Security Standard: Audit logs are append-only. All LUMO Pay payout unlocks and admin state changes are cryptographically timestamped.
          </span>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-center gap-2">
            <CardTitle className="text-base font-semibold font-heading">Audit Event Log</CardTitle>
          </div>

          <div className="relative w-full sm:w-64">
            <Search className="absolute left-2.5 top-2.5 size-4 text-muted-foreground" />
            <Input
              placeholder="Search action, actor, target..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-8 text-xs"
            />
          </div>
        </CardHeader>

        <CardContent className="p-0">
          <div className="divide-y border-t border-border">
            {filteredLogs.length === 0 ? (
              <div className="p-8 text-center text-xs text-muted-foreground">
                No audit events recorded.
              </div>
            ) : (
              filteredLogs.map((log) => (
                <div
                  key={log.id}
                  className="flex flex-col gap-2 p-4 sm:flex-row sm:items-center sm:justify-between hover:bg-muted/40 transition-colors"
                >
                  <div className="flex flex-col gap-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="font-mono text-xs font-semibold text-primary-500">{log.action}</span>
                      <Badge variant="outline" className="text-[10px] uppercase">
                        {log.category}
                      </Badge>
                    </div>

                    <span className="text-xs text-foreground font-medium">{log.target}</span>

                    <span className="text-[11px] text-muted-foreground">
                      Actor: {log.actor} · IP: {log.ipAddress}
                    </span>
                  </div>

                  <div className="shrink-0 text-right">
                    <span className="text-xs text-muted-foreground font-mono">{formatDate(log.timestamp)}</span>
                  </div>
                </div>
              ))
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
