import { useEffect, useMemo, useRef, useState } from 'react'
import { useQuiz, useSubmitQuiz, useQuizAttempts } from '../../hooks/useQuiz'

interface Props {
  moduleId: number
  courseId: number
}

const QuizViewer = ({ moduleId, courseId: _courseId }: Props) => {
  const { data: quiz, isLoading, isError, error } = useQuiz(moduleId)
  const submitQuiz = useSubmitQuiz()

  const [answers, setAnswers]       = useState<Record<number, number>>({})
  const [result,  setResult]        = useState<any>(null)
  const [started, setStarted]       = useState(false)
  const [tabSwitchCount, setTabSwitchCount] = useState(0)
  const [secondsLeft, setSecondsLeft] = useState<number | null>(null)
  const autoSubmittingRef = useRef(false)
  const startedAtIsoRef = useRef<string | null>(null)
  const timerIdRef = useRef<number | null>(null)

  const { data: attemptsData } = useQuizAttempts(quiz?.id || 0)
  const attempts = attemptsData || []

  const handleAnswer = (questionId: number, optionId: number) => {
    setAnswers(prev => ({ ...prev, [questionId]: optionId }))
  }

  const handleSubmit = async (force = false) => {
    if (!quiz) return
    if (!force && Object.keys(answers).length !== quiz.questions.length) return
    if (submitQuiz.isPending || autoSubmittingRef.current) return

    const formattedAnswers = Object.entries(answers).map(([questionId, selectedOptionId]) => ({
      questionId:       parseInt(questionId),
      selectedOptionId: selectedOptionId
    }))

    try {
      autoSubmittingRef.current = true
      const res = await submitQuiz.mutateAsync({
        quizId:  quiz.id,
        answers: formattedAnswers,
        startedAt: startedAtIsoRef.current ?? undefined,
        timeTakenSec:
          startedAtIsoRef.current
            ? Math.max(
                0,
                Math.floor((Date.now() - new Date(startedAtIsoRef.current).getTime()) / 1000)
              )
            : undefined,
      })
      setResult(res)
      setStarted(false)
    } catch (err: any) {
      alert(err.response?.data?.message || 'Failed to submit')
    } finally {
      autoSubmittingRef.current = false
    }
  }

  const timeLimitSec = useMemo(() => (quiz?.timeLimit ? quiz.timeLimit * 60 : null), [quiz?.timeLimit])

  // Timer: starts when quiz starts, auto-submits when 0.
  useEffect(() => {
    if (!started || result || !quiz || !timeLimitSec) return

    // init
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
  }, [started, result, quiz, timeLimitSec, answers])

  // Cleanup when leaving quiz screen
  useEffect(() => {
    if (!started || result) return
    return () => {
      if (timerIdRef.current) window.clearInterval(timerIdRef.current)
      timerIdRef.current = null
    }
  }, [started, result])

  useEffect(() => {
    if (!started || result) return

    const onVisibilityChange = () => {
      if (document.visibilityState !== 'hidden') return

      setTabSwitchCount((prev) => {
        const next = prev + 1
        if (next === 1) {
          alert('Please do not switch tab. Next tab switch will auto-submit your quiz.')
        } else if (next >= 2) {
          void handleSubmit(true)
        }
        return next
      })
    }

    document.addEventListener('visibilitychange', onVisibilityChange)
    return () => document.removeEventListener('visibilitychange', onVisibilityChange)
  }, [started, result, quiz, answers])

  if (isLoading) return (
    <div className="text-center py-8 text-gray-600">Loading quiz...</div>
  )

  if (isError) {
    const msg =
      (error as { response?: { data?: { message?: string } } })?.response?.data?.message ||
      'Unable to load this quiz.'
    return (
      <div className="rounded-lg border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-900">
        {msg}
      </div>
    )
  }

  if (!quiz) return (
    <div className="text-center py-8">
      <p className="text-3xl mb-2">📝</p>
      <p className="text-[#6B6A66] text-sm">No quiz for this module.</p>
    </div>
  )

  const answeredCount = Object.keys(answers).length
  const totalQuestions = quiz.questions.length
  const canSubmit = answeredCount === totalQuestions

  // Show result
  if (result) return (
    <div className="space-y-4">
      <div className={`rounded-xl p-6 text-center border ${
        result.isPassed
          ? 'bg-green-50 border-green-200'
          : 'bg-red-50 border-red-200'
      }`}>
        <p className="text-4xl mb-3">{result.isPassed ? '🎉' : '😔'}</p>
        <h3 className={`text-2xl font-bold mb-1 ${
          result.isPassed ? 'text-green-700' : 'text-red-700'
        }`}>
          {result.isPassed ? 'You Passed!' : 'Try Again'}
        </h3>
        <p className={`text-4xl font-bold my-3 ${
          result.isPassed ? 'text-green-600' : 'text-red-600'
        }`}>
          {result.percentage}%
        </p>
        <p className="text-sm text-[#6B6A66]">
          {result.score} / {result.totalMarks} marks •
          Passing score: {result.passingScore}%
        </p>
      </div>

      {/* Detailed results */}
      <div className="space-y-3">
        <h4 className="font-semibold text-[#141413]">Answer Review</h4>
        {result.gradedAnswers?.map((ga: any, index: number) => (
          <div
            key={ga.questionId}
            className={`p-4 rounded-lg border ${
              ga.isCorrect ? 'bg-green-50 border-green-200' : 'bg-red-50 border-red-200'
            }`}
          >
            <p className="text-sm font-medium text-[#141413] mb-2">
              Q{index + 1}. {ga.questionText}
            </p>
            <p className={`text-xs ${ga.isCorrect ? 'text-green-600' : 'text-red-600'}`}>
              {ga.isCorrect ? '✅ Correct' : '❌ Incorrect'} •
              {ga.marks} / {quiz.questions[index]?.marks} marks
            </p>
          </div>
        ))}
      </div>

      <button
        onClick={() => { setResult(null); setAnswers({}); setTabSwitchCount(0); setSecondsLeft(null); startedAtIsoRef.current = null }}
        className="w-full py-2 bg-[#08A696] text-white rounded-lg text-sm hover:opacity-90 transition"
      >
        Back to Quiz
      </button>
    </div>
  )

  // Show past attempts
  if (!started && attempts.length > 0) return (
    <div className="space-y-4">
      <div className="bg-white rounded-xl border border-[#E0DED8] p-5">
        <h3 className="font-semibold text-[#141413] mb-1">{quiz.title}</h3>
        <p className="text-sm text-[#6B6A66]">
          {quiz.questions.length} questions •
          Passing score: {quiz.passingScore}% •
          {quiz.maxAttempts - attempts.length} attempts remaining
        </p>
      </div>

      <div className="space-y-2">
        <h4 className="font-semibold text-[#141413] text-sm">Previous Attempts</h4>
        {attempts.map((attempt: any) => (
          <div
            key={attempt.id}
            className={`flex items-center justify-between p-3 rounded-lg border ${
              attempt.isPassed
                ? 'bg-green-50 border-green-200'
                : 'bg-red-50 border-red-200'
            }`}
          >
            <span className="text-sm text-[#141413]">
              Attempt {attempt.attemptNumber}
            </span>
            <span className={`font-bold text-sm ${
              attempt.isPassed ? 'text-green-600' : 'text-red-600'
            }`}>
              {Math.round(attempt.percentage)}%
              {attempt.isPassed ? ' ✅' : ' ❌'}
            </span>
          </div>
        ))}
      </div>

      {attempts.length < quiz.maxAttempts && (
        <button
          onClick={() => { setStarted(true); setTabSwitchCount(0); setSecondsLeft(null); startedAtIsoRef.current = null }}
          className="w-full py-2 bg-[#08A696] text-white rounded-lg text-sm hover:opacity-90"
        >
          Retake Quiz
        </button>
      )}
    </div>
  )

  // Start screen
  if (!started) return (
    <div className="space-y-4">
      <div className="bg-white rounded-xl border border-[#E0DED8] p-6 text-center">
        <p className="text-4xl mb-3">📝</p>
        <h3 className="font-semibold text-[#141413] text-lg mb-2">{quiz.title}</h3>
        <div className="flex justify-center gap-6 text-sm text-[#6B6A66] mb-4">
          <span>📋 {quiz.questions.length} questions</span>
          {quiz.timeLimit && <span>⏱ {quiz.timeLimit} min</span>}
          <span>🎯 Pass: {quiz.passingScore}%</span>
          <span>🔄 {quiz.maxAttempts} attempts</span>
        </div>
        <button
          onClick={() => { setStarted(true); setTabSwitchCount(0); setSecondsLeft(null); startedAtIsoRef.current = null }}
          className="px-8 py-3 bg-[#08A696] text-white rounded-lg font-semibold hover:opacity-90 transition"
        >
          Start Quiz
        </button>
      </div>
    </div>
  )

  // Quiz questions
  return (
    <div className="space-y-4">
      {/* Progress */}
      <div className="bg-white rounded-lg border border-[#E0DED8] p-4">
        <div className="mb-2 rounded-md border border-amber-200 bg-amber-50 px-3 py-2 text-xs text-amber-800">
          Anti-cheat: do not switch tabs. First switch shows a warning; second switch auto-submits this quiz.
        </div>
        {quiz.timeLimit && (
          <div className="mb-3 flex items-center justify-between rounded-md border border-gray-200 bg-[#F2F4F7] px-3 py-2 text-sm">
            <span className="text-gray-600">Time left</span>
            <span className={`font-bold tabular-nums ${secondsLeft !== null && secondsLeft <= 10 ? 'text-red-600' : 'text-[#111827]'}`}>
              {(() => {
                const s = secondsLeft ?? quiz.timeLimit * 60
                const mm = String(Math.floor(s / 60)).padStart(2, '0')
                const ss = String(s % 60).padStart(2, '0')
                return `${mm}:${ss}`
              })()}
            </span>
          </div>
        )}
        <div className="flex justify-between text-sm text-[#6B6A66] mb-2">
          <span>{answeredCount}/{totalQuestions} answered</span>
          <span className={canSubmit ? 'text-green-600 font-medium' : ''}>
            {tabSwitchCount > 0
              ? `Tab switches: ${tabSwitchCount}/2`
              : canSubmit
                ? '✅ Ready to submit'
                : 'Answer all questions'}
          </span>
        </div>
        <div className="w-full bg-[#E0DED8] rounded-full h-2">
          <div
            className="bg-[#08A696] h-2 rounded-full transition-all"
            style={{ width: `${(answeredCount / totalQuestions) * 100}%` }}
          />
        </div>
      </div>

      {/* Questions */}
      {quiz.questions.map((question: any, index: number) => (
        <div
          key={question.id}
          className="bg-white rounded-xl border border-[#E0DED8] p-5"
        >
          <p className="font-medium text-[#141413] mb-3">
            Q{index + 1}. {question.questionText}
            <span className="text-xs text-[#6B6A66] ml-2">
              ({question.marks} mark{question.marks !== 1 ? 's' : ''})
            </span>
          </p>

          <div className="space-y-2">
            {question.options.map((option: any) => (
              <button
                key={option.id}
                onClick={() => handleAnswer(question.id, option.id)}
                className={`w-full text-left px-4 py-3 rounded-lg border text-sm transition ${
                  answers[question.id] === option.id
                    ? 'bg-[#08A696] text-white border-[#08A696]'
                    : 'bg-[#F4F3EE] text-[#141413] border-[#D4D2CC] hover:border-[#08A696]'
                }`}
              >
                {option.optionText}
              </button>
            ))}
          </div>
        </div>
      ))}

      {/* Submit */}
      <button
        onClick={() => void handleSubmit(false)}
        disabled={!canSubmit || submitQuiz.isPending}
        className="w-full py-3 bg-[#08A696] text-white rounded-lg font-semibold hover:opacity-90 disabled:opacity-50 transition"
      >
        {submitQuiz.isPending ? 'Submitting...' : 'Submit Quiz'}
      </button>
    </div>
  )
}

export default QuizViewer