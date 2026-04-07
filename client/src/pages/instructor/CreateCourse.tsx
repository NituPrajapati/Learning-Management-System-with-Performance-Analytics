import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useCreateCourse } from '../../hooks/useCourses'

const CreateCourse = () => {
  const navigate = useNavigate()
  const createCourse = useCreateCourse()
  const [form, setForm] = useState({
    title: '',
    description: '',
    thumbnail: '',
    durationWeeks: '',
    courseType: 'FREE' as 'FREE' | 'PAID',
    level: 'BEGINNER' as 'BEGINNER' | 'INTERMEDIATE' | 'ADVANCED',
    price: '',
  })

  const submit = async (e: React.FormEvent) => {
    e.preventDefault()
    const payload = {
      title: form.title,
      description: form.description,
      thumbnail: form.thumbnail || undefined,
      durationWeeks: form.durationWeeks ? Number(form.durationWeeks) : undefined,
      courseType: form.courseType,
      level: form.level,
      price: form.courseType === 'PAID' && form.price ? Number(form.price) : undefined,
    }

    const res = await createCourse.mutateAsync(payload)
    navigate(`/instructor/courses/${res.course.id}`)
  }

  return (
    <div className="max-w-3xl space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-[#141413]">Create Course</h1>
        <p className="text-sm text-[#6B6A66] mt-1">Set details, then add modules on the course detail page.</p>
      </div>

      <form onSubmit={submit} className="rounded-xl border border-[#E0DED8] bg-white p-6 space-y-4">
        <div>
          <label className="block text-sm font-medium mb-1">Title *</label>
          <input
            value={form.title}
            onChange={(e) => setForm((prev) => ({ ...prev, title: e.target.value }))}
            className="w-full rounded-md border border-[#D4D2CC] px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-[#08A696]"
            required
          />
        </div>

        <div>
          <label className="block text-sm font-medium mb-1">Description *</label>
          <textarea
            value={form.description}
            onChange={(e) => setForm((prev) => ({ ...prev, description: e.target.value }))}
            rows={4}
            className="w-full rounded-md border border-[#D4D2CC] px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-[#08A696]"
            required
          />
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium mb-1">Course Type</label>
            <select
              value={form.courseType}
              onChange={(e) => setForm((prev) => ({ ...prev, courseType: e.target.value as 'FREE' | 'PAID' }))}
              className="w-full rounded-md border border-[#D4D2CC] px-3 py-2 text-sm"
            >
              <option value="FREE">FREE</option>
              <option value="PAID">PAID</option>
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">Level</label>
            <select
              value={form.level}
              onChange={(e) => setForm((prev) => ({ ...prev, level: e.target.value as 'BEGINNER' | 'INTERMEDIATE' | 'ADVANCED' }))}
              className="w-full rounded-md border border-[#D4D2CC] px-3 py-2 text-sm"
            >
              <option value="BEGINNER">BEGINNER</option>
              <option value="INTERMEDIATE">INTERMEDIATE</option>
              <option value="ADVANCED">ADVANCED</option>
            </select>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium mb-1">Duration (weeks)</label>
            <input
              type="number"
              min="1"
              value={form.durationWeeks}
              onChange={(e) => setForm((prev) => ({ ...prev, durationWeeks: e.target.value }))}
              className="w-full rounded-md border border-[#D4D2CC] px-3 py-2 text-sm"
            />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">Price</label>
            <input
              type="number"
              min="0"
              step="0.01"
              value={form.price}
              onChange={(e) => setForm((prev) => ({ ...prev, price: e.target.value }))}
              disabled={form.courseType !== 'PAID'}
              required={form.courseType === 'PAID'}
              className="w-full rounded-md border border-[#D4D2CC] px-3 py-2 text-sm disabled:bg-gray-100"
            />
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium mb-1">Thumbnail URL</label>
          <input
            type="url"
            value={form.thumbnail}
            onChange={(e) => setForm((prev) => ({ ...prev, thumbnail: e.target.value }))}
            className="w-full rounded-md border border-[#D4D2CC] px-3 py-2 text-sm"
          />
        </div>

        <div className="flex items-center gap-3">
          <button
            type="submit"
            disabled={createCourse.isPending}
            className="rounded-md bg-[#08A696] px-4 py-2 text-sm font-medium text-white hover:bg-[#078878] transition disabled:opacity-60"
          >
            {createCourse.isPending ? 'Creating...' : 'Create Course'}
          </button>
          <Link
            to="/instructor/courses"
            className="rounded-md border border-[#D4D2CC] bg-white px-4 py-2 text-sm text-[#141413] hover:bg-[#F4F3EE] transition"
          >
            Cancel
          </Link>
        </div>
      </form>
    </div>
  )
}

export default CreateCourse
