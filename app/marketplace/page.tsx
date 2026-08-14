'use client'

import { PublicShell } from '@/components/shell/public-shell'
import { PageHeader } from '@/components/shell/page-header'
import { MarketplaceBrowser } from '@/components/marketplace/marketplace-browser'
import { useT } from '@/lib/i18n/use-locale'

export default function MarketplacePage() {
  const t = useT()

  return (
    <PublicShell>
      <PageHeader
        title={t('marketplace.title')}
        description={t('marketplace.description')}
      />
      <div className="mt-6">
        <MarketplaceBrowser />
      </div>
    </PublicShell>
  )
}
