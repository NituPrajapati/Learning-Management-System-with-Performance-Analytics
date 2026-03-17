import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import type { AuthUser } from '../types/env'
import api from '../api/axios'
import { queryClient } from '../main' 

export type Role = 'ADMIN' | 'INSTRUCTOR' | 'STUDENT'

interface AuthState {
  user: AuthUser | null
  token: string | null
  isLoading: boolean
  error: string | null
  login: (email: string, password: string) => Promise<void>
  register: (name: string, email: string, password: string) => Promise<void>
  logout: () => void
  clearError: () => void
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set) => ({
      user: null,
      token: null,
      isLoading: false,
      error: null,

      login: async (email: string, password: string) => {
        try {
          set({ isLoading: true, error: null })

          const res = await api.post('/api/auth/login', { email, password })

          set({
            user: res.data.user,
            token: res.data.token,
            isLoading: false,
            error: null,
          })
        } catch (err: unknown) {
          set({
            error: (err as { response?: { data?: { message?: string } } }).response?.data?.message || 'Failed to login',
            isLoading: false,
          })
        }
      },

      register: async (name: string, email: string, password: string) => {
        try {
          set({ isLoading: true, error: null })

          const res = await api.post('/api/auth/register', { name, email, password })

          set({
            user: res.data.user,
            token: res.data.token,
            isLoading: false,
            error: null,
          })
        } catch (err: any) {
          set({
            error: err.response?.data?.message || 'Failed to register',
            isLoading: false,
          })
        }
      },

      logout: () => {
        queryClient.clear()
        set({ user: null, token: null, error: null })
      },

      clearError: () => {
        set({ error: null })
      },
    }),
    {
      name: 'auth-storage',
      partialize: (state) => ({
        user: state.user,
        token: state.token,
      }),
    }
  )
)
