import { Navigate, Route, Routes } from 'react-router-dom'
import { Home } from '../pages/Home'
import { Login } from '../pages/auth/Login'
import { Register } from '../pages/auth/Register'
import { AdminDashboard } from '../pages/dashboards/AdminDashboard'
import { InstructorDashboard } from '../pages/dashboards/InstructorDashboard'
import { StudentDashboard } from '../pages/dashboards/StudentDashboard'
import { NotFound } from '../pages/NotFound'
import { ProtectedRoute } from '../middleware/ProtectedRoute'
//import { CourseAccess } from '../pages/course/CourseAccess'
//import { InstructorCourseModules } from '../pages/course/InstructorCourseModules'
import StudentLayout from '../layouts/StudentLayout'
import MyCourses from '../pages/student/MyCourses'
import CourseViewer from '../pages/student/CourseViewer'
import InstructorLayout   from '../layouts/InstructorLayout'
import InstructorCourses  from '../pages/instructor/Courses'
import CreateCourse       from '../pages/instructor/CreateCourse'
import CourseDetail       from '../pages/instructor/CourseDetail'
import CreateQuiz         from '../pages/instructor/CreateQuiz'
import InstructorAnalytics from '../pages/instructor/Analytics'
import InstructorChats     from '../pages/instructor/Chats'
import Progress           from '../pages/student/Progress'
import Report             from '../pages/student/Report'

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
        <Route path="/instructor" element={<InstructorLayout />}>
          <Route index element={<Navigate to="dashboard" replace />} />
          <Route path="dashboard" element={<InstructorDashboard />} />
          <Route path="courses" element={<InstructorCourses />} />
          <Route path="courses/create" element={<CreateCourse />} />
          <Route path="courses/:id" element={<CourseDetail />} />
          <Route 
            path="courses/:courseId/modules/:moduleId/quiz" 
            element={<CreateQuiz />} 
          />
          <Route path="analytics" element={<InstructorAnalytics />} />
          <Route path="chats" element={<InstructorChats />} />
        </Route>
      </Route>

      <Route element={<ProtectedRoute allowedRoles={['STUDENT']} />}>
        <Route path="/student" element={<StudentLayout />}>
          <Route index element={<Navigate to="dashboard" replace />} />
          <Route path="dashboard" element={<StudentDashboard />} />
          <Route path="courses" element={<MyCourses />} />
          <Route path="courses/:id" element={<CourseViewer />} />
          <Route path="progress" element={<Progress />} />
          <Route path="report" element={<Report />} />
        </Route>
      </Route>
 
      <Route path="/not-found" element={<NotFound />} />
      <Route path="*" element={<Navigate to="/not-found" replace />} />
      
    </Routes>
  
  )
}


