import { useAuthStore } from '../../stores/authStore'

export function Navbar({ title }: { title: string }) {
  const { user, logout } = useAuthStore()

  return (
    <header className="flex items-center justify-between px-6 py-4 bg-[#141413] text-[#F4F3EE] shadow-sm">
      <h1 className="text-xl font-semibold">{title}</h1>
      <div className="flex items-center gap-3 text-sm">
        {user && (
          <>
            <span className="opacity-90">
              {user.name} ({user.role})
            </span>
            <button
              onClick={logout}
              className="px-3 py-1 rounded bg-[#08A696] text-[#141413] font-medium hover:opacity-90 transition"
            >
              Logout
            </button>
          </>
        )}
      </div>
    </header>
  )
}


