import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import api from '../api/axios'
import { useAuthStore } from '../stores/authStore'

export const useNotifications = () => {
  const { user } = useAuthStore()
  return useQuery({
    queryKey: ['notifications', user?.id],
    queryFn: async () => {
      const res = await api.get('/api/notifications')
      return res.data
    },
    enabled: !!user,
    // Socket.IO pushes `notification:new` for instant updates; this is a fallback.
    refetchInterval: 120_000,
    retry: 1,
  })
}

export const useMarkAsRead = () => {
  const queryClient = useQueryClient()
  const { user } = useAuthStore()
  return useMutation({
    mutationFn: async (id: number) => {
      await api.patch(`/api/notifications/${id}/read`)
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['notifications', user?.id] })
    }
  })
}

export const useMarkAllRead = () => {
  const queryClient = useQueryClient()
  const { user } = useAuthStore()
  return useMutation({
    mutationFn: async () => {
      await api.patch('/api/notifications/read-all')
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['notifications', user?.id] })
    }
  })
}