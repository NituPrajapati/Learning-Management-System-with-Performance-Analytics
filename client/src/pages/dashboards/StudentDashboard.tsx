import { useState } from 'react'
import { Navbar } from '../../components/common/Navbar'
import { useEnrollments, useSavedCourses } from '../../hooks/useCourses'
import { LoadingSpinner } from '../../components/common/LoadingSpinner'
import { Link } from 'react-router-dom'
import type { Enrollment, SavedCourse } from '../../api/courses'

function EnrollmentCard({ enrollment }: { enrollment: Enrollment }) {
  const isExpired = enrollment.isExpired || enrollment.status === 'EXPIRED'

  return (
    <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4">
      <div className="flex items-start justify-between mb-3 gap-2">
        <div className="flex-1 min-w-0">
          <h3 className="text-base font-semibold text-[#111827] mb-1 line-clamp-2">{enrollment.course.title}</h3>
          <p className="text-xs text-gray-600">Instructor: {enrollment.course.instructor.name}</p>
        </div>
        {isExpired ? (
          <span className="px-2 py-1 rounded-full bg-red-100 text-red-700 text-[10px] font-medium shrink-0">
            EXPIRED
          </span>
        ) : (
          <span className="px-2 py-1 rounded-full bg-green-100 text-green-700 text-[10px] font-medium shrink-0">
            ACTIVE
          </span>
        )}
      </div>

      <div className="mb-3">
        <div className="flex items-center justify-between text-[10px] text-gray-600 mb-1">
          <span>Progress</span>
          <span>{enrollment.completionRate.toFixed(0)}%</span>
        </div>
        <div className="w-full bg-gray-200 rounded-full h-2">
          <div
            className="bg-[#08A696] h-2 rounded-full transition-all"
            style={{ width: `${enrollment.completionRate}%` }}
          />
        </div>
      </div>

      {enrollment.expiresAt && (
        <p className="text-[10px] text-gray-600 mb-3">
          Expires: {new Date(enrollment.expiresAt).toLocaleDateString()}
        </p>
      )}

      {!isExpired && (
        <Link
          to={`/student/courses/${enrollment.course.id}`}
          className="inline-block px-4 py-2 rounded-md bg-[#08A696] text-white font-medium hover:bg-[#078878] transition text-sm"
        >
          Access Course
        </Link>
      )}
    </div>
  )
}

function SavedCourseCard({ savedCourse }: { savedCourse: SavedCourse }) {
  return (
    <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4">
      <h3 className="text-base font-semibold text-[#111827] mb-1 line-clamp-2">{savedCourse.course.title}</h3>
      <p className="text-xs text-gray-600 mb-3">Instructor: {savedCourse.course.instructor.name}</p>
      <Link
        to={`/student/courses/${savedCourse.course.id}`}
        className="inline-block px-4 py-2 rounded-md bg-[#08A696] text-white font-medium hover:bg-[#078878] transition text-sm"
      >
        Open Course
      </Link>
    </div>
  )
}

export function StudentDashboard() {
  const [activeTab, setActiveTab] = useState<'enrolled' | 'saved'>('enrolled')
  const { data: enrollmentsData, isLoading: enrollmentsLoading } = useEnrollments()
  const { data: savedData, isLoading: savedLoading } = useSavedCourses()

  return (
    <div className="min-h-full text-[#111827]">
      <Navbar title="Student Dashboard" />
      <main className="p-3 sm:p-6 bg-[#F2F4F7]">
        <div className="max-w-6xl mx-auto px-[3px]">
          <div className="flex gap-2 mb-6 border-b border-gray-200">
            <button
              type="button"
              onClick={() => setActiveTab('enrolled')}
              className={`px-4 py-2 font-medium transition text-sm ${
                activeTab === 'enrolled'
                  ? 'text-[#08A696] border-b-2 border-[#08A696]'
                  : 'text-gray-600 hover:text-[#111827]'
              }`}
            >
              Enrolled Courses ({enrollmentsData?.enrollments?.length || 0})
            </button>
            <button
              type="button"
              onClick={() => setActiveTab('saved')}
              className={`px-4 py-2 font-medium transition text-sm ${
                activeTab === 'saved'
                  ? 'text-[#08A696] border-b-2 border-[#08A696]'
                  : 'text-gray-600 hover:text-[#111827]'
              }`}
            >
              Saved Courses ({savedData?.savedCourses?.length || 0})
            </button>
          </div>

          {activeTab === 'enrolled' ? (
            <>
              {enrollmentsLoading ? (
                <LoadingSpinner label="Loading enrollments..." />
              ) : enrollmentsData?.enrollments && enrollmentsData.enrollments.length > 0 ? (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-[3px]">
                  {enrollmentsData.enrollments.map((enrollment: Enrollment) => (
                    <EnrollmentCard key={enrollment.id} enrollment={enrollment} />
                  ))}
                </div>
              ) : (
                <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-8 text-center">
                  <p className="text-gray-600 mb-4">You haven&apos;t enrolled in any courses yet.</p>
                  <Link
                    to="/"
                    className="inline-block px-4 py-2 rounded-md bg-[#08A696] text-white font-medium hover:bg-[#078878] transition"
                  >
                    Browse Courses
                  </Link>
                </div>
              )}
            </>
          ) : (
            <>
              {savedLoading ? (
                <LoadingSpinner label="Loading saved courses..." />
              ) : savedData?.savedCourses && savedData.savedCourses.length > 0 ? (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-[3px]">
                  {savedData.savedCourses.map((savedCourse) => (
                    <SavedCourseCard key={savedCourse.id} savedCourse={savedCourse} />
                  ))}
                </div>
              ) : (
                <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-8 text-center">
                  <p className="text-gray-600 mb-4">You haven&apos;t saved any courses yet.</p>
                  <Link
                    to="/"
                    className="inline-block px-4 py-2 rounded-md bg-[#08A696] text-white font-medium hover:bg-[#078878] transition"
                  >
                    Browse Courses
                  </Link>
                </div>
              )}
            </>
          )}
        </div>
      </main>
    </div>
  )
}
