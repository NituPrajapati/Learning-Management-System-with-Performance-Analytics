import { create } from 'zustand'
import type { AuthUser } from '../types/env'

export type Role = 'ADMIN' | 'INSTRUCTOR' | 'STUDENT'


interface AuthState {
  user: AuthUser | null
  token: string | null
  isLoading: boolean
  error: string | null
  login: (email: string, password: string) => Promise<void>
  register: (name: string, email: string, password: string) => Promise<void>
  logout: () => void
}

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:5000'

export const useAuthStore = create<AuthState>((set) => ({
  user: null,
  token: null,
  isLoading: false,
  error: null,

  login: async (email: string, password: string) => {
    try {
      set({ isLoading: true, error: null })
      const res = await fetch(`${API_BASE_URL}/api/auth/login`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email, password }),
      })

      if (!res.ok) {
        const data = await res.json().catch(() => ({}))
        throw new Error(data.message || 'Failed to login')
      }

      const data = await res.json()

      set({
        user: data.user,
        token: data.token,
        isLoading: false,
        error: null,
      })
    } catch (err: any) {
      set({ error: err.message || 'Failed to login', isLoading: false })
    }
  },

  register: async (name: string, email: string, password: string) => {
    try {
      set({ isLoading: true, error: null })
      const res = await fetch(`${API_BASE_URL}/api/auth/register`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ name, email, password }),
      })

      if (!res.ok) {
        const data = await res.json().catch(() => ({}))
        throw new Error(data.message || 'Failed to register')
      }

      const data = await res.json()

      set({
        user: data.user,
        token: data.token,
        isLoading: false,
        error: null,
      })
    } catch (err: any) {
      set({ error: err.message || 'Failed to register', isLoading: false })
    }
  },

  logout: () => {
    set({ user: null, token: null, error: null })
  },
}))


