import { useQuery } from '@tanstack/react-query'
import { getCourse } from '../api/courses'
import type { Module } from '../api/courses'
import { useCreateCourseModule } from './useCourses'

/** Reuses the same query cache as `useCourse` for this course id. */
export const useModules = (courseId: number) => {
  return useQuery({
    queryKey: ['course', courseId],
    queryFn: () => getCourse(courseId),
    enabled: Number.isFinite(courseId) && !Number.isNaN(courseId),
    select: (data): Module[] => data.course.modules ?? [],
  })
}

// Backward-compatible alias used by older module form.
export const useCreateModule = () => {
  const mutation = useCreateCourseModule()
  return {
    ...mutation,
    mutateAsync: (data: {
      title: string
      description?: string
      orderIndex?: number
      contentType: 'VIDEO' | 'PDF' | 'TEXT' | 'LINK'
      contentUrl?: string
      contentText?: string
      duration?: number
      courseId: number
    }) => mutation.mutateAsync({ courseId: data.courseId, data }),
  }
}
