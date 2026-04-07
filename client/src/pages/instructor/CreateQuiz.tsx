import { useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { useCreateQuiz } from '../../hooks/useQuiz'

interface Option {
  optionText: string
  isCorrect:  boolean
}

interface Question {
  questionText: string
  questionType: 'MCQ' | 'TRUE_FALSE'
  marks:        number
  options:      Option[]
}

const CreateQuiz = () => {
  const { courseId, moduleId } = useParams()
  const navigate     = useNavigate()
  const createQuiz   = useCreateQuiz()

  const [form, setForm] = useState({
    title:        '',
    timeLimit:    '',
    passingScore: '60',
    maxAttempts:  '3',
  })

  const [questions, setQuestions] = useState<Question[]>([
    {
      questionText: '',
      questionType: 'MCQ',
      marks:        1,
      options: [
        { optionText: '', isCorrect: false },
        { optionText: '', isCorrect: false },
        { optionText: '', isCorrect: false },
        { optionText: '', isCorrect: false },
      ]
    }
  ])

  const [error, setError] = useState('')

  const addQuestion = () => {
    setQuestions(prev => [...prev, {
      questionText: '',
      questionType: 'MCQ',
      marks:        1,
      options: [
        { optionText: '', isCorrect: false },
        { optionText: '', isCorrect: false },
        { optionText: '', isCorrect: false },
        { optionText: '', isCorrect: false },
      ]
    }])
  }

  const removeQuestion = (index: number) => {
    setQuestions(prev => prev.filter((_, i) => i !== index))
  }

  const updateQuestion = (index: number, field: string, value: any) => {
    setQuestions(prev => prev.map((q, i) =>
      i === index ? { ...q, [field]: value } : q
    ))
  }

  const updateOption = (qIndex: number, oIndex: number, field: string, value: any) => {
    setQuestions(prev => prev.map((q, i) => {
      if (i !== qIndex) return q
      const newOptions = q.options.map((o, j) => {
        if (field === 'isCorrect') {
          // Only one correct answer for MCQ
          return { ...o, isCorrect: j === oIndex ? value : false }
        }
        return j === oIndex ? { ...o, [field]: value } : o
      })
      return { ...q, options: newOptions }
    }))
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')

    // Validate
    for (let i = 0; i < questions.length; i++) {
      const q = questions[i]
      if (!q.questionText.trim()) {
        setError(`Question ${i + 1} text is required`)
        return
      }
      const hasCorrect = q.options.some(o => o.isCorrect)
      if (!hasCorrect) {
        setError(`Question ${i + 1} must have one correct answer`)
        return
      }
      const hasEmpty = q.options.some(o => !o.optionText.trim())
      if (hasEmpty) {
        setError(`All options in question ${i + 1} must be filled`)
        return
      }
    }

    try {
      await createQuiz.mutateAsync({
        moduleId: parseInt(moduleId!),
        data: {
          title:        form.title,
          timeLimit:    form.timeLimit    ? parseInt(form.timeLimit)    : null,
          passingScore: parseInt(form.passingScore),
          maxAttempts:  parseInt(form.maxAttempts),
          questions
        }
      })
      navigate(`/instructor/courses/${courseId}`)
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to create quiz')
    }
  }

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      <div className="flex items-center gap-3">
        <button
          onClick={() => navigate(-1)}
          className="text-sm text-[#6B6A66] hover:text-[#141413]"
        >
          ← Back
        </button>
        <h1 className="text-2xl font-bold text-[#141413]">Create Quiz</h1>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        {error && (
          <div className="bg-red-50 text-red-600 text-sm px-4 py-3 rounded-lg border border-red-100">
            {error}
          </div>
        )}

        {/* Quiz settings */}
        <div className="bg-white rounded-xl border border-[#E0DED8] p-5 space-y-4">
          <h2 className="font-semibold text-[#141413]">Quiz Settings</h2>

          <div>
            <label className="block text-xs font-medium text-[#6B6A66] mb-1">
              Quiz Title *
            </label>
            <input
              value={form.title}
              onChange={e => setForm({ ...form, title: e.target.value })}
              placeholder="e.g. Chapter 1 Assessment"
              required
              className="w-full rounded-lg border border-[#D4D2CC] px-4 py-2 text-sm outline-none focus:ring-2 focus:ring-[#08A696] bg-[#F4F3EE]"
            />
          </div>

          <div className="grid grid-cols-3 gap-4">
            <div>
              <label className="block text-xs font-medium text-[#6B6A66] mb-1">
                Time Limit (min)
              </label>
              <input
                type="number"
                value={form.timeLimit}
                onChange={e => setForm({ ...form, timeLimit: e.target.value })}
                placeholder="No limit"
                min="1"
                className="w-full rounded-lg border border-[#D4D2CC] px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-[#08A696] bg-[#F4F3EE]"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-[#6B6A66] mb-1">
                Passing Score (%)
              </label>
              <input
                type="number"
                value={form.passingScore}
                onChange={e => setForm({ ...form, passingScore: e.target.value })}
                min="1"
                max="100"
                className="w-full rounded-lg border border-[#D4D2CC] px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-[#08A696] bg-[#F4F3EE]"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-[#6B6A66] mb-1">
                Max Attempts
              </label>
              <input
                type="number"
                value={form.maxAttempts}
                onChange={e => setForm({ ...form, maxAttempts: e.target.value })}
                min="1"
                max="10"
                className="w-full rounded-lg border border-[#D4D2CC] px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-[#08A696] bg-[#F4F3EE]"
              />
            </div>
          </div>
        </div>

        {/* Questions */}
        <div className="space-y-4">
          {questions.map((question, qIndex) => (
            <div
              key={qIndex}
              className="bg-white rounded-xl border border-[#E0DED8] p-5 space-y-4"
            >
              <div className="flex items-center justify-between">
                <h3 className="font-semibold text-[#141413]">
                  Question {qIndex + 1}
                </h3>
                {questions.length > 1 && (
                  <button
                    type="button"
                    onClick={() => removeQuestion(qIndex)}
                    className="text-xs text-red-500 hover:underline"
                  >
                    Remove
                  </button>
                )}
              </div>

              {/* Question text */}
              <div>
                <label className="block text-xs font-medium text-[#6B6A66] mb-1">
                  Question Text *
                </label>
                <textarea
                  value={question.questionText}
                  onChange={e => updateQuestion(qIndex, 'questionText', e.target.value)}
                  rows={2}
                  placeholder="Enter your question..."
                  className="w-full rounded-lg border border-[#D4D2CC] px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-[#08A696] bg-[#F4F3EE] resize-none"
                />
              </div>

              {/* Marks */}
              <div className="flex items-center gap-4">
                <div>
                  <label className="block text-xs font-medium text-[#6B6A66] mb-1">
                    Marks
                  </label>
                  <input
                    type="number"
                    value={question.marks}
                    onChange={e => updateQuestion(qIndex, 'marks', parseInt(e.target.value))}
                    min="1"
                    className="w-20 rounded-lg border border-[#D4D2CC] px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-[#08A696] bg-[#F4F3EE]"
                  />
                </div>
              </div>

              {/* Options */}
              <div className="space-y-2">
                <label className="block text-xs font-medium text-[#6B6A66]">
                  Options (select correct answer)
                </label>
                {question.options.map((option, oIndex) => (
                  <div key={oIndex} className="flex items-center gap-3">
                    <input
                      type="radio"
                      name={`correct-${qIndex}`}
                      checked={option.isCorrect}
                      onChange={() => updateOption(qIndex, oIndex, 'isCorrect', true)}
                      className="accent-[#08A696] w-4 h-4 flex-shrink-0"
                    />
                    <input
                      value={option.optionText}
                      onChange={e => updateOption(qIndex, oIndex, 'optionText', e.target.value)}
                      placeholder={`Option ${oIndex + 1}`}
                      className={`flex-1 rounded-lg border px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-[#08A696] ${
                        option.isCorrect
                          ? 'border-[#08A696] bg-[#E6FAF7]'
                          : 'border-[#D4D2CC] bg-[#F4F3EE]'
                      }`}
                    />
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>

        {/* Add question */}
        <button
          type="button"
          onClick={addQuestion}
          className="w-full py-3 border-2 border-dashed border-[#D4D2CC] rounded-xl text-sm text-[#6B6A66] hover:border-[#08A696] hover:text-[#08A696] transition"
        >
          + Add Question
        </button>

        {/* Submit */}
        <div className="flex gap-3">
          <button
            type="button"
            onClick={() => navigate(-1)}
            className="flex-1 py-3 border border-[#D4D2CC] rounded-xl text-sm hover:bg-[#F4F3EE] transition"
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={createQuiz.isPending}
            className="flex-1 py-3 bg-[#08A696] text-white rounded-xl text-sm font-semibold hover:opacity-90 disabled:opacity-60 transition"
          >
            {createQuiz.isPending ? 'Creating...' : `Create Quiz (${questions.length} questions)`}
          </button>
        </div>
      </form>
    </div>
  )
}

export default CreateQuiz