import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import api from '../api/axios'
import { useAuthStore } from '../stores/authStore'

export type ExamDifficulty = 'EASY' | 'INTERMEDIATE' | 'ADVANCED'

export interface CourseExamListItem {
  id: number
  courseId: number
  title: string
  difficulty: ExamDifficulty
  timeLimit: number | null
  createdAt: string
  locked: boolean
  attempted: boolean
  attempt: null | {
    examId: number
    percentage: number
    totalMarks: number
    score: number
    submittedAt: string
  }
}

export interface CourseExamQuestion {
  id: number
  questionText: string
  questionType: 'MCQ' | 'TRUE_FALSE'
  marks: number
  options: { id: number; optionText: string }[]
}

export interface CourseExamDetail {
  id: number
  courseId: number
  title: string
  difficulty: ExamDifficulty
  timeLimit: number | null
  questions: CourseExamQuestion[]
}

export function useCourseExams(courseId: number) {
  const { user } = useAuthStore()
  return useQuery({
    queryKey: ['course-exams', courseId, user?.id],
    queryFn: async () => {
      const res = await api.get(`/api/exams/course/${courseId}`)
      return res.data as { exams: CourseExamListItem[] }
    },
    enabled: Boolean(courseId && user && user.role === 'STUDENT'),
  })
}

export function useExamDetail(examId: number, enabled = true) {
  const { user } = useAuthStore()
  return useQuery({
    queryKey: ['exam', examId, user?.id],
    queryFn: async () => {
      const res = await api.get(`/api/exams/${examId}`)
      return res.data.exam as CourseExamDetail
    },
    enabled: Boolean(examId && enabled && user && user.role === 'STUDENT'),
  })
}

export function useSubmitExam() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async ({
      examId,
      answers,
      startedAt,
      timeTakenSec,
    }: {
      examId: number
      answers: { questionId: number; selectedOptionId: number }[]
      startedAt?: string
      timeTakenSec?: number
    }) => {
      const res = await api.post(`/api/exams/${examId}/submit`, { answers, startedAt, timeTakenSec })
      return res.data
    },
    onSuccess: (_data, vars) => {
      qc.invalidateQueries({ queryKey: ['exam', vars.examId] })
      // list queries refreshed by courseId from page after submit
      qc.invalidateQueries({ queryKey: ['course-exams'] })
    },
  })
}

export function useCreateCourseExam() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async ({
      courseId,
      data,
    }: {
      courseId: number
      data: any
    }) => {
      const res = await api.post(`/api/exams/course/${courseId}`, data)
      return res.data
    },
    onSuccess: (_data, vars) => {
      qc.invalidateQueries({ queryKey: ['course', vars.courseId] })
    },
  })
}

