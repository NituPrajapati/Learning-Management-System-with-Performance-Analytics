import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import api from '../api/axios'

// Instructor — get quiz with answers
export const useQuizFull = (moduleId: number) => {
  return useQuery({
    queryKey: ['quiz-full', moduleId],
    queryFn: async () => {
      const res = await api.get(`/api/quiz/module/${moduleId}/full`)
      return res.data.quiz
    },
    enabled: !!moduleId
  })
}

// Student — get quiz without answers
export const useQuiz = (moduleId: number, enabled = true) => {
  return useQuery({
    queryKey: ['quiz', moduleId],
    queryFn: async () => {
      const res = await api.get(`/api/quiz/module/${moduleId}`)
      return res.data.quiz
    },
    enabled: !!moduleId && enabled
  })
}

// Student — get attempts
export const useQuizAttempts = (quizId: number) => {
  return useQuery({
    queryKey: ['quiz-attempts', quizId],
    queryFn: async () => {
      const res = await api.get(`/api/quiz/${quizId}/attempts`)
      return res.data.attempts
    },
    enabled: !!quizId
  })
}

// Instructor — create quiz
export const useCreateQuiz = () => {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async ({ moduleId, data }: { moduleId: number; data: any }) => {
      const res = await api.post(`/api/quiz/module/${moduleId}`, data)
      return res.data
    },
    onSuccess: (_, { moduleId }) => {
      queryClient.invalidateQueries({ queryKey: ['quiz-full', moduleId] })
      queryClient.invalidateQueries({ queryKey: ['quiz', moduleId] })
    }
  })
}

// Student — submit quiz
export const useSubmitQuiz = () => {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async ({ quizId, answers, startedAt, timeTakenSec }: { quizId: number; answers: any[]; startedAt?: string; timeTakenSec?: number }) => {
      const res = await api.post(`/api/quiz/${quizId}/submit`, { answers, startedAt, timeTakenSec })
      return res.data
    },
    onSuccess: (_, { quizId }) => {
      queryClient.invalidateQueries({ queryKey: ['quiz-attempts', quizId] })
    }
  })
}

// Instructor — delete quiz
export const useDeleteQuiz = () => {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async (quizId: number) => {
      await api.delete(`/api/quiz/${quizId}`)
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['quiz-full'] })
    }
  })
}