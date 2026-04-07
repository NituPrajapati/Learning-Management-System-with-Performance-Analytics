import { useCallback, useEffect, useMemo, useState } from 'react'
import api from '../../api/axios'
import { useAuthStore } from '../../stores/authStore'
import { useSocket } from '../../hooks/useSocket'
import ChatInput from './chat/ChatInput'
import MessageList from './chat/MessageList'
import type { ChatMessage } from './chat/types'

interface Props {
  courseId: number
}

const PAGE_SIZE = 20

const ChatTab = ({ courseId }: Props) => {
  const me = useAuthStore((s) => s.user)
  const { socket, connected } = useSocket()

  const [messages, setMessages] = useState<ChatMessage[]>([])
  const [hasMore, setHasMore] = useState(false)
  const [nextCursor, setNextCursor] = useState<number | null>(null)
  const [loadingMore, setLoadingMore] = useState(false)
  const [replyToMessageId, setReplyToMessageId] = useState<number | null>(null)

  const fetchHistory = useCallback(async (cursor?: number | null) => {
    const params: Record<string, string | number> = { limit: PAGE_SIZE }
    if (cursor) params.cursor = cursor
    const { data } = await api.get(`/api/chat/${courseId}/messages`, { params })
    return data as { messages: ChatMessage[]; nextCursor: number | null; hasMore: boolean }
  }, [courseId])

  const loadInitial = useCallback(async () => {
    const data = await fetchHistory(null)
    setMessages(data.messages)
    setHasMore(data.hasMore)
    setNextCursor(data.nextCursor)
  }, [fetchHistory])

  useEffect(() => {
    void loadInitial()
  }, [loadInitial])

  useEffect(() => {
    if (!socket) return

    socket.emit('join_room', { courseId })

    const onMessage = (payload: ChatMessage) => {
      setMessages((prev) => {
        const deduped = prev.filter((m) => !(m.optimistic && m.senderId === payload.senderId && m.message === payload.message))
        return [...deduped, payload]
      })
    }
    const onErr = (e: { message?: string }) => {
      if (e?.message) alert(e.message)
    }

    socket.on('message_received', onMessage)
    socket.on('chat_error', onErr)
    return () => {
      socket.emit('leave_room', { courseId })
      socket.off('message_received', onMessage)
      socket.off('chat_error', onErr)
    }
  }, [socket, courseId])

  const handleSend = (text: string) => {
    if (!socket || !me) return

    const optimistic: ChatMessage = {
      id: `tmp-${Date.now()}`,
      courseId,
      senderId: me.id,
      senderName: me.name,
      senderRole: me.role,
      displayName: me.role === 'INSTRUCTOR' ? `${me.name} (INSTRUCTOR)` : me.name,
      message: text,
      replyToMessageId,
      createdAt: new Date().toISOString(),
      optimistic: true,
    }
    setMessages((prev) => [...prev, optimistic])

    socket.emit('send_message', {
      courseId,
      message: text,
      replyToMessageId,
    })
    setReplyToMessageId(null)
  }

  const loadMore = async () => {
    if (!hasMore || !nextCursor) return
    setLoadingMore(true)
    try {
      const data = await fetchHistory(nextCursor)
      setMessages((prev) => [...data.messages, ...prev])
      setHasMore(data.hasMore)
      setNextCursor(data.nextCursor)
    } finally {
      setLoadingMore(false)
    }
  }

  const statusText = useMemo(() => {
    if (!socket) return 'Connecting...'
    return connected ? 'Live' : 'Reconnecting...'
  }, [socket, connected])

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <h3 className="font-semibold text-[#111827]">Course Discussion</h3>
        <span className={`text-xs px-2 py-1 rounded-full ${connected ? 'bg-green-100 text-green-700' : 'bg-amber-100 text-amber-700'}`}>
          {statusText}
        </span>
      </div>
      <MessageList
        messages={messages}
        hasMore={hasMore}
        loadingMore={loadingMore}
        onLoadMore={() => void loadMore()}
        onReply={(id) => setReplyToMessageId(id)}
      />
      <ChatInput
        onSend={handleSend}
        replyToMessageId={replyToMessageId}
        onCancelReply={() => setReplyToMessageId(null)}
      />
    </div>
  )
}

export default ChatTab