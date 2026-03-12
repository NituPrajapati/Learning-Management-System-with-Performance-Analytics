import type { FormEvent } from 'react'
import { useEffect, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useAuthStore } from '../../stores/authStore'

export function Login() {
  const navigate = useNavigate()
  const { login, user, isLoading, error } = useAuthStore()

  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')

  useEffect(() => {
    if (!user) return
    if (user.role === 'ADMIN') navigate('/admin/dashboard', { replace: true })
    else if (user.role === 'INSTRUCTOR') navigate('/instructor/dashboard', { replace: true })
    else navigate('/student/dashboard', { replace: true })
  }, [navigate, user])

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault()
    await login(email, password)
    // redirect handled in useEffect when store updates
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-[#F4F3EE] text-[#141413] p-6">
      <div className="w-full max-w-md bg-white shadow-sm rounded-lg border border-[#E0DED8] p-8">
        <h1 className="text-2xl font-semibold mb-1 text-center">Welcome back</h1>
        <p className="text-sm text-[#6B6A66] text-center mb-6">Login to continue</p>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium mb-1">Email</label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full border border-[#D4D2CC] bg-[#F4F3EE] rounded px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-[#08A696]"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium mb-1">Password</label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full border border-[#D4D2CC] bg-[#F4F3EE] rounded px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-[#08A696]"
              required
            />
          </div>

          {error ? (
            <p className="text-sm text-red-700 bg-red-50 border border-red-100 rounded-md px-3 py-2">
              {error}
            </p>
          ) : null}

          <button
            type="submit"
            disabled={isLoading}
            className="w-full bg-[#08A696] text-[#141413] py-2 rounded font-semibold hover:opacity-90 transition disabled:opacity-60"
          >
            {isLoading ? 'Logging in...' : 'Login'}
          </button>

          <p className="text-sm text-center text-[#6B6A66] mt-4">
            Don&apos;t have an account?{' '}
            <Link to="/register" className="text-[#08A696] font-semibold hover:underline">
              Register
            </Link>
          </p>
        </form>
      </div>
    </div>
  )
}


