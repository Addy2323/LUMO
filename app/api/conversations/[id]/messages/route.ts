import { NextRequest, NextResponse } from 'next/server'
import { authorizeApiRequest } from '@/lib/auth/authorize'
import { canAccessConversation, getMessages, postMessage } from '@/lib/conversations/conversation-service'

/**
 * GET /api/conversations/[id]/messages — fetch messages for a conversation
 */
export async function GET(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const auth = await authorizeApiRequest(req)
  if (!auth.authorized) return auth.response!

  const { id: conversationId } = await params
  const { user, activeRole } = auth
  const { searchParams } = req.nextUrl
  const page = Math.max(1, parseInt(searchParams.get('page') || '1'))
  const limit = Math.min(100, Math.max(1, parseInt(searchParams.get('limit') || '50')))

  const hasAccess = await canAccessConversation(conversationId, user.id, activeRole!)
  if (!hasAccess) {
    return NextResponse.json({ error: 'Access forbidden to this conversation' }, { status: 403 })
  }

  try {
    const result = await getMessages(conversationId, user.id, activeRole!, page, limit)
    return NextResponse.json(result)
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 })
  }
}

/**
 * POST /api/conversations/[id]/messages — post a message or internal note
 */
export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const auth = await authorizeApiRequest(req)
  if (!auth.authorized) return auth.response!

  const { id: conversationId } = await params
  const { user, activeRole } = auth

  let body: { content?: string; isInternal?: boolean }
  try {
    body = await req.json()
  } catch {
    return NextResponse.json({ error: 'Invalid request body' }, { status: 400 })
  }

  if (!body.content || !body.content.trim()) {
    return NextResponse.json({ error: 'Message content cannot be empty' }, { status: 400 })
  }

  const hasAccess = await canAccessConversation(conversationId, user.id, activeRole!)
  if (!hasAccess) {
    return NextResponse.json({ error: 'Access forbidden to this conversation' }, { status: 403 })
  }

  try {
    const message = await postMessage({
      conversationId,
      senderId: user.id,
      senderRole: activeRole!,
      content: body.content.trim(),
      isInternal: body.isInternal || false,
    })

    return NextResponse.json({ message }, { status: 201 })
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 400 })
  }
}
