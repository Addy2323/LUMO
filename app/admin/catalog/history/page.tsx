'use client'

import { useState } from 'react'
import Link from 'next/link'
import { ArrowLeft, Download, FileSpreadsheet, History, Search } from 'lucide-react'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'

export default function CatalogImportHistoryPage() {
  const [search, setSearch] = useState('')
  const [history] = useState([
    {
      id: 'imp-001',
      fileName: 'electronics_seed_catalog_100.csv',
      sourceType: 'CSV_IMPORT',
      totalRows: 100,
      importedCount: 97,
      skippedCount: 2,
      failedCount: 1,
      adminName: 'LUMO Super Admin',
      date: '2026-08-07 10:15 AM',
      status: 'COMPLETED_WITH_ERRORS',
    },
    {
      id: 'imp-002',
      fileName: 'istanbul_textile_wholesalers.xlsx',
      sourceType: 'EXCEL_IMPORT',
      totalRows: 50,
      importedCount: 50,
      skippedCount: 0,
      failedCount: 0,
      adminName: 'LUMO Catalog Manager',
      date: '2026-08-06 04:30 PM',
      status: 'COMPLETED',
    },
    {
      id: 'imp-003',
      fileName: 'dubai_dragon_mart_lighting.csv',
      sourceType: 'CSV_IMPORT',
      totalRows: 40,
      importedCount: 40,
      skippedCount: 0,
      failedCount: 0,
      adminName: 'Dubai Field Agent',
      date: '2026-08-05 11:00 AM',
      status: 'COMPLETED',
    },
  ])

  const filtered = history.filter((h) =>
    search.trim() === '' || h.fileName.toLowerCase().includes(search.toLowerCase()),
  )

  return (
    <div className="flex flex-col gap-6 max-w-6xl mx-auto">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Button variant="ghost" size="sm" render={<Link href="/admin/catalog" />}>
            <ArrowLeft className="size-4 mr-1" /> Back
          </Button>
          <div>
            <h1 className="text-xl font-bold tracking-tight">Catalog Import Job History</h1>
            <p className="text-xs text-muted-foreground">Historical audit record of all CSV and Excel batch imports.</p>
          </div>
        </div>
      </div>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <div>
            <CardTitle className="text-base font-semibold flex items-center gap-2">
              <History className="size-4 text-muted-foreground" />
              Batch Import Audit Trail
            </CardTitle>
          </div>

          <div className="relative w-64">
            <Search className="absolute left-2.5 top-2.5 size-4 text-muted-foreground" />
            <Input
              placeholder="Search file name..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-8 text-xs"
            />
          </div>
        </CardHeader>

        <CardContent className="p-0">
          <div className="divide-y border-t border-border">
            {filtered.map((item) => (
              <div key={item.id} className="p-4 flex items-center justify-between gap-4 text-xs">
                <div className="flex items-center gap-3">
                  <FileSpreadsheet className="size-6 text-brand-600 shrink-0" />
                  <div>
                    <span className="font-bold text-foreground block text-sm">{item.fileName}</span>
                    <span className="text-muted-foreground text-[11px]">
                      By {item.adminName} on {item.date}
                    </span>
                  </div>
                </div>

                <div className="flex items-center gap-6">
                  <div className="text-right font-mono">
                    <span className="text-success-600 font-bold block">{item.importedCount} Imported</span>
                    <span className="text-muted-foreground text-[10px]">{item.totalRows} Total Rows</span>
                  </div>

                  <Badge
                    variant={item.status === 'COMPLETED' ? 'secondary' : 'outline'}
                    className="text-[10px]"
                  >
                    {item.status.replace(/_/g, ' ')}
                  </Badge>

                  {item.failedCount > 0 ? (
                    <Button variant="outline" size="sm" className="text-[11px] text-danger-600 gap-1">
                      <Download className="size-3" /> Error Log
                    </Button>
                  ) : null}
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
