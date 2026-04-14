import {
    LineChart, Line, XAxis, YAxis,
    CartesianGrid, Tooltip, ResponsiveContainer
  } from 'recharts'
  import { Link } from 'react-router-dom'
  import { FaFire } from 'react-icons/fa6'
  import { useStudentAnalytics } from '../../hooks/useAnalytics'
  import { useStudentDailyVisit } from '../../hooks/useStudentDailyVisit'
  
  const Progress = () => {
    const { data, isLoading, isError } = useStudentAnalytics()
    const { data: visit, isLoading: streakLoading } = useStudentDailyVisit()
  
    if (isLoading) return (
      <div className="space-y-4 m-[3px]">
        {[1,2].map(i => (
          <div key={i} className="bg-white rounded-xl border border-gray-200 h-40 animate-pulse" />
        ))}
      </div>
    )
  
    if (isError) return (
      <div className="text-center py-20 text-red-500">Failed to load progress.</div>
    )
  
    const { overview, courseProgress } = data
  
    return (
      <div className="space-y-6 m-[3px]">
        <div className="flex items-center justify-between gap-3">
          <h1 className="text-xl font-bold text-[#111827]">My Progress</h1>
          <Link
            to="/student/report"
            className="rounded-md bg-[#08A698] px-3 py-2 text-xs font-medium text-white hover:opacity-90"
          >
            See report
          </Link>
        </div>

        <div className="rounded-xl border border-orange-200 bg-gradient-to-br from-orange-50 to-amber-50 p-4 flex items-center gap-4">
          <div className="w-12 h-12 rounded-full bg-white border border-orange-200 flex items-center justify-center text-orange-500 shadow-sm">
            <FaFire className="w-7 h-7" />
          </div>
          <div>
            <p className="text-xs font-medium text-gray-600 uppercase tracking-wide">Daily streak</p>
            {streakLoading || !visit ? (
              <p className="text-lg text-gray-500 mt-1">…</p>
            ) : (
              <>
                <p className="text-2xl font-bold text-[#111827] mt-0.5">{visit.streak} days</p>
                <p className="text-xs text-gray-600 mt-1">
                  Visit on consecutive days (UTC) to grow your streak. Miss a day and it resets.
                </p>
              </>
            )}
          </div>
        </div>
  
        {/* Overview */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-[3px]">
          {[
            { label: 'Enrolled',    value: overview.totalEnrolled },
            { label: 'Completed',   value: overview.completedCourses },
            { label: 'Avg Progress',value: `${overview.avgCompletion}%` },
            { label: 'Avg Score',   value: `${overview.avgScore}%` },
          ].map(card => (
            <div key={card.label} className="rounded-xl p-4 bg-[#08A698] text-white border border-[#08A698]">
              <p className="text-xs font-medium text-white/75">{card.label}</p>
              <p className="text-2xl font-bold mt-1">{card.value}</p>
            </div>
          ))}
        </div>
  
        {/* Per course progress */}
        {courseProgress.map((course: any) => (
          <div key={course.courseId} className="bg-white rounded-xl border border-gray-200 p-4 space-y-4">
            <div className="flex items-center justify-between gap-2">
              <div className="min-w-0">
                <h3 className="font-semibold text-[#111827] text-sm truncate">{course.courseTitle}</h3>
                <Link
                  to={`/student/courses/${course.courseId}`}
                  className="inline-flex mt-1 text-xs font-medium text-[#08A696] hover:underline"
                >
                  See progress →
                </Link>
              </div>
              <div className="flex gap-3">
                <span className={`text-xs px-2 py-1 rounded-full font-medium ${
                  course.pace === 'Fast'    ? 'bg-green-100  text-green-700'  :
                  course.pace === 'Average' ? 'bg-yellow-100 text-yellow-700' :
                                             'bg-red-100    text-red-700'
                }`}>
                  {course.pace} Learner
                </span>
                <span className={`text-xs px-2 py-1 rounded-full font-medium ${
                  course.status === 'COMPLETED'
                    ? 'bg-green-100 text-green-700'
                    : 'bg-blue-100  text-blue-700'
                }`}>
                  {course.status}
                </span>
              </div>
            </div>
  
            {/* Progress bar */}
            <div>
              <div className="flex justify-between text-xs text-gray-600 mb-1">
                <span>{course.completedModules}/{course.totalModules} modules</span>
                <span className="font-medium text-[#111827]">{course.completionRate}%</span>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-3">
                <div
                  className="bg-[#08A696] h-3 rounded-full transition-all"
                  style={{ width: `${course.completionRate}%` }}
                />
              </div>
            </div>
  
            {/* Stats row */}
            <div className="flex gap-6 text-xs text-gray-600">
              <span>Avg Score: <strong className="text-[#111827]">{course.avgScore}%</strong></span>
              {course.improvement !== 0 && (
                <span className={course.improvement > 0 ? 'text-green-600' : 'text-red-600'}>
                  {course.improvement > 0 ? '📈' : '📉'} Score {course.improvement > 0 ? '+' : ''}{course.improvement}% improvement
                </span>
              )}
            </div>
  
            {/* Quiz score trend */}
            {course.quizAttempts.length > 1 && (
              <div>
                <p className="text-xs font-medium text-gray-600 mb-2">Quiz Score Trend</p>
                <ResponsiveContainer width="100%" height={120}>
                  <LineChart data={course.quizAttempts.map((a: any, i: number) => ({
                    attempt: `Quiz ${i + 1}`,
                    score:   a.score
                  }))}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                    <XAxis dataKey="attempt" tick={{ fontSize: 10 }} />
                    <YAxis domain={[0, 100]} tick={{ fontSize: 10 }} />
                    <Tooltip formatter={(val) => `${val}%`} />
                    <Line
                      type="monotone"
                      dataKey="score"
                      stroke="#08A696"
                      strokeWidth={2}
                      dot={{ fill: '#08A696', r: 4 }}
                    />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            )}
          </div>
        ))}
  
        {courseProgress.length === 0 && (
          <div className="text-center py-20 bg-white rounded-xl border border-gray-200">
            <p className="text-gray-600">Enroll in courses to see your progress here.</p>
          </div>
        )}
      </div>
    )
  }
  
  export default Progress