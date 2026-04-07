import { useEffect, useMemo, useState } from 'react'
import { io, type Socket } from 'socket.io-client'
import { useAuthStore } from '../stores/authStore'

function socketBaseUrl() {
  const raw = import.meta.env.VITE_API_BASE_URL || 'http://localhost:5000'
  try {
    const u = new URL(raw)
    return `${u.protocol}//${u.host}`
  } catch {
    return String(raw).replace(/\/$/, '')
  }
}

export function useSocket() {
  const token = useAuthStore((s) => s.token)
  const [socket, setSocket] = useState<Socket | null>(null)
  const [connected, setConnected] = useState(false)
  const base = useMemo(() => socketBaseUrl(), [])

  useEffect(() => {
    if (!token) return

    const s = io(base, {
      auth: { token },
      transports: ['websocket', 'polling'],
    })
    setSocket(s)

    const onConnect = () => setConnected(true)
    const onDisconnect = () => setConnected(false)
    s.on('connect', onConnect)
    s.on('disconnect', onDisconnect)

    return () => {
      s.off('connect', onConnect)
      s.off('disconnect', onDisconnect)
      s.disconnect()
      setSocket(null)
      setConnected(false)
    }
  }, [token, base])

  return { socket, connected }
}

