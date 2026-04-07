import { Outlet, NavLink, useNavigate } from 'react-router-dom'
import { CgProfile } from 'react-icons/cg'
import { LuLayoutDashboard } from 'react-icons/lu'
import { IoChatboxEllipsesOutline, IoLogOutOutline } from 'react-icons/io5'
import { FaMagnifyingGlass, FaFire } from 'react-icons/fa6'
import { MdOutlineAnalytics } from 'react-icons/md'
import { useAuthStore } from '../stores/authStore'
import NotificationBell from '../components/NotificationBell'
import { useStudentDailyVisit } from '../hooks/useStudentDailyVisit'

const ic = 'w-5 h-5 flex-shrink-0'

const navItems = [
  { label: 'Dashboard', path: '/student/dashboard', icon: <LuLayoutDashboard className={ic} /> },
  {
    label: 'My Courses',
    path: '/student/courses',
    icon: <IoChatboxEllipsesOutline className={ic} />,
  },
  { label: 'Explore', path: '/', icon: <FaMagnifyingGlass className={ic} /> },
  { label: 'Progress', path: '/student/progress', icon: <MdOutlineAnalytics className={ic} /> },
]

const StudentLayout = () => {
  const { user, logout } = useAuthStore()
  const navigate = useNavigate()
  const { data: visit } = useStudentDailyVisit()

  const handleLogout = () => {
    logout()
    navigate('/login')
  }

  return (
    <div className="flex min-h-screen bg-[#F2F4F7]">
      <aside className="w-64 bg-white border-r border-gray-200 fixed top-0 left-0 h-full flex flex-col z-10">
        <div className="p-5 border-b border-gray-200">
          <h1 className="font-bold text-[#111827]">LMS Platform</h1>
          <p className="text-xs text-gray-600 mt-1">Student Portal</p>
        </div>

        <div className="p-4 border-b border-gray-200">
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-2 flex-shrink-0">
              <div className="w-9 h-9 rounded-full bg-[#F2F4F7] border border-gray-200 flex items-center justify-center">
                <CgProfile className="w-5 h-5 text-[#111827]" aria-hidden />
              </div>
            </div>
            <div className="min-w-0 flex-1">
              <p className="text-sm font-medium text-[#111827] truncate">{user?.name}</p>
              <p className="text-xs text-gray-600">Student</p>
            </div>
            <span
                className={`flex flex-col items-center justify-center ${visit != null ? 'text-orange-600' : 'text-orange-300'}`}
                title={visit != null ? `${visit.streak} day streak` : 'Loading streak…'}
                aria-label={visit != null ? `${visit.streak} day streak` : 'Streak'}
              >
                <FaFire className="w-5 h-5" />streak
                {visit != null && (
                  <span className="text-[10px] font-bold leading-none text-orange-600 -mt-0.5 tabular-nums">
                    {visit.streak}
                  </span>
                )}
              </span>
          </div>
        </div>

        <nav className="flex-1 p-4 space-y-1 overflow-y-auto">
          {navItems.map((item) => (
            <NavLink
              key={item.path}
              to={item.path}
              className={({ isActive }) =>
                `flex items-center gap-3 px-4 py-3 rounded-lg text-sm transition ${
                  isActive
                    ? 'bg-[#111827] text-white font-medium'
                    : 'text-gray-600 hover:bg-[#F2F4F7] hover:text-[#111827]'
                }`
              }
            >
              {item.icon}
              <span>{item.label}</span>
            </NavLink>
          ))}
        </nav>

        <div className="p-4 border-t border-gray-200 space-y-2 flex-shrink-0">
          <div className="flex items-center justify-between gap-2 px-2 py-1 min-h-[40px]">
            <span className="text-sm text-gray-600 truncate">Notifications</span>
            <NotificationBell />
          </div>
          <button
            type="button"
            onClick={handleLogout}
            className="w-full flex items-center gap-3 px-4 py-3 rounded-lg text-sm text-gray-600 hover:bg-red-50 hover:text-red-500 transition"
          >
            <IoLogOutOutline className="w-5 h-5 flex-shrink-0" aria-hidden />
            <span>Logout</span>
          </button>
        </div>
      </aside>

      <main className="ml-64 flex-1 min-h-screen p-3 sm:p-5 text-[#111827]">
        <Outlet />
      </main>
    </div>
  )
}

export default StudentLayout
