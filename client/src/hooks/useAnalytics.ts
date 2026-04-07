import { useQuery } from '@tanstack/react-query'
import api from '../api/axios'
import { useAuthStore } from '../stores/authStore'

export const useInstructorAnalytics = () => {
  const { user } = useAuthStore()
  return useQuery({
    queryKey: ['instructor-analytics', user?.id],
    queryFn: async () => {
      const res = await api.get('/api/analytics/instructor')
      return res.data
    },
    enabled: !!user && user.role === 'INSTRUCTOR'
  })
}

export const useStudentAnalytics = () => {
  const { user } = useAuthStore()
  return useQuery({
    queryKey: ['student-analytics', user?.id],
    queryFn: async () => {
      const res = await api.get('/api/analytics/student')
      return res.data
    },
    enabled: !!user && user.role === 'STUDENT'
  })
}

export const useAdminAnalytics = () => {
  const { user } = useAuthStore()
  return useQuery({
    queryKey: ['admin-analytics', user?.id],
    queryFn: async () => {
      const res = await api.get('/api/analytics/admin')
      return res.data
    },
    enabled: !!user && user.role === 'ADMIN'
  })
}