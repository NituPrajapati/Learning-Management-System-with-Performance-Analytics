import type { FormEvent } from 'react'
import { useEffect, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useAuthStore } from '../../stores/authStore'

export function Register() {
  const navigate = useNavigate()
  const { register, user, isLoading, error } = useAuthStore()

  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')

  useEffect(() => {
    if (!user) return
    // Register always creates STUDENT
    navigate('/student/dashboard', { replace: true })
  }, [navigate, user])

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault()
    if (password !== confirmPassword) return
    await register(name, email, password)
  }

  const passwordsMismatch = password && confirmPassword && password !== confirmPassword

  return (
    <div className="min-h-screen flex items-center justify-center bg-[#F4F3EE] text-[#141413] p-6">
      <div className="w-full max-w-md bg-white shadow-sm rounded-lg border border-[#E0DED8] p-8">
        <h1 className="text-2xl font-semibold mb-1 text-center">Create account</h1>
        <p className="text-sm text-[#6B6A66] text-center mb-6">
          Sign up as a student to start learning
        </p>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium mb-1">Full Name</label>
            <input
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full border border-[#D4D2CC] bg-[#F4F3EE] rounded px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-[#08A696]"
              required
            />
          </div>

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
              minLength={6}
            />
          </div>

          <div>
            <label className="block text-sm font-medium mb-1">Confirm Password</label>
            <input
              type="password"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              className="w-full border border-[#D4D2CC] bg-[#F4F3EE] rounded px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-[#08A696]"
              required
              minLength={6}
            />
            {passwordsMismatch ? (
              <p className="text-sm text-red-700 mt-1">Passwords do not match</p>
            ) : null}
          </div>

          {error ? (
            <p className="text-sm text-red-700 bg-red-50 border border-red-100 rounded-md px-3 py-2">
              {error}
            </p>
          ) : null}

          <button
            type="submit"
            disabled={isLoading || passwordsMismatch}
            className="w-full bg-[#08A696] text-[#141413] py-2 rounded font-semibold hover:opacity-90 transition disabled:opacity-60"
          >
            {isLoading ? 'Creating...' : 'Register'}
          </button>

          <p className="text-sm text-center text-[#6B6A66] mt-4">
            Already have an account?{' '}
            <Link to="/login" className="text-[#08A696] font-semibold hover:underline">
              Login
            </Link>
          </p>
        </form>
      </div>
    </div>
  )
}





