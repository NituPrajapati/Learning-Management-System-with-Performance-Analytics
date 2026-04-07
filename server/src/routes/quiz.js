import express from 'express'
import prisma from '../prisma.js'
import { protect, allowRoles } from '../middleware/authMiddleware.js'
import { notifyCourseStudents, notifyUser } from '../utils/notify.js'

const router = express.Router()

async function assertStudentActiveEnrollment(studentId, courseId) {
  const enrollment = await prisma.enrollment.findUnique({
    where: {
      studentId_courseId: { studentId, courseId },
    },
  })
  if (!enrollment || enrollment.status !== 'ACTIVE') {
    return { ok: false, status: 403, message: 'Enroll in this course to access quizzes' }
  }
  if (enrollment.expiresAt && new Date(enrollment.expiresAt) < new Date()) {
    return { ok: false, status: 403, message: 'Your enrollment in this course has expired' }
  }
  return { ok: true }
}

// ─── Instructor Routes ───

// POST create quiz for a module
router.post('/module/:moduleId',
  protect,
  allowRoles('INSTRUCTOR', 'ADMIN'),
  async (req, res) => {
    try {
      const moduleId = parseInt(req.params.moduleId)
      const { title, timeLimit, passingScore, maxAttempts, questions } = req.body

      if (!title || !questions || questions.length === 0) {
        return res.status(400).json({ message: 'Title and questions are required' })
      }

      const module = await prisma.module.findUnique({
        where: { id: moduleId },
        include: { course: true }
      })

      if (!module) return res.status(404).json({ message: 'Module not found' })
      if (module.course.instructorId !== req.user.id && req.user.role !== 'ADMIN') {
        return res.status(403).json({ message: 'Not authorized' })
      }

      const existing = await prisma.quiz.findUnique({ where: { moduleId } })
      if (existing) {
        return res.status(409).json({ message: 'Quiz already exists for this module' })
      }

      const quiz = await prisma.quiz.create({
        data: {
          title,
          moduleId,
          timeLimit: timeLimit ? parseInt(timeLimit) : null,
          passingScore: passingScore ? parseInt(passingScore) : 60,
          maxAttempts: maxAttempts ? parseInt(maxAttempts) : 3,
          questions: {
            create: questions.map((q, index) => ({
              questionText: q.questionText,
              questionType: q.questionType || 'MCQ',
              orderIndex: index + 1,
              marks: q.marks || 1,
              options: {
                create: (q.options || []).map((o) => ({
                  optionText: o.optionText,
                  isCorrect: o.isCorrect
                }))
              }
            }))
          }
        },
        include: {
          questions: { include: { options: true } }
        }
      })

      await notifyCourseStudents({
        courseId: module.courseId,
        title: 'Quiz created',
        message: `A new quiz "${title}" was added for module "${module.title}". Open the course to take it.`,
        type: 'EXAM_REMINDER',
        moduleId
      })

      return res.status(201).json({ message: 'Quiz created', quiz })
    } catch (error) {
      console.error('Create quiz error:', error)
      return res.status(500).json({ message: 'Failed to create quiz' })
    }
  }
)

// GET quiz for instructor
router.get('/module/:moduleId/full',
  protect,
  allowRoles('INSTRUCTOR', 'ADMIN'),
  async (req, res) => {
    try {
      const quiz = await prisma.quiz.findUnique({
        where: { moduleId: parseInt(req.params.moduleId) },
        include: {
          questions: {
            orderBy: { orderIndex: 'asc' },
            include: { options: true }
          }
        }
      })
      if (!quiz) return res.status(404).json({ message: 'No quiz found' })
      return res.json({ quiz })
    } catch (error) {
      return res.status(500).json({ message: 'Failed to fetch quiz' })
    }
  }
)

// DELETE quiz
router.delete('/:quizId',
  protect,
  allowRoles('INSTRUCTOR', 'ADMIN'),
  async (req, res) => {
    try {
      await prisma.quiz.delete({ where: { id: parseInt(req.params.quizId) } })
      return res.json({ message: 'Quiz deleted' })
    } catch (error) {
      return res.status(500).json({ message: 'Failed to delete quiz' })
    }
  }
)

// ─── Student Routes ───

