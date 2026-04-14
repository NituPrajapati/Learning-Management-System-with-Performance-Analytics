import express from 'express'
import prisma from '../prisma.js'
import { protect, allowRoles } from '../middleware/authMiddleware.js'

const router = express.Router()

function difficultyOrder(d) {
  if (d === 'EASY') return 0
  if (d === 'INTERMEDIATE') return 1
  return 2 // ADVANCED
}

function parseTimeLimitMinutes(raw) {
  if (raw === null || raw === undefined || raw === '') return null
  const n = Number(raw)
  if (!Number.isFinite(n)) return { error: 'Time duration must be a number' }
  if (n <= 0) return { error: 'Time duration must be positive (minimum 1 minute)' }
  if (n > 180) return { error: 'Maximum exam duration is 180 minutes (3 hours)' }
  return Math.floor(n)
}

async function assertStudentActiveEnrollment(studentId, courseId) {
  const enrollment = await prisma.enrollment.findUnique({
    where: { studentId_courseId: { studentId, courseId } },
    select: { status: true, expiresAt: true },
  })
  if (!enrollment || enrollment.status !== 'ACTIVE') {
    return { ok: false, status: 403, message: 'Enroll in this course to access exams' }
  }
  if (enrollment.expiresAt && new Date(enrollment.expiresAt) < new Date()) {
    return { ok: false, status: 403, message: 'Your enrollment in this course has expired' }
  }
  return { ok: true }
}

async function canInstructorAccessCourse(instructorId, courseId, role) {
  if (role === 'ADMIN') return true
  const course = await prisma.course.findUnique({
    where: { id: courseId },
    select: { instructorId: true },
  })
  return !!course && course.instructorId === instructorId
}

// ─── Instructor: create course exam ───────────────────────────────
router.post(
  '/course/:courseId',
  protect,
  allowRoles('INSTRUCTOR', 'ADMIN'),
  async (req, res) => {
    try {
      const courseId = Number(req.params.courseId)
      const { title, timeLimit, difficulty, questions } = req.body

      if (!Number.isFinite(courseId)) return res.status(400).json({ message: 'Invalid course id' })
      if (!title || !difficulty) return res.status(400).json({ message: 'Title and difficulty are required' })
      if (!Array.isArray(questions) || questions.length === 0) {
        return res.status(400).json({ message: 'Questions are required' })
      }
      const parsedTimeLimit = parseTimeLimitMinutes(timeLimit)
      if (typeof parsedTimeLimit === 'object' && parsedTimeLimit?.error) {
        return res.status(400).json({ message: parsedTimeLimit.error })
      }

      for (let i = 0; i < questions.length; i += 1) {
        const q = questions[i]
        if (!q?.questionText || !String(q.questionText).trim()) {
          return res.status(400).json({ message: `Question ${i + 1} text is required` })
        }
        if (!Array.isArray(q.options) || q.options.length < 2) {
          return res.status(400).json({ message: `Question ${i + 1} must have at least 2 options` })
        }
        const correctCount = q.options.filter((o) => o && o.isCorrect).length
        if (correctCount !== 1) {
          return res.status(400).json({ message: `Question ${i + 1} must have exactly one correct option` })
        }
        const hasEmptyOption = q.options.some((o) => !o?.optionText || !String(o.optionText).trim())
        if (hasEmptyOption) {
          return res.status(400).json({ message: `Question ${i + 1} has empty option text` })
        }
        if (Number(q.marks) <= 0) {
          return res.status(400).json({ message: `Question ${i + 1} marks must be positive` })
        }
      }

      const ok = await canInstructorAccessCourse(req.user.id, courseId, req.user.role)
      if (!ok) return res.status(403).json({ message: 'Not authorized' })

      // one exam per difficulty per course
      const existing = await prisma.courseExam.findFirst({
        where: { courseId, difficulty },
        select: { id: true },
      })
      if (existing) {
        return res.status(409).json({ message: `An exam already exists for ${difficulty}` })
      }

      const exam = await prisma.courseExam.create({
        data: {
          courseId,
          title,
          difficulty,
          timeLimit: parsedTimeLimit,
          questions: {
            create: questions.map((q, index) => ({
              questionText: q.questionText,
              questionType: q.questionType || 'MCQ',
              orderIndex: index + 1,
              marks: q.marks || 1,
              options: {
                create: (q.options || []).map((o) => ({
                  optionText: o.optionText,
                  isCorrect: o.isCorrect,
                })),
              },
            })),
          },
        },
        include: {
          questions: { include: { options: true }, orderBy: { orderIndex: 'asc' } },
        },
      })

      return res.status(201).json({ exam })
    } catch (e) {
      console.error('create exam', e)
      return res.status(500).json({ message: 'Failed to create exam' })
    }
  }
)

