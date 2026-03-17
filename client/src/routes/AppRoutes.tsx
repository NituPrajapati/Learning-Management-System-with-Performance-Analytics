import { Navigate, Route, Routes } from 'react-router-dom'
import { Home } from '../pages/Home'
import { Login } from '../pages/auth/Login'
import { Register } from '../pages/auth/Register'
import { AdminDashboard } from '../pages/dashboards/AdminDashboard'
import { InstructorDashboard } from '../pages/dashboards/InstructorDashboard'
import { StudentDashboard } from '../pages/dashboards/StudentDashboard'
import { NotFound } from '../pages/NotFound'
import { ProtectedRoute } from '../middleware/ProtectedRoute'

export function AppRoutes() {
  return (
    <Routes>
      <Route path="/" element={<Home />} />

      <Route path="/login" element={<Login />} />
      <Route path="/register" element={<Register />} />

      <Route element={<ProtectedRoute allowedRoles={['ADMIN']} />}>
        <Route path="/admin/dashboard" element={<AdminDashboard />} />
      </Route>

      <Route element={<ProtectedRoute allowedRoles={['INSTRUCTOR']} />}>
        <Route path="/instructor/dashboard" element={<InstructorDashboard />} />
      </Route>

      <Route element={<ProtectedRoute allowedRoles={['STUDENT']} />}>
        <Route path="/student/dashboard" element={<StudentDashboard />} />
      </Route>

      <Route path="/not-found" element={<NotFound />} />
      <Route path="*" element={<Navigate to="/not-found" replace />} />
    </Routes>
  )
}


