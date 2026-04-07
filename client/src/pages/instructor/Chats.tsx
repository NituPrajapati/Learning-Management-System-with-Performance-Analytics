import { useMemo, useState } from 'react'
import { useInstructorCourses } from '../../hooks/useCourses'
import { LoadingSpinner } from '../../components/common/LoadingSpinner'
import ChatTab from '../../components/courses/ChatTab'

export default function Chats() {
  const { data, isLoading, isError } = useInstructorCourses()
  const courses = data?.courses ?? []
  const [selectedCourseId, setSelectedCourseId] = useState<number | null>(null)

  const selected = useMemo(() => {
    if (!selectedCourseId) return null
    return courses.find((c) => c.id === selectedCourseId) ?? null
  }, [courses, selectedCourseId])

  if (isLoading) return <LoadingSpinner label="Loading courses..." />

  if (isError) {
    return (
      <div className="rounded-lg border border-red-200 bg-red-50 p-4 text-red-700">
        Failed to load your courses for chat. Please refresh and try again.
      </div>
    )
  }

  return (
    <div className="space-y-4">
      <div className="flex items-start justify-between gap-3">
        <div>
          <h1 className="text-xl font-bold text-[#111827]">Course Chat</h1>
          <p className="text-xs text-gray-600 mt-1">
            Select a course to join its chat room. Students and instructors share the same room per course.
          </p>
        </div>
      </div>

      <div className="rounded-lg border border-gray-200 bg-white p-4 space-y-3">
        <label className="block">
          <span className="text-xs font-medium text-gray-700">Course</span>
          <select
            className="mt-1 w-full rounded-md border border-gray-200 bg-white px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#08A696]/30"
            value={selectedCourseId ?? ''}
            onChange={(e) => setSelectedCourseId(e.target.value ? Number(e.target.value) : null)}
          >
            <option value="">Select a course…</option>
            {courses.map((c) => (
              <option key={c.id} value={c.id}>
                {c.title}
              </option>
            ))}
          </select>
        </label>

        {!selected ? (
          <div className="rounded-md bg-[#F2F4F7] p-4 text-sm text-gray-700">
            Pick a course to start chatting.
          </div>
        ) : (
          <div className="space-y-3">
            <div className="flex items-center justify-between gap-2">
              <div className="min-w-0">
                <div className="text-sm font-semibold text-[#111827] truncate">{selected.title}</div>
                <div className="text-xs text-gray-600 truncate">
                  Room: <span className="font-mono">course:{selected.id}</span>
                </div>
              </div>
            </div>

            <ChatTab courseId={selected.id} />
          </div>
        )}
      </div>
    </div>
  )
}