// ─── Student: list exams for course (status + locks) ──────────────
router.get(
  '/course/:courseId',
  protect,
  allowRoles('STUDENT'),
  async (req, res) => {
    try {
      const courseId = Number(req.params.courseId)
      if (!Number.isFinite(courseId)) return res.status(400).json({ message: 'Invalid course id' })

      const gate = await assertStudentActiveEnrollment(req.user.id, courseId)
      if (!gate.ok) return res.status(gate.status).json({ message: gate.message })

      const exams = await prisma.courseExam.findMany({
        where: { courseId },
        orderBy: { createdAt: 'asc' },
        select: { id: true, title: true, difficulty: true, timeLimit: true, createdAt: true },
      })

      const attempts = await prisma.courseExamAttempt.findMany({
        where: { studentId: req.user.id, exam: { courseId } },
        select: { examId: true, percentage: true, totalMarks: true, score: true, submittedAt: true },
      })

      const attemptedByExamId = new Map(attempts.map((a) => [a.examId, a]))
      const completedDifficulties = new Set(
        exams
          .filter((ex) => attemptedByExamId.has(ex.id))
          .map((ex) => ex.difficulty)
      )

      // Unlock rule: EASY always unlocked if exists.
      // INTERMEDIATE unlocked only if EASY attempted.
      // ADVANCED unlocked only if INTERMEDIATE attempted.
      const canAccessDifficulty = (d) => {
        if (d === 'EASY') return true
        if (d === 'INTERMEDIATE') return completedDifficulties.has('EASY')
        return completedDifficulties.has('INTERMEDIATE')
      }

      return res.json({
        exams: exams.map((ex) => {
          const attempt = attemptedByExamId.get(ex.id) || null
          return {
            ...ex,
            locked: !canAccessDifficulty(ex.difficulty),
            attempted: !!attempt,
            attempt,
          }
        }),
      })
    } catch (e) {
      console.error('list exams', e)
      return res.status(500).json({ message: 'Failed to fetch exams' })
    }
  }
)

// ─── Student: fetch exam questions (if unlocked, not yet attempted) ─
router.get(
  '/:examId',
  protect,
  allowRoles('STUDENT'),
  async (req, res) => {
    try {
      const examId = Number(req.params.examId)
      if (!Number.isFinite(examId)) return res.status(400).json({ message: 'Invalid exam id' })

      const exam = await prisma.courseExam.findUnique({
        where: { id: examId },
        include: {
          course: { select: { id: true } },
          questions: {
            orderBy: { orderIndex: 'asc' },
            include: { options: { select: { id: true, optionText: true } } },
          },
        },
      })
      if (!exam) return res.status(404).json({ message: 'Exam not found' })

      const gate = await assertStudentActiveEnrollment(req.user.id, exam.courseId)
      if (!gate.ok) return res.status(gate.status).json({ message: gate.message })

      const prior = await prisma.courseExamAttempt.findUnique({
        where: { studentId_examId: { studentId: req.user.id, examId } },
        select: { id: true },
      })
      if (prior) return res.status(400).json({ message: 'You have already attempted this exam' })

      // progression gating
      if (exam.difficulty !== 'EASY') {
        const all = await prisma.courseExam.findMany({
          where: { courseId: exam.courseId },
          select: { id: true, difficulty: true },
        })
        const need = exam.difficulty === 'INTERMEDIATE' ? 'EASY' : 'INTERMEDIATE'
        const prereq = all.find((x) => x.difficulty === need)
        if (prereq) {
          const prereqAttempt = await prisma.courseExamAttempt.findUnique({
            where: { studentId_examId: { studentId: req.user.id, examId: prereq.id } },
            select: { id: true },
          })
          if (!prereqAttempt) {
            return res.status(403).json({ message: `Complete the ${need} exam first` })
          }
        }
      }

      return res.json({
        exam: {
          id: exam.id,
          courseId: exam.courseId,
          title: exam.title,
          difficulty: exam.difficulty,
          timeLimit: exam.timeLimit,
          questions: exam.questions,
        },
      })
    } catch (e) {
      console.error('get exam', e)
      return res.status(500).json({ message: 'Failed to fetch exam' })
    }
  }
)

