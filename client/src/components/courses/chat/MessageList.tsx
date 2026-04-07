import { useEffect, useRef } from 'react'
import MessageItem from './MessageItem'
import type { ChatMessage } from './types'

interface Props {
  messages: ChatMessage[]
  hasMore: boolean
  loadingMore: boolean
  onLoadMore: () => void
  onReply: (id: number) => void
}

const MessageList = ({ messages, hasMore, loadingMore, onLoadMore, onReply }: Props) => {
  const endRef = useRef<HTMLDivElement | null>(null)

  useEffect(() => {
    endRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages.length])

  return (
    <div className="rounded-xl border border-gray-200 bg-[#F2F4F7]/40 p-3 h-[52vh] overflow-y-auto space-y-2">
      {hasMore && (
        <div className="flex justify-center">
          <button
            type="button"
            onClick={onLoadMore}
            disabled={loadingMore}
            className="text-xs px-3 py-1 rounded border border-gray-300 bg-white hover:bg-gray-50 disabled:opacity-50"
          >
            {loadingMore ? 'Loading...' : 'Load older messages'}
          </button>
        </div>
      )}
      {messages.map((m) => (
        <MessageItem key={String(m.id)} message={m} onReply={onReply} />
      ))}
      <div ref={endRef} />
    </div>
  )
}

export default MessageList

