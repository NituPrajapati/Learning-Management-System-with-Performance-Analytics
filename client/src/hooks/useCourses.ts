import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { useAuthStore } from '../stores/authStore'

import {
  getCourses,
  getCourse,
  enrollInCourse,
  getMyEnrollments,
  getSavedCourses,
  saveCourse,
  unsaveCourse,
  getInstructorCourses,
  createCourse,
  updateCourse,
  toggleCoursePublish,
  getAllCourses,
  type Course,
  type Enrollment,
  type SavedCourse,
} from '../api/courses'

// Public: Get all published courses
export const useCourses = () => {
  return useQuery({
    queryKey: ['courses'],
    queryFn: getCourses,
  })
}

// Get single course
export const useCourse = (id: number | null) => {
  return useQuery({
    queryKey: ['course', id],
    queryFn: () => getCourse(id!),
    enabled: !!id,
  })
}

// Student: Enroll in course
export const useEnrollCourse = () => {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: enrollInCourse,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['courses'] })
      queryClient.invalidateQueries({ queryKey: ['enrollments'] })
      queryClient.invalidateQueries({ queryKey: ['course'] })
    },
  })
}

// Student: Get enrollments
export const useEnrollments = () => {
  const { user } = useAuthStore()
  return useQuery({
    queryKey: ['enrollments', user?.id], 
    queryFn: getMyEnrollments,
    enabled: !!user && user.role === 'STUDENT'
  })
}

// Student: Get saved courses
export const useSavedCourses = () => {
  const { user } = useAuthStore()
  return useQuery({
    queryKey: ['savedCourses', user?.id], 
    queryFn: getSavedCourses,
    enabled: !!user && user.role === 'STUDENT'
  })
}

// Student: Save course
export const useSaveCourse = () => {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: saveCourse,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['savedCourses'] })
      queryClient.invalidateQueries({ queryKey: ['courses'] })
    },
  })
}

// Student: Unsave course
export const useUnsaveCourse = () => {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: unsaveCourse,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['savedCourses'] })
      queryClient.invalidateQueries({ queryKey: ['courses'] })
    },
  })
}

// Instructor: Get my courses
export const useInstructorCourses = () => {
  const { user } = useAuthStore() 

  return useQuery({
    queryKey: ['instructorCourses', user?.id], 
    queryFn: getInstructorCourses,
    enabled: !!user && user.role === 'INSTRUCTOR' 
  })
}

// Instructor: Create course
export const useCreateCourse = () => {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: createCourse,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['instructorCourses'] })
    },
  })
}

// Instructor: Update course
export const useUpdateCourse = () => {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: ({ courseId, data }: { courseId: number; data: Parameters<typeof updateCourse>[1] }) =>
      updateCourse(courseId, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['instructorCourses'] })
      queryClient.invalidateQueries({ queryKey: ['courses'] })
      queryClient.invalidateQueries({ queryKey: ['course'] })
    },
  })
}

// Instructor: Toggle publish
export const useToggleCoursePublish = () => {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: ({ courseId, isPublished }: { courseId: number; isPublished: boolean }) =>
      toggleCoursePublish(courseId, isPublished),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['instructorCourses'] })
      queryClient.invalidateQueries({ queryKey: ['courses'] })
      queryClient.invalidateQueries({ queryKey: ['course'] })
    },
  })
}

// Admin: Get all courses
export const useAllCourses = () => {
  return useQuery({
    queryKey: ['allCourses'],
    queryFn: getAllCourses,
  })
}

