'use client'

import { useState, useEffect, useRef } from 'react'
import { Send, RefreshCw, MessageSquare, User, ShieldCheck } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { formatDate } from '@/lib/format'
import { toast } from 'sonner'

type MessageItem = {
  id: string
  senderId: string
  senderRole: string
  content: string
  isInternal: boolean
  createdAt: string
  sender?: {
    name: string
    email: string
  }
}

type SourcingChatThreadProps = {
  sourcingRequestId: string
  currentRole: 'BUYER' | 'SALES' | 'ADMIN' | string
  currentUserId?: string
}

export function SourcingChatThread({
  sourcingRequestId,
  currentRole,
  currentUserId,
}: SourcingChatThreadProps) {
  const [conversationId, setConversationId] = useState<string | null>(null)
  const [messages, setMessages] = useState<MessageItem[]>([])
  const [loading, setLoading] = useState(true)
  const [sending, setSending] = useState(false)
  const [chatInput, setChatInput] = useState('')
  const chatEndRef = useRef<HTMLDivElement>(null)

  const initOrFetchConversation = async () => {
    try {
      setLoading(true)
      // 1. Check existing conversations for this sourcingRequestId
      const res = await fetch(`/api/conversations?sourcingRequestId=${sourcingRequestId}`, {
        headers: { 'x-active-role': currentRole },
      })
      if (!res.ok) {
        console.warn('[SOURCING CHAT WARNING] Failed to fetch conversations:', res.status)
        return
      }
      const text = await res.text()
      if (!text) return
      const data = JSON.parse(text)

      let convId = data.conversations?.[0]?.id

      // 2. If no conversation exists, create one
      if (!convId) {
        const createRes = await fetch('/api/conversations', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'x-active-role': currentRole,
          },
          body: JSON.stringify({
            sourcingRequestId,
            visibility: 'CUSTOMER_VISIBLE',
            title: `Sourcing Discussion - ${sourcingRequestId.slice(0, 8)}`,
          }),
        })
        if (createRes.ok) {
          const createText = await createRes.text()
          if (createText) {
            const createData = JSON.parse(createText)
            if (createData.conversation) {
              convId = createData.conversation.id
            }
          }
        }
      }

      setConversationId(convId)

      // 3. Fetch messages if conversationId exists
      if (convId) {
        await fetchMessages(convId)
      }
    } catch (err) {
      console.error('[SOURCING CHAT ERROR]', err)
    } finally {
      setLoading(false)
    }
  }

  const fetchMessages = async (convId: string) => {
    try {
      const res = await fetch(`/api/conversations/${convId}/messages`, {
        headers: { 'x-active-role': currentRole },
      })
      if (!res.ok) return
      const text = await res.text()
      if (!text) return
      const data = JSON.parse(text)
      if (Array.isArray(data.messages)) {
        setMessages(data.messages.reverse())
      }
    } catch (err) {
      console.error('[FETCH MESSAGES ERROR]', err)
    }
  }

  const activeRoleKey = currentRole || 'BUYER'

  useEffect(() => {
    initOrFetchConversation()
  }, [sourcingRequestId, activeRoleKey])

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages.length])

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!chatInput.trim() || !conversationId) return

    setSending(true)
    const content = chatInput.trim()
    setChatInput('')

    try {
      const res = await fetch(`/api/conversations/${conversationId}/messages`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-active-role': currentRole,
        },
        body: JSON.stringify({
          content,
          isInternal: false,
        }),
      })

      const data = await res.json()
      if (res.ok && data.message) {
        setMessages((prev) => [...prev, data.message])
        toast.success('Message sent to conversation thread')
      } else {
        toast.error(data.error || 'Failed to send message')
        setChatInput(content)
      }
    } catch (err) {
      console.error('[SEND MESSAGE ERROR]', err)
      toast.error('Network error sending message')
      setChatInput(content)
    } finally {
      setSending(false)
    }
  }

  return (
    <div className="space-y-3 pt-3 border-t border-border/60">
      <div className="flex items-center justify-between">
        <h4 className="font-extrabold text-xs text-foreground uppercase tracking-wider flex items-center gap-2">
          <MessageSquare className="size-4 text-[#FF6B00]" />
          <span>Sourcing Communication Thread</span>
        </h4>
        <div className="flex items-center gap-2">
          <Badge variant="outline" className="text-[10px] font-mono font-bold bg-muted/40">
            {messages.length} Messages
          </Badge>
          <Button
            variant="ghost"
            size="icon"
            onClick={() => conversationId && fetchMessages(conversationId)}
            className="size-7 rounded-full hover:bg-muted"
          >
            <RefreshCw className={`size-3.5 text-muted-foreground ${loading ? 'animate-spin' : ''}`} />
          </Button>
        </div>
      </div>

      <div className="space-y-3 min-h-[140px] max-h-64 overflow-y-auto p-4 rounded-2xl bg-slate-950/5 dark:bg-muted/10 border border-border/80">
        {loading ? (
          <div className="py-8 text-center text-xs text-muted-foreground flex items-center justify-center gap-2 font-medium">
            <RefreshCw className="size-4 animate-spin text-[#FF6B00]" />
            Syncing live database conversation thread...
          </div>
        ) : messages.length === 0 ? (
          <div className="py-8 text-center text-xs text-muted-foreground space-y-1">
            <div className="size-9 rounded-full bg-primary/10 text-primary flex items-center justify-center mx-auto mb-2">
              <MessageSquare className="size-4" />
            </div>
            <p className="font-bold text-foreground">No messages in discussion thread yet.</p>
            <p className="text-[11px]">Type below to send a formal quote update or ask buyer a clarification question.</p>
          </div>
        ) : (
          messages.map((msg) => {
            const isMe = msg.senderId === currentUserId || msg.senderRole === currentRole
            const isSalesOrAdmin = msg.senderRole === 'ADMIN' || msg.senderRole === 'SALES'

            return (
              <div
                key={msg.id}
                className={`p-3.5 rounded-2xl max-w-[85%] text-xs space-y-1 shadow-xs transition-all ${
                  isMe
                    ? 'ml-auto bg-[#FF6B00] text-white font-medium'
                    : isSalesOrAdmin
                    ? 'mr-auto bg-amber-500/15 border border-amber-500/30 text-foreground'
                    : 'mr-auto bg-card border border-border text-foreground'
                }`}
              >
                <div className="flex items-center justify-between gap-4 text-[10px] opacity-90 border-b border-current/15 pb-1 mb-1 font-semibold">
                  <span className="flex items-center gap-1.5">
                    {msg.sender?.name || msg.senderRole}
                    {isSalesOrAdmin && (
                      <span className="text-[9px] px-1.5 py-0.2 rounded bg-black/20 font-bold uppercase tracking-wider">
                        Official Desk
                      </span>
                    )}
                  </span>
                  <span className="font-mono text-[9.5px] opacity-75">{formatDate(msg.createdAt)}</span>
                </div>
                <p className="leading-relaxed whitespace-pre-wrap">{msg.content}</p>
              </div>
            )
          })
        )}
        <div ref={chatEndRef} />
      </div>

      <form onSubmit={handleSendMessage} className="flex gap-2">
        <Input
          placeholder={
            currentRole === 'SALES' || currentRole === 'ADMIN'
              ? 'Type quotation note or response to customer...'
              : 'Type question for sourcing officer...'
          }
          value={chatInput}
          onChange={(e) => setChatInput(e.target.value)}
          className="text-xs h-10 rounded-xl bg-card border-border shadow-xs focus-visible:ring-[#FF6B00]"
          disabled={sending || loading}
        />
        <Button
          type="submit"
          disabled={sending || loading || !chatInput.trim()}
          className="bg-[#FF6B00] hover:bg-[#E85F00] text-white font-bold h-10 px-5 rounded-xl shrink-0 shadow-md shadow-orange-500/15"
        >
          {sending ? <RefreshCw className="size-4 animate-spin" /> : <Send className="size-4 mr-1.5" />}
          Send
        </Button>
      </form>
    </div>
  )
}
