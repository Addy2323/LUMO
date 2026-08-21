'use client'

import React, { useState, useEffect } from 'react'
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
  RefreshCw,
} from 'lucide-react'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { toast } from 'sonner'

export default function SalesTasksPage() {
  const [tasks, setTasks] = useState<any[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchTasks()
  }, [])

  async function fetchTasks() {
    setLoading(true)
    try {
      const res = await fetch('/api/sales/overview')
      if (res.ok) {
        const data = await res.json()
        const followups = data.followups || []
        const escalations = data.escalations || []

        // Build tasks from real follow-ups and escalations
        const realTasks = [
          ...followups.map((f: any, i: number) => ({
            id: f.id || `followup_${i}`,
            title: `${f.task || 'Follow up'} — ${f.customer || 'Customer'}`,
            due: f.time || '—',
            category: 'Follow-up',
            priority: i === 0 ? 'HIGH' : 'NORMAL',
            completed: false,
          })),
          ...escalations.map((e: any, i: number) => ({
            id: e.id || `escalation_${i}`,
            title: `${e.title || 'Escalation'} (${e.ref || ''})`,
            due: e.due || '—',
            category: 'Escalation',
            priority: e.priority === 'Critical' ? 'URGENT' : 'HIGH',
            completed: false,
          })),
        ]

        setTasks(realTasks)
      }
    } catch (err) {
      console.error('Failed to fetch tasks:', err)
      toast.error('Failed to load tasks')
    } finally {
      setLoading(false)
    }
  }

  function toggleTask(id: string) {
    setTasks(tasks.map((t) => (t.id === id ? { ...t, completed: !t.completed } : t)))
    toast.success('Task status updated!')
  }

  return (
    <div className="flex flex-col gap-5 font-sans antialiased text-slate-900 bg-surface-secondary min-h-screen p-3 md:p-6 pb-24">
      <div className="flex items-center justify-between bg-white p-4 rounded-xl border border-slate-200 shadow-sm">
        <div>
          <h1 className="text-xl font-black text-slate-900 flex items-center gap-2">
            <Clock className="size-6 text-primary" /> Today's Sales Tasks & Customer Follow-ups
          </h1>
          <p className="text-xs text-slate-500 mt-0.5">Priority checklist derived from live sourcing requests, disputes, and escalations in PostgreSQL.</p>
        </div>
        <Button
          onClick={fetchTasks}
          variant="outline"
          className="border-slate-200 bg-white text-slate-700 hover:bg-slate-50 text-xs font-bold h-9 px-3 gap-1.5"
        >
          <RefreshCw className={`size-3.5 text-slate-500 ${loading ? 'animate-spin' : ''}`} /> Refresh Tasks
        </Button>
      </div>

      <Card className="bg-white border-slate-200 p-4 shadow-sm space-y-3">
        {loading ? (
          <div className="py-12 text-center text-xs text-slate-400 flex items-center justify-center gap-2">
            <RefreshCw className="size-4 animate-spin text-primary" /> Loading tasks from database...
          </div>
        ) : tasks.length === 0 ? (
          <div className="py-12 text-center text-xs text-slate-400">
            <p className="font-semibold text-slate-600">No active tasks</p>
            <p className="mt-1">Tasks are generated from live sourcing requests, disputes, and escalations in the database.</p>
          </div>
        ) : (
          <div className="divide-y divide-slate-100">
            {tasks.map((task) => (
              <div key={task.id} className="py-3 flex items-center justify-between text-xs">
                <div className="flex items-center gap-3">
                  <input
                    type="checkbox"
                    checked={task.completed}
                    onChange={() => toggleTask(task.id)}
                    className="size-4 accent-primary rounded cursor-pointer"
                  />
                  <span className={task.completed ? 'line-through text-slate-400 font-semibold' : 'font-bold text-slate-900'}>
                    {task.title}
                  </span>
                </div>

                <div className="flex items-center gap-2">
                  <span className="font-mono text-slate-500">{task.due}</span>
                  <Badge className={task.priority === 'URGENT' ? 'bg-rose-50 text-rose-700' : task.priority === 'HIGH' ? 'bg-orange-50 text-primary' : 'bg-slate-50 text-slate-700'}>
                    {task.priority}
                  </Badge>
                  <Badge variant="outline" className="text-[9px]">
                    {task.category}
                  </Badge>
                </div>
              </div>
            ))}
          </div>
        )}
      </Card>
    </div>
  )
}
