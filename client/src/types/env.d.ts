/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_API_BASE_URL?: string
}

interface ImportMeta {
  readonly env: ImportMetaEnv
}

export interface AuthUser {
  id: number
  name: string
  email: string
  role: Role
}
// ─────────────────────────────────────────
// USER TYPES
// ─────────────────────────────────────────
export interface User {
  id: number
  name: string
  email: string
  role: 'ADMIN' | 'INSTRUCTOR' | 'STUDENT'
  profileImage?: string
  isActive?: boolean
  createdAt?: string
}

// ─────────────────────────────────────────
// NAV TYPES
// ─────────────────────────────────────────
export interface NavItem {
  label: string
  path: string
  icon: string
}

// ─────────────────────────────────────────
// COURSE TYPES
// ─────────────────────────────────────────
export interface Course {
  id: number
  title: string
  description: string
  thumbnail?: string
  duration?: number
  level: 'BEGINNER' | 'INTERMEDIATE' | 'ADVANCED'
  isPublished: boolean
  instructorId: number
  instructor?: { id: number; name: string; email: string }
  createdAt: string
  _count?: {
    modules: number
    enrollments: number
  }
}

// ─────────────────────────────────────────
// MODULE TYPES
// ─────────────────────────────────────────
export interface Module {
  id: number
  title: string
  description?: string
  orderIndex: number
  contentType: 'VIDEO' | 'PDF' | 'TEXT' | 'LINK'
  contentUrl?: string
  contentText?: string
  duration?: number
  isPublished: boolean
  courseId: number
  quiz?: Quiz
}

// ─────────────────────────────────────────
// QUIZ TYPES
// ─────────────────────────────────────────
export interface Quiz {
  id: number
  title: string
  moduleId: number
  timeLimit?: number
  passingScore: number
  maxAttempts: number
  questions?: Question[]
}

export interface Question {
  id: number
  quizId: number
  questionText: string
  questionType: 'MCQ' | 'TRUE_FALSE'
  orderIndex: number
  marks: number
  options: Option[]
}

export interface Option {
  id: number
  questionId: number
  optionText: string
  isCorrect: boolean
}

export interface QuizAttempt {
  id: number
  studentId: number
  quizId: number
  score: number
  totalMarks: number
  percentage: number
  isPassed: boolean
  attemptNumber: number
  startedAt: string
  submittedAt?: string
  answers: { questionId: number; selectedOptionId: number }[]
}

// ─────────────────────────────────────────
// ENROLLMENT TYPES
// ─────────────────────────────────────────
export interface Enrollment {
  id: number
  studentId: number
  courseId: number
  enrolledAt: string
  completedAt?: string
  status: 'ACTIVE' | 'COMPLETED' | 'DROPPED'
  completionRate: number
  course?: Course
  student?: User
}

// ─────────────────────────────────────────
// PROGRESS TYPES
// ─────────────────────────────────────────
export interface ModuleProgress {
  id: number
  studentId: number
  moduleId: number
  courseId: number
  isCompleted: boolean
  startedAt: string
  completedAt?: string
  timeSpent: number
}

// ─────────────────────────────────────────
// ANALYTICS TYPES
// ─────────────────────────────────────────
export interface StudentAnalytics {
  studentId: number
  studentName: string
  completionRate: number
  avgScore: number
  timeSpent: number
  isAtRisk: boolean
  modulesCompleted: number
  totalModules: number
}

export interface CourseAnalytics {
  courseId: number
  courseTitle: string
  totalEnrolled: number
  completionRate: number
  avgScore: number
  dropoutRate: number
}

// ─────────────────────────────────────────
// API RESPONSE TYPES
// ─────────────────────────────────────────
export interface ApiResponse<T> {
  data: T
  message?: string
}

export interface AuthResponse {
  user: User
  token: string
}

// ─────────────────────────────────────────
// STAT CARD TYPES
// ─────────────────────────────────────────
export interface StatCardProps {
  title: string
  value: string | number
  icon: string
  color: string
}