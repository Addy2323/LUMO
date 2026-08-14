'use client'

import { BarChart3, Clock, CheckCircle2, Star, Users, Trophy, TrendingUp } from 'lucide-react'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'

type AgentPerformance = {
  id: string
  name: string
  role: string
  resolvedTickets: number
  avgResponseTime: string
  csatScore: number
  quoteConversionRate: string
}

const AGENTS: AgentPerformance[] = [
  {
    id: 'a1',
    name: 'DevStromer',
    role: 'Sales Department Lead',
    resolvedTickets: 142,
    avgResponseTime: '12 min',
    csatScore: 4.9,
    quoteConversionRate: '78.5%',
  },
  {
    id: 'a2',
    name: 'Josephine Kimani',
    role: 'Senior Sourcing Specialist',
    resolvedTickets: 118,
    avgResponseTime: '18 min',
    csatScore: 4.8,
    quoteConversionRate: '72.1%',
  },
  {
    id: 'a3',
    name: 'Rashid Chande',
    role: 'B2B Procurement Officer',
    resolvedTickets: 96,
    avgResponseTime: '24 min',
    csatScore: 4.7,
    quoteConversionRate: '65.4%',
  },
]

export default function SalesPerformancePage() {
  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="text-2xl font-extrabold tracking-tight">Sales Team Performance Analytics</h1>
        <p className="text-sm text-muted-foreground">
          SLA response metrics, customer satisfaction scores (CSAT), and quote conversion leaderboards.
        </p>
      </div>

      {/* Top Level Key Metrics */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="bg-gradient-to-br from-brand-500/10 to-transparent border-brand-500/20">
          <CardHeader className="pb-2">
            <CardDescription className="text-xs font-semibold flex items-center gap-1.5 text-foreground">
              <CheckCircle2 className="size-4 text-emerald-500" /> Total Tickets Resolved
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-mono font-extrabold text-foreground">356</div>
            <p className="text-[11px] text-emerald-600 font-semibold mt-1 flex items-center gap-1">
              <TrendingUp className="size-3" /> +14.2% this month
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardDescription className="text-xs font-semibold flex items-center gap-1.5 text-foreground">
              <Clock className="size-4 text-brand-500" /> Avg First Response Time
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-mono font-extrabold text-brand-500">16.4 min</div>
            <p className="text-[11px] text-muted-foreground mt-1">SLA Target: &lt; 30 min</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardDescription className="text-xs font-semibold flex items-center gap-1.5 text-foreground">
              <Star className="size-4 text-amber-500 fill-amber-500" /> Customer Satisfaction (CSAT)
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-mono font-extrabold text-foreground">4.8 / 5.0</div>
            <p className="text-[11px] text-emerald-600 font-semibold mt-1">Based on 210 reviews</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardDescription className="text-xs font-semibold flex items-center gap-1.5 text-foreground">
              <Trophy className="size-4 text-amber-500" /> Landed Quote Conversion
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-mono font-extrabold text-foreground">71.8%</div>
            <p className="text-[11px] text-emerald-600 font-semibold mt-1">+5.4% conversion uplift</p>
          </CardContent>
        </Card>
      </div>

      {/* Leaderboard Table */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base font-extrabold flex items-center gap-2">
            <Users className="size-5 text-brand-500" />
            Agent Performance Roster
          </CardTitle>
          <CardDescription className="text-xs">
            Individual breakdown of tickets handled, average response velocity, and quote acceptance rate.
          </CardDescription>
        </CardHeader>

        <CardContent>
          <div className="divide-y border rounded-xl overflow-hidden">
            {AGENTS.map((agent, index) => (
              <div
                key={agent.id}
                className="p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-card hover:bg-muted/20 text-xs"
              >
                <div className="flex items-center gap-3">
                  <div className="size-8 rounded-full bg-brand-500/10 text-brand-500 flex items-center justify-center font-bold font-mono">
                    #{index + 1}
                  </div>
                  <div>
                    <h4 className="font-extrabold text-foreground">{agent.name}</h4>
                    <p className="text-[11px] text-muted-foreground">{agent.role}</p>
                  </div>
                </div>

                <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 sm:gap-8 text-right">
                  <div>
                    <span className="text-[10px] text-muted-foreground uppercase font-bold block">Resolved</span>
                    <span className="font-mono font-bold text-foreground">{agent.resolvedTickets}</span>
                  </div>

                  <div>
                    <span className="text-[10px] text-muted-foreground uppercase font-bold block">Avg Speed</span>
                    <span className="font-mono font-bold text-brand-500">{agent.avgResponseTime}</span>
                  </div>

                  <div>
                    <span className="text-[10px] text-muted-foreground uppercase font-bold block">CSAT Rating</span>
                    <span className="font-mono font-bold text-amber-500 flex items-center justify-end gap-1">
                      <Star className="size-3 fill-amber-500" /> {agent.csatScore}
                    </span>
                  </div>

                  <div>
                    <span className="text-[10px] text-muted-foreground uppercase font-bold block">Conversion</span>
                    <span className="font-mono font-extrabold text-emerald-600">{agent.quoteConversionRate}</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
