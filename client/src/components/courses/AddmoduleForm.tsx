import { useState, useRef } from 'react'
import { useCreateModule } from '../../hooks/useModules'
import api from '../../api/axios'

interface Props {
  courseId: number
  onSuccess: () => void
}

type ContentType = 'VIDEO' | 'PDF' | 'TEXT' | 'LINK'

const AddModuleForm = ({ courseId, onSuccess }: Props) => {
  const createModule = useCreateModule()
  const videoRef = useRef<HTMLInputElement>(null)
  const pdfRef   = useRef<HTMLInputElement>(null)

  const [form, setForm] = useState({
    title:       '',
    description: '',
    contentType: 'VIDEO' as ContentType,
    contentUrl:  '',
    contentText: '',
    duration:    '',
  })

  const [uploadProgress, setUploadProgress] = useState(0)
  const [isUploading,    setIsUploading]    = useState(false)
  const [uploadedUrl,    setUploadedUrl]    = useState('')
  const [uploadedPublicId, setUploadedPublicId] = useState('')
  const [uploadedSize,   setUploadedSize]   = useState(0)
  const [error,          setError]          = useState('')
  const [fileName,       setFileName]       = useState('')

  const MAX_VIDEO_BYTES = 100 * 1024 * 1024
  const MAX_PDF_BYTES = 50 * 1024 * 1024

  const handleFileUpload = async (
    file: File,
    type: 'video' | 'pdf'
  ) => {
    if (type === 'video' && file.size > MAX_VIDEO_BYTES) {
      setError('Please upload max 100MB video for Cloudinary.')
      return
    }
    if (type === 'pdf' && file.size > MAX_PDF_BYTES) {
      setError('Please upload PDF under 50MB.')
      return
    }

    setIsUploading(true)
    setUploadProgress(0)
    setError('')
    setFileName(file.name)

    const formData = new FormData()
    formData.append(type, file)

    try {
      const res = await api.post(
        `/api/instructor/upload/${type}`,
        formData,
        {
          headers: { 'Content-Type': 'multipart/form-data' },
          onUploadProgress: (e) => {
            const percent = Math.round((e.loaded * 100) / (e.total || 1))
            setUploadProgress(percent)
          }
        }
      )
      setUploadedUrl(res.data.url)
      setUploadedPublicId(res.data.publicId)
      setUploadedSize(res.data.size)
      setForm(prev => ({ ...prev, contentUrl: res.data.url }))
    } catch (err: any) {
      setError(err.response?.data?.message || 'Upload failed')
    } finally {
      setIsUploading(false)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')

    if (!form.title) {
      setError('Title is required')
      return
    }

    if (['VIDEO', 'PDF', 'LINK'].includes(form.contentType) && !form.contentUrl) {
      setError('Please upload a file or enter a URL')
      return
    }

    if (form.contentType === 'TEXT' && !form.contentText) {
      setError('Please enter text content')
      return
    }

    try {
      await createModule.mutateAsync({
        title:       form.title,
        description: form.description || undefined,
        contentType: form.contentType,
        contentUrl:  form.contentUrl  || undefined,
        contentText: form.contentText || undefined,
        duration:    form.contentType === 'VIDEO' && form.duration ? parseInt(form.duration) : undefined,
        publicId:    uploadedPublicId || undefined,
        fileSize:    uploadedSize     || undefined,
        courseId,
      } as any)
      onSuccess()
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to create module')
    }
  }

  const formatFileSize = (bytes: number) => {
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <h3 className="font-semibold text-[#141413]">Add New Module</h3>

      {error && (
        <div className="bg-red-50 text-red-600 text-sm px-4 py-3 rounded-lg border border-red-100">
          {error}
        </div>
      )}

      {/* Title */}
      <div>
        <label className="block text-xs font-medium text-[#6B6A66] mb-1">
          Title *
        </label>
        <input
          value={form.title}
          onChange={e => setForm({ ...form, title: e.target.value })}
          placeholder="e.g. Introduction to React Hooks"
          required
          className="w-full rounded-lg border border-[#D4D2CC] px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-[#08A696] bg-white"
        />
      </div>

      {/* Description */}
      <div>
        <label className="block text-xs font-medium text-[#6B6A66] mb-1">
          Description
        </label>
        <textarea
          value={form.description}
          onChange={e => setForm({ ...form, description: e.target.value })}
          rows={2}
          className="w-full rounded-lg border border-[#D4D2CC] px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-[#08A696] bg-white resize-none"
        />
      </div>

      {/* Content Type + Duration (VIDEO only) */}
      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className="block text-xs font-medium text-[#6B6A66] mb-1">
            Content Type *
          </label>
          <select
            value={form.contentType}
            onChange={e => {
              setForm({ ...form, contentType: e.target.value as ContentType, contentUrl: '', duration: e.target.value === 'VIDEO' ? form.duration : '' })
              setUploadedUrl('')
              setFileName('')
              setUploadProgress(0)
            }}
            className="w-full rounded-lg border border-[#D4D2CC] px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-[#08A696] bg-white"
          >
            <option value="VIDEO">🎬 Video</option>
            <option value="PDF">📄 PDF</option>
            <option value="TEXT">📝 Text</option>
            <option value="LINK">🔗 Link</option>
          </select>
        </div>
        {form.contentType === 'VIDEO' && (
          <div>
            <label className="block text-xs font-medium text-[#6B6A66] mb-1">
              Duration (minutes)
            </label>
            <input
              type="number"
              value={form.duration}
              onChange={e => setForm({ ...form, duration: e.target.value })}
              placeholder="e.g. 30"
              min="1"
              className="w-full rounded-lg border border-[#D4D2CC] px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-[#08A696] bg-white"
            />
          </div>
        )}
      </div>

      {/* VIDEO upload */}
      {form.contentType === 'VIDEO' && (
        <div>
          <label className="block text-xs font-medium text-[#6B6A66] mb-1">
            Upload Video (max 100MB)
          </label>
          <input
            ref={videoRef}
            type="file"
            accept="video/mp4,video/mkv,video/quicktime,video/webm"
            className="hidden"
            onChange={e => {
              const file = e.target.files?.[0]
              if (file) handleFileUpload(file, 'video')
            }}
          />

          {/* Upload area */}
          {!uploadedUrl ? (
            <div
              onClick={() => videoRef.current?.click()}
              className="border-2 border-dashed border-[#D4D2CC] rounded-lg p-6 text-center cursor-pointer hover:border-[#08A696] hover:bg-[#F4F3EE] transition"
            >
              <p className="text-2xl mb-2">🎬</p>
              <p className="text-sm text-[#6B6A66]">
                Click to upload video
              </p>
              <p className="text-xs text-[#6B6A66] mt-1">
                MP4, MKV, MOV, WEBM up to 100MB
              </p>
            </div>
          ) : (
            <div className="bg-green-50 border border-green-200 rounded-lg p-3 flex items-center gap-3">
              <span className="text-green-600 text-xl">✅</span>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-green-700 line-clamp-1">
                  {fileName}
                </p>
                <p className="text-xs text-green-600">
                  {formatFileSize(uploadedSize)} • Uploaded successfully
                </p>
              </div>
              <button
                type="button"
                onClick={() => {
                  setUploadedUrl('')
                  setFileName('')
                  setForm(prev => ({ ...prev, contentUrl: '' }))
                }}
                className="text-xs text-red-500 hover:underline"
              >
                Remove
              </button>
            </div>
          )}

          {/* Progress bar */}
          {isUploading && (
            <div className="mt-2">
              <div className="flex justify-between text-xs text-[#6B6A66] mb-1">
                <span>Uploading {fileName}...</span>
                <span>{uploadProgress}%</span>
              </div>
              <div className="w-full bg-[#E0DED8] rounded-full h-2">
                <div
                  className="bg-[#08A696] h-2 rounded-full transition-all duration-300"
                  style={{ width: `${uploadProgress}%` }}
                />
              </div>
            </div>
          )}
        </div>
      )}

      {/* PDF upload */}
      {form.contentType === 'PDF' && (
        <div>
          <label className="block text-xs font-medium text-[#6B6A66] mb-1">
            Upload PDF (max 50MB)
          </label>
          <input
            ref={pdfRef}
            type="file"
            accept="application/pdf"
            className="hidden"
            onChange={e => {
              const file = e.target.files?.[0]
              if (file) handleFileUpload(file, 'pdf')
            }}
          />

          {!uploadedUrl ? (
            <div
              onClick={() => pdfRef.current?.click()}
              className="border-2 border-dashed border-[#D4D2CC] rounded-lg p-6 text-center cursor-pointer hover:border-[#08A696] hover:bg-[#F4F3EE] transition"
            >
              <p className="text-2xl mb-2">📄</p>
              <p className="text-sm text-[#6B6A66]">Click to upload PDF</p>
              <p className="text-xs text-[#6B6A66] mt-1">PDF up to 50MB</p>
            </div>
          ) : (
            <div className="bg-green-50 border border-green-200 rounded-lg p-3 flex items-center gap-3">
              <span className="text-green-600 text-xl">✅</span>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-green-700 line-clamp-1">
                  {fileName}
                </p>
                <p className="text-xs text-green-600">
                  {formatFileSize(uploadedSize)} • Uploaded successfully
                </p>
              </div>
              <button
                type="button"
                onClick={() => {
                  setUploadedUrl('')
                  setFileName('')
                  setForm(prev => ({ ...prev, contentUrl: '' }))
                }}
                className="text-xs text-red-500 hover:underline"
              >
                Remove
              </button>
            </div>
          )}

          {isUploading && (
            <div className="mt-2">
              <div className="flex justify-between text-xs text-[#6B6A66] mb-1">
                <span>Uploading {fileName}...</span>
                <span>{uploadProgress}%</span>
              </div>
              <div className="w-full bg-[#E0DED8] rounded-full h-2">
                <div
                  className="bg-[#08A696] h-2 rounded-full transition-all duration-300"
                  style={{ width: `${uploadProgress}%` }}
                />
              </div>
            </div>
          )}
        </div>
      )}

      {/* LINK input */}
      {form.contentType === 'LINK' && (
        <div>
          <label className="block text-xs font-medium text-[#6B6A66] mb-1">
            URL *
          </label>
          <input
            value={form.contentUrl}
            onChange={e => setForm({ ...form, contentUrl: e.target.value })}
            placeholder="https://..."
            className="w-full rounded-lg border border-[#D4D2CC] px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-[#08A696] bg-white"
          />
        </div>
      )}

      {/* TEXT content */}
      {form.contentType === 'TEXT' && (
        <div>
          <label className="block text-xs font-medium text-[#6B6A66] mb-1">
            Content *
          </label>
          <textarea
            value={form.contentText}
            onChange={e => setForm({ ...form, contentText: e.target.value })}
            rows={8}
            placeholder="Write your lesson content here..."
            className="w-full rounded-lg border border-[#D4D2CC] px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-[#08A696] bg-white resize-none"
          />
        </div>
      )}

      {/* Buttons */}
      <div className="flex gap-2 pt-1">
        <button
          type="button"
          onClick={onSuccess}
          className="flex-1 py-2 text-sm border border-[#D4D2CC] rounded-lg hover:bg-[#F4F3EE] transition"
        >
          Cancel
        </button>
        <button
          type="submit"
          disabled={createModule.isPending || isUploading}
          className="flex-1 py-2 text-sm bg-[#08A696] text-white rounded-lg hover:opacity-90 disabled:opacity-60 transition"
        >
          {isUploading
            ? `Uploading ${uploadProgress}%...`
            : createModule.isPending
            ? 'Adding...'
            : 'Add Module'}
        </button>
      </div>
    </form>
  )
}

export default AddModuleForm