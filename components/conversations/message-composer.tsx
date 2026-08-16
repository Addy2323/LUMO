'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { SendIcon, LockIcon } from 'lucide-react'

type MessageComposerProps = {
  onSend: (content: string, isInternal?: boolean) => Promise<void>
  disabled?: boolean
  allowInternalNotes?: boolean
  placeholder?: string
}

export function MessageComposer({
  onSend,
  disabled,
  allowInternalNotes = false,
  placeholder = 'Type a message...',
}: MessageComposerProps) {
  const [content, setContent] = useState('')
  const [isInternal, setIsInternal] = useState(false)
  const [sending, setSending] = useState(false)

  const handleSend = async () => {
    if (!content.trim() || sending) return
    setSending(true)
    try {
      await onSend(content.trim(), allowInternalNotes ? isInternal : false)
      setContent('')
    } catch (err) {
      console.error('[MESSAGE COMPOSER ERROR]', err)
    } finally {
      setSending(false)
    }
  }

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      handleSend()
    }
  }

  return (
    <div className="space-y-2 border-t pt-3">
      {allowInternalNotes && (
        <div className="flex items-center gap-2 text-xs font-medium text-muted-foreground">
          <button
            type="button"
            onClick={() => setIsInternal(!isInternal)}
            className={`flex items-center gap-1 rounded-md px-2 py-1 transition-colors ${
              isInternal
                ? 'bg-amber-500/10 text-amber-600 dark:text-amber-400 font-semibold'
                : 'hover:bg-accent hover:text-accent-foreground'
            }`}
          >
            <LockIcon className="size-3" />
            {isInternal ? 'Internal Note (Hidden from Customer)' : 'Public Customer Message'}
          </button>
        </div>
      )}

      <div className="flex gap-2">
        <textarea
          value={content}
          onChange={(e) => setContent(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder={isInternal ? 'Write an internal team note...' : placeholder}
          disabled={disabled || sending}
          rows={2}
          className={`flex-1 resize-none rounded-md border bg-background px-3 py-2 text-sm shadow-sm placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 ${
            isInternal ? 'border-amber-400/50 focus-visible:ring-amber-500' : 'focus-visible:ring-ring'
          }`}
        />
        <Button
          type="button"
          onClick={handleSend}
          disabled={!content.trim() || disabled || sending}
          size="icon"
          variant={isInternal ? 'outline' : 'default'}
          className={isInternal ? 'border-amber-500 text-amber-600 hover:bg-amber-50' : ''}
        >
          <SendIcon className="size-4" />
        </Button>
      </div>
    </div>
  )
}