// ─── Student: submit exam (one attempt) ────────────────────────────
router.post(
  '/:examId/submit',
  protect,
  allowRoles('STUDENT'),
  async (req, res) => {
    try {
      const examId = Number(req.params.examId)
      if (!Number.isFinite(examId)) return res.status(400).json({ message: 'Invalid exam id' })

      const { answers, startedAt, timeTakenSec } = req.body

      const exam = await prisma.courseExam.findUnique({
        where: { id: examId },
        include: {
          questions: { include: { options: true } },
        },
      })
      if (!exam) return res.status(404).json({ message: 'Exam not found' })

      const gate = await assertStudentActiveEnrollment(req.user.id, exam.courseId)
      if (!gate.ok) return res.status(gate.status).json({ message: gate.message })

      // single attempt
      const prior = await prisma.courseExamAttempt.findUnique({
        where: { studentId_examId: { studentId: req.user.id, examId } },
        select: { id: true },
      })
      if (prior) return res.status(400).json({ message: 'You have already attempted this exam' })

      // progression gating again (server-side)
      if (exam.difficulty !== 'EASY') {
        const all = await prisma.courseExam.findMany({
          where: { courseId: exam.courseId },
          select: { id: true, difficulty: true },
        })
        const need = exam.difficulty === 'INTERMEDIATE' ? 'EASY' : 'INTERMEDIATE'
        const prereq = all.find((x) => x.difficulty === need)
        if (prereq) {
          const prereqAttempt = await prisma.courseExamAttempt.findUnique({
            where: { studentId_examId: { studentId: req.user.id, examId: prereq.id } },
            select: { id: true },
          })
          if (!prereqAttempt) {
            return res.status(403).json({ message: `Complete the ${need} exam first` })
          }
        }
      }

      let score = 0
      let totalMarks = 0
      const gradedAnswers = []

      for (const q of exam.questions) {
        totalMarks += q.marks
        const ans = (answers || []).find((a) => a.questionId === q.id)
        if (!ans) continue
        const selected = q.options.find((o) => o.id === ans.selectedOptionId)
        const correct = q.options.find((o) => o.isCorrect)
        const isCorrect = !!selected?.isCorrect
        if (isCorrect) score += q.marks
        gradedAnswers.push({
          questionId: q.id,
          questionText: q.questionText,
          selectedOptionId: ans.selectedOptionId,
          correctOptionId: correct?.id,
          isCorrect,
          marks: isCorrect ? q.marks : 0,
        })
      }

      const percentage = totalMarks > 0 ? (score / totalMarks) * 100 : 0

      const attempt = await prisma.courseExamAttempt.create({
        data: {
          studentId: req.user.id,
          examId,
          score,
          totalMarks,
          percentage,
          timeTakenSec: typeof timeTakenSec === 'number' ? Math.max(0, Math.floor(timeTakenSec)) : null,
          answers: gradedAnswers,
          submittedAt: new Date(),
        },
      })

      await prisma.activityLog.create({
        data: {
          studentId: req.user.id,
          courseId: exam.courseId,
          action: 'QUIZ_SUBMITTED',
          metadata: { examId, kind: 'COURSE_EXAM', score, percentage: Math.round(percentage) },
        },
      })

      return res.json({
        attempt,
        score,
        totalMarks,
        percentage: Math.round(percentage),
        gradedAnswers,
      })
    } catch (e) {
      console.error('submit exam', e)
      return res.status(500).json({ message: 'Failed to submit exam' })
    }
  }
)

export default router

