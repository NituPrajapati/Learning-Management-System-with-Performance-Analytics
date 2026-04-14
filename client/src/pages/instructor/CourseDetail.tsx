import { useEffect, useMemo, useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import { LoadingSpinner } from '../../components/common/LoadingSpinner'
import {
  useCourse,
  useCreateCourseModule,
  useDeleteInstructorModule,
  useUpdateCourse,
  useUploadInstructorPdf,
  useUploadInstructorVideo,
} from '../../hooks/useCourses'
import type { ContentType } from '../../api/courses'
import { useCreateCourseExam } from '../../hooks/useExams'

interface ExamOption {
  optionText: string
  isCorrect: boolean
}

interface ExamQuestion {
  questionText: string
  marks: number
  options: ExamOption[]
}

const CourseDetail = () => {
  const { id } = useParams()
  const courseId = Number(id)

  const { data, isLoading, isError } = useCourse(Number.isFinite(courseId) ? courseId : null)
  const uploadVideo = useUploadInstructorVideo()
  const uploadPdf = useUploadInstructorPdf()
  const createModule = useCreateCourseModule()
  const deleteModule = useDeleteInstructorModule()
  const updateCourse = useUpdateCourse()
  const createExam = useCreateCourseExam()

  const [form, setForm] = useState({
    title: '',
    description: '',
    contentType: 'VIDEO' as ContentType,
    duration: '',
    contentText: '',
  })
  const [videoFile, setVideoFile] = useState<File | null>(null)
  const [pdfFile, setPdfFile] = useState<File | null>(null)
  const [fileError, setFileError] = useState('')
  const [examOpen, setExamOpen] = useState(false)
  const [examError, setExamError] = useState('')
  const [editOpen, setEditOpen] = useState(false)
  const [editError, setEditError] = useState('')
  const [editForm, setEditForm] = useState({
    title: '',
    description: '',
    durationWeeks: '',
    courseType: 'FREE' as 'FREE' | 'PAID',
    level: 'BEGINNER' as 'BEGINNER' | 'INTERMEDIATE' | 'ADVANCED',
    price: '',
  })
  const [examForm, setExamForm] = useState({
    title: '',
    timeLimit: '',
    difficulty: 'EASY' as 'EASY' | 'INTERMEDIATE' | 'ADVANCED',
  })
  const [examQuestions, setExamQuestions] = useState<ExamQuestion[]>([
    {
      questionText: '',
      marks: 1,
      options: [
        { optionText: '', isCorrect: true },
        { optionText: '', isCorrect: false },
        { optionText: '', isCorrect: false },
        { optionText: '', isCorrect: false },
      ],
    },
  ])

  const modules = data?.course?.modules ?? []
  const sortedModules = useMemo(() => [...modules].sort((a, b) => a.orderIndex - b.orderIndex), [modules])

  useEffect(() => {
    if (!data?.course) return
    setEditForm({
      title: data.course.title ?? '',
      description: data.course.description ?? '',
      durationWeeks: data.course.durationWeeks ? String(data.course.durationWeeks) : '',
      courseType: data.course.courseType ?? 'FREE',
      level: data.course.level ?? 'BEGINNER',
      price: data.course.price ? String(data.course.price) : '',
    })
  }, [data?.course])

  const uploadAndGetUrl = async () => {
    if (form.contentType === 'VIDEO') {
      if (!videoFile) throw new Error('Select a video file')
      if (videoFile.size > 100 * 1024 * 1024) throw new Error('Please upload max 100MB video for Cloudinary.')
      const res = await uploadVideo.mutateAsync(videoFile)
      return res.url
    }
    if (form.contentType === 'PDF') {
      if (!pdfFile) throw new Error('Select a PDF file')
      if (pdfFile.size > 50 * 1024 * 1024) throw new Error('Please upload PDF under 50MB.')
      const res = await uploadPdf.mutateAsync(pdfFile)
      return res.url
    }
    return undefined
  }

  const submit = async (e: React.FormEvent) => {
    e.preventDefault()
    try {
      setFileError('')
      const contentUrl = await uploadAndGetUrl()

      await createModule.mutateAsync({
        courseId,
        data: {
          title: form.title,
          description: form.description || undefined,
          contentType: form.contentType,
          contentUrl,
          contentText: form.contentType === 'TEXT' ? form.contentText : undefined,
          duration: form.contentType === 'VIDEO' && form.duration ? Number(form.duration) : undefined,
        },
      })

      setForm({ title: '', description: '', contentType: 'VIDEO', duration: '', contentText: '' })
      setVideoFile(null)
      setPdfFile(null)
    } catch (err: any) {
      setFileError(err?.message || 'Failed to add module')
    }
  }

  const submitExam = async (e: React.FormEvent) => {
    e.preventDefault()
    setExamError('')
    if (!examForm.title.trim()) {
      setExamError('Exam title is required')
      return
    }
    if (examForm.timeLimit) {
      const mins = Number(examForm.timeLimit)
      if (!Number.isFinite(mins) || mins <= 0) {
        setExamError('Duration must be positive (minimum 1 minute)')
        return
      }
      if (mins > 180) {
        setExamError('Maximum exam duration is 180 minutes (3 hours)')
        return
      }
    }
    for (let i = 0; i < examQuestions.length; i += 1) {
      const q = examQuestions[i]
      if (!q.questionText.trim()) {
        setExamError(`Question ${i + 1} text is required`)
        return
      }
      if (q.marks <= 0) {
        setExamError(`Question ${i + 1} marks must be positive`)
        return
      }
      const correct = q.options.filter((o) => o.isCorrect).length
      if (correct !== 1) {
        setExamError(`Question ${i + 1} must have exactly one correct option`)
        return
      }
      if (q.options.some((o) => !o.optionText.trim())) {
        setExamError(`Question ${i + 1} has empty options`)
        return
      }
    }
    try {
      await createExam.mutateAsync({
        courseId,
        data: {
          title: examForm.title,
          timeLimit: examForm.timeLimit ? Number(examForm.timeLimit) : null,
          difficulty: examForm.difficulty,
          questions: examQuestions.map((q) => ({
            questionText: q.questionText,
            questionType: 'MCQ',
            marks: q.marks,
            options: q.options,
          })),
        },
      })
      setExamOpen(false)
      setExamForm({ title: '', timeLimit: '', difficulty: 'EASY' })
      setExamQuestions([
        {
          questionText: '',
          marks: 1,
          options: [
            { optionText: '', isCorrect: true },
            { optionText: '', isCorrect: false },
            { optionText: '', isCorrect: false },
            { optionText: '', isCorrect: false },
          ],
        },
      ])
    } catch (err: any) {
      setExamError(err.response?.data?.message || 'Failed to create exam')
    }
  }

  const submitEditCourse = async (e: React.FormEvent) => {
    e.preventDefault()
    setEditError('')
    if (!editForm.title.trim() || !editForm.description.trim()) {
      setEditError('Title and description are required')
      return
    }
    if (editForm.courseType === 'PAID') {
      const value = Number(editForm.price)
      if (!Number.isFinite(value) || value <= 0) {
        setEditError('Price must be greater than 0 for paid courses')
        return
      }
    }

    try {
      await updateCourse.mutateAsync({
        courseId,
        data: {
          title: editForm.title.trim(),
          description: editForm.description.trim(),
          durationWeeks: editForm.durationWeeks ? Number(editForm.durationWeeks) : undefined,
          courseType: editForm.courseType,
          level: editForm.level,
          price: editForm.courseType === 'PAID' ? Number(editForm.price) : undefined,
        },
      })
      setEditOpen(false)
    } catch (err: any) {
      setEditError(err?.response?.data?.message || 'Failed to update course')
    }
  }

  const addExamQuestion = () => {
    setExamQuestions((prev) => [
      ...prev,
      {
        questionText: '',
        marks: 1,
        options: [
          { optionText: '', isCorrect: true },
          { optionText: '', isCorrect: false },
          { optionText: '', isCorrect: false },
          { optionText: '', isCorrect: false },
        ],
      },
    ])
  }

  const removeExamQuestion = (index: number) => {
    setExamQuestions((prev) => prev.filter((_, i) => i !== index))
  }

  const updateExamQuestion = (index: number, patch: Partial<ExamQuestion>) => {
    setExamQuestions((prev) => prev.map((q, i) => (i === index ? { ...q, ...patch } : q)))
  }

  const updateExamOption = (qIndex: number, oIndex: number, patch: Partial<ExamOption>) => {
    setExamQuestions((prev) =>
      prev.map((q, i) => {
        if (i !== qIndex) return q
        const options = q.options.map((o, j) => {
          if (patch.isCorrect === true) return { ...o, isCorrect: j === oIndex }
          if (j === oIndex) return { ...o, ...patch }
          return o
        })
        return { ...q, options }
      })
    )
  }

  if (isLoading) return <LoadingSpinner label="Loading course..." />
  if (isError || !data?.course) return <div className="text-red-600">Course not found or failed to load.</div>

  return (
    <div className="space-y-6">
      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-[#141413]">{data.course.title}</h1>
          <p className="text-sm text-[#6B6A66] mt-1">{data.course.description}</p>
        </div>
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => {
              setEditError('')
              setEditOpen(true)
            }}
            className="rounded-md border border-[#111827] bg-[#111827] px-3 py-2 text-sm text-white hover:opacity-90"
          >
            Edit Course
          </button>
          <Link to="/instructor/courses" className="rounded-md border border-[#D4D2CC] bg-white px-3 py-2 text-sm text-[#141413] hover:bg-[#F4F3EE]">
            Back to courses
          </Link>
        </div>
      </div>

      {editOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
          <div className="w-full max-w-2xl rounded-xl border border-gray-200 bg-white p-5 space-y-4">
            <div className="flex items-center justify-between gap-3">
              <h3 className="text-lg font-semibold text-[#111827]">Edit Course</h3>
              <button
                type="button"
                onClick={() => {
                  setEditOpen(false)
                  setEditError('')
                }}
                className="text-sm text-gray-600 hover:text-[#111827]"
              >
                ✕
              </button>
            </div>

            {editError && (
              <div className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
                {editError}
              </div>
            )}

            <form onSubmit={submitEditCourse} className="space-y-3">
              <div>
                <label className="block text-sm font-medium mb-1">Course Title *</label>
                <input
                  value={editForm.title}
                  onChange={(e) => setEditForm((p) => ({ ...p, title: e.target.value }))}
                  required
                  className="w-full rounded-md border border-gray-200 px-3 py-2 text-sm"
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Description *</label>
                <textarea
                  rows={3}
                  value={editForm.description}
                  onChange={(e) => setEditForm((p) => ({ ...p, description: e.target.value }))}
                  required
                  className="w-full rounded-md border border-gray-200 px-3 py-2 text-sm"
                />
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-sm font-medium mb-1">Duration (weeks)</label>
                  <input
                    type="number"
                    min="1"
                    value={editForm.durationWeeks}
                    onChange={(e) => setEditForm((p) => ({ ...p, durationWeeks: e.target.value }))}
                    className="w-full rounded-md border border-gray-200 px-3 py-2 text-sm"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">Level</label>
                  <select
                    value={editForm.level}
                    onChange={(e) => setEditForm((p) => ({ ...p, level: e.target.value as 'BEGINNER' | 'INTERMEDIATE' | 'ADVANCED' }))}
                    className="w-full rounded-md border border-gray-200 px-3 py-2 text-sm"
                  >
                    <option value="BEGINNER">Beginner</option>
                    <option value="INTERMEDIATE">Intermediate</option>
                    <option value="ADVANCED">Advanced</option>
                  </select>
                </div>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-sm font-medium mb-1">Course Type</label>
                  <select
                    value={editForm.courseType}
                    onChange={(e) =>
                      setEditForm((p) => ({
                        ...p,
                        courseType: e.target.value as 'FREE' | 'PAID',
                        price: e.target.value === 'PAID' ? p.price : '',
                      }))
                    }
                    className="w-full rounded-md border border-gray-200 px-3 py-2 text-sm"
                  >
                    <option value="FREE">Free</option>
                    <option value="PAID">Paid</option>
                  </select>
                </div>
                {editForm.courseType === 'PAID' && (
                  <div>
                    <label className="block text-sm font-medium mb-1">Price *</label>
                    <input
                      type="number"
                      min="1"
                      step="0.01"
                      value={editForm.price}
                      onChange={(e) => setEditForm((p) => ({ ...p, price: e.target.value }))}
                      required
                      className="w-full rounded-md border border-gray-200 px-3 py-2 text-sm"
                    />
                  </div>
                )}
              </div>
              <div className="flex gap-2 pt-1">
                <button
                  type="button"
                  onClick={() => {
                    setEditOpen(false)
                    setEditError('')
                  }}
                  className="flex-1 rounded-md border border-gray-200 bg-white px-3 py-2 text-sm hover:bg-gray-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={updateCourse.isPending}
                  className="flex-1 rounded-md bg-[#08A696] px-3 py-2 text-sm font-medium text-white hover:bg-[#078878] disabled:opacity-60"
                >
                  {updateCourse.isPending ? 'Saving...' : 'Save changes'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      <div className="rounded-xl border border-[#E0DED8] bg-white p-6">
        <div className="flex items-center justify-between gap-3 mb-4">
          <h2 className="text-lg font-semibold">Add Module</h2>
          <button
            type="button"
            onClick={() => setExamOpen(true)}
            className="rounded-md bg-[#111827] px-3 py-2 text-xs font-medium text-white hover:opacity-90"
          >
            Create Exam
          </button>
        </div>
        <form onSubmit={submit} className="space-y-4">
          {fileError && (
            <div className="rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-700">
              {fileError}
            </div>
          )}
          <div>
            <label className="block text-sm font-medium mb-1">Module Title *</label>
            <input value={form.title} onChange={(e) => setForm((p) => ({ ...p, title: e.target.value }))} required className="w-full rounded-md border border-[#D4D2CC] px-3 py-2 text-sm" />
          </div>

          <div>
            <label className="block text-sm font-medium mb-1">Description</label>
            <textarea rows={3} value={form.description} onChange={(e) => setForm((p) => ({ ...p, description: e.target.value }))} className="w-full rounded-md border border-[#D4D2CC] px-3 py-2 text-sm" />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium mb-1">Content Type *</label>
              <select
                value={form.contentType}
                onChange={(e) =>
                  setForm((p) => ({
                    ...p,
                    contentType: e.target.value as ContentType,
                    duration: e.target.value === 'VIDEO' ? p.duration : '',
                  }))
                }
                className="w-full rounded-md border border-[#D4D2CC] px-3 py-2 text-sm"
              >
                <option value="VIDEO">VIDEO</option>
                <option value="PDF">PDF</option>
                <option value="TEXT">TEXT</option>
              </select>
            </div>
            {form.contentType === 'VIDEO' && (
              <div>
                <label className="block text-sm font-medium mb-1">Duration (minutes)</label>
                <input
                  type="number"
                  min="1"
                  value={form.duration}
                  onChange={(e) => setForm((p) => ({ ...p, duration: e.target.value }))}
                  className="w-full rounded-md border border-[#D4D2CC] px-3 py-2 text-sm"
                />
              </div>
            )}
          </div>

          {form.contentType === 'VIDEO' && (
            <div>
              <label className="block text-sm font-medium mb-1">Video File *</label>
              <input
                type="file"
                accept="video/*"
                onChange={(e) => {
                  const f = e.target.files?.[0] ?? null
                  if (f && f.size > 100 * 1024 * 1024) {
                    setFileError('Please upload max 100MB video for Cloudinary.')
                    setVideoFile(null)
                    return
                  }
                  setFileError('')
                  setVideoFile(f)
                }}
                required
                className="w-full text-sm"
              />
            </div>
          )}

          {form.contentType === 'PDF' && (
            <div>
              <label className="block text-sm font-medium mb-1">PDF File *</label>
              <input
                type="file"
                accept="application/pdf"
                onChange={(e) => {
                  const f = e.target.files?.[0] ?? null
                  if (f && f.size > 50 * 1024 * 1024) {
                    setFileError('Please upload PDF under 50MB.')
                    setPdfFile(null)
                    return
                  }
                  setFileError('')
                  setPdfFile(f)
                }}
                required
                className="w-full text-sm"
              />
            </div>
          )}

          {form.contentType === 'TEXT' && (
            <div>
              <label className="block text-sm font-medium mb-1">Text Content *</label>
              <textarea rows={6} value={form.contentText} onChange={(e) => setForm((p) => ({ ...p, contentText: e.target.value }))} required className="w-full rounded-md border border-[#D4D2CC] px-3 py-2 text-sm" />
            </div>
          )}

          <button
            type="submit"
            disabled={createModule.isPending || uploadVideo.isPending || uploadPdf.isPending}
            className="rounded-md bg-[#08A696] px-4 py-2 text-sm font-medium text-white hover:bg-[#078878] disabled:opacity-60"
          >
            {createModule.isPending || uploadVideo.isPending || uploadPdf.isPending ? 'Saving module...' : 'Add Module'}
          </button>
        </form>
      </div>

      {/* Create Exam Modal */}
      {examOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
          <div className="w-full max-w-3xl max-h-[90vh] overflow-y-auto rounded-xl bg-white border border-gray-200 p-5 space-y-4">
            <div className="flex items-center justify-between gap-3">
              <h3 className="text-lg font-semibold text-[#111827]">Create Course Exam</h3>
              <button
                type="button"
                onClick={() => { setExamOpen(false); setExamError('') }}
                className="text-sm text-gray-600 hover:text-[#111827]"
              >
                ✕
              </button>
            </div>

            {examError && (
              <div className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
                {examError}
              </div>
            )}

            <form onSubmit={submitExam} className="space-y-3">
              <div>
                <label className="block text-sm font-medium mb-1">Exam Name *</label>
                <input
                  value={examForm.title}
                  onChange={(e) => setExamForm((p) => ({ ...p, title: e.target.value }))}
                  required
                  className="w-full rounded-md border border-gray-200 px-3 py-2 text-sm"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div className="sm:col-span-1">
                  <label className="block text-sm font-medium mb-1">Duration (min)</label>
                  <input
                    type="number"
                    min="1"
                    max="180"
                    value={examForm.timeLimit}
                    onChange={(e) => setExamForm((p) => ({ ...p, timeLimit: e.target.value }))}
                    className="w-full rounded-md border border-gray-200 px-3 py-2 text-sm"
                  />
                  <p className="text-[11px] text-gray-500 mt-1">Allowed: 1 to 180 minutes.</p>
                </div>
                <div className="sm:col-span-2">
                  <label className="block text-sm font-medium mb-1">Difficulty *</label>
                  <select
                    value={examForm.difficulty}
                    onChange={(e) => setExamForm((p) => ({ ...p, difficulty: e.target.value as any }))}
                    className="w-full rounded-md border border-gray-200 px-3 py-2 text-sm"
                  >
                    <option value="EASY">Easy</option>
                    <option value="INTERMEDIATE">Intermediate</option>
                    <option value="ADVANCED">Advanced</option>
                  </select>
                  <p className="text-[11px] text-gray-500 mt-1">
                    Students must attempt exams in order: Easy → Intermediate → Advanced. Each exam can be attempted once.
                  </p>
                </div>
              </div>

              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <h4 className="text-sm font-semibold text-[#111827]">Questions</h4>
                  <button
                    type="button"
                    onClick={addExamQuestion}
                    className="rounded-md border border-gray-200 bg-white px-2.5 py-1 text-xs hover:bg-gray-50"
                  >
                    + Add Question
                  </button>
                </div>

                {examQuestions.map((q, qIndex) => (
                  <div key={qIndex} className="rounded-lg border border-gray-200 p-3 space-y-2">
                    <div className="flex items-center justify-between gap-2">
                      <p className="text-xs font-medium text-gray-600">Question {qIndex + 1}</p>
                      {examQuestions.length > 1 && (
                        <button
                          type="button"
                          onClick={() => removeExamQuestion(qIndex)}
                          className="text-xs text-red-600 hover:underline"
                        >
                          Remove
                        </button>
                      )}
                    </div>
                    <textarea
                      rows={2}
                      value={q.questionText}
                      onChange={(e) => updateExamQuestion(qIndex, { questionText: e.target.value })}
                      placeholder="Write question..."
                      className="w-full rounded-md border border-gray-200 px-3 py-2 text-sm"
                    />
                    <div>
                      <label className="block text-xs text-gray-600 mb-1">Marks</label>
                      <input
                        type="number"
                        min="1"
                        value={q.marks}
                        onChange={(e) => updateExamQuestion(qIndex, { marks: Number(e.target.value) || 1 })}
                        className="w-24 rounded-md border border-gray-200 px-3 py-1.5 text-sm"
                      />
                    </div>
                    <div className="space-y-2">
                      {q.options.map((o, oIndex) => (
                        <div key={oIndex} className="flex items-center gap-2">
                          <input
                            type="radio"
                            name={`exam-q-${qIndex}`}
                            checked={o.isCorrect}
                            onChange={() => updateExamOption(qIndex, oIndex, { isCorrect: true })}
                          />
                          <input
                            value={o.optionText}
                            onChange={(e) => updateExamOption(qIndex, oIndex, { optionText: e.target.value })}
                            placeholder={`Option ${oIndex + 1}`}
                            className="w-full rounded-md border border-gray-200 px-3 py-1.5 text-sm"
                          />
                        </div>
                      ))}
                    </div>
                  </div>
                ))}
              </div>

              <div className="flex gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => { setExamOpen(false); setExamError('') }}
                  className="flex-1 rounded-md border border-gray-200 bg-white px-3 py-2 text-sm hover:bg-gray-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={createExam.isPending}
                  className="flex-1 rounded-md bg-[#08A696] px-3 py-2 text-sm font-medium text-white hover:bg-[#078878] disabled:opacity-60"
                >
                  {createExam.isPending ? 'Creating...' : 'Create'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      <div className="rounded-xl border border-[#E0DED8] bg-white p-6">
        <h2 className="text-lg font-semibold mb-4">Modules ({sortedModules.length})</h2>
        {sortedModules.length === 0 ? (
          <p className="text-sm text-[#6B6A66]">No modules yet.</p>
        ) : (
          <div className="space-y-3">
            {sortedModules.map((m) => (
              <div
                key={m.id}
                className="rounded-lg border border-gray-200 p-3 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3"
              >
                <div className="min-w-0">
                  <p className="font-medium text-[#111827]">
                    {m.orderIndex}. {m.title}
                  </p>
                  <p className="text-xs text-gray-600 mt-1">
                    {m.contentType}
                    {m.duration ? ` · ${m.duration} min` : ''}
                    {m.quiz ? (
                      <span className="ml-2 text-green-700 font-medium">· Quiz: {m.quiz.title}</span>
                    ) : null}
                  </p>
                </div>
                <Link
                  to={`/instructor/courses/${courseId}/modules/${m.id}/quiz`}
                  className="shrink-0 rounded-md border border-[#111827] bg-[#111827] px-3 py-2 text-xs font-medium text-white hover:opacity-90 text-center"
                >
                  {m.quiz ? 'Edit quiz' : 'Create quiz'}
                </Link>
                <button
                  type="button"
                  onClick={async () => {
                    const ok = window.confirm(
                      `Delete "${m.title}"? This will also delete its quiz (if any).`
                    )
                    if (!ok) return
                    try {
                      await deleteModule.mutateAsync({ moduleId: m.id })
                    } catch (e: any) {
                      alert(e?.response?.data?.message || 'Failed to delete module')
                    }
                  }}
                  disabled={deleteModule.isPending}
                  className="shrink-0 rounded-md border border-red-200 bg-red-50 px-3 py-2 text-xs font-medium text-red-700 hover:bg-red-100 disabled:opacity-60"
                >
                  Delete
                </button>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}

export default CourseDetail
