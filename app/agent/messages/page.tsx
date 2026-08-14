'use client'

import { useState } from 'react'
import Link from 'next/link'
import {
  MessageSquare,
  Send,
  Paperclip,
  Image as ImageIcon,
  FileText,
  Mic,
  ShieldCheck,
  User,
  Building2,
  Sparkles,
  ClipboardList,
  PlusCircle,
} from 'lucide-react'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { useAgentStore } from '@/lib/stores/agent-store'
import { toast } from 'sonner'

interface ChatMessage {
  id: string
  sender: string
  role: string
  text: string
  time: string
  isMe: boolean
}

export default function AgentMessagesPage() {
  const { activeCountry, agentName, orders, seedSampleOrder } = useAgentStore()
  const hubOrders = orders.filter((o) => o.assignedCountry === activeCountry)
  const activeOrder = hubOrders[0]

  const [messages, setMessages] = useState<ChatMessage[]>([])
  const [inputMsg, setInputMsg] = useState('')

  function handleSend() {
    if (!inputMsg.trim()) return
    const newMsg: ChatMessage = {
      id: `m_${Date.now()}`,
      sender: `${agentName} (${activeCountry} Hub)`,
      role: 'Field Agent',
      text: inputMsg,
      time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      isMe: true,
    }
    setMessages((prev) => [...prev, newMsg])
    setInputMsg('')
    toast.success('Message sent to 4-way operations channel!')
  }

  if (!activeOrder) {
    return (
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-extrabold font-heading text-white">4-Way Operations Chat Channel</h1>
          <p className="text-xs text-slate-400 font-mono">
            Unified Operations Channel: <strong className="text-brand-400">Customer ↔ LUMO HQ ↔ Field Agent ↔ Supplier</strong>
          </p>
        </div>

        <Card className="bg-slate-900 border-slate-800">
          <CardContent className="p-12 text-center space-y-4">
            <div className="size-14 rounded-2xl bg-slate-800 text-brand-400 mx-auto flex items-center justify-center border border-slate-700">
              <MessageSquare className="size-7" />
            </div>
            <div className="space-y-1 max-w-md mx-auto">
              <h3 className="text-base font-bold text-white">No Active Operations Channel in {activeCountry} Hub</h3>
              <p className="text-xs text-slate-400 leading-relaxed">
                When a buyer or HQ assigns an active sourcing request to {activeCountry}, a dedicated 4-way real-time chat channel will open automatically here.
              </p>
            </div>
            <div className="pt-2 flex flex-wrap items-center justify-center gap-3">
              <Button
                render={
                  <Link href="/agent/orders">
                    <ClipboardList className="size-4 mr-1.5" />
                    View Orders Queue
                  </Link>
                }
                className="bg-brand-500 hover:bg-brand-600 text-white text-xs font-bold"
              />
              <Button
                onClick={() => {
                  seedSampleOrder()
                  toast.success(`Created order in ${activeCountry} Hub for chat channel testing.`)
                }}
                variant="outline"
                className="border-slate-700 bg-slate-800 text-slate-300 hover:bg-slate-700 text-xs font-bold"
              >
                <PlusCircle className="size-4 mr-1.5" />
                Add Test Order
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-extrabold font-heading text-white">4-Way Operations Chat</h1>
        <p className="text-xs text-slate-400 font-mono">
          Unified Operations Channel: <strong className="text-brand-400">Customer ↔ LUMO HQ ↔ Field Agent ↔ Supplier</strong>
        </p>
      </div>

      <Card className="bg-slate-900 border-slate-800 flex flex-col h-[640px]">
        <CardHeader className="p-4 border-b border-slate-800 flex flex-row items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="size-9 rounded-xl bg-brand-500/20 text-brand-400 font-extrabold flex items-center justify-center border border-brand-500/30">
              <MessageSquare className="size-5" />
            </div>
            <div>
              <CardTitle className="text-sm font-bold text-white">Order #{activeOrder.orderNumber} Operations Channel</CardTitle>
              <p className="text-[11px] text-slate-400">Product: {activeOrder.productName} · Real-time Translation Enabled</p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <Badge className="bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 text-[10px] font-mono">
              Live Channel
            </Badge>
          </div>
        </CardHeader>

        {/* Message History */}
        <CardContent className="p-5 flex-1 overflow-y-auto space-y-4">
          {messages.length === 0 ? (
            <div className="h-full flex flex-col items-center justify-center text-center space-y-2 p-6">
              <MessageSquare className="size-8 text-slate-600" />
              <p className="text-xs font-bold text-slate-300">Operations Channel Initialized</p>
              <p className="text-[11px] text-slate-500 max-w-xs">
                Type below to communicate directly with LUMO HQ, Customer ({activeOrder.customerName}), and Factory Suppliers.
              </p>
            </div>
          ) : (
            messages.map((m) => (
              <div
                key={m.id}
                className={`flex flex-col ${m.isMe ? 'items-end' : 'items-start'}`}
              >
                <div className="flex items-center gap-2 text-[10px] text-slate-400 mb-1 font-mono">
                  <span className="font-bold text-slate-200">{m.sender}</span>
                  <span className="px-1.5 py-0.2 rounded bg-slate-800 border border-slate-700 text-slate-300">
                    {m.role}
                  </span>
                  <span>{m.time}</span>
                </div>

                <div
                  className={`max-w-md p-3.5 rounded-2xl text-xs leading-relaxed ${
                    m.isMe
                      ? 'bg-brand-500 text-white rounded-br-none shadow-md shadow-brand-500/20'
                      : 'bg-slate-950 text-slate-200 border border-slate-800 rounded-bl-none'
                  }`}
                >
                  {m.text}
                </div>
              </div>
            ))
          )}
        </CardContent>

        {/* Input Bar */}
        <div className="p-4 border-t border-slate-800 bg-slate-950/60 flex items-center gap-2">
          <Button variant="ghost" size="icon" className="text-slate-400 hover:text-white shrink-0">
            <Paperclip className="size-4" />
          </Button>
          <Button variant="ghost" size="icon" className="text-slate-400 hover:text-white shrink-0">
            <ImageIcon className="size-4" />
          </Button>
          <Input
            value={inputMsg}
            onChange={(e) => setInputMsg(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleSend()}
            placeholder="Type message to Customer, HQ or Supplier..."
            className="flex-1 h-10 bg-slate-900 border-slate-800 text-white text-xs placeholder:text-slate-500"
          />
          <Button onClick={handleSend} className="bg-brand-500 hover:bg-brand-600 text-white font-bold text-xs h-10 px-4">
            <Send className="size-4 mr-1" />
            Send
          </Button>
        </div>
      </Card>
    </div>
  )
}
