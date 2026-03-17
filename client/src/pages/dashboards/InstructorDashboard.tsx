import { useState } from 'react'
import { Navbar } from '../../components/common/Navbar'
import {
  useInstructorCourses,
  useCreateCourse,
  useUpdateCourse,
  useToggleCoursePublish,
} from '../../hooks/useCourses'
import { LoadingSpinner } from '../../components/common/LoadingSpinner'
import type { Course } from '../../api/courses'

function CreateCourseForm({ onClose }: { onClose: () => void }) {
  const createMutation = useCreateCourse()
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    thumbnail: '',
    durationWeeks: '',
    courseType: 'FREE' as 'FREE' | 'PAID',
    level: 'BEGINNER' as 'BEGINNER' | 'INTERMEDIATE' | 'ADVANCED',
    price: '',
  })

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    try {
      await createMutation.mutateAsync({
        ...formData,
        durationWeeks: formData.durationWeeks ? parseInt(formData.durationWeeks) : undefined,
        price: formData.courseType === 'PAID' && formData.price ? parseFloat(formData.price) : undefined,
      })
      onClose()
    } catch (error) {
      // Error handled by mutation
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div>
        <label className="block text-sm font-medium text-[#141413] mb-1">Course Title *</label>
        <input
          type="text"
          value={formData.title}
          onChange={(e) => setFormData({ ...formData, title: e.target.value })}
          className="w-full rounded-md border border-[#D4D2CC] px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-[#08A696] bg-white"
          required
        />
      </div>

      <div>
        <label className="block text-sm font-medium text-[#141413] mb-1">Description *</label>
        <textarea
          value={formData.description}
          onChange={(e) => setFormData({ ...formData, description: e.target.value })}
          rows={4}
          className="w-full rounded-md border border-[#D4D2CC] px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-[#08A696] bg-white"
          required
        />
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium text-[#141413] mb-1">Duration (weeks)</label>
          <input
            type="number"
            value={formData.durationWeeks}
            onChange={(e) => setFormData({ ...formData, durationWeeks: e.target.value })}
            className="w-full rounded-md border border-[#D4D2CC] px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-[#08A696] bg-white"
            min="1"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-[#141413] mb-1">Course Type</label>
          <select
            value={formData.courseType}
            onChange={(e) => setFormData({ ...formData, courseType: e.target.value as 'FREE' | 'PAID', price: formData.courseType === 'PAID' ? formData.price : '' })}
            className="w-full rounded-md border border-[#D4D2CC] px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-[#08A696] bg-white"
          >
            <option value="FREE">FREE</option>
            <option value="PAID">PAID</option>
          </select>
        </div>
      </div>

      {formData.courseType === 'PAID' && (
        <div>
          <label className="block text-sm font-medium text-[#141413] mb-1">Price ($) *</label>
          <input
            type="number"
            value={formData.price}
            onChange={(e) => setFormData({ ...formData, price: e.target.value })}
            className="w-full rounded-md border border-[#D4D2CC] px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-[#08A696] bg-white"
            min="0.01"
            step="0.01"
            required={formData.courseType === 'PAID'}
            placeholder="0.00"
          />
        </div>
      )}

      <div>
        <label className="block text-sm font-medium text-[#141413] mb-1">Level</label>
        <select
          value={formData.level}
          onChange={(e) =>
            setFormData({ ...formData, level: e.target.value as 'BEGINNER' | 'INTERMEDIATE' | 'ADVANCED' })
          }
          className="w-full rounded-md border border-[#D4D2CC] px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-[#08A696] bg-white"
        >
          <option value="BEGINNER">BEGINNER</option>
          <option value="INTERMEDIATE">INTERMEDIATE</option>
          <option value="ADVANCED">ADVANCED</option>
        </select>
      </div>

      <div>
        <label className="block text-sm font-medium text-[#141413] mb-1">Thumbnail URL</label>
        <input
          type="url"
          value={formData.thumbnail}
          onChange={(e) => setFormData({ ...formData, thumbnail: e.target.value })}
          className="w-full rounded-md border border-[#D4D2CC] px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-[#08A696] bg-white"
        />
      </div>

      <div className="flex gap-3">
        <button
          type="submit"
          disabled={createMutation.isPending}
          className="px-4 py-2 rounded-md bg-[#08A696] text-white font-medium hover:bg-[#078878] transition disabled:opacity-60"
        >
          {createMutation.isPending ? 'Creating...' : 'Create Course'}
        </button>
        <button
          type="button"
          onClick={onClose}
          className="px-4 py-2 rounded-md border border-[#D4D2CC] bg-white text-[#141413] hover:bg-[#F4F3EE] transition"
        >
          Cancel
        </button>
      </div>
    </form>
  )
}

function CourseCard({ course }: { course: Course }) {
  const togglePublishMutation = useToggleCoursePublish()

  const handleTogglePublish = () => {
    togglePublishMutation.mutate({ courseId: course.id, isPublished: !course.isPublished })
  }

  return (
    <div className="bg-white rounded-lg shadow-sm border border-[#E0DED8] p-5">
      <div className="flex items-start justify-between mb-3">
        <div className="flex-1">
          <h3 className="text-lg font-semibold text-[#141413] mb-1">{course.title}</h3>
          <p className="text-sm text-[#6B6A66] line-clamp-2">{course.description}</p>
        </div>
        <span
          className={`px-2 py-1 rounded-full text-xs font-medium ${
            course.isPublished
              ? 'bg-green-100 text-green-700'
              : 'bg-gray-100 text-gray-700'
          }`}
        >
          {course.isPublished ? 'PUBLISHED' : 'DRAFT'}
        </span>
      </div>

      <div className="flex items-center gap-2 mb-4 flex-wrap">
        <span className="text-xs text-[#6B6A66]">
          {course._count?.modules || 0} modules • {course._count?.enrollments || 0} enrollments
        </span>
        {course.durationWeeks && (
          <span className="text-xs text-[#6B6A66]">• {course.durationWeeks} weeks</span>
        )}
        {course.price && (
          <span className="text-xs font-semibold text-[#08A696]">• ${course.price.toFixed(2)}</span>
        )}
      </div>

      <div className="flex gap-2">
        <button
          onClick={handleTogglePublish}
          disabled={togglePublishMutation.isPending}
          className={`px-3 py-1 rounded-md text-sm font-medium transition disabled:opacity-60 ${
            course.isPublished
              ? 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              : 'bg-[#08A696] text-white hover:bg-[#078878]'
          }`}
        >
          {togglePublishMutation.isPending
            ? 'Updating...'
            : course.isPublished
              ? 'Unpublish'
              : 'Publish'}
        </button>
        <button className="px-3 py-1 rounded-md border border-[#D4D2CC] bg-white text-[#141413] hover:bg-[#F4F3EE] transition text-sm">
          Edit
        </button>
        <button className="px-3 py-1 rounded-md border border-[#D4D2CC] bg-white text-[#141413] hover:bg-[#F4F3EE] transition text-sm">
          Modules
        </button>
      </div>
    </div>
  )
}

export function InstructorDashboard() {
  const [showCreateForm, setShowCreateForm] = useState(false)
  const { data, isLoading, error } = useInstructorCourses()

  return (
    <div className="min-h-screen bg-[#F4F3EE] text-[#141413]">
      <Navbar title="Instructor Dashboard" />
      <main className="p-6">
        <div className="max-w-6xl mx-auto">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h2 className="text-2xl font-bold text-[#141413] mb-1">My Courses</h2>
              <p className="text-sm text-[#6B6A66]">Create and manage your courses</p>
            </div>
            <button
              onClick={() => setShowCreateForm(true)}
              className="px-4 py-2 rounded-md bg-[#08A696] text-white font-medium hover:bg-[#078878] transition"
            >
              Create Course
            </button>
          </div>

          {showCreateForm && (
            <div className="bg-white rounded-lg shadow-sm border border-[#E0DED8] p-6 mb-6">
              <h3 className="text-lg font-semibold text-[#141413] mb-4">Create New Course</h3>
              <CreateCourseForm onClose={() => setShowCreateForm(false)} />
            </div>
          )}

          {isLoading ? (
            <LoadingSpinner label="Loading courses..." />
          ) : error ? (
            <div className="bg-red-50 border border-red-200 rounded-lg p-4 text-red-700">
              Failed to load courses. Please try again later.
            </div>
          ) : data?.courses && data.courses.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {data.courses.map((course) => (
                <CourseCard key={course.id} course={course} />
              ))}
            </div>
          ) : (
            <div className="bg-white rounded-lg shadow-sm border border-[#E0DED8] p-8 text-center">
              <p className="text-[#6B6A66] mb-4">You haven't created any courses yet.</p>
              <button
                onClick={() => setShowCreateForm(true)}
                className="px-4 py-2 rounded-md bg-[#08A696] text-white font-medium hover:bg-[#078878] transition"
              >
                Create Your First Course
              </button>
            </div>
          )}
        </div>
      </main>
    </div>
  )
}
