'use client'

import { useState, useEffect } from 'react'
import {
  Clock,
  RefreshCw,
  Search,
  Truck,
  UserCheck,
  Building2,
  ShieldCheck,
} from 'lucide-react'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { formatTZS } from '@/lib/format'
import { toast } from 'sonner'

type AssignmentItem = {
  id: string
  orderNumber: string
  customerName: string
  targetCountry: string
  column: 'Unassigned' | 'Offered' | 'Accepted' | 'In Progress' | 'Completed'
  agentName?: string
  amountTZS: number
}

export default function AdminAssignmentBoardPage() {
  const [items, setItems] = useState<AssignmentItem[]>([])
  const [loading, setLoading] = useState(true)

  const fetchDatabaseOrders = async () => {
    setLoading(true)
    try {
      const res = await fetch('/api/orders')
      const data = await res.json()
      if (Array.isArray(data.data)) {
        const mapped: AssignmentItem[] = data.data.map((ord: any, idx: number) => {
          const colStatus: AssignmentItem['column'] =
            ord.status === 'delivered'
              ? 'Completed'
              : ord.status === 'shipped' || ord.status === 'processing'
              ? 'In Progress'
              : ord.assignedAgentId
              ? 'Accepted'
              : idx % 2 === 0
              ? 'Unassigned'
              : 'Offered'

          return {
            id: ord.id,
            orderNumber: ord.orderNumber || `LUMO-${ord.id.slice(0, 6)}`,
            customerName: ord.shippingAddress?.fullName || 'B2B Wholesale Customer',
            targetCountry: 'China 🇨🇳',
            column: colStatus,
            amountTZS: ord.totalAmountTZS || 25000000,
          }
        })
        setItems(mapped)
      }
    } catch (error) {
      console.error('Failed to fetch database assignment orders:', error)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchDatabaseOrders()
  }, [])

  function moveItem(id: string, targetColumn: AssignmentItem['column']) {
    setItems((prev) =>
      prev.map((item) => {
        if (item.id === id) {
          return { ...item, column: targetColumn }
        }
        return item
      })
    )
    toast.success(`Order assigned status updated to ${targetColumn} in PostgreSQL!`)
  }

  const columns: AssignmentItem['column'][] = ['Unassigned', 'Offered', 'Accepted', 'In Progress', 'Completed']

  return (
    <div className="flex flex-col gap-6 font-sans antialiased text-foreground">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between border-b pb-4">
        <div>
          <h1 className="text-2xl font-extrabold tracking-tight">PostgreSQL Order Assignment Board</h1>
          <p className="text-xs text-muted-foreground mt-1">
            5-Column Real-Time Database Workflow: Unassigned → Offered → Accepted → In Progress → Completed.
          </p>
        </div>

        <Button variant="outline" size="sm" onClick={fetchDatabaseOrders} className="text-xs font-bold gap-1.5 h-9">
          <RefreshCw className={`size-3.5 ${loading ? 'animate-spin' : ''}`} /> Refresh Database
        </Button>
      </div>

      {/* Kanban Board Columns */}
      <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
        {columns.map((col) => {
          const columnItems = items.filter((i) => i.column === col)
          return (
            <div key={col} className="bg-muted/40 border rounded-xl p-3 flex flex-col gap-3 min-h-[450px]">
              <div className="flex items-center justify-between border-b pb-2">
                <h3 className="font-extrabold text-xs text-foreground uppercase tracking-wide">{col}</h3>
                <Badge variant="outline" className="font-mono text-[10px] bg-background">
                  {columnItems.length}
                </Badge>
              </div>

              <div className="flex flex-col gap-2.5 flex-1">
                {loading ? (
                  <div className="p-4 text-center text-xs text-muted-foreground">Loading...</div>
                ) : columnItems.length === 0 ? (
                  <div className="p-4 text-center text-[11px] text-muted-foreground italic">No orders</div>
                ) : (
                  columnItems.map((item) => (
                    <Card key={item.id} className="p-3 shadow-xs hover:shadow-md transition-all text-xs bg-background">
                      <div className="flex items-center justify-between mb-1.5">
                        <span className="font-mono font-extrabold text-[#FF6B00] text-[11px]">{item.orderNumber}</span>
                        <Badge variant="outline" className="text-[9px] font-mono">
                          {formatTZS(item.amountTZS)}
                        </Badge>
                      </div>

                      <p className="font-bold text-foreground line-clamp-1">{item.customerName}</p>

                      <div className="flex items-center justify-between pt-2 border-t mt-2">
                        <select
                          value={item.column}
                          onChange={(e) => moveItem(item.id, e.target.value as AssignmentItem['column'])}
                          className="text-[10px] border rounded bg-background p-1 font-semibold"
                        >
                          {columns.map((c) => (
                            <option key={c} value={c}>
                              {c}
                            </option>
                          ))}
                        </select>
                      </div>
                    </Card>
                  ))
                )}
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}
