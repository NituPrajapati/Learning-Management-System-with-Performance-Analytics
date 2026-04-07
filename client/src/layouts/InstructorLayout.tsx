import { Outlet } from 'react-router-dom'
import { LuLayoutDashboard } from 'react-icons/lu'
import { IoChatboxEllipsesOutline, IoChatbubblesOutline } from 'react-icons/io5'
import { MdOutlineAnalytics } from 'react-icons/md'
import Sidebar from '../components/Sidebar'

const icon = 'w-5 h-5 flex-shrink-0'

const instructorNavItems = [
  { label: 'Dashboard', path: '/instructor/dashboard', icon: <LuLayoutDashboard className={icon} /> },
  {
    label: 'My Courses',
    path: '/instructor/courses',
    icon: <IoChatboxEllipsesOutline className={icon} />,
  },
  { label: 'Analytics', path: '/instructor/analytics', icon: <MdOutlineAnalytics className={icon} /> },
  { label: 'Chat', path: '/instructor/chats', icon: <IoChatbubblesOutline className={icon} /> },
]

const InstructorLayout = () => {
  return (
    <div className="flex min-h-screen bg-[#F2F4F7]">
      <Sidebar navItems={instructorNavItems} />
      <main className="ml-64 flex-1 min-h-screen text-[#111827] p-3 sm:p-5">
        <Outlet />
      </main>
    </div>
  )
}

export default InstructorLayout
