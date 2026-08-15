'use client'

import React, { useState } from 'react'
import {
  Clock,
  CheckCircle2,
  AlertTriangle,
  Plus,
  Search,
  Calendar as CalendarIcon,
  User,
  Phone,
  MessageSquare,
} from 'lucide-react'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { toast } from 'sonner'

export default function SalesTasksPage() {
  const [tasks, setTasks] = useState<any[]>([
    { id: '1', title: 'Call Merchant Amani regarding Textile Quotation #Q-8821', due: '10:30 AM', category: 'Call', priority: 'HIGH', completed: false },
    { id: '2', title: 'Verify Sourcing Agent Inspection Photos for Order #ORD-9902', due: '11:45 AM', category: 'Inspection', priority: 'URGENT', completed: false },
    { id: '3', title: 'Follow up with Guangzhou Supplier on Zhejiang Freight Rates', due: '02:00 PM', category: 'Supplier', priority: 'NORMAL', completed: false },
    { id: '4', title: 'Review AzamPay Escrow Release for Dispute #DSP-104', due: '04:30 PM', category: 'Escrow', priority: 'HIGH', completed: true },
  ])

  function toggleTask(id: string) {
    setTasks(tasks.map((t) => (t.id === id ? { ...t, completed: !t.completed } : t)))
    toast.success('Task status updated!')
  }

  return (
    <div className="flex flex-col gap-5 font-sans antialiased text-slate-900 bg-[#f8fafc] min-h-screen p-3 md:p-6 pb-24">
      <div className="flex items-center justify-between bg-white p-4 rounded-xl border border-slate-200 shadow-sm">
        <div>
          <h1 className="text-xl font-black text-slate-900 flex items-center gap-2">
            <Clock className="size-6 text-[#FF6B00]" /> Today's Sales Tasks &amp; Customer Follow-ups
          </h1>
          <p className="text-xs text-slate-500 mt-0.5">Priority checklist for customer calls, quotation expiries, and agent follow-ups.</p>
        </div>
      </div>

      <Card className="bg-white border-slate-200 p-4 shadow-sm space-y-3">
        <div className="divide-y divide-slate-100">
          {tasks.map((task) => (
            <div key={task.id} className="py-3 flex items-center justify-between text-xs">
              <div className="flex items-center gap-3">
                <input
                  type="checkbox"
                  checked={task.completed}
                  onChange={() => toggleTask(task.id)}
                  className="size-4 accent-[#FF6B00] rounded cursor-pointer"
                />
                <span className={task.completed ? 'line-through text-slate-400 font-semibold' : 'font-bold text-slate-900'}>
                  {task.title}
                </span>
              </div>

              <div className="flex items-center gap-2">
                <span className="font-mono text-slate-500">{task.due}</span>
                <Badge className={task.priority === 'URGENT' ? 'bg-rose-50 text-rose-700' : 'bg-orange-50 text-[#FF6B00]'}>
                  {task.priority}
                </Badge>
              </div>
            </div>
          ))}
        </div>
      </Card>
    </div>
  )
}
