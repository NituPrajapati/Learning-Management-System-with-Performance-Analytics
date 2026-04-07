import { useAuthStore } from '../../../stores/authStore'
import type { ChatMessage } from './types'

interface Props {
  message: ChatMessage
  onReply: (id: number) => void
}

const MessageItem = ({ message, onReply }: Props) => {
  const me = useAuthStore((s) => s.user)
  const mine = me?.id === message.senderId
  const displayName = message.displayName || (message.senderRole === 'INSTRUCTOR' ? `${message.senderName} (INSTRUCTOR)` : message.senderName)

  return (
    <div className={`flex ${mine ? 'justify-end' : 'justify-start'}`}>
      <div className={`max-w-[80%] rounded-xl px-3 py-2 border ${mine ? 'bg-[#111827] text-white border-[#111827]' : 'bg-white border-gray-200 text-[#111827]'}`}>
        <div className={`text-[11px] mb-1 ${mine ? 'text-white/80' : 'text-gray-500'} flex items-center gap-2`}>
          <span className="font-semibold">{displayName}</span>
          <span>{new Date(message.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
        </div>
        <p className="text-sm whitespace-pre-wrap break-words">{message.message}</p>
        {!mine && typeof message.id === 'number' && (
          <button
            type="button"
            className={`mt-1 text-[11px] ${mine ? 'text-white/80' : 'text-gray-500'} hover:underline`}
            onClick={() => onReply(message.id as number)}
          >
            Reply
          </button>
        )}
      </div>
    </div>
  )
}

export default MessageItem