// GET quiz for student (must be enrolled; module must be published)
router.get('/module/:moduleId',
  protect,
  allowRoles('STUDENT'),
  async (req, res) => {
    try {
      const moduleId = parseInt(req.params.moduleId, 10)
      if (Number.isNaN(moduleId)) {
        return res.status(400).json({ message: 'Invalid module id' })
      }

      const mod = await prisma.module.findUnique({
        where: { id: moduleId },
        select: { courseId: true, isPublished: true },
      })
      if (!mod || !mod.isPublished) {
        return res.status(404).json({ message: 'Module not found' })
      }

      const gate = await assertStudentActiveEnrollment(req.user.id, mod.courseId)
      if (!gate.ok) {
        return res.status(gate.status).json({ message: gate.message })
      }

      const quiz = await prisma.quiz.findUnique({
        where: { moduleId },
        include: {
          questions: {
            orderBy: { orderIndex: 'asc' },
            include: {
              options: {
                select: {
                  id: true,
                  optionText: true
                }
              }
            }
          }
        }
      })
      if (!quiz) return res.status(404).json({ message: 'No quiz found' })
      return res.json({ quiz })
    } catch (error) {
      return res.status(500).json({ message: 'Failed to fetch quiz' })
    }
  }
)

// POST submit quiz
router.post('/:quizId/submit',
  protect,
  allowRoles('STUDENT'),
  async (req, res) => {
    try {
      const quizId = parseInt(req.params.quizId)
      const studentId = req.user.id
      const { answers, startedAt, timeTakenSec } = req.body

      const quiz = await prisma.quiz.findUnique({
        where: { id: quizId },
        include: {
          module: { select: { id: true, courseId: true, isPublished: true, title: true } },
          questions: { include: { options: true } }
        }
      })

      if (!quiz) return res.status(404).json({ message: 'Quiz not found' })
      if (!quiz.module?.isPublished) {
        return res.status(403).json({ message: 'This quiz is not available' })
      }

      const gate = await assertStudentActiveEnrollment(req.user.id, quiz.module.courseId)
      if (!gate.ok) {
        return res.status(gate.status).json({ message: gate.message })
      }

      const attemptCount = await prisma.quizAttempt.count({
        where: { quizId, studentId }
      })

      if (attemptCount >= quiz.maxAttempts) {
        return res.status(400).json({
          message: `Maximum ${quiz.maxAttempts} attempts reached`
        })
      }

      let score = 0
      let totalMarks = 0
      const gradedAnswers = []

      for (const question of quiz.questions) {
        totalMarks += question.marks

        const answer = (answers || []).find(a => a.questionId === question.id)

        if (answer) {
          const selectedOption = question.options.find(
            o => o.id === answer.selectedOptionId
          )
          const correctOption = question.options.find(o => o.isCorrect)
          const isCorrect = selectedOption?.isCorrect || false

          if (isCorrect) score += question.marks

          gradedAnswers.push({
            questionId: question.id,
            questionText: question.questionText,
            selectedOptionId: answer.selectedOptionId,
            correctOptionId: correctOption?.id,
            isCorrect,
            marks: isCorrect ? question.marks : 0
          })
        }
      }

      const percentage = totalMarks > 0 ? (score / totalMarks) * 100 : 0
      const isPassed = percentage >= quiz.passingScore
      const attemptNumber = attemptCount + 1

      const attempt = await prisma.quizAttempt.create({
        data: {
          studentId,
          quizId,
          score,
          totalMarks,
          percentage,
          isPassed,
          attemptNumber,
          startedAt: startedAt ? new Date(startedAt) : new Date(),
          submittedAt: new Date(),
          timeTakenSec: typeof timeTakenSec === 'number' ? Math.max(0, Math.floor(timeTakenSec)) : null,
          answers: gradedAnswers
        }
      })

      await prisma.activityLog.create({
        data: {
          studentId,
          action: 'QUIZ_SUBMITTED',
          metadata: { quizId, score, percentage, isPassed }
        }
      })

      await notifyUser({
        userId: studentId,
        title: `Quiz result: ${quiz.title}`,
        message: `You scored ${Math.round(percentage)}% on "${quiz.title}" (${quiz.module.title}). ${isPassed ? 'You passed — great job!' : 'Keep practicing and try again when you are ready.'}`,
        type: 'QUIZ_RESULT',
        courseId: quiz.module.courseId,
        moduleId: quiz.moduleId,
      })

      return res.json({
        message: isPassed ? 'Congratulations! You passed!' : 'Quiz submitted',
        attempt,
        score,
        totalMarks,
        percentage: Math.round(percentage),
        isPassed,
        passingScore: quiz.passingScore,
        gradedAnswers
      })
    } catch (error) {
      console.error('Submit quiz error:', error)
      return res.status(500).json({ message: 'Failed to submit quiz' })
    }
  }
)

// GET attempts
router.get('/:quizId/attempts',
  protect,
  allowRoles('STUDENT'),
  async (req, res) => {
    try {
      const attempts = await prisma.quizAttempt.findMany({
        where: {
          quizId: parseInt(req.params.quizId),
          studentId: req.user.id
        },
        orderBy: { startedAt: 'desc' }
      })
      return res.json({ attempts })
    } catch (error) {
      return res.status(500).json({ message: 'Failed to fetch attempts' })
    }
  }
)

export default router