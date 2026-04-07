import { useState, useRef, useEffect, useLayoutEffect } from 'react'
import { createPortal } from 'react-dom'
import { MdOutlineNotificationsActive } from 'react-icons/md'
import { useNotifications, useMarkAsRead, useMarkAllRead } from '../hooks/useNotifications'

const typeIcon: Record<string, string> = {
  NEW_MODULE: '📚',
  COURSE_UPDATE: '📝',
  EXAM_REMINDER: '⏰',
  ENROLLMENT: '🎓',
  QUIZ_RESULT: '✅',
  COURSE_EXPIRING: '⏳',
  INFO: 'ℹ️',
}

const NotificationBell = () => {
  const [open, setOpen] = useState(false)
  const [panelStyle, setPanelStyle] = useState<React.CSSProperties>({})
  const wrapRef = useRef<HTMLDivElement>(null)
  const buttonRef = useRef<HTMLButtonElement>(null)
  const panelRef = useRef<HTMLDivElement>(null)
  const { data, isError, isLoading, refetch } = useNotifications()
  const markAsRead = useMarkAsRead()
  const markAllRead = useMarkAllRead()

  const notifications = data?.notifications || []
  const unreadCount = data?.unreadCount || 0

  useLayoutEffect(() => {
    if (!open || !buttonRef.current) return

    const update = () => {
      const btn = buttonRef.current
      if (!btn) return
      const r = btn.getBoundingClientRect()
      const panelW = 320
      const panelMaxH = Math.min(288, window.innerHeight - 16)

      let left = r.right - panelW
      if (left < 8) left = 8
      if (left + panelW > window.innerWidth - 8) {
        left = Math.max(8, window.innerWidth - panelW - 8)
      }

      let top = r.bottom + 8
      const spaceBelow = window.innerHeight - top - 8
      if (spaceBelow < Math.min(200, panelMaxH) && r.top > panelMaxH + 24) {
        top = r.top - panelMaxH - 8
      }
      if (top < 8) top = 8

      setPanelStyle({
        position: 'fixed',
        top,
        left,
        width: panelW,
        maxHeight: panelMaxH,
        zIndex: 9999,
      })
    }

    update()
    window.addEventListener('resize', update)
    window.addEventListener('scroll', update, true)
    return () => {
      window.removeEventListener('resize', update)
      window.removeEventListener('scroll', update, true)
    }
  }, [open])

  useEffect(() => {
    const handleClick = (e: MouseEvent) => {
      const t = e.target as Node
      if (
        wrapRef.current?.contains(t) ||
        panelRef.current?.contains(t)
      ) {
        return
      }
      setOpen(false)
    }
    document.addEventListener('mousedown', handleClick)
    return () => document.removeEventListener('mousedown', handleClick)
  }, [])

  const panel =
    open &&
    createPortal(
      <div
        ref={panelRef}
        style={panelStyle}
        className="flex flex-col bg-white rounded-xl shadow-xl border border-gray-200 text-[#111827] overflow-hidden"
      >
        <div className="flex items-center justify-between px-4 py-3 border-b border-gray-200 flex-shrink-0">
          <h3 className="font-semibold text-sm">Notifications</h3>
          <div className="flex items-center gap-2">
            {isError && (
              <button
                type="button"
                onClick={() => refetch()}
                className="text-xs text-red-600 hover:underline"
              >
                Retry
              </button>
            )}
            {unreadCount > 0 && !isError && (
              <button
                type="button"
                onClick={() => markAllRead.mutate()}
                className="text-xs text-[#111827] font-medium hover:underline"
              >
                Mark all read
              </button>
            )}
          </div>
        </div>

        <div className="overflow-y-auto flex-1 min-h-0">
          {isLoading ? (
            <div className="text-center py-8 text-sm text-gray-500">Loading…</div>
          ) : isError ? (
            <div className="text-center py-8 px-4">
              <p className="text-sm text-red-600">Could not load notifications.</p>
              <p className="text-xs text-gray-500 mt-2">
                Check that you are logged in and the server is running.
              </p>
            </div>
          ) : notifications.length === 0 ? (
            <div className="text-center py-8">
              <MdOutlineNotificationsActive className="w-8 h-8 mx-auto mb-2 text-gray-400" />
              <p className="text-sm text-gray-600">No notifications yet</p>
            </div>
          ) : (
            notifications.map(
              (n: {
                id: number
                title: string
                message: string
                type: string
                isRead: boolean
                createdAt: string
              }) => (
                <div
                  key={n.id}
                  role="button"
                  tabIndex={0}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' && !n.isRead) markAsRead.mutate(n.id)
                  }}
                  onClick={() => !n.isRead && markAsRead.mutate(n.id)}
                  className={`flex gap-3 px-4 py-3 border-b border-gray-100 cursor-pointer hover:bg-[#F2F4F7] transition ${
                    !n.isRead ? 'bg-[#F2F4F7]/80' : ''
                  }`}
                >
                  <span className="text-lg flex-shrink-0">{typeIcon[n.type] || 'ℹ️'}</span>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium">{n.title}</p>
                    <p className="text-xs text-gray-600 mt-0.5 line-clamp-2">{n.message}</p>
                    <p className="text-xs text-gray-500 mt-1">
                      {new Date(n.createdAt).toLocaleDateString()}
                    </p>
                  </div>
                  {!n.isRead && (
                    <div className="w-2 h-2 bg-[#111827] rounded-full flex-shrink-0 mt-2" />
                  )}
                </div>
              )
            )
          )}
        </div>
      </div>,
      document.body
    )

  return (
    <div className="relative" ref={wrapRef}>
      <button
        ref={buttonRef}
        type="button"
        onClick={() => setOpen((prev) => !prev)}
        className="relative p-2 rounded-lg hover:bg-[#F2F4F7] transition text-[#111827]"
        aria-label="Notifications"
        aria-expanded={open}
      >
        <MdOutlineNotificationsActive className="w-5 h-5" />
        {isError && (
          <span
            className="absolute -top-0.5 -right-0.5 w-2 h-2 bg-amber-500 rounded-full"
            title="Failed to load"
          />
        )}
        {unreadCount > 0 && !isError && (
          <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs rounded-full w-5 h-5 flex items-center justify-center font-bold">
            {unreadCount > 9 ? '9+' : unreadCount}
          </span>
        )}
      </button>
      {panel}
    </div>
  )
}

export default NotificationBell
