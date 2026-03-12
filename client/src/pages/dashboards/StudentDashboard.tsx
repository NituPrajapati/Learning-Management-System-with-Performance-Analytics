import { Navbar } from '../../components/common/Navbar'

export function StudentDashboard() {
  return (
    <div className="min-h-screen bg-[#F4F3EE] text-[#141413]">
      <Navbar title="Student Dashboard" />
      <main className="p-6">
        <div className="max-w-5xl mx-auto">
          <div className="bg-white rounded-lg shadow-sm border border-[#E0DED8] p-5">
            <p className="text-sm text-[#6B6A66]">
              Student dashboard placeholder. Next phase: course cards and progress tracking.
            </p>
          </div>
        </div>
      </main>
    </div>
  )
}


