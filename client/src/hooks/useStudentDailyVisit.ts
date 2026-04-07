import { useQuery } from '@tanstack/react-query'
import api from '../api/axios'
import { useAuthStore } from '../stores/authStore'

export type DailyVisitPayload = { streak: number; lastVisit: string | null }

/** Runs on student routes; POST is idempotent for streak (UTC calendar days). */
export function useStudentDailyVisit() {
  const user = useAuthStore((s) => s.user)
  const token = useAuthStore((s) => s.token)
  return useQuery({
    queryKey: ['studentDailyVisit', user?.id],
    queryFn: async () => {
      const { data } = await api.post<DailyVisitPayload>('/api/student/me/daily-visit')
      return data
    },
    enabled: Boolean(user && user.role === 'STUDENT' && token),
  })
}
