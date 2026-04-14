import { useQuery } from '@tanstack/react-query'
import { Link } from 'react-router-dom'
import api from '../../api/axios'
import { LoadingSpinner } from '../../components/common/LoadingSpinner'
import { formatDateIST } from '../../utils/time'

type ReportPayload = {
  student: { id: number; name: string; email: string }
  streak: { streak: number; lastVisit: string | null }
  courses: Array<{
    courseId: number
    courseTitle: string
    completionRate: number
    avgQuizScore: number
    streak: number
    chatEngagementScore: number
    bonus10: number
    exam: null | { title: string | null; difficulty: string | null; percentage: number; label: string }
    breakdown: { factor50: number; bonus10: number; exam40: number }
    overall: number
    grade: string
    suggestion: string
  }>
}

export default function Report() {
  const { data, isLoading, isError } = useQuery({
    queryKey: ['student-report'],
    queryFn: async () => {
      const res = await api.get<ReportPayload>('/api/student/me/report')
      return res.data
    },
  })

  if (isLoading) return <LoadingSpinner label="Loading report..." />
  if (isError || !data) return <div className="text-center py-20 text-red-600">Failed to load report.</div>

  return (
    <div className="space-y-5">
      <div className="flex items-start justify-between gap-3">
        <div>
          <h1 className="text-xl font-bold text-[#111827]">Performance Report</h1>
          <p className="text-xs text-gray-600 mt-1">
            Score = 50% (completion + quizzes) + 10% bonus (streak + chat) + 40% exam
          </p>
        </div>
        <Link
          to="/student/progress"
          className="rounded-md border border-gray-200 bg-white px-3 py-2 text-xs font-medium text-[#111827] hover:bg-gray-50"
        >
          Back
        </Link>
      </div>

      <div className="rounded-xl border border-gray-200 bg-white p-4">
        <div className="text-sm font-semibold text-[#111827]">{data.student.name}</div>
        <div className="text-xs text-gray-600">{data.student.email}</div>
        <div className="mt-2 text-xs text-gray-600">
          Streak: <span className="font-semibold text-[#111827]">{data.streak.streak} days</span>
          {data.streak.lastVisit ? (
            <span className="ml-2">• Last visit: {formatDateIST(data.streak.lastVisit)}</span>
          ) : null}
        </div>
      </div>

      {data.courses.length === 0 ? (
        <div className="rounded-xl border border-gray-200 bg-white p-8 text-center text-sm text-gray-600">
          Enroll in courses to generate your report.
        </div>
      ) : (
        <div className="space-y-4">
          {data.courses.map((c) => (
            <div key={c.courseId} className="rounded-xl border border-gray-200 bg-white p-4 space-y-3">
              <div className="flex items-center justify-between gap-2">
                <div className="min-w-0">
                  <div className="font-semibold text-[#111827] truncate">{c.courseTitle}</div>
                  <div className="text-xs text-gray-600 mt-0.5">
                    Completion {c.completionRate}% • Quiz avg {c.avgQuizScore}% • Chat {c.chatEngagementScore} • Bonus {c.bonus10}/10
                  </div>
                </div>
                <div className="text-right">
                  <div className="text-2xl font-bold text-[#111827]">{c.overall}%</div>
                  <div className="text-xs text-gray-600">Grade: {c.grade}</div>
                </div>
              </div>

              <div className="grid grid-cols-3 gap-2">
                <div className="rounded-lg bg-[#F2F4F7] p-3">
                  <div className="text-[11px] text-gray-600">Factors (50%)</div>
                  <div className="text-lg font-bold text-[#111827]">{c.breakdown.factor50}</div>
                </div>
                <div className="rounded-lg bg-[#F2F4F7] p-3">
                  <div className="text-[11px] text-gray-600">Bonus (10%)</div>
                  <div className="text-lg font-bold text-[#111827]">{c.breakdown.bonus10}</div>
                </div>
                <div className="rounded-lg bg-[#F2F4F7] p-3">
                  <div className="text-[11px] text-gray-600">Exam (40%)</div>
                  <div className="text-lg font-bold text-[#111827]">{c.breakdown.exam40}</div>
                </div>
              </div>

              <div className="rounded-lg border border-gray-200 bg-white p-3 text-sm">
                <div className="font-semibold text-[#111827]">Exam</div>
                {c.exam ? (
                  <div className="text-xs text-gray-600 mt-1">
                    {c.exam.title || 'Exam'} • {c.exam.difficulty} • {c.exam.percentage}% • {c.exam.label}
                  </div>
                ) : (
                  <div className="text-xs text-gray-600 mt-1">Not attempted yet.</div>
                )}
              </div>

              <div className="rounded-lg border border-amber-200 bg-amber-50 px-3 py-2 text-sm text-amber-900">
                <span className="font-semibold">Suggestion:</span> {c.suggestion}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

