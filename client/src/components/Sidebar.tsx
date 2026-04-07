import { NavLink, useNavigate } from 'react-router-dom'
import { CgProfile } from 'react-icons/cg'
import { IoLogOutOutline } from 'react-icons/io5'
import { useAuthStore } from '../stores/authStore'
import type { NavItem } from '../types/env'
import NotificationBell from './NotificationBell'

interface Props {
  navItems: NavItem[]
}

const Sidebar = ({ navItems }: Props) => {
  const { user, logout } = useAuthStore()
  const navigate = useNavigate()

  const handleLogout = () => {
    logout()
    navigate('/login')
  }

  return (
    <div className="w-64 h-screen bg-white border-r border-gray-200 text-[#111827] flex flex-col fixed left-0 top-0">
      {/* Logo */}
      <div className="p-6 border-b border-gray-200">
        <h1 className="text-xl font-bold">LMS Platform</h1>
        <p className="text-xs text-gray-500 mt-1">{user?.role}</p>
      </div>

      {/* User info */}
      <div className="p-4 border-b border-gray-200">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-full bg-[#F2F4F7] border border-gray-200 flex items-center justify-center flex-shrink-0">
            <CgProfile className="w-5 h-5 text-[#111827]" aria-hidden />
          </div>
          <div>
            <p className="text-sm font-medium">{user?.name}</p>
            <p className="text-xs text-gray-500">{user?.email}</p>
          </div>
        </div>
      </div>

      {/* Nav links */}
      <nav className="flex-1 p-4 space-y-1">
        {navItems.map((item) => (
          <NavLink
            key={item.path}
            to={item.path}
            className={({ isActive }) =>
              `flex items-center gap-3 px-4 py-3 rounded-lg text-sm transition-colors ${
                isActive
                  ? 'bg-[#111827] text-white'
                  : 'text-gray-600 hover:bg-[#F2F4F7] hover:text-[#111827]'
              }`
            }
          >
            <span>{item.icon}</span>
            <span>{item.label}</span>
          </NavLink>
        ))}
      </nav>

      {/* Notifications + Logout */}
      <div className="p-4 border-t border-gray-200 space-y-2 mt-auto">
        <div className="flex items-center justify-between gap-2 px-2 py-1 min-h-[40px]">
          <span className="text-xs text-gray-500 truncate">Notifications</span>
          <NotificationBell />
        </div>
        <button
          type="button"
          onClick={handleLogout}
          className="w-full flex items-center gap-3 px-4 py-3 rounded-lg text-sm text-gray-600 hover:bg-red-50 hover:text-red-600 transition-colors"
        >
          <IoLogOutOutline className="w-5 h-5 flex-shrink-0" aria-hidden />
          <span>Logout</span>
        </button>
      </div>
    </div>
  )
}

export default Sidebar