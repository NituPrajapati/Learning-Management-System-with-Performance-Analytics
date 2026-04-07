import { useAuthStore } from '../../stores/authStore'

export function Navbar({ title }: { title: string }) {
  const { user, logout } = useAuthStore()

  return (
    <header className="flex items-center justify-between px-6 py-4 bg-[#111827] text-white shadow-sm">
      <h1 className="text-xl font-semibold">{title}</h1>
      <div className="flex items-center gap-3 text-sm">
        {user && (
          <>
            <span className="opacity-90">
              {user.name} ({user.role})
            </span>
            <button
              type="button"
              onClick={logout}
              className="px-3 py-1.5 rounded-md border border-white/30 bg-transparent text-white font-medium hover:bg-white/10 transition"
            >
              Logout
            </button>
          </>
        )}
      </div>
    </header>
  )
}
