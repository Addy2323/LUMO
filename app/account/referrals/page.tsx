'use client'

import { useState } from 'react'
import { Gift, Copy, Check, Share2, Users, Wallet, Trophy } from 'lucide-react'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { formatTZS } from '@/lib/format'
import { toast } from 'sonner'

import { useSessionStore } from '@/lib/stores/session-store'

export default function CustomerReferralsPage() {
  const user = useSessionStore((s) => s.user)
  const isDemoUser =
    user?.id === 'usr_cus_001' ||
    user?.id === 'cust_01' ||
    user?.email === 'amina.hassan@example.co.tz'

  const userCode = user?.fullName
    ? user.fullName.toUpperCase().replace(/[^A-Z0-9]/g, '').slice(0, 8) + '-7709'
    : 'DEV-7709'

  const referralLink = `https://lumoo.co.tz/register?ref=${isDemoUser ? 'DEV-7709' : userCode}`
  const [copied, setCopied] = useState(false)

  const bonusEarnings = isDemoUser ? 125000 : 0
  const partnersCount = isDemoUser ? 5 : 0
  const completedShipments = isDemoUser ? 3 : 0
  const tierName = isDemoUser ? 'Silver Ambassador' : 'Bronze Ambassador'
  const nextRankText = isDemoUser ? 'Next rank: Gold (+50,000 TZS bonus)' : 'Next rank: Silver (+25,000 TZS bonus)'

  function handleCopy() {
    navigator.clipboard.writeText(referralLink)
    setCopied(true)
    toast.success('Referral link copied to clipboard!')
    setTimeout(() => setCopied(false), 2000)
  }

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="text-2xl font-extrabold tracking-tight">Referral Program &amp; Bonus Rewards</h1>
        <p className="text-sm text-muted-foreground">
          Invite fellow B2B buyers and earning 25,000 TZS cashback for every business that registers and places an order.
        </p>
      </div>

      {/* Hero Banner */}
      <Card className="bg-gradient-to-r from-brand-500/10 via-brand-500/5 to-transparent border-brand-500/30">
        <CardContent className="p-6 flex flex-col md:flex-row items-center justify-between gap-6">
          <div className="space-y-2">
            <Badge className="bg-brand-500 text-white font-extrabold text-xs">Earn 25,000 TZS Per Referral</Badge>
            <h2 className="text-xl font-extrabold text-foreground">Share Lumoo B2B Sourcing</h2>
            <p className="text-xs text-muted-foreground max-w-md">
              Give your business partners access to direct China/Tanzania factory prices. You both receive bonus sourcing credits on their first completed shipment.
            </p>
          </div>

          <div className="bg-card p-4 rounded-xl border border-border shadow-xs space-y-3 w-full md:w-auto shrink-0">
            <span className="text-xs font-bold text-muted-foreground uppercase tracking-wider block">Your Unique Invite Link</span>
            <div className="flex items-center gap-2">
              <span className="font-mono text-xs font-bold text-brand-500 bg-muted px-3 py-1.5 rounded-md border select-all">
                {referralLink}
              </span>
              <Button size="sm" onClick={handleCopy} className="bg-brand-500 hover:bg-brand-600 text-white font-bold text-xs shrink-0">
                {copied ? <Check className="size-4" /> : <Copy className="size-4" />}
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Rewards Overview */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardHeader className="pb-2">
            <CardDescription className="text-xs font-bold flex items-center gap-1.5 text-foreground">
              <Wallet className="size-4 text-emerald-500" /> Bonus Earnings Wallet
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-mono font-extrabold text-brand-500">{formatTZS(bonusEarnings)}</div>
            <p className="text-[11px] text-muted-foreground mt-1">Available for automatic checkout discount</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardDescription className="text-xs font-bold flex items-center gap-1.5 text-foreground">
              <Users className="size-4 text-brand-500" /> Businesses Referred
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-mono font-extrabold text-foreground">{partnersCount} Partners</div>
            <p className="text-[11px] text-emerald-600 font-semibold mt-1">{completedShipments} Completed first shipment</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardDescription className="text-xs font-bold flex items-center gap-1.5 text-foreground">
              <Trophy className="size-4 text-amber-500" /> Current Reward Tier
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-mono font-extrabold text-amber-500">{tierName}</div>
            <p className="text-[11px] text-muted-foreground mt-1">{nextRankText}</p>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
