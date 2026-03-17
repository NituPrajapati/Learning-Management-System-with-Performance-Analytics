import { useEffect, useState } from 'react'
import { Navbar } from '../../components/common/Navbar'
import { ManageUsers } from '../../components/admin/ManageUsers'
import { useAuthStore } from '../../stores/authStore'
import api from '../../api/axios'

type Stats = {
  totalUsers: number
  activeUsers: number
  inactiveUsers: number
  totalStudents: number
  totalInstructors: number
  totalAdmins: number
}

export function AdminDashboard() {
  const { user } = useAuthStore()
  const [stats, setStats] = useState<Stats | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const fetchStats = async () => {
      try {
        const res = await api.get('/api/users/stats')
        setStats(res.data)
      } catch (err) {
        console.error('Failed to fetch stats:', err)
      } finally {
        setLoading(false)
      }
    }
    fetchStats()
  }, [])

  const statCards = [
    { label: 'Total Users',    value: stats?.totalUsers,        bg: 'bg-[#E6FAF7]', text: 'text-[#057A6E]' },
    { label: 'Active Users',   value: stats?.activeUsers,       bg: 'bg-[#E6F4FF]', text: 'text-[#0550AE]' },
    { label: 'Inactive Users', value: stats?.inactiveUsers,     bg: 'bg-[#FDECEC]', text: 'text-[#B42318]' },
    { label: 'Students',       value: stats?.totalStudents,     bg: 'bg-[#FFF8E6]', text: 'text-[#92400E]' },
    { label: 'Instructors',    value: stats?.totalInstructors,  bg: 'bg-[#F3EEFF]', text: 'text-[#5B21B6]' },
    { label: 'Admins',         value: stats?.totalAdmins,       bg: 'bg-[#F4F3EE]', text: 'text-[#141413]' },
  ]

  return (
    <div className="min-h-screen bg-[#F4F3EE] text-[#141413]">
      <Navbar title="Admin Dashboard" />
      <main className="p-6">
        <div className="max-w-5xl mx-auto space-y-6">

          {/* Welcome card */}
          <div className="bg-white rounded-lg shadow-sm border border-[#E0DED8] p-5">
            <h2 className="text-lg font-semibold mb-1">
              Welcome back, {user?.name} 👋
            </h2>
            <p className="text-sm text-[#6B6A66]">
              Here's what's happening on your platform
            </p>

            {/* Stat cards */}
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-4 mt-4">
              {statCards.map((card) => (
                <div
                  key={card.label}
                  className={`rounded-lg border border-[#E0DED8] p-4 ${card.bg}`}
                >
                  <p className="text-xs text-[#6B6A66]">{card.label}</p>
                  <p className={`text-2xl font-semibold mt-1 ${card.text}`}>
                    {loading ? '...' : card.value ?? 0}
                  </p>
                </div>
              ))}
            </div>
          </div>

          {/* Users table */}
          <ManageUsers />

        </div>
      </main>
    </div>
  )
}
