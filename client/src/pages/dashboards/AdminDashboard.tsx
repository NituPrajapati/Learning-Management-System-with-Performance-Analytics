import { useEffect, useState } from 'react'
import { Navbar } from '../../components/common/Navbar'
import { ManageUsers } from '../../components/admin/ManageUsers'
import { useAuthStore } from '../../stores/authStore'

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:5000'

type Stats = {
  totalUsers: number
  activeUsers: number
  inactiveUsers: number
  totalStudents: number
  totalInstructors: number
  totalAdmins: number
}

export function AdminDashboard() {
  const { user, token } = useAuthStore()
  const [stats, setStats] = useState<Stats | null>(null)

  useEffect(() => {
    const load = async () => {
      if (!token) return
      const res = await fetch(`${API_BASE_URL}/api/users/stats`, {
        headers: { Authorization: `Bearer ${token}` },
      })
      const data = await res.json().catch(() => ({}))
      if (res.ok) setStats(data)
    }
    load()
  }, [token])

  return (
    <div className="min-h-screen bg-[#F4F3EE] text-[#141413]">
      <Navbar title="Admin Dashboard" />
      <main className="p-6">
        <div className="max-w-5xl mx-auto space-y-6">
          <div className="bg-white rounded-lg shadow-sm border border-[#E0DED8] p-5">
            <h2 className="text-lg font-semibold mb-1">Welcome back, {user?.name}</h2>
            <p className="text-sm text-[#6B6A66]">Here’s what’s happening on your platform</p>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mt-4">
              <div className="rounded-lg border border-[#E0DED8] p-4 bg-[#F4F3EE]">
                <p className="text-xs text-[#6B6A66]">Total Users</p>
                <p className="text-2xl font-semibold">{stats?.totalUsers ?? '-'}</p>
              </div>
              <div className="rounded-lg border border-[#E0DED8] p-4 bg-[#F4F3EE]">
                <p className="text-xs text-[#6B6A66]">Active Users</p>
                <p className="text-2xl font-semibold">{stats?.activeUsers ?? '-'}</p>
              </div>
              <div className="rounded-lg border border-[#E0DED8] p-4 bg-[#F4F3EE]">
                <p className="text-xs text-[#6B6A66]">Students</p>
                <p className="text-2xl font-semibold">{stats?.totalStudents ?? '-'}</p>
              </div>
              <div className="rounded-lg border border-[#E0DED8] p-4 bg-[#F4F3EE]">
                <p className="text-xs text-[#6B6A66]">Instructors</p>
                <p className="text-2xl font-semibold">{stats?.totalInstructors ?? '-'}</p>
              </div>
            </div>
          </div>

          <ManageUsers />
        </div>
      </main>
    </div>
  )
}



