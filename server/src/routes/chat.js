import express from 'express'
import prisma from '../prisma.js'
import { protect } from '../middleware/authMiddleware.js'

const router = express.Router()
router.use(protect)

async function canAccessCourseChat(userId, role, courseId) {
  if (role === 'ADMIN') return true
  if (role === 'INSTRUCTOR') {
    const course = await prisma.course.findUnique({
      where: { id: courseId },
      select: { instructorId: true },
    })
    return !!course && course.instructorId === userId
  }
  if (role === 'STUDENT') {
    const enrollment = await prisma.enrollment.findUnique({
      where: { studentId_courseId: { studentId: userId, courseId } },
      select: { status: true, expiresAt: true },
    })
    if (!enrollment || enrollment.status !== 'ACTIVE') return false
    if (enrollment.expiresAt && new Date(enrollment.expiresAt) < new Date()) return false
    return true
  }
  return false
}

// GET /api/chat/:courseId/messages?cursor=<id>&limit=<n>
router.get('/:courseId/messages', async (req, res) => {
  try {
    const courseId = Number(req.params.courseId)
    const limit = Math.max(1, Math.min(50, Number(req.query.limit) || 20))
    const cursor = req.query.cursor ? Number(req.query.cursor) : null

    if (!Number.isFinite(courseId)) {
      return res.status(400).json({ message: 'Invalid course id' })
    }
    const allowed = await canAccessCourseChat(req.user.id, req.user.role, courseId)
    if (!allowed) return res.status(403).json({ message: 'No access to this course chat' })

    const where = {
      courseId,
      ...(cursor ? { id: { lt: cursor } } : {}),
    }

    const rows = await prisma.chatMessage.findMany({
      where,
      include: {
        sender: { select: { id: true, name: true, role: true } },
      },
      orderBy: { id: 'desc' },
      take: limit + 1,
    })

    const hasMore = rows.length > limit
    const trimmed = hasMore ? rows.slice(0, limit) : rows
    const messages = trimmed.reverse().map((m) => ({
      id: m.id,
      courseId: m.courseId,
      senderId: m.senderId,
      senderName: m.sender.name,
      senderRole: m.sender.role,
      message: m.message,
      replyToMessageId: m.replyToMessageId ?? null,
      createdAt: m.createdAt,
    }))

    return res.json({
      messages,
      nextCursor: hasMore ? trimmed[trimmed.length - 1].id : null,
      hasMore,
    })
  } catch (error) {
    console.error('Chat history error:', error)
    return res.status(500).json({ message: 'Failed to fetch chat history' })
  }
})

export default router

