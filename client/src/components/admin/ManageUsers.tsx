import type { FormEvent } from 'react'
import { useState, useEffect} from 'react'
import { useAuthStore } from '../../stores/authStore'
import { LoadingSpinner } from '../common/LoadingSpinner'
import api from '../../api/axios'

type UserRow = {
  id: number
  name: string
  email: string
  role: 'ADMIN' | 'INSTRUCTOR' | 'STUDENT'
  isActive: boolean
  createdAt: string
  updatedAt: string
}

export function ManageUsers() {
  const { user } = useAuthStore()

  const [users, setUsers] = useState<UserRow[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [search, setSearch] = useState('')
  const [roleFilter, setRoleFilter] = useState<'ALL' | 'STUDENT' | 'INSTRUCTOR'>('ALL')

  const [showInstructorForm, setShowInstructorForm] = useState(false)
  const [instName, setInstName] = useState('')
  const [instEmail, setInstEmail] = useState('')
  const [instPassword, setInstPassword] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [successMessage, setSuccessMessage] = useState<string | null>(null)
  const [pendingRole, setPendingRole] = useState<Record<number, 'STUDENT' | 'INSTRUCTOR'>>({})


  const fetchUsers = async () => {
    try {
      setIsLoading(true)
      setError(null)
      const res = await api.get('/api/users')
      setUsers(Array.isArray(res.data) ? res.data : [])
    } catch (err: unknown) {
      setError((err as Error).message || 'Failed to fetch users')
    } finally {
      setIsLoading(false)
    }
  }

    useEffect(() => {
    fetchUsers()
  }, [])

  const handleCreateInstructor = async (e: FormEvent) => {
    e.preventDefault()
    try {
      setIsSubmitting(true)
      setError(null)
      setSuccessMessage(null)

      const res = await api.post('/api/users/create-instructor', {
        name: instName,
        email: instEmail,
        password: instPassword,
      })

      // ✅ instant update — no refetch needed
      setUsers(prev => [res.data, ...prev])
      setSuccessMessage('Instructor created successfully.')
      setInstName('')
      setInstEmail('')
      setInstPassword('')
      setShowInstructorForm(false)
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to create instructor')
    } finally {
      setIsSubmitting(false)
    }
  }

  const toggleStatus = async (targetId: number) => {
    try {
      setError(null)
      await api.patch(`/api/users/${targetId}/toggle-status`)
      // ✅ instant update
      setUsers(prev =>
        prev.map(u => u.id === targetId ? { ...u, isActive: !u.isActive } : u)
      )
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to toggle status')
    }
  }

  const deleteUser = async (targetId: number) => {
    if (!window.confirm('Are you sure you want to delete this user?')) return
    try {
      setError(null)
      await api.delete(`/api/users/${targetId}`)
      // ✅ instant update
      setUsers(prev => prev.filter(u => u.id !== targetId))
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to delete user')
    }
  }

    const updateRole = async (userId: number) => {
    try {
      setError(null)
      const role = pendingRole[userId]
      if (!role) return
      await api.patch(`/api/users/${userId}/role`, { role })
      // ✅ instant update
      setUsers(prev =>
        prev.map(u => u.id === userId ? { ...u, role } : u)
      )
      setPendingRole(prev => {
        const updated = { ...prev }
        delete updated[userId]
        return updated
      })
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to update role')
    }
  }

  if (user?.role !== 'ADMIN') return null

  const filteredUsers = users.filter((u) => {
    const q = search.trim().toLowerCase()
    const matchesQuery = !q || u.name.toLowerCase().includes(q) || u.email.toLowerCase().includes(q)
    const matchesRole = roleFilter === 'ALL' ? true : u.role === roleFilter
    return matchesQuery && matchesRole
  })


  return (
    <section className="bg-white rounded-lg shadow-sm border border-[#E0DED8] p-5">
      <div className="flex items-start justify-between gap-4 mb-4">
        <div>
          <h2 className="text-lg font-semibold text-[#141413]">Manage Users</h2>
          <p className="text-sm text-[#6B6A66]">
            View all users, create instructors, change roles, activate/deactivate and delete.
          </p>
        </div>
        <button
          onClick={() => setShowInstructorForm((prev) => !prev)}
          className="px-4 py-2 rounded-full bg-[#08A696] text-[#141413] text-sm font-semibold hover:opacity-90 transition"
        >
          {showInstructorForm ? 'Close' : 'Create Instructor'}
        </button>
      </div>
      {/* Search + Filters */}
      <div className="flex flex-col md:flex-row md:items-center gap-3 mb-4">
        <div className="flex-1">
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search by name or email..."
            className="w-full rounded-md border border-[#D4D2CC] px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-[#08A696] bg-[#F4F3EE]"
          />
        </div>
        <div className="w-full md:w-60">
          <select
            value={roleFilter}
            onChange={(e) => setRoleFilter(e.target.value as any)}
            className="w-full rounded-md border border-[#D4D2CC] px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-[#08A696] bg-[#F4F3EE]"
          >
            <option value="ALL">All roles</option>
            <option value="STUDENT">Students</option>
            <option value="INSTRUCTOR">Instructors</option>
          </select>
        </div>
      </div>
      {/* Create Instructor Form */}
      {showInstructorForm && (
        <form onSubmit={handleCreateInstructor} className="space-y-4 mb-5">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
            <div>
              <label className="block text-xs font-medium text-[#6B6A66] mb-1">Name</label>
              <input
                value={instName}
                onChange={(e) => setInstName(e.target.value)}
                className="w-full rounded-md border border-[#D4D2CC] px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-[#08A696] bg-[#F4F3EE]"
                required
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-[#6B6A66] mb-1">Email</label>
              <input
                type="email"
                value={instEmail}
                onChange={(e) => setInstEmail(e.target.value)}
                className="w-full rounded-md border border-[#D4D2CC] px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-[#08A696] bg-[#F4F3EE]"
                required
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-[#6B6A66] mb-1">Password</label>
              <input
                type="password"
                value={instPassword}
                onChange={(e) => setInstPassword(e.target.value)}
                minLength={6}
                className="w-full rounded-md border border-[#D4D2CC] px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-[#08A696] bg-[#F4F3EE]"
                required
              />
            </div>
          </div>
          <div className="flex items-center gap-3">
            <button
              type="submit"
              disabled={isSubmitting}
              className="px-4 py-2 rounded-md bg-[#08A696] text-[#141413] font-semibold text-sm hover:opacity-90 disabled:opacity-60"
            >
              {isSubmitting ? 'Creating...' : 'Create'}
            </button>
            <button
              type="button"
              onClick={() => setShowInstructorForm(false)}
              className="px-4 py-2 rounded-md border border-[#D4D2CC] bg-white text-[#141413] text-sm hover:bg-[#F4F3EE]"
            >
              Cancel
            </button>
          </div>
        </form>
      )}

      {isLoading ? (
        <LoadingSpinner label="Loading users..." />
      ) : (
        <div className="overflow-auto rounded-md border border-[#E0DED8]">
          <table className="w-full text-sm">
            <thead className="bg-[#F4F3EE] text-[#141413]">
              <tr>
                <th className="text-left px-3 py-2">Name</th>
                <th className="text-left px-3 py-2">Email</th>
                <th className="text-left px-3 py-2">Role</th>
                <th className="text-left px-3 py-2">Status</th>
                <th className="text-right px-3 py-2">Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredUsers.length === 0 ? (
                <tr>
                  <td className="px-3 py-4 text-[#6B6A66]" colSpan={5}>
                    No users found.
                  </td>
                </tr>
              ) : (
                filteredUsers.map((u) => (
                  <tr key={u.id} className="border-t border-[#E0DED8]">
                    <td className="px-3 py-2">{u.name}</td>
                    <td className="px-3 py-2">{u.email}</td>

                    {/* Role */}
                    <td className="px-3 py-2">
                      {u.role === 'ADMIN' ? (
                        <span className="font-semibold">{u.role}</span>
                      ) : (
                        <div className="flex items-center gap-2">
                          <select
                            value={pendingRole[u.id] || u.role}
                            onChange={(e) =>
                              setPendingRole(prev => ({
                                ...prev,
                                [u.id]: e.target.value as any,
                              }))
                            }
                            className="rounded-md border border-[#D4D2CC] px-2 py-1 text-sm bg-[#F4F3EE] outline-none focus:ring-2 focus:ring-[#08A696]"
                          >
                            <option value="STUDENT">STUDENT</option>
                            <option value="INSTRUCTOR">INSTRUCTOR</option>
                          </select>
                          <button
                            onClick={() => updateRole(u.id)}
                            className="px-2 py-1 rounded-md bg-[#08A696] text-[#141413] text-xs font-semibold hover:opacity-90"
                          >
                            Save
                          </button>
                        </div>
                      )}
                    </td>

                    {/* Status */}
                    <td className="px-3 py-2">
                      <span className={
                        u.isActive
                          ? 'inline-flex items-center rounded-full bg-[#E6FAF7] text-[#057A6E] px-2 py-0.5 text-xs font-medium'
                          : 'inline-flex items-center rounded-full bg-[#FDECEC] text-[#B42318] px-2 py-0.5 text-xs font-medium'
                      }>
                        {u.isActive ? 'ACTIVE' : 'INACTIVE'}
                      </span>
                    </td>

                    {/* Actions */}
                    <td className="px-3 py-2">
                      <div className="flex justify-end gap-2">
                        <button
                          onClick={() => toggleStatus(u.id)}
                          disabled={u.role === 'ADMIN'}
                          className="px-3 py-1 rounded-md border border-[#D4D2CC] bg-white hover:bg-[#F4F3EE] disabled:opacity-40"
                        >
                          Toggle
                        </button>
                        <button
                          onClick={() => deleteUser(u.id)}
                          disabled={u.role === 'ADMIN'}
                          className="px-3 py-1 rounded-md bg-[#141413] text-[#F4F3EE] hover:opacity-90 disabled:opacity-40"
                        >
                          Delete
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      )}

      {/* Error */}
      {error && (
        <p className="mt-3 text-sm text-red-700 bg-red-50 border border-red-100 rounded-md px-3 py-2">
          {error}
        </p>
      )}

      {/* Success */}
      {successMessage && (
        <p className="mt-3 text-sm text-green-800 bg-green-50 border border-green-100 rounded-md px-3 py-2">
          {successMessage}
        </p>
      )}
    </section>
  )
}
  