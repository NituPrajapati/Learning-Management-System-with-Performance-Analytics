import { Link } from 'react-router-dom'
import { LoadingSpinner } from '../../components/common/LoadingSpinner'
import { useInstructorCourses } from '../../hooks/useCourses'

const statusStyles: Record<string, string> = {
  PUBLISHED: 'bg-green-100 text-green-700',
  DRAFT: 'bg-gray-100 text-gray-700',
}

const Courses = () => {
  const { data, isLoading, isError } = useInstructorCourses()
  const courses = data?.courses ?? []

  if (isLoading) return <LoadingSpinner label="Loading your courses..." />

  if (isError) {
    return (
      <div className="rounded-lg border border-red-200 bg-red-50 p-4 text-red-700">
        Failed to load courses. Please refresh and try again.
      </div>
    )
  }

  return (
    <div className="space-y-10">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold text-[#111827]">My Courses</h1>
          <p className="text-xs text-gray-600 mt-1">
            {courses.length} course{courses.length !== 1 ? 's' : ''}
          </p>
        </div>
        <Link
          to="/instructor/courses/create"
          className="rounded-md bg-[#08A696] px-4 py-2 text-sm font-medium text-white hover:bg-[#078878] transition"
        >
          Create Course
        </Link>
      </div>

      {courses.length === 0 ? (
        <div className="rounded-lg border border-gray-200 bg-white p-8 text-center">
          <p className="text-gray-600 mb-4">You have not created any courses yet.</p>
          <Link
            to="/instructor/courses/create"
            className="rounded-md bg-[#08A696] px-4 py-2 text-sm font-medium text-white hover:bg-[#078878] transition"
          >
            Create Your First Course
          </Link>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {courses.map((course) => {
            const badge = course.isPublished ? 'PUBLISHED' : 'DRAFT'
            return (
              <Link
                key={course.id}
                to={`/instructor/courses/${course.id}`}
                className="rounded-lg border border-gray-200 bg-white p-3 hover:shadow-sm transition"
              >
                <div className="flex items-start justify-between gap-2">
                  <h2 className="text-lg font-semibold text-[#111827] line-clamp-2 leading-snug">{course.title}</h2>
                  <span className={`rounded-full px-1.5 py-0.5 text-[10px] font-medium shrink-0 ${statusStyles[badge]}`}>
                    {badge}
                  </span>
                </div>

                <p className="text-xs text-gray-600 mt-1.5 line-clamp-2 leading-snug">{course.description}</p>

                <div className="mt-2 text-[10px] text-gray-600">
                  {course._count?.modules ?? 0} modules � {course._count?.enrollments ?? 0} students
                </div>
              </Link>
            )
          })}
        </div>
      )}
    </div>
  )
}

export default Courses
