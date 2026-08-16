'use client'

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { apiRequest } from '@/lib/api/client'
import { MessageComposer } from './message-composer'
import { LockIcon, ShieldAlertIcon } from 'lucide-react'
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

type InternalNotesPanelProps = {
  orderId: string
  conversationId?: string
  className?: string
}

export function InternalNotesPanel({
  orderId,
  conversationId,
  className = '',
}: InternalNotesPanelProps) {
  const queryClient = useQueryClient()

  // Fetch messages for internal notes
  const { data: messagesData, isLoading } = useQuery({
    queryKey: ['conversation', 'internal-notes', orderId, conversationId],
    queryFn: async () => {
      let convId = conversationId
      if (!convId) {
        const res = await apiRequest<{ conversations: any[] }>(`/api/conversations?orderId=${orderId}`)
        convId = res.conversations?.[0]?.id
      }
      if (!convId) return { messages: [] }
      return apiRequest<{ messages: Message[] }>(`/api/conversations/${convId}/messages`)
    },
  })

  // Filter only internal notes
  const internalNotes = (messagesData?.messages || []).filter((m) => m.isInternal)

  const postMutation = useMutation({
    mutationFn: async (content: string) => {
      let convId = conversationId
      if (!convId) {
        const res = await apiRequest<{ conversations: any[] }>(`/api/conversations?orderId=${orderId}`)
        convId = res.conversations?.[0]?.id
      }
      if (!convId) {
        const createRes = await apiRequest<{ conversation: { id: string } }>('/api/conversations', {
          method: 'POST',
          body: { orderId, title: `Order ${orderId} Internal Discussion`, visibility: 'LUMO_INTERNAL' },
        })
        convId = createRes.conversation.id
      }

      return apiRequest(`/api/conversations/${convId}/messages`, {
        method: 'POST',
        body: { content, isInternal: true },
      })
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['conversation', 'internal-notes', orderId] })
    },
  })

  return (
    <div className={`rounded-lg border border-amber-500/30 bg-amber-500/5 p-4 space-y-3 ${className}`}>
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2 text-amber-700 dark:text-amber-300">
          <LockIcon className="size-4" />
          <h4 className="text-sm font-semibold">Internal Team Notes</h4>
        </div>
        <Badge variant="outline" className="border-amber-500 text-amber-700 dark:text-amber-300 text-xs">
          Confidential
        </Badge>
      </div>

      <div className="space-y-2 max-h-60 overflow-y-auto pr-1">
        {isLoading ? (
          <div className="text-xs text-muted-foreground">Loading internal notes...</div>
        ) : internalNotes.length === 0 ? (
          <div className="text-xs text-muted-foreground italic">No internal notes for this order yet.</div>
        ) : (
          internalNotes.map((note) => (
            <div key={note.id} className="rounded-md border border-amber-500/20 bg-background/80 p-2.5 text-xs shadow-xs">
              <div className="flex items-center justify-between mb-1">
                <span className="font-semibold text-amber-900 dark:text-amber-200">
                  {note.sender?.name || note.senderRole} ({note.senderRole})
                </span>
                <span className="text-[10px] text-muted-foreground">
                  {new Date(note.createdAt).toLocaleDateString()} {new Date(note.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                </span>
              </div>
              <p className="whitespace-pre-wrap">{note.content}</p>
            </div>
          ))
        )}
      </div>

      <MessageComposer
        onSend={async (content) => {
          await postMutation.mutateAsync(content)
        }}
        placeholder="Add an internal note for Sales, Logistics, or Agents..."
        disabled={postMutation.isPending}
      />
    </div>
  )
}
