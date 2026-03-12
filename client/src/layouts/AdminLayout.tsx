import { Outlet } from 'react-router-dom'
import Sidebar from '../components/Sidebar'

const adminNavItems = [
  { label: 'Dashboard', path: '/admin/dashboard', icon: '📊' },
  { label: 'Users', path: '/admin/users', icon: '👥' },
  { label: 'Courses', path: '/admin/courses', icon: '📚' },
]

const AdminLayout = () => {
  return (
    <div className="flex">
      <Sidebar navItems={adminNavItems} />
      <main className="ml-64 flex-1 min-h-screen bg-gray-50 p-8">
        <Outlet />
      </main>
    </div>
  )
}

export default AdminLayout