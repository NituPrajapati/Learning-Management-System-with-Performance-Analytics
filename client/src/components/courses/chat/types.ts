export interface ChatMessage {
  id: number | string
  courseId: number
  senderId: number
  senderName: string
  senderRole: 'ADMIN' | 'INSTRUCTOR' | 'STUDENT'
  displayName?: string
  message: string
  replyToMessageId?: number | null
  createdAt: string
  optimistic?: boolean
}

