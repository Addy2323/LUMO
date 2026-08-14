'use client'

import { useState } from 'react'
import Link from 'next/link'
import {
  Boxes,
  CheckCircle2,
  Clock,
  Download,
  FileCheck,
  FileSpreadsheet,
  FileText,
  History,
  Layers,
  Plus,
  ShieldAlert,
  Sparkles,
  UploadCloud,
} from 'lucide-react'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'

export default function CatalogImportDashboardPage() {
  const [recentImports] = useState([
    {
      id: 'imp-001',
      fileName: 'electronics_seed_catalog_100.csv',
      sourceType: 'CSV_IMPORT',
      totalRows: 100,
      importedCount: 97,
      skippedCount: 2,
      failedCount: 1,
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
      date: '2026-08-06 04:30 PM',
      status: 'COMPLETED',
    },
  ])

  return (
    <div className="flex flex-col gap-6">
      {/* Top Banner & Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-2xl font-bold tracking-tight">Product Catalog Import</h1>
            <Badge variant="outline" className="text-xs bg-brand-50 text-brand-700 border-brand-200">
              LUMO Owned Catalog
            </Badge>
          </div>
          <p className="text-sm text-muted-foreground mt-1">
            Initialize and expand LUMO market inventory in bulk without external API dependencies.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            className="gap-2 text-xs"
            onClick={() => {
              const a = document.createElement('a')
              a.href = '/templates/lumo-product-import-template.csv'
              a.download = 'lumo-product-import-template.csv'
              a.click()
            }}
          >
            <Download className="size-3.5 text-brand-600" />
            Download CSV Template
          </Button>

          <Button size="sm" className="gap-2 bg-brand-600 hover:bg-brand-700 text-white text-xs font-semibold" render={<Link href="/admin/catalog/import" />}>
            <UploadCloud className="size-3.5" />
            Launch Import Wizard
          </Button>
        </div>
      </div>

      {/* KPI Stats Bar */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-5">
        <Card>
          <CardContent className="p-4 flex items-center gap-3">
            <div className="p-2.5 rounded-lg bg-blue-50 text-blue-600 dark:bg-blue-950/40">
              <Boxes className="size-5" />
            </div>
            <div>
              <p className="text-xs text-muted-foreground font-medium">Total Products</p>
              <h3 className="text-xl font-extrabold text-foreground">100</h3>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4 flex items-center gap-3">
            <div className="p-2.5 rounded-lg bg-success-50 text-success-600 dark:bg-success-950/40">
              <CheckCircle2 className="size-5" />
            </div>
            <div>
              <p className="text-xs text-muted-foreground font-medium">Published</p>
              <h3 className="text-xl font-extrabold text-foreground">80</h3>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4 flex items-center gap-3">
            <div className="p-2.5 rounded-lg bg-warning-50 text-warning-600 dark:bg-warning-950/40">
              <Clock className="size-5" />
            </div>
            <div>
              <p className="text-xs text-muted-foreground font-medium">Pending Review</p>
              <h3 className="text-xl font-extrabold text-foreground">15</h3>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4 flex items-center gap-3">
            <div className="p-2.5 rounded-lg bg-slate-100 text-slate-700 dark:bg-slate-800">
              <FileText className="size-5" />
            </div>
            <div>
              <p className="text-xs text-muted-foreground font-medium">Drafts</p>
              <h3 className="text-xl font-extrabold text-foreground">5</h3>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4 flex items-center gap-3">
            <div className="p-2.5 rounded-lg bg-danger-50 text-danger-600 dark:bg-danger-950/40">
              <ShieldAlert className="size-5" />
            </div>
            <div>
              <p className="text-xs text-muted-foreground font-medium">Import Errors</p>
              <h3 className="text-xl font-extrabold text-foreground">1</h3>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Quick Launch Cards */}
      <div className="grid gap-6 md:grid-cols-3">
        <Card className="hover:border-brand-300 transition-all cursor-pointer">
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-semibold flex items-center gap-2">
              <FileSpreadsheet className="size-4 text-brand-600" />
              CSV / Excel Bulk Import
            </CardTitle>
            <CardDescription className="text-xs">
              Upload supplier catalogs or seed data files up to 100,000+ products.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Button variant="outline" size="sm" className="w-full text-xs gap-1.5" render={<Link href="/admin/catalog/import" />}>
              Start Import Wizard <UploadCloud className="size-3.5" />
            </Button>
          </CardContent>
        </Card>

        <Card className="hover:border-brand-300 transition-all cursor-pointer">
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-semibold flex items-center gap-2">
              <Layers className="size-4 text-brand-600" />
              Category Hierarchy
            </CardTitle>
            <CardDescription className="text-xs">
              Manage parent categories, subcategories, and attribute definitions.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Button variant="outline" size="sm" className="w-full text-xs gap-1.5" render={<Link href="/admin/catalog/categories" />}>
              Manage Categories <Plus className="size-3.5" />
            </Button>
          </CardContent>
        </Card>

        <Card className="hover:border-brand-300 transition-all cursor-pointer">
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-semibold flex items-center gap-2">
              <FileCheck className="size-4 text-brand-600" />
              Product Approval Queue
            </CardTitle>
            <CardDescription className="text-xs">
              Inspect imported drafts, verify pricing and descriptions before publishing.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Button variant="outline" size="sm" className="w-full text-xs gap-1.5" render={<Link href="/admin/products" />}>
              Review Products <CheckCircle2 className="size-3.5" />
            </Button>
          </CardContent>
        </Card>
      </div>

      {/* Recent Imports Log */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <div>
            <CardTitle className="text-base font-semibold flex items-center gap-2">
              <History className="size-4 text-muted-foreground" />
              Recent Catalog Import Jobs
            </CardTitle>
            <CardDescription className="text-xs mt-0.5">
              Historical log of CSV and Excel catalog batch uploads.
            </CardDescription>
          </div>
          <Button variant="ghost" size="sm" className="text-xs text-brand-600" render={<Link href="/admin/catalog/history" />}>
            View All History
          </Button>
        </CardHeader>
        <CardContent className="p-0">
          <div className="divide-y border-t border-border">
            {recentImports.map((imp) => (
              <div key={imp.id} className="p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs">
                <div className="flex items-center gap-3">
                  <div className="p-2 rounded-md bg-muted font-bold text-muted-foreground">
                    {imp.sourceType === 'CSV_IMPORT' ? 'CSV' : 'XLS'}
                  </div>
                  <div>
                    <span className="font-semibold text-foreground text-sm block">{imp.fileName}</span>
                    <span className="text-muted-foreground text-[11px]">
                      {imp.date} · {imp.totalRows} Total Rows
                    </span>
                  </div>
                </div>

                <div className="flex items-center gap-4">
                  <div className="text-right">
                    <span className="text-success-600 font-semibold">{imp.importedCount} Imported</span>
                    {imp.failedCount > 0 ? (
                      <span className="text-danger-600 font-semibold block text-[10px]">
                        {imp.failedCount} Failed
                      </span>
                    ) : null}
                  </div>

                  <Badge
                    variant={imp.status === 'COMPLETED' ? 'secondary' : 'outline'}
                    className="text-[10px]"
                  >
                    {imp.status.replace(/_/g, ' ')}
                  </Badge>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
