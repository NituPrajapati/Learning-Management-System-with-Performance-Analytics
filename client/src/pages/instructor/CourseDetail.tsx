import { useMemo, useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import { LoadingSpinner } from '../../components/common/LoadingSpinner'
import { useCourse, useCreateCourseModule, useUploadInstructorPdf, useUploadInstructorVideo } from '../../hooks/useCourses'
import type { ContentType } from '../../api/courses'

const CourseDetail = () => {
  const { id } = useParams()
  const courseId = Number(id)

  const { data, isLoading, isError } = useCourse(Number.isFinite(courseId) ? courseId : null)
  const uploadVideo = useUploadInstructorVideo()
  const uploadPdf = useUploadInstructorPdf()
  const createModule = useCreateCourseModule()

  const [form, setForm] = useState({
    title: '',
    description: '',
    contentType: 'VIDEO' as ContentType,
    duration: '',
    contentText: '',
  })
  const [videoFile, setVideoFile] = useState<File | null>(null)
  const [pdfFile, setPdfFile] = useState<File | null>(null)

  const modules = data?.course?.modules ?? []
  const sortedModules = useMemo(() => [...modules].sort((a, b) => a.orderIndex - b.orderIndex), [modules])

  const uploadAndGetUrl = async () => {
    if (form.contentType === 'VIDEO') {
      if (!videoFile) throw new Error('Select a video file')
      const res = await uploadVideo.mutateAsync(videoFile)
      return res.url
    }
    if (form.contentType === 'PDF') {
      if (!pdfFile) throw new Error('Select a PDF file')
      const res = await uploadPdf.mutateAsync(pdfFile)
      return res.url
    }
    return undefined
  }

  const submit = async (e: React.FormEvent) => {
    e.preventDefault()
    const contentUrl = await uploadAndGetUrl()

    await createModule.mutateAsync({
      courseId,
      data: {
        title: form.title,
        description: form.description || undefined,
        contentType: form.contentType,
        contentUrl,
        contentText: form.contentType === 'TEXT' ? form.contentText : undefined,
        duration: form.duration ? Number(form.duration) : undefined,
      },
    })

    setForm({ title: '', description: '', contentType: 'VIDEO', duration: '', contentText: '' })
    setVideoFile(null)
    setPdfFile(null)
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
        <Link to="/instructor/courses" className="rounded-md border border-[#D4D2CC] bg-white px-3 py-2 text-sm text-[#141413] hover:bg-[#F4F3EE]">
          Back to courses
        </Link>
      </div>

      <div className="rounded-xl border border-[#E0DED8] bg-white p-6">
        <h2 className="text-lg font-semibold mb-4">Add Module</h2>
        <form onSubmit={submit} className="space-y-4">
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
              <select value={form.contentType} onChange={(e) => setForm((p) => ({ ...p, contentType: e.target.value as ContentType }))} className="w-full rounded-md border border-[#D4D2CC] px-3 py-2 text-sm">
                <option value="VIDEO">VIDEO</option>
                <option value="PDF">PDF</option>
                <option value="TEXT">TEXT</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Duration (minutes)</label>
              <input type="number" min="1" value={form.duration} onChange={(e) => setForm((p) => ({ ...p, duration: e.target.value }))} className="w-full rounded-md border border-[#D4D2CC] px-3 py-2 text-sm" />
            </div>
          </div>

          {form.contentType === 'VIDEO' && (
            <div>
              <label className="block text-sm font-medium mb-1">Video File *</label>
              <input type="file" accept="video/*" onChange={(e) => setVideoFile(e.target.files?.[0] ?? null)} required className="w-full text-sm" />
            </div>
          )}

          {form.contentType === 'PDF' && (
            <div>
              <label className="block text-sm font-medium mb-1">PDF File *</label>
              <input type="file" accept="application/pdf" onChange={(e) => setPdfFile(e.target.files?.[0] ?? null)} required className="w-full text-sm" />
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
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}

export default CourseDetail
