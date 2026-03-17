import api from './axios'

export interface Course {
  id: number
  title: string
  slug?: string | null
  description: string
  thumbnail: string | null
  durationWeeks: number | null
  courseType: 'FREE' | 'PAID'
  level: 'BEGINNER' | 'INTERMEDIATE' | 'ADVANCED'
  price: number | null
  isPublished: boolean
  instructorId: number
  instructor: {
    id: number
    name: string
    email: string
  }
  _count?: {
    modules: number
    enrollments: number
  }
  createdAt: string
  updatedAt: string
}

export interface Enrollment {
  id: number
  studentId: number
  courseId: number
  enrolledAt: string
  expiresAt: string | null
  status: 'ACTIVE' | 'COMPLETED' | 'DROPPED' | 'EXPIRED'
  completionRate: number
  course: Course
  isExpired?: boolean
}

export interface SavedCourse {
  id: number
  studentId: number
  courseId: number
  createdAt: string
  course: Course
}

// Public: Get all published courses
export const getCourses = async (): Promise<{ courses: Course[] }> => {
  const res = await api.get('/api/courses')
  return res.data
}

// Get single course detail
export const getCourse = async (id: number): Promise<{ course: Course; isEnrolled: boolean; enrollment?: Enrollment }> => {
  const res = await api.get(`/api/courses/${id}`)
  return res.data
}

// Student: Enroll in course
export const enrollInCourse = async (courseId: number): Promise<{ message: string; enrollment: Enrollment }> => {
  const res = await api.post(`/api/courses/${courseId}/enroll`)
  return res.data
}

// Student: Get my enrollments
export const getMyEnrollments = async (): Promise<{ enrollments: Enrollment[] }> => {
  const res = await api.get('/api/student/me/enrollments')
  return res.data
}

// Student: Get saved courses
export const getSavedCourses = async (): Promise<{ savedCourses: SavedCourse[] }> => {
  const res = await api.get('/api/student/me/saved-courses')
  return res.data
}

// Student: Save course
export const saveCourse = async (courseId: number): Promise<{ message: string; savedCourse: SavedCourse }> => {
  const res = await api.post(`/api/student/me/saved-courses/${courseId}`)
  return res.data
}

// Student: Unsave course
export const unsaveCourse = async (courseId: number): Promise<{ message: string }> => {
  const res = await api.delete(`/api/student/me/saved-courses/${courseId}`)
  return res.data
}

// Instructor: Get my courses
export const getInstructorCourses = async (): Promise<{ courses: Course[] }> => {
  const res = await api.get('/api/instructor/courses')
  return res.data
}

// Instructor: Create course
export const createCourse = async (data: {
  title: string
  description: string
  thumbnail?: string
  durationWeeks?: number
  courseType?: 'FREE' | 'PAID'
  level?: 'BEGINNER' | 'INTERMEDIATE' | 'ADVANCED'
  price?: number
}): Promise<{ message: string; course: Course }> => {
  const res = await api.post('/api/instructor/courses', data)
  return res.data
}

// Instructor: Update course
export const updateCourse = async (
  courseId: number,
  data: Partial<{
    title: string
    description: string
    thumbnail: string
    durationWeeks: number
    courseType: 'FREE' | 'PAID'
    level: 'BEGINNER' | 'INTERMEDIATE' | 'ADVANCED'
    price: number
  }>
): Promise<{ message: string; course: Course }> => {
  const res = await api.put(`/api/instructor/courses/${courseId}`, data)
  return res.data
}

// Instructor: Publish/unpublish course
export const toggleCoursePublish = async (
  courseId: number,
  isPublished: boolean
): Promise<{ message: string; course: Course }> => {
  const res = await api.patch(`/api/instructor/courses/${courseId}/publish`, { isPublished })
  return res.data
}

// Admin: Get all courses
export const getAllCourses = async (): Promise<{ courses: Course[] }> => {
  const res = await api.get('/api/users/courses')
  return res.data
}

