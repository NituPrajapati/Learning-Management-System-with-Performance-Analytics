import { useState } from 'react'

interface Props {
  onSend: (text: string) => void
  replyToMessageId: number | null
  onCancelReply: () => void
}

const ChatInput = ({ onSend, replyToMessageId, onCancelReply }: Props) => {
  const [text, setText] = useState('')

  const submit = () => {
    const v = text.trim()
    if (!v) return
    onSend(v)
    setText('')
  }

  return (
    <div className="space-y-2">
      {replyToMessageId != null && (
        <div className="text-xs rounded-md border border-amber-200 bg-amber-50 px-3 py-2 text-amber-800 flex items-center justify-between">
          <span>Replying to message #{replyToMessageId}</span>
          <button type="button" className="hover:underline" onClick={onCancelReply}>
            Cancel
          </button>
        </div>
      )}
      <div className="flex items-end gap-2">
        <textarea
          value={text}
          onChange={(e) => setText(e.target.value)}
          rows={2}
          placeholder="Type a message..."
          className="flex-1 rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-[#08A696]"
        />
        <button
          type="button"
          onClick={submit}
          className="rounded-lg bg-[#08A696] text-white text-sm font-medium px-4 py-2 hover:opacity-90"
        >
          Send
        </button>
      </div>
    </div>
  )
}

export default ChatInput

