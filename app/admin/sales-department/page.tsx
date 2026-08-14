'use client'

import { useState, useEffect } from 'react'
import { Users, Inbox, Plus, RefreshCw, ShieldCheck, CheckCircle2 } from 'lucide-react'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { toast } from 'sonner'

type DatabaseSalesOfficer = {
  id: string
  name: string
  email: string
  phone: string
  role: string
  activeQueueCount: number
  shiftStatus: 'On Duty' | 'Off Duty'
}

export default function AdminSalesDepartmentPage() {
  const [roster, setRoster] = useState<DatabaseSalesOfficer[]>([])
  const [loading, setLoading] = useState(true)
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [phone, setPhone] = useState('')
  const [role, setRole] = useState<'Sales Lead' | 'Senior Specialist' | 'Procurement Officer'>('Procurement Officer')

  const fetchSalesOfficers = async () => {
    setLoading(true)
    try {
      const res = await fetch('/api/admin/users')
      const data = await res.json()
      if (data.users) {
        const salesStaff = data.users
          .filter((u: any) => u.role === 'SALES' || u.role === 'ADMIN')
          .map((u: any) => ({
            id: u.id,
            name: u.fullName || u.name || u.email.split('@')[0],
            email: u.email,
            phone: u.phone || '+255 700 000 000',
            role: u.role === 'ADMIN' ? 'Sales Lead' : 'Senior Specialist',
            activeQueueCount: 0,
            shiftStatus: u.status === 'ACTIVE' ? 'On Duty' : 'Off Duty',
          }))
        setRoster(salesStaff)
      }
    } catch (error) {
      console.error('Failed to fetch sales staff:', error)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchSalesOfficers()
  }, [])

  async function handleAddOfficer() {
    if (!name.trim() || !email.trim()) {
      toast.error('Name and Email are required')
      return
    }

    try {
      const res = await fetch('/api/admin/users', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: email.trim(),
          name: name.trim(),
          phone: phone.trim() || '+255 700 000 000',
          role: 'SALES',
          password: 'Password123!',
        }),
      })

      if (res.ok) {
        toast.success(`Sales officer "${name}" onboarded to system database!`)
        setIsModalOpen(false)
        setName('')
        setEmail('')
        setPhone('')
        fetchSalesOfficers()
      } else {
        const errData = await res.json()
        toast.error(errData.error || 'Failed to onboard sales officer')
      }
    } catch (error) {
      toast.error('Network error onboarding officer')
    }
  }

  function handleToggleDuty(id: string) {
    setRoster(
      roster.map((s) =>
        s.id === id ? { ...s, shiftStatus: s.shiftStatus === 'On Duty' ? 'Off Duty' : 'On Duty' } : s,
      ),
    )
    toast.success('Duty status updated!')
  }

  return (
    <div className="flex flex-col gap-6 font-sans antialiased text-foreground">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between border-b pb-4">
        <div>
          <h1 className="text-2xl font-extrabold tracking-tight">Database Sales Department Roster &amp; Staff</h1>
          <p className="text-xs text-muted-foreground mt-1">
            Manage sales representatives, sourcing queue allocations, and duty shift schedules directly connected to PostgreSQL.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" onClick={fetchSalesOfficers} className="text-xs font-bold gap-1.5 h-9">
            <RefreshCw className={`size-3.5 ${loading ? 'animate-spin' : ''}`} /> Refresh Database
          </Button>
          <Button onClick={() => setIsModalOpen(true)} className="bg-[#FF6B00] hover:bg-[#E85F00] text-white font-bold text-xs h-9">
            <Plus className="size-4 mr-1.5" />
            Onboard Sales Officer
          </Button>
        </div>
      </div>

      {loading ? (
        <div className="p-12 text-center text-xs text-muted-foreground">
          <RefreshCw className="size-6 animate-spin mx-auto mb-2 text-[#FF6B00]" />
          Loading live sales staff from database...
        </div>
      ) : roster.length === 0 ? (
        <div className="p-8 text-center text-xs text-muted-foreground">
          No registered sales staff found in database. Click "Onboard Sales Officer" to register staff.
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {roster.map((s) => (
            <Card key={s.id} className="flex flex-col justify-between hover:shadow-md transition-shadow">
              <CardHeader className="pb-2 space-y-1">
                <div className="flex items-center justify-between">
                  <Badge className={s.shiftStatus === 'On Duty' ? 'bg-emerald-600 text-white' : 'bg-slate-600 text-white'}>
                    {s.shiftStatus}
                  </Badge>
                  <span className="font-mono text-xs font-bold text-[#FF6B00]">{s.activeQueueCount} Tickets</span>
                </div>
                <CardTitle className="text-sm font-extrabold text-foreground">{s.name}</CardTitle>
                <CardDescription className="text-xs">{s.role}</CardDescription>
              </CardHeader>

              <CardContent className="space-y-4">
                <div className="bg-muted/40 p-3 rounded-lg border text-xs font-mono space-y-1">
                  <div className="text-muted-foreground">Email: <span className="text-foreground font-bold">{s.email}</span></div>
                  <div className="text-muted-foreground">Phone: <span className="text-foreground font-bold">{s.phone}</span></div>
                </div>

                <Button variant="outline" size="sm" onClick={() => handleToggleDuty(s.id)} className="w-full text-xs font-bold">
                  {s.shiftStatus === 'On Duty' ? 'Set Off Duty' : 'Set On Duty'}
                </Button>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Modal */}
      {isModalOpen && (
        <Dialog open onOpenChange={setIsModalOpen}>
          <DialogContent className="max-w-md p-6">
            <DialogHeader>
              <DialogTitle className="text-base font-extrabold">Onboard Sales Representative</DialogTitle>
            </DialogHeader>

            <div className="space-y-4 text-xs">
              <div className="space-y-1">
                <label className="font-bold">Full Name</label>
                <Input value={name} onChange={(e) => setName(e.target.value)} className="text-xs" placeholder="Jane Doe" />
              </div>

              <div className="space-y-1">
                <label className="font-bold">Corporate Email</label>
                <Input value={email} onChange={(e) => setEmail(e.target.value)} className="text-xs font-mono" placeholder="jane@lumoo.co.tz" />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="font-bold">Role Title</label>
                  <select
                    value={role}
                    onChange={(e) => setRole(e.target.value as any)}
                    className="w-full h-9 rounded-md border border-input bg-background px-3 text-xs font-bold"
                  >
                    <option value="Sales Lead">Sales Lead</option>
                    <option value="Senior Specialist">Senior Specialist</option>
                    <option value="Procurement Officer">Procurement Officer</option>
                  </select>
                </div>

                <div className="space-y-1">
                  <label className="font-bold">Phone Number</label>
                  <Input value={phone} onChange={(e) => setPhone(e.target.value)} className="text-xs font-mono" placeholder="+255 754 000 111" />
                </div>
              </div>
            </div>

            <DialogFooter className="mt-4">
              <Button variant="outline" size="sm" onClick={() => setIsModalOpen(false)}>Cancel</Button>
              <Button size="sm" onClick={handleAddOfficer} className="bg-[#FF6B00] hover:bg-[#E85F00] text-white font-bold">Onboard Officer</Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      )}
    </div>
  )
}
