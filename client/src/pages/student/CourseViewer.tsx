import { useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { useCourse } from '../../hooks/useCourses'
import { useModules } from '../../hooks/useModules'
import VideoTab from '../../components/courses/VideoTab'
import NotesTab from '../../components/courses/NotesTab'
import ChatTab from '../../components/courses/ChatTab'
import QuizViewer from '../../components/courses/Quiz'
import { useCourseExams } from '../../hooks/useExams'
import ExamViewer from '../../components/courses/ExamViewer.tsx'

type Tab = 'video' | 'notes' | 'quiz' | 'chat'

const CourseViewer = () => {
  const { id } = useParams()
  const navigate = useNavigate()
  const courseId = parseInt(id!)
  const [activeTab, setActiveTab] = useState<Tab>('video')
  const [activeModule, setActiveModule] = useState<number | null>(null)
  const [quizModuleId, setQuizModuleId] = useState<number | null>(null)

  const { data: courseData, isLoading: courseLoading } = useCourse(courseId)
  const { data: modules, isLoading: modulesLoading } = useModules(courseId)
  const { data: examData } = useCourseExams(courseId)

  const isLoading = courseLoading || modulesLoading

  const course = courseData?.course

  const videoModules = modules?.filter((m) => m.contentType === 'VIDEO') || []
  const notesModules = modules?.filter(
    (m) => m.contentType === 'PDF' || m.contentType === 'TEXT'
  ) || []

  const currentVideoModule =
    videoModules.find((m) => m.id === activeModule) ?? videoModules[0] ?? null

  const quizModuleCandidates = modules ?? []
  const effectiveQuizModuleId =
    quizModuleId ?? quizModuleCandidates[0]?.id ?? null
  const exams = examData?.exams ?? []
  const [activeExamId, setActiveExamId] = useState<number | null>(null)

  if (isLoading) return (
    <div className="flex items-center justify-center h-64">
      <div className="animate-spin w-8 h-8 border-4 border-[#111827] border-t-transparent rounded-full" />
    </div>
  )

  if (!course) return (
    <div className="text-center py-20 text-red-600">Course not found.</div>
  )

  const tabs = [
    { id: 'video' as const, label: 'Video lectures', count: videoModules.length },
    { id: 'notes' as const, label: 'Notes & PDFs', count: notesModules.length },
    { id: 'quiz' as const, label: 'Quizzes', count: quizModuleCandidates.length },
    { id: 'chat' as const, label: 'Discussion', count: null },
  ]

  return (
    <div className="space-y-4 text-[#111827]" onContextMenu={(e) => e.preventDefault()}>
      <div className="flex items-center gap-3">
        <button
          type="button"
          onClick={() => navigate('/student/courses')}
          className="text-sm text-gray-600 hover:text-[#111827]"
        >
          ← Back
        </button>
        <div>
          <h1 className="text-xl font-bold">{course.title}</h1>
          <p className="text-xs text-gray-600 mt-1">Instructor: {course.instructor?.name}</p>
        </div>
      </div>

      <div className="bg-white rounded-xl border border-gray-200 overflow-hidden shadow-sm">
        <div className="flex border-b border-gray-200 overflow-x-auto">
          {tabs.map(tab => (
            <button
              key={tab.id}
              type="button"
              onClick={() => setActiveTab(tab.id)}
              className={`flex-1 min-w-[100px] flex items-center justify-center gap-2 px-3 py-3 text-sm font-medium transition whitespace-nowrap ${
                activeTab === tab.id
                  ? 'border-b-2 border-[#111827] text-[#111827] bg-[#F2F4F7]'
                  : 'text-gray-600 hover:bg-[#F2F4F7]'
              }`}
            >
              {tab.label}
              {tab.count !== null && (
                <span className={`text-xs px-2 py-0.5 rounded-full ${
                  activeTab === tab.id
                    ? 'bg-[#111827] text-white'
                    : 'bg-gray-200 text-gray-700'
                }`}>
                  {tab.count}
                </span>
              )}
            </button>
          ))}
        </div>

        <div className="p-4 bg-[#F2F4F7]/30">
          {activeTab === 'video' && (
            <VideoTab
              modules={videoModules}
              activeModule={currentVideoModule}
              onModuleSelect={(m) => setActiveModule(m.id)}
              courseId={courseId}
            />
          )}
          {activeTab === 'notes' && (
            <NotesTab
              modules={notesModules}
              courseId={courseId}
            />
          )}
          {activeTab === 'quiz' && (
            <div className="space-y-4">
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                <div className="rounded-xl border border-gray-200 bg-white p-4 space-y-3">
                  <h3 className="font-semibold text-[#111827]">Module Quizzes</h3>
                  {quizModuleCandidates.length === 0 ? (
                    <p className="text-sm text-gray-600">No modules in this course yet.</p>
                  ) : (
                    <>
                      <div>
                        <label className="block text-xs font-medium text-gray-600 mb-1">Module</label>
                        <select
                          value={effectiveQuizModuleId ?? ''}
                          onChange={(e) => setQuizModuleId(Number(e.target.value))}
                          className="w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm text-[#111827]"
                        >
                          {quizModuleCandidates.map((m) => (
                            <option key={m.id} value={m.id}>
                              {m.orderIndex}. {m.title} ({m.contentType})
                            </option>
                          ))}
                        </select>
                        <p className="text-xs text-gray-500 mt-2">
                          Pick the module that has a quiz. If none was added by your instructor, you will see “No quiz”.
                        </p>
                      </div>
                      {effectiveQuizModuleId != null && (
                        <QuizViewer moduleId={effectiveQuizModuleId} courseId={courseId} />
                      )}
                    </>
                  )}
                </div>

                <div className="rounded-xl border border-gray-200 bg-white p-4 space-y-3">
                  <h3 className="font-semibold text-[#111827]">Course Exams</h3>
                  {exams.length === 0 ? (
                    <p className="text-sm text-gray-600">No exams created yet.</p>
                  ) : (
                    <>
                      <div className="space-y-2">
                        {exams.map((ex) => (
                          <button
                            key={ex.id}
                            type="button"
                            onClick={() => setActiveExamId(ex.id)}
                            disabled={ex.locked}
                            className={`w-full rounded-lg border px-3 py-2 text-left text-sm transition ${
                              activeExamId === ex.id
                                ? 'border-[#08A696] bg-[#E6FAF7]'
                                : 'border-gray-200 bg-white hover:bg-[#F2F4F7]'
                            } ${ex.locked ? 'opacity-60 cursor-not-allowed' : ''}`}
                          >
                            <div className="flex items-center justify-between gap-2">
                              <span className="font-medium text-[#111827]">{ex.title}</span>
                              <span className="text-[11px] px-2 py-0.5 rounded-full bg-gray-100 text-gray-700">
                                {ex.difficulty}
                              </span>
                            </div>
                            <div className="text-[11px] text-gray-600 mt-1">
                              {ex.attempted
                                ? `Attempted • ${Math.round(ex.attempt?.percentage ?? 0)}%`
                                : ex.locked
                                  ? 'Locked: complete previous difficulty first'
                                  : 'Available (one attempt)'}
                            </div>
                          </button>
                        ))}
                      </div>

                      {activeExamId != null && (
                        <ExamViewer examId={activeExamId} courseId={courseId} />
                      )}
                    </>
                  )}
                </div>
              </div>
            </div>
          )}
          {activeTab === 'chat' && (
            <ChatTab courseId={courseId} />
          )}
        </div>
      </div>
    </div>
  )
}

export default CourseViewer
