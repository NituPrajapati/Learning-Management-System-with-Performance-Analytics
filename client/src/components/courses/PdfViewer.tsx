import { useMemo, useState } from 'react'

/** Cloudinary raw PDFs often block embedding; `fl_inline` helps; Google viewer is a fallback. */
function cloudinaryInlinePdfUrl(url: string): string {
  if (!url) return url
  if (
    url.includes('res.cloudinary.com') &&
    url.includes('/raw/upload/') &&
    !url.includes('/fl_inline/')
  ) {
    return url.replace('/raw/upload/', '/raw/upload/fl_inline/')
  }
  return url
}

function googleViewerEmbedUrl(url: string): string {
  return `https://docs.google.com/viewer?url=${encodeURIComponent(url)}&embedded=true`
}

interface Props {
  url: string
  title: string
}

/**
 * Student PDF viewer: tries embedded viewers that work with hosted files (e.g. Cloudinary raw).
 */
const PdfViewer = ({ url, title }: Props) => {
  const [mode, setMode] = useState<'google' | 'direct'>(() =>
    url.includes('cloudinary.com') && url.includes('/raw/upload/') ? 'google' : 'direct'
  )

  const directSrc = useMemo(() => `${cloudinaryInlinePdfUrl(url.split('#')[0])}#toolbar=0`, [url])
  const googleSrc = useMemo(() => googleViewerEmbedUrl(url.split('#')[0]), [url])

  const iframeSrc = mode === 'google' ? googleSrc : directSrc

  return (
    <div className="space-y-2">
      <div className="flex flex-wrap items-center gap-2 text-xs">
        <a
          href={directSrc}
          target="_blank"
          rel="noopener noreferrer"
          className="font-medium text-[#08A696] hover:underline"
        >
          Open PDF in new tab
        </a>
        <span className="text-gray-400">|</span>
        <button
          type="button"
          onClick={() => setMode((m) => (m === 'google' ? 'direct' : 'google'))}
          className="text-gray-600 hover:text-[#111827] underline"
        >
          {mode === 'google' ? 'Try direct embed' : 'Try Google viewer'}
        </button>
      </div>
      <div
        className="rounded-lg overflow-hidden border border-gray-200 bg-gray-100"
        style={{ height: '70vh' }}
        onContextMenu={(e) => e.preventDefault()}
      >
        <iframe
          key={mode}
          title={title}
          src={iframeSrc}
          className="w-full h-full border-0 bg-white"
          referrerPolicy="no-referrer-when-downgrade"
        />
      </div>
      <p className="text-[11px] text-gray-500">
        If the preview is blank, use &quot;Open PDF in new tab&quot; or switch viewer — some browsers block embedded PDFs from file hosts.
      </p>
    </div>
  )
}

export default PdfViewer
