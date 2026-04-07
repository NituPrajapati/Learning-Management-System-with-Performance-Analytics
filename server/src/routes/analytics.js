import express from 'express'
import prisma from '../prisma.js'
import { protect } from '../middleware/authMiddleware.js'
import { allowRoles } from '../middleware/authMiddleware.js'

const router = express.Router()

// ─── Helper Functions ───
const calculateRiskScore = (completionRate, avgScore, daysInactive) => {
  const completionRisk = (1 - completionRate / 100) * 40
  const scoreRisk      = (1 - avgScore / 100) * 40
  const inactiveRisk   = Math.min(daysInactive / 7, 1) * 20
  const riskScore      = completionRisk + scoreRisk + inactiveRisk

  if (riskScore <= 30) return { score: Math.round(riskScore), level: 'SAFE',    color: 'green'  }
  if (riskScore <= 60) return { score: Math.round(riskScore), level: 'WARNING', color: 'yellow' }
  return                      { score: Math.round(riskScore), level: 'AT_RISK', color: 'red'    }
}

const getDaysInactive = (lastAccess) => {
  if (!lastAccess) return 30
  return Math.floor((new Date() - new Date(lastAccess)) / (1000 * 60 * 60 * 24))
}

// ─── Instructor Analytics ───
router.get('/instructor', protect, allowRoles('INSTRUCTOR'), async (req, res) => {
  try {
    const instructorId = req.user.id

    // Get all instructor courses
    const courses = await prisma.course.findMany({
      where: { instructorId },
      include: {
        enrollments: {
          include: {
            student: { select: { id: true, name: true, email: true } }
          }
        },
        modules: true,
        _count: { select: { enrollments: true, modules: true } }
      }
    })

    // Per course analytics
    const courseAnalytics = await Promise.all(courses.map(async (course) => {
      const enrollments    = course.enrollments
      const totalStudents  = enrollments.length
      const completed      = enrollments.filter(e => e.status === 'COMPLETED').length
      const dropped        = enrollments.filter(e => e.status === 'DROPPED').length
      const completionRate = totalStudents > 0 ? (completed / totalStudents) * 100 : 0
      const dropoutRate    = totalStudents > 0 ? (dropped  / totalStudents) * 100 : 0

      // Quiz attempts for this course
      const quizAttempts = await prisma.quizAttempt.findMany({
        where: {
          quiz: { module: { courseId: course.id } }
        },
        select: { percentage: true, isPassed: true }
      })

      const avgScore  = quizAttempts.length > 0
        ? quizAttempts.reduce((sum, a) => sum + a.percentage, 0) / quizAttempts.length
        : 0
      const passRate  = quizAttempts.length > 0
        ? (quizAttempts.filter(a => a.isPassed).length / quizAttempts.length) * 100
        : 0

      // At risk students
      const atRiskStudents = enrollments.map(e => {
        const daysInactive = getDaysInactive(e.lastAccessedAt)
        const risk         = calculateRiskScore(
          e.completionRate || 0,
          e.quizAvgScore   || 0,
          daysInactive
        )
        return {
          id:             e.student.id,
          name:           e.student.name,
          email:          e.student.email,
          completionRate: Math.round(e.completionRate || 0),
          avgScore:       Math.round(e.quizAvgScore   || 0),
          daysInactive,
          risk
        }
      }).filter(s => s.risk.level !== 'SAFE')

      return {
        courseId:     course.id,
        courseTitle:  course.title,
        totalStudents,
        completionRate: Math.round(completionRate),
        dropoutRate:    Math.round(dropoutRate),
        avgScore:       Math.round(avgScore),
        passRate:       Math.round(passRate),
        atRiskStudents,
        totalModules:   course._count.modules,
      }
    }))

    // Overall stats
    const totalStudents    = courseAnalytics.reduce((sum, c) => sum + c.totalStudents, 0)
    const avgCompletionRate = courseAnalytics.length > 0
      ? courseAnalytics.reduce((sum, c) => sum + c.completionRate, 0) / courseAnalytics.length
      : 0
    const avgScore = courseAnalytics.length > 0
      ? courseAnalytics.reduce((sum, c) => sum + c.avgScore, 0) / courseAnalytics.length
      : 0
    const totalAtRisk = courseAnalytics.reduce(
      (sum, c) => sum + c.atRiskStudents.length, 0
    )

    return res.json({
      overview: {
        totalCourses:    courses.length,
        totalStudents,
        avgCompletionRate: Math.round(avgCompletionRate),
        avgScore:          Math.round(avgScore),
        totalAtRisk,
      },
      courseAnalytics
    })
  } catch (error) {
    console.error('Instructor analytics error:', error)
    return res.status(500).json({ message: 'Failed to fetch analytics' })
  }
})

