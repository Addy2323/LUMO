'use client'

import { useState, useEffect, useRef } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { apiRequest } from '@/lib/api/client'
import { MessageComposer } from './message-composer'
import { LockIcon, MessageSquareIcon, UserIcon, ShieldAlertIcon } from 'lucide-react'
import { Badge } from '@/components/ui/badge'

type Message = {
  id: string
  content: string
  isInternal: boolean
  senderRole: string
  createdAt: string
  sender?: {
    id: string
    name: string
    role: string
  }
}

type OrderConversationPanelProps = {
  orderId: string
  conversationId?: string
  allowInternalNotes?: boolean
  className?: string
}

export function OrderConversationPanel({
  orderId,
  conversationId: initialConversationId,
  allowInternalNotes = false,
  className = '',
}: OrderConversationPanelProps) {
  const queryClient = useQueryClient()
  const messagesEndRef = useRef<HTMLDivElement>(null)
  const [activeConvId, setActiveConvId] = useState<string | null>(initialConversationId || null)

  // 1. Fetch conversations for order if conv ID not explicitly provided
  const { data: convData, isLoading: loadingConvs } = useQuery({
    queryKey: ['conversations', 'order', orderId],
    queryFn: () => apiRequest<{ conversations: any[] }>(`/api/conversations?orderId=${orderId}`),
    enabled: !initialConversationId,
  })

  useEffect(() => {
    if (!activeConvId && convData?.conversations?.length) {
      setActiveConvId(convData.conversations[0].id)
    }
  }, [convData, activeConvId])

  const convId = initialConversationId || activeConvId

  // 2. Fetch messages for active conversation
  const { data: messagesData, isLoading: loadingMessages } = useQuery({
    queryKey: ['conversation', 'messages', convId],
    queryFn: () => apiRequest<{ messages: Message[] }>(`/api/conversations/${convId}/messages`),
    enabled: !!convId,
    refetchInterval: 10_000, // Poll every 10s for real-time update
  })

  // Auto-scroll on new messages
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messagesData?.messages])

  // 3. Post message mutation
  const postMutation = useMutation({
    mutationFn: async ({ content, isInternal }: { content: string; isInternal?: boolean }) => {
      if (!convId) {
        // Create conversation first if doesn't exist
        const createRes = await apiRequest<{ conversation: { id: string } }>('/api/conversations', {
          method: 'POST',
          body: { orderId, title: `Order ${orderId} Discussion` },
        })
        const newConvId = createRes.conversation.id
        setActiveConvId(newConvId)
        return apiRequest(`/api/conversations/${newConvId}/messages`, {
          method: 'POST',
          body: { content, isInternal },
        })
      }
      return apiRequest(`/api/conversations/${convId}/messages`, {
        method: 'POST',
        body: { content, isInternal },
      })
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['conversation', 'messages', convId] })
      queryClient.invalidateQueries({ queryKey: ['conversations', 'order', orderId] })
    },
  })

  const messages = messagesData?.messages || []

  return (
    <div className={`flex flex-col h-[480px] rounded-lg border bg-card text-card-foreground shadow-sm ${className}`}>
      {/* Header */}
      <div className="flex items-center justify-between border-b px-4 py-3 bg-muted/30">
        <div className="flex items-center gap-2">
          <MessageSquareIcon className="size-4 text-brand-500" />
          <h3 className="text-sm font-semibold">Order Communication</h3>
        </div>
        <Badge variant="outline" className="text-xs">
          {messages.length} messages
        </Badge>
      </div>

      {/* Messages Feed */}
      <div className="flex-1 overflow-y-auto p-4 space-y-3">
        {loadingConvs || loadingMessages ? (
          <div className="flex h-full items-center justify-center text-sm text-muted-foreground">
            Loading messages...
          </div>
        ) : messages.length === 0 ? (
          <div className="flex h-full flex-col items-center justify-center text-center text-sm text-muted-foreground p-4">
            <MessageSquareIcon className="size-8 mb-2 opacity-40" />
            <p>No messages yet for this order.</p>
            <p className="text-xs">Start a conversation with the customer or team below.</p>
          </div>
        ) : (
          messages.map((msg) => (
            <div
              key={msg.id}
              className={`flex flex-col rounded-lg p-3 text-sm ${
                msg.isInternal
                  ? 'bg-amber-500/10 border border-amber-500/20 text-amber-950 dark:text-amber-100'
                  : 'bg-accent/50 text-accent-foreground'
              }`}
            >
              <div className="flex items-center justify-between gap-2 mb-1">
                <div className="flex items-center gap-1.5 font-semibold text-xs">
                  <UserIcon className="size-3.5" />
                  <span>{msg.sender?.name || msg.senderRole}</span>
                  <Badge variant="secondary" className="text-[10px] uppercase px-1 py-0">
                    {msg.senderRole}
                  </Badge>
                  {msg.isInternal && (
                    <Badge variant="outline" className="text-[10px] bg-amber-500/20 border-amber-500 text-amber-700 dark:text-amber-300">
                      <LockIcon className="size-2.5 mr-0.5" /> Internal
                    </Badge>
                  )}
                </div>
                <span className="text-[10px] text-muted-foreground">
                  {new Date(msg.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                </span>
              </div>
              <p className="whitespace-pre-wrap break-words">{msg.content}</p>
            </div>
          ))
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Composer */}
      <div className="p-3 border-t bg-card">
        <MessageComposer
          onSend={async (content, isInternal) => {
            await postMutation.mutateAsync({ content, isInternal })
          }}
          allowInternalNotes={allowInternalNotes}
          disabled={postMutation.isPending}
        />
      </div>
    </div>
  )
}
