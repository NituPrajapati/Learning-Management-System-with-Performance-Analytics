import { useState } from 'react'
import type { Module } from '../../api/courses'
import PdfViewer from './PdfViewer'

interface Props {
  modules: Module[]
  courseId: number
}

const NotesTab = ({ modules }: Props) => {
  const [activeNote, setActiveNote] = useState<Module | null>(
    modules[0] || null
  )

  if (modules.length === 0) return (
    <div className="text-center py-12">
      <p className="text-3xl mb-3">📄</p>
      <p className="text-[#6B6A66] text-sm">No notes or PDFs yet.</p>
    </div>
  )

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-4" onContextMenu={(e) => e.preventDefault()}>
      {/* Content viewer */}
      <div className="lg:col-span-2">
        {activeNote ? (
          <div className="space-y-3">
            <h3 className="font-semibold text-[#111827]">{activeNote.title}</h3>

            {activeNote.contentType === 'PDF' && activeNote.contentUrl && (
              <PdfViewer key={activeNote.id} url={activeNote.contentUrl} title={activeNote.title} />
            )}

            {activeNote.contentType === 'TEXT' && activeNote.contentText && (
              <div className="bg-[#F2F4F7] rounded-lg p-6 prose max-w-none border border-gray-200">
                <div dangerouslySetInnerHTML={{ __html: activeNote.contentText }} />
              </div>
            )}
          </div>
        ) : (
          <div className="h-64 bg-[#F2F4F7] rounded-lg flex items-center justify-center border border-gray-200">
            <p className="text-gray-600">Select a note to view</p>
          </div>
        )}
      </div>

      {/* Notes list */}
      <div className="space-y-2">
        <h3 className="font-semibold text-[#111827] text-sm">All Notes</h3>
        {modules.map((module) => (
          <button
            key={module.id}
            onClick={() => setActiveNote(module)}
            className={`w-full flex items-center gap-3 p-3 rounded-lg text-left transition ${
              activeNote?.id === module.id
                ? 'bg-[#111827] text-white'
                : 'bg-[#F2F4F7] hover:bg-gray-200 text-[#111827]'
            }`}
          >
            <span className="text-lg flex-shrink-0">
              {module.contentType === 'PDF' ? '📄' : '📝'}
            </span>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium line-clamp-2">{module.title}</p>
              <p className={`text-xs mt-0.5 ${
                activeNote?.id === module.id ? 'text-white opacity-80' : 'text-[#6B6A66]'
              }`}>
                {module.contentType}
              </p>
            </div>
          </button>
        ))}
      </div>
    </div>
  )
}

export default NotesTab