import { useEffect } from 'react'
import { io } from 'socket.io-client'
import { useAuthStore } from '../stores/authStore'
import { queryClient } from '../main'

function socketBaseUrl() {
  const raw = import.meta.env.VITE_API_BASE_URL || 'http://localhost:5000'
  try {
    const u = new URL(raw)
    return `${u.protocol}//${u.host}`
  } catch {
    return String(raw).replace(/\/$/, '')
  }
}

/** Real-time refresh of the notification list when the server creates a row (quiz, broadcasts, etc.). */
export function NotificationSocketListener() {
  const token = useAuthStore((s) => s.token)

  useEffect(() => {
    if (!token) return
    const socket = io(socketBaseUrl(), {
      auth: { token },
      transports: ['websocket', 'polling'],
    })
    socket.on('notification:new', () => {
      queryClient.invalidateQueries({ queryKey: ['notifications'] })
    })
    return () => {
      socket.disconnect()
    }
  }, [token])

  return null
}
