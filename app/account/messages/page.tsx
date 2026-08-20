'use client'

import React, { useState } from 'react'
import { MessageSquare, Send, Search, ShieldCheck } from 'lucide-react'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { toast } from 'sonner'

export default function CustomerMessagesPage() {
  const [messages, setMessages] = useState<any[]>([])
  const [text, setText] = useState('')

  function handleSend(e: React.FormEvent) {
    e.preventDefault()
    if (!text.trim()) return
    const newMsg = {
      id: Date.now().toString(),
      sender: 'Customer',
      text: text.trim(),
      time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    }
    setMessages([...messages, newMsg])
    setText('')
    toast.success('Message sent to Sales Department!')
  }

  return (
    <div className="flex flex-col gap-5 font-sans antialiased text-slate-900 bg-surface-secondary min-h-screen p-3 md:p-6 pb-24">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-white p-4 rounded-xl border border-slate-200 shadow-sm">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-xl md:text-2xl font-black tracking-tight text-slate-900 flex items-center gap-2">
              <MessageSquare className="size-6 text-primary" /> Sales Department Support Messages
            </h1>
            <Badge className="bg-orange-50 text-primary border-orange-200 text-[10px] font-bold">
              Direct Communication
            </Badge>
          </div>
          <p className="text-xs text-slate-500 mt-0.5">
            Communicate directly with your assigned Sales Officer for order assistance and sourcing inquiries.
          </p>
        </div>
      </div>

      <Card className="bg-white border-slate-200 p-4 shadow-sm space-y-4">
        <div className="min-h-[300px] max-h-[450px] overflow-y-auto space-y-3 p-2 bg-slate-50 border border-slate-100 rounded-lg">
          {messages.length === 0 ? (
            <div className="py-20 text-center text-xs text-slate-400">
              No active messages with Sales Department. Type below to send a message.
            </div>
          ) : (
            messages.map((m) => (
              <div key={m.id} className="p-3 bg-white border border-slate-200 rounded-lg text-xs space-y-1">
                <div className="flex items-center justify-between font-bold text-slate-900">
                  <span>{m.sender}</span>
                  <span className="text-[10px] text-slate-400 font-mono">{m.time}</span>
                </div>
                <p className="text-slate-700">{m.text}</p>
              </div>
            ))
          )}
        </div>

        <form onSubmit={handleSend} className="flex gap-2">
          <Input
            value={text}
            onChange={(e) => setText(e.target.value)}
            placeholder="Type message to Sales Officer..."
            className="bg-slate-50 border-slate-200 text-xs h-10"
          />
          <Button type="submit" className="bg-primary hover:bg-primary/80 text-white font-bold text-xs h-10 px-4">
            <Send className="size-4 mr-1" /> Send Message
          </Button>
        </form>
      </Card>
    </div>
  )
}
