import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from 'recharts'
import { useInstructorAnalytics } from '../../hooks/useAnalytics'

const riskColors: Record<string, string> = {
    SAFE:    'bg-green-100 text-green-700',
    WARNING: 'bg-yellow-100 text-yellow-700',
    AT_RISK: 'bg-red-100 text-red-700',
  }
  
  const InstructorAnalytics = () => {
    const { data, isLoading, isError } = useInstructorAnalytics()
  
    if (isLoading) return (
      <div className="space-y-4">
        {[1,2,3].map(i => (
          <div key={i} className="bg-white rounded-xl border border-[#E0DED8] h-40 animate-pulse" />
        ))}
      </div>
    )
  
    if (isError) return (
      <div className="text-center py-20 text-red-500">
        Failed to load analytics.
      </div>
    )
  
    const { overview, courseAnalytics } = data
  
    const completionData = courseAnalytics.map((c: any) => ({
      name:           c.courseTitle.length > 15
        ? c.courseTitle.substring(0, 15) + '...'
        : c.courseTitle,
      completion:     c.completionRate,
      avgScore:       c.avgScore,
      students:       c.totalStudents,
    }))
  
    return (
      <div className="space-y-6">
        <h1 className="text-2xl font-bold text-[#141413]">Analytics Dashboard</h1>
  
        {/* Overview cards */}
        <div className="grid grid-cols-2 lg:grid-cols-5 gap-4">
          {[
            { label: 'Total Courses',    value: overview.totalCourses,       color: 'bg-blue-50  text-blue-700'  },
            { label: 'Total Students',   value: overview.totalStudents,      color: 'bg-green-50 text-green-700' },
            { label: 'Avg Completion',   value: `${overview.avgCompletionRate}%`, color: 'bg-purple-50 text-purple-700' },
            { label: 'Avg Score',        value: `${overview.avgScore}%`,     color: 'bg-yellow-50 text-yellow-700' },
            { label: 'At Risk Students', value: overview.totalAtRisk,        color: 'bg-red-50   text-red-700'   },
          ].map(card => (
            <div key={card.label} className={`rounded-xl p-4 ${card.color}`}>
              <p className="text-xs font-medium opacity-70">{card.label}</p>
              <p className="text-2xl font-bold mt-1">{card.value}</p>
            </div>
          ))}
        </div>
  
        {/* Charts */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Completion rate per course */}
          <div className="bg-white rounded-xl border border-[#E0DED8] p-5">
            <h3 className="font-semibold text-[#141413] mb-4">
              Completion Rate per Course
            </h3>
            <ResponsiveContainer width="100%" height={200}>
              <BarChart data={completionData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#E0DED8" />
                <XAxis dataKey="name" tick={{ fontSize: 11 }} />
                <YAxis domain={[0, 100]} tick={{ fontSize: 11 }} />
                <Tooltip formatter={(val) => `${val}%`} />
                <Bar dataKey="completion" fill="#08A696" radius={[4,4,0,0]} name="Completion %" />
              </BarChart>
            </ResponsiveContainer>
          </div>
  
          {/* Avg score per course */}
          <div className="bg-white rounded-xl border border-[#E0DED8] p-5">
            <h3 className="font-semibold text-[#141413] mb-4">
              Average Quiz Score per Course
            </h3>
            <ResponsiveContainer width="100%" height={200}>
              <BarChart data={completionData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#E0DED8" />
                <XAxis dataKey="name" tick={{ fontSize: 11 }} />
                <YAxis domain={[0, 100]} tick={{ fontSize: 11 }} />
                <Tooltip formatter={(val) => `${val}%`} />
                <Bar dataKey="avgScore" fill="#6B6A66" radius={[4,4,0,0]} name="Avg Score %" />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
  
        {/* Per course at-risk students */}
        {courseAnalytics.map((course: any) => (
          <div key={course.courseId} className="bg-white rounded-xl border border-[#E0DED8] p-5">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-semibold text-[#141413]">{course.courseTitle}</h3>
              <div className="flex gap-4 text-sm text-[#6B6A66]">
                <span>👥 {course.totalStudents} students</span>
                <span>✅ {course.completionRate}% completion</span>
                <span>📊 {course.avgScore}% avg score</span>
              </div>
            </div>
  
            {course.atRiskStudents.length === 0 ? (
              <p className="text-sm text-green-600 bg-green-50 px-4 py-2 rounded-lg">
                ✅ All students are on track!
              </p>
            ) : (
              <div>
                <p className="text-sm font-medium text-[#141413] mb-3">
                  ⚠️ {course.atRiskStudents.length} student(s) need attention
                </p>
                <div className="overflow-auto">
                  <table className="w-full text-sm">
                    <thead className="bg-[#F4F3EE]">
                      <tr>
                        <th className="text-left px-3 py-2 text-xs font-semibold text-[#6B6A66]">Student</th>
                        <th className="text-left px-3 py-2 text-xs font-semibold text-[#6B6A66]">Completion</th>
                        <th className="text-left px-3 py-2 text-xs font-semibold text-[#6B6A66]">Avg Score</th>
                        <th className="text-left px-3 py-2 text-xs font-semibold text-[#6B6A66]">Days Inactive</th>
                        <th className="text-left px-3 py-2 text-xs font-semibold text-[#6B6A66]">Risk Level</th>
                      </tr>
                    </thead>
                    <tbody>
                      {course.atRiskStudents.map((student: any) => (
                        <tr key={student.id} className="border-t border-[#E0DED8]">
                          <td className="px-3 py-2">
                            <p className="font-medium text-[#141413]">{student.name}</p>
                            <p className="text-xs text-[#6B6A66]">{student.email}</p>
                          </td>
                          <td className="px-3 py-2">
                            <div className="flex items-center gap-2">
                              <div className="w-16 bg-[#E0DED8] rounded-full h-1.5">
                                <div
                                  className="bg-[#08A696] h-1.5 rounded-full"
                                  style={{ width: `${student.completionRate}%` }}
                                />
                              </div>
                              <span className="text-xs">{student.completionRate}%</span>
                            </div>
                          </td>
                          <td className="px-3 py-2 text-[#141413]">{student.avgScore}%</td>
                          <td className="px-3 py-2 text-[#141413]">{student.daysInactive} days</td>
                          <td className="px-3 py-2">
                            <span className={`text-xs font-semibold px-2 py-1 rounded-full ${riskColors[student.risk.level]}`}>
                              {student.risk.level.replace('_', ' ')}
                            </span>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}
          </div>
        ))}
      </div>
    )
  }
  
  export default InstructorAnalytics