import { Link } from 'react-router-dom'
import { useAuthStore } from '../stores/authStore'
import { useCourses, useEnrollCourse, useSaveCourse, useUnsaveCourse, useSavedCourses } from '../hooks/useCourses'
import { LoadingSpinner } from '../components/common/LoadingSpinner'
import type { Course } from '../api/courses'

function CourseCard({ course }: { course: Course }) {
  const { user } = useAuthStore()
  const enrollMutation = useEnrollCourse()
  const saveMutation = useSaveCourse()
  const unsaveMutation = useUnsaveCourse()
  const { data: savedData } = useSavedCourses()

  const isSaved = savedData?.savedCourses?.some((sc) => sc.courseId === course.id) || false

  const handleEnroll = () => {
    if (!user) {
      window.location.href = '/login?redirect=/'
      return
    }
    enrollMutation.mutate(course.id)
  }

  const handleSave = () => {
    if (!user) {
      window.location.href = '/login?redirect=/'
      return
    }
    if (isSaved) {
      unsaveMutation.mutate(course.id)
    } else {
      saveMutation.mutate(course.id)
    }
  }

  return (
    <div className="bg-white rounded-lg shadow-sm border border-[#E0DED8] overflow-hidden hover:shadow-md transition">
      {course.thumbnail && (
        <img
          src={course.thumbnail}
          alt={course.title}
          className="w-full h-48 object-cover"
          onError={(e) => {
            ;(e.target as HTMLImageElement).style.display = 'none'
          }}
        />
      )}
      <div className="p-5">
        <div className="flex items-start justify-between mb-2">
          <h3 className="text-lg font-semibold text-[#141413] line-clamp-2">{course.title}</h3>
          <button
            onClick={handleSave}
            className={`ml-2 p-2 rounded-full transition ${
              isSaved
                ? 'text-[#08A696] bg-[#E6FAF7]'
                : 'text-[#6B6A66] hover:bg-[#F4F3EE]'
            }`}
            title={isSaved ? 'Unsave course' : 'Save course'}
          >
            <svg
              className="w-5 h-5"
              fill={isSaved ? 'currentColor' : 'none'}
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M5 5a2 2 0 012-2h10a2 2 0 012 2v16l-7-3.5L5 21V5z"
              />
            </svg>
          </button>
        </div>

        <p className="text-sm text-[#6B6A66] mb-3 line-clamp-2">{course.description}</p>

        <div className="flex items-center gap-2 mb-3 flex-wrap">
          <span className="text-xs text-[#6B6A66]">Instructor: {course.instructor.name}</span>
          {course.durationWeeks && (
            <span className="text-xs text-[#6B6A66]">• {course.durationWeeks} weeks</span>
          )}
          {course.price && (
            <span className="text-xs font-semibold text-[#08A696]">• ${course.price.toFixed(2)}</span>
          )}
        </div>

        <div className="flex items-center gap-2 mb-4">
          <span
            className={`px-2 py-1 rounded-full text-xs font-medium ${
              course.courseType === 'FREE'
                ? 'bg-green-100 text-green-700'
                : 'bg-blue-100 text-blue-700'
            }`}
          >
            {course.courseType} {course.price ? `- $${course.price.toFixed(2)}` : ''}
          </span>
          <span
            className={`px-2 py-1 rounded-full text-xs font-medium ${
              course.level === 'BEGINNER'
                ? 'bg-purple-100 text-purple-700'
                : course.level === 'INTERMEDIATE'
                  ? 'bg-orange-100 text-orange-700'
                  : 'bg-red-100 text-red-700'
            }`}
          >
            {course.level}
          </span>
        </div>

        <button
          onClick={handleEnroll}
          disabled={enrollMutation.isPending}
          className="w-full px-4 py-2 rounded-md bg-[#08A696] text-white font-medium hover:bg-[#078878] transition disabled:opacity-60 disabled:cursor-not-allowed"
        >
          {enrollMutation.isPending ? 'Enrolling...' : 'Enroll Now'}
        </button>
      </div>
    </div>
  )
}

export function Home() {
  const { user } = useAuthStore()
  const { data, isLoading, error } = useCourses()

  return (
    <div className="min-h-screen bg-[#F4F3EE]">
      {/* Navbar */}
      <header className="bg-[#141413] text-[#F4F3EE] shadow-sm">
        <div className="max-w-7xl mx-auto px-6 py-4 flex items-center justify-between">
          <Link to="/" className="text-xl font-semibold">
            LMS Platform
          </Link>
          <div className="flex items-center gap-4">
            {user ? (
              <>
                <Link
                  to={
                    user.role === 'ADMIN'
                      ? '/admin/dashboard'
                      : user.role === 'INSTRUCTOR'
                        ? '/instructor/dashboard'
                        : '/student/dashboard'
                  }
                  className="flex items-center gap-2 px-3 py-2 rounded-md hover:bg-[#08A696] transition"
                >
                  <div className="w-8 h-8 rounded-full bg-[#08A696] flex items-center justify-center text-sm font-medium">
                    {user.name.charAt(0).toUpperCase()}
                  </div>
                  <span className="text-sm">{user.name}</span>
                </Link>
              </>
            ) : (
              <>
                <Link
                  to="/login"
                  className="px-4 py-2 rounded-md hover:bg-[#08A696] transition text-sm"
                >
                  Login
                </Link>
                <Link
                  to="/register"
                  className="px-4 py-2 rounded-md bg-[#08A696] text-[#141413] font-medium hover:opacity-90 transition text-sm"
                >
                  Register
                </Link>
              </>
            )}
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-6 py-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-[#141413] mb-2">Available Courses</h1>
          <p className="text-[#6B6A66]">Browse and enroll in courses to start learning</p>
        </div>

        {isLoading ? (
          <LoadingSpinner label="Loading courses..." />
        ) : error ? (
          <div className="bg-red-50 border border-red-200 rounded-lg p-4 text-red-700">
            Failed to load courses. Please try again later.
          </div>
        ) : data?.courses && data.courses.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {data.courses.map((course) => (
              <CourseCard key={course.id} course={course} />
            ))}
          </div>
        ) : (
          <div className="text-center py-12 text-[#6B6A66]">
            <p className="text-lg">No courses available at the moment.</p>
          </div>
        )}
      </main>
    </div>
  )
}

