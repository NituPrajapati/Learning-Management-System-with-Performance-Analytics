import { Link } from 'react-router-dom'

export function NotFound() {
  return (
    <div className="min-h-screen bg-[#F4F3EE] text-[#141413] flex items-center justify-center p-6">
      <div className="w-full max-w-md bg-white rounded-lg shadow-sm border border-[#E0DED8] p-6">
        <h1 className="text-xl font-semibold mb-2">Page not found</h1>
        <p className="text-sm text-[#6B6A66] mb-4">The page you are looking for doesn’t exist.</p>
        <Link
          to="/login"
          className="inline-flex items-center justify-center px-4 py-2 rounded-md bg-[#08A696] text-[#141413] font-semibold text-sm hover:opacity-90"
        >
          Go to Login
        </Link>
      </div>
    </div>
  )
}