// ─── Student Analytics ───
router.get('/student', protect, allowRoles('STUDENT'), async (req, res) => {
  try {
    const studentId = req.user.id

    const enrollments = await prisma.enrollment.findMany({
      where: { studentId, status: { not: 'DROPPED' } },
      include: {
        course: {
          include: {
            modules: true,
            _count: { select: { modules: true } }
          }
        }
      }
    })

    // Per course progress
    const courseProgress = await Promise.all(enrollments.map(async (e) => {
      const quizAttempts = await prisma.quizAttempt.findMany({
        where: {
          studentId,
          quiz: { module: { courseId: e.courseId } }
        },
        orderBy: { startedAt: 'asc' },
        select:  { percentage: true, isPassed: true, startedAt: true }
      })

      const avgScore  = quizAttempts.length > 0
        ? quizAttempts.reduce((sum, a) => sum + a.percentage, 0) / quizAttempts.length
        : 0

      // Score improvement
      const improvement = quizAttempts.length >= 2
        ? ((quizAttempts[quizAttempts.length - 1].percentage - quizAttempts[0].percentage)
            / quizAttempts[0].percentage) * 100
        : 0

      // Learning pace
      const enrolledDays = Math.max(1, Math.floor(
        (new Date().getTime() - new Date(e.enrolledAt).getTime()) / (1000 * 60 * 60 * 24)
      ))
      const completedModules = Math.round((e.completionRate / 100) * e.course._count.modules)
      const pace             = completedModules / enrolledDays
      const paceLabel        = pace > 1 ? 'Fast' : pace >= 0.5 ? 'Average' : 'Slow'

      return {
        courseId:         e.courseId,
        courseTitle:      e.course.title,
        completionRate:   Math.round(e.completionRate || 0),
        avgScore:         Math.round(avgScore),
        improvement:      Math.round(improvement),
        totalModules:     e.course._count.modules,
        completedModules,
        pace:             paceLabel,
        status:           e.status,
        enrolledAt:       e.enrolledAt,
        quizAttempts:     quizAttempts.map(a => ({
          score: Math.round(a.percentage),
          date:  a.startedAt
        }))
      }
    }))

    // Overall stats
    const avgCompletion = courseProgress.length > 0
      ? courseProgress.reduce((sum, c) => sum + c.completionRate, 0) / courseProgress.length
      : 0
    const avgScore = courseProgress.length > 0
      ? courseProgress.reduce((sum, c) => sum + c.avgScore, 0) / courseProgress.length
      : 0
    const completedCourses = courseProgress.filter(c => c.status === 'COMPLETED').length

    return res.json({
      overview: {
        totalEnrolled:    enrollments.length,
        completedCourses,
        avgCompletion:    Math.round(avgCompletion),
        avgScore:         Math.round(avgScore),
      },
      courseProgress
    })
  } catch (error) {
    console.error('Student analytics error:', error)
    return res.status(500).json({ message: 'Failed to fetch analytics' })
  }
})

// ─── Admin Analytics ───
router.get('/admin', protect, allowRoles('ADMIN'), async (req, res) => {
  try {
    const [
      totalUsers,
      totalCourses,
      totalEnrollments,
      activeStudents,
      quizAttempts,
    ] = await Promise.all([
      prisma.user.count({ where: { role: { not: 'ADMIN' } } }),
      prisma.course.count({ where: { isPublished: true } }),
      prisma.enrollment.count(),
      prisma.user.count({ where: { role: 'STUDENT', isActive: true } }),
      prisma.quizAttempt.findMany({ select: { percentage: true, isPassed: true } }),
    ])

    const avgScore   = quizAttempts.length > 0
      ? quizAttempts.reduce((sum, a) => sum + a.percentage, 0) / quizAttempts.length
      : 0
    const passRate   = quizAttempts.length > 0
      ? (quizAttempts.filter(a => a.isPassed).length / quizAttempts.length) * 100
      : 0

    // Monthly enrollments (last 6 months)
    const monthlyData = []
    for (let i = 5; i >= 0; i--) {
      const date  = new Date()
      date.setMonth(date.getMonth() - i)
      const start = new Date(date.getFullYear(), date.getMonth(), 1)
      const end   = new Date(date.getFullYear(), date.getMonth() + 1, 0)

      const count = await prisma.enrollment.count({
        where: { enrolledAt: { gte: start, lte: end } }
      })

      monthlyData.push({
        month: date.toLocaleString('default', { month: 'short' }),
        enrollments: count
      })
    }

    return res.json({
      overview: {
        totalUsers,
        totalCourses,
        totalEnrollments,
        activeStudents,
        avgScore:  Math.round(avgScore),
        passRate:  Math.round(passRate),
      },
      monthlyData
    })
  } catch (error) {
    console.error('Admin analytics error:', error)
    return res.status(500).json({ message: 'Failed to fetch analytics' })
  }
})

export default router