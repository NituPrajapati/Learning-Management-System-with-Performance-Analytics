import { useAuthStore } from '../../stores/authStore'
import api from '../../api/axios'
import type { Module } from '../../api/courses'

interface Props {
  modules: Module[]
  activeModule: Module | null
  onModuleSelect: (module: Module) => void
  courseId: number
}

const VideoTab = ({ modules, activeModule, onModuleSelect, courseId }: Props) => {
  const { user } = useAuthStore()

  const trackProgress = async (action: string) => {
    if (!activeModule) return
    try {
      await api.post('/api/student/progress', {
        moduleId: activeModule.id,
        courseId,
        action,
      })
    } catch (err) {
      console.error('Progress tracking failed:', err)
    }
  }

  if (modules.length === 0)
    return (
      <div className="text-center py-12">
        <p className="text-3xl mb-3">🎬</p>
        <p className="text-gray-600 text-sm">No video lectures yet.</p>
      </div>
    )

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-4" onContextMenu={(e) => e.preventDefault()}>
      <div className="lg:col-span-2 space-y-3">
        {activeModule?.contentUrl ? (
          <div
            className="relative rounded-lg overflow-hidden bg-black"
            onContextMenu={(e) => e.preventDefault()}
          >
            <div className="absolute top-3 right-3 z-10 pointer-events-none">
              <p className="text-white text-xs opacity-40 font-medium">{user?.email}</p>
            </div>
            <video
              key={activeModule.id}
              controls
              controlsList="nodownload"
              playsInline
              className="w-full max-h-[70vh] rounded-lg"
              src={activeModule.contentUrl}
              onPlay={() => trackProgress('MODULE_STARTED')}
              onEnded={() => trackProgress('MODULE_COMPLETED')}
            >
              Your browser does not support the video tag.
            </video>
          </div>
        ) : (
          <div className="aspect-video bg-[#F2F4F7] rounded-lg flex items-center justify-center border border-gray-200">
            <p className="text-gray-600 text-sm">Select a video with a valid URL</p>
          </div>
        )}

        {activeModule && (
          <div>
            <h3 className="font-semibold text-[#111827]">{activeModule.title}</h3>
            {activeModule.duration != null && activeModule.duration > 0 && (
              <p className="text-xs text-gray-600 mt-1">⏱ {activeModule.duration} minutes</p>
            )}
          </div>
        )}
      </div>

      <div className="space-y-2">
        <h3 className="font-semibold text-[#111827] text-sm">All Videos</h3>
        {modules.map((module, index) => (
          <button
            key={module.id}
            type="button"
            onClick={() => onModuleSelect(module)}
            className={`w-full flex items-center gap-3 p-3 rounded-lg text-left transition ${
              activeModule?.id === module.id
                ? 'bg-[#111827] text-white'
                : 'bg-[#F2F4F7] hover:bg-gray-200 text-[#111827]'
            }`}
          >
            <span
              className={`text-xs font-bold w-6 h-6 rounded-full flex items-center justify-center flex-shrink-0 ${
                activeModule?.id === module.id ? 'bg-white text-[#111827]' : 'bg-gray-300 text-gray-700'
              }`}
            >
              {index + 1}
            </span>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium line-clamp-1">{module.title}</p>
              {module.duration != null && module.duration > 0 && (
                <p
                  className={`text-xs ${
                    activeModule?.id === module.id ? 'text-white/80' : 'text-gray-600'
                  }`}
                >
                  ⏱ {module.duration} min
                </p>
              )}
            </div>
          </button>
        ))}
      </div>
    </div>
  )
}

export default VideoTab
