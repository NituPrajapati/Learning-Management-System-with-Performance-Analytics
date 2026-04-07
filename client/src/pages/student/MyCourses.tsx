import { useNavigate } from 'react-router-dom'
import { useEnrollments } from '../../hooks/useCourses'

const levelColors: Record<string, string> = {
  BEGINNER: 'bg-[#E6FAF7] text-[#057A6E]',
  INTERMEDIATE: 'bg-[#FFF8E6] text-[#92400E]',
  ADVANCED: 'bg-[#FDECEC] text-[#B42318]',
}

const MyCourses = () => {
  const navigate = useNavigate()
  const { data, isLoading, isError } = useEnrollments()

  const enrollments = data?.enrollments || []

  if (isLoading)
    return (
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
        {[1, 2, 3].map((i) => (
          <div key={i} className="bg-white rounded-lg border border-gray-200 h-44 animate-pulse" />
        ))}
      </div>
    )

  if (isError)
    return <div className="text-center py-20 text-red-500">Failed to load courses.</div>

  return (
    <div className="space-y-4 m-[3px]" onContextMenu={(e) => e.preventDefault()}>
      <div>
        <h1 className="text-xl font-bold text-[#111827]">My Courses</h1>
        <p className="text-xs text-gray-600 mt-1">
          {enrollments.length} enrolled course{enrollments.length !== 1 ? 's' : ''}
        </p>
      </div>

      {enrollments.length === 0 ? (
        <div className="text-center py-16 bg-white rounded-lg border border-gray-200">
          <p className="text-gray-600 mb-4">No courses enrolled yet.</p>
          <button
            type="button"
            onClick={() => navigate('/')}
            className="px-4 py-2 bg-[#08A696] text-white rounded-lg text-sm"
          >
            Explore Courses
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-[3px]">
          {enrollments.map((enrollment: (typeof enrollments)[number]) => {
            const course = enrollment.course
            const isExpired =
              enrollment.expiresAt && new Date(enrollment.expiresAt) < new Date()

            return (
              <div
                key={enrollment.id}
                className="bg-white rounded-lg border border-gray-200 overflow-hidden hover:shadow-sm transition"
              >
                <div className="h-28 bg-[#F2F4F7] flex items-center justify-center overflow-hidden">
                  {course.thumbnail ? (
                    <img
                      src={course.thumbnail}
                      alt={course.title}
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <span className="text-2xl text-gray-400">Course</span>
                  )}
                </div>

                <div className="p-3 space-y-2">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span
                      className={`text-[10px] font-semibold px-2 py-0.5 rounded-full ${levelColors[course.level]}`}
                    >
                      {course.level}
                    </span>
                    {isExpired && (
                      <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-red-100 text-red-600">
                        EXPIRED
                      </span>
                    )}
                    <span
                      className={`text-[10px] font-semibold px-2 py-0.5 rounded-full ${
                        enrollment.status === 'COMPLETED'
                          ? 'bg-green-100 text-green-600'
                          : 'bg-blue-100 text-blue-600'
                      }`}
                    >
                      {enrollment.status}
                    </span>
                  </div>

                  <h3 className="font-semibold text-[#111827] text-sm line-clamp-2">{course.title}</h3>

                  <div>
                    <div className="flex justify-between text-[10px] text-gray-600 mb-1">
                      <span>Progress</span>
                      <span>{Math.round(enrollment.completionRate || 0)}%</span>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-1.5">
                      <div
                        className="bg-[#08A696] h-1.5 rounded-full transition-all"
                        style={{ width: `${enrollment.completionRate || 0}%` }}
                      />
                    </div>
                  </div>

                  <p className="text-[10px] text-gray-600">{course.instructor?.name}</p>

                  <button
                    type="button"
                    onClick={() => navigate(`/student/courses/${course.id}`)}
                    disabled={!!isExpired}
                    className={`w-full py-2 rounded-lg text-xs font-semibold transition ${
                      isExpired
                        ? 'bg-gray-200 text-gray-500 cursor-not-allowed'
                        : 'bg-[#08A696] text-white hover:opacity-90'
                    }`}
                  >
                    {isExpired
                      ? 'Access Expired'
                      : enrollment.completionRate === 100
                        ? 'Review Course'
                        : 'Continue Learning'}
                  </button>
                </div>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}

export default MyCourses
