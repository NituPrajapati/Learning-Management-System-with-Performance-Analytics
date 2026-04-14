import { useEffect, useMemo, useRef, useState } from 'react'
import { useCourseExams, useExamDetail, useSubmitExam } from '../../hooks/useExams'

interface Props {
  courseId: number
  examId: number
}

export default function ExamViewer({ courseId, examId }: Props) {
  const { data: listData } = useCourseExams(courseId)
  const exams = listData?.exams ?? []
  const selectedMeta = useMemo(() => exams.find((e) => e.id === examId) ?? null, [exams, examId])

  const locked = selectedMeta?.locked ?? false
  const attempted = selectedMeta?.attempted ?? false

  const { data: exam, isLoading, isError, error } = useExamDetail(examId, !locked && !attempted)
  const submit = useSubmitExam()

  const [answers, setAnswers] = useState<Record<number, number>>({})
  const [started, setStarted] = useState(false)
  const [secondsLeft, setSecondsLeft] = useState<number | null>(null)
  const startedAtIsoRef = useRef<string | null>(null)
  const timerIdRef = useRef<number | null>(null)

  const timeLimitSec = useMemo(() => (exam?.timeLimit ? exam.timeLimit * 60 : null), [exam?.timeLimit])

  useEffect(() => {
    if (!started || !exam || !timeLimitSec) return
    if (!startedAtIsoRef.current) startedAtIsoRef.current = new Date().toISOString()
    setSecondsLeft(timeLimitSec)

    if (timerIdRef.current) window.clearInterval(timerIdRef.current)
    timerIdRef.current = window.setInterval(() => {
      const startMs = new Date(startedAtIsoRef.current as string).getTime()
      const elapsed = Math.max(0, Math.floor((Date.now() - startMs) / 1000))
      const left = Math.max(0, timeLimitSec - elapsed)
      setSecondsLeft(left)
      if (left <= 0) {
        if (timerIdRef.current) window.clearInterval(timerIdRef.current)
        timerIdRef.current = null
        void handleSubmit(true)
      }
    }, 500)

    return () => {
      if (timerIdRef.current) window.clearInterval(timerIdRef.current)
      timerIdRef.current = null
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [started, examId, exam?.id, timeLimitSec])

  useEffect(() => {
    return () => {
      if (timerIdRef.current) window.clearInterval(timerIdRef.current)
      timerIdRef.current = null
    }
  }, [])

  const totalQuestions = exam?.questions?.length ?? 0
  const answeredCount = Object.keys(answers).length
  const canSubmit = totalQuestions > 0 && answeredCount === totalQuestions

  const handleSubmit = async (force = false) => {
    if (!exam) return
    if (!force && !canSubmit) return
    if (submit.isPending) return

    const formattedAnswers = Object.entries(answers).map(([questionId, selectedOptionId]) => ({
      questionId: Number(questionId),
      selectedOptionId: Number(selectedOptionId),
    }))

    try {
      const res = await submit.mutateAsync({
        examId: exam.id,
        answers: formattedAnswers,
        startedAt: startedAtIsoRef.current ?? undefined,
        timeTakenSec:
          startedAtIsoRef.current
            ? Math.max(0, Math.floor((Date.now() - new Date(startedAtIsoRef.current).getTime()) / 1000))
            : undefined,
      })
      alert(`Exam submitted. Score: ${res.percentage}%`)
      setStarted(false)
    } catch (e: any) {
      alert(e.response?.data?.message || 'Failed to submit exam')
    }
  }

  if (locked) {
    return (
      <div className="rounded-lg border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-900">
        This exam is locked. Complete the previous difficulty first.
      </div>
    )
  }

  if (attempted) {
    return (
      <div className="rounded-lg border border-green-200 bg-green-50 px-4 py-3 text-sm text-green-900">
        You have already attempted this exam (one attempt only).
      </div>
    )
  }

  if (isLoading) return <div className="text-sm text-gray-600">Loading exam...</div>

  if (isError) {
    const msg =
      (error as { response?: { data?: { message?: string } } })?.response?.data?.message ||
      'Unable to load this exam.'
    return (
      <div className="rounded-lg border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-900">
        {msg}
      </div>
    )
  }

  if (!exam) return null

  if (!started) {
    return (
      <div className="rounded-xl border border-gray-200 bg-white p-4 space-y-2">
        <div className="flex items-center justify-between gap-2">
          <div className="min-w-0">
            <div className="font-semibold text-[#111827] truncate">{exam.title}</div>
            <div className="text-xs text-gray-600 mt-0.5">
              {exam.questions.length} questions
              {exam.timeLimit ? ` • ${exam.timeLimit} min` : ''} • One attempt
            </div>
          </div>
          <span className="text-[11px] px-2 py-0.5 rounded-full bg-gray-100 text-gray-700">{exam.difficulty}</span>
        </div>
        <button
          type="button"
          onClick={() => { setStarted(true); setAnswers({}); startedAtIsoRef.current = null; setSecondsLeft(null) }}
          className="w-full rounded-lg bg-[#08A696] text-white py-2 text-sm font-semibold hover:opacity-90"
        >
          Start Exam
        </button>
      </div>
    )
  }

  return (
    <div className="space-y-3">
      {exam.timeLimit && (
        <div className="rounded-md border border-gray-200 bg-[#F2F4F7] px-3 py-2 text-sm flex items-center justify-between">
          <span className="text-gray-600">Time left</span>
          <span className={`font-bold tabular-nums ${secondsLeft !== null && secondsLeft <= 10 ? 'text-red-600' : 'text-[#111827]'}`}>
            {(() => {
              const s = secondsLeft ?? exam.timeLimit * 60
              const mm = String(Math.floor(s / 60)).padStart(2, '0')
              const ss = String(s % 60).padStart(2, '0')
              return `${mm}:${ss}`
            })()}
          </span>
        </div>
      )}

      {exam.questions.map((q, idx) => (
        <div key={q.id} className="rounded-xl border border-gray-200 bg-white p-4">
          <div className="text-sm font-medium text-[#111827] mb-2">
            Q{idx + 1}. {q.questionText}
            <span className="text-xs text-gray-500 ml-2">({q.marks} marks)</span>
          </div>
          <div className="space-y-2">
            {q.options.map((o) => (
              <button
                key={o.id}
                type="button"
                onClick={() => setAnswers((p) => ({ ...p, [q.id]: o.id }))}
                className={`w-full text-left px-3 py-2 rounded-lg border text-sm ${
                  answers[q.id] === o.id
                    ? 'bg-[#08A696] text-white border-[#08A696]'
                    : 'bg-white border-gray-200 hover:bg-[#F2F4F7]'
                }`}
              >
                {o.optionText}
              </button>
            ))}
          </div>
        </div>
      ))}

      <button
        type="button"
        onClick={() => void handleSubmit(false)}
        disabled={!canSubmit || submit.isPending}
        className="w-full rounded-lg bg-[#111827] text-white py-2 text-sm font-semibold hover:opacity-90 disabled:opacity-60"
      >
        {submit.isPending ? 'Submitting...' : 'Submit Exam'}
      </button>
    </div>
  )
}

