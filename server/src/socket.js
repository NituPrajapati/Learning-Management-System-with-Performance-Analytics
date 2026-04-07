import { Server } from 'socket.io'
import jwt from 'jsonwebtoken'
import prisma from './prisma.js'

/** @type {import('socket.io').Server | null} */
let io = null

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

function engagementPointsByLength(text) {
  const len = (text || '').trim().length
  if (len < 20) return 2
  if (len <= 100) return 6
  return 12
}

export function initSocket(httpServer) {
  io = new Server(httpServer, {
    cors: {
      origin: true,
      credentials: true,
    },
  })

  io.use((socket, next) => {
    const token =
      socket.handshake.auth?.token ||
      (typeof socket.handshake.headers?.authorization === 'string'
        ? socket.handshake.headers.authorization.replace(/^Bearer\s+/i, '')
        : null)
    if (!token) {
      return next(new Error('Unauthorized'))
    }
    try {
      const decoded = jwt.verify(token, process.env.JWT_SECRET)
      socket.userId = decoded.id
      socket.userRole = decoded.role
      next()
    } catch {
      next(new Error('Unauthorized'))
    }
  })

  io.on('connection', async (socket) => {
    socket.join(`user:${socket.userId}`)

    socket.on('join_room', async ({ courseId }) => {
      const id = Number(courseId)
      if (!Number.isFinite(id)) return
      const allowed = await canAccessCourseChat(socket.userId, socket.userRole, id)
      if (!allowed) {
        socket.emit('chat_error', { message: 'No access to this room' })
        return
      }
      socket.join(`course:${id}`)
      socket.emit('joined_room', { courseId: id })
    })

    socket.on('leave_room', ({ courseId }) => {
      const id = Number(courseId)
      if (!Number.isFinite(id)) return
      socket.leave(`course:${id}`)
    })

    socket.on('send_message', async ({ courseId, message, replyToMessageId }) => {
      try {
        const id = Number(courseId)
        if (!Number.isFinite(id)) return
        const text = String(message || '').trim()
        if (!text) return

        const allowed = await canAccessCourseChat(socket.userId, socket.userRole, id)
        if (!allowed) {
          socket.emit('chat_error', { message: 'No access to this room' })
          return
        }

        const sender = await prisma.user.findUnique({
          where: { id: socket.userId },
          select: { id: true, name: true, role: true },
        })
        if (!sender) return

        const replyId = replyToMessageId ? Number(replyToMessageId) : null
        let replyTo = null
        if (replyId && Number.isFinite(replyId)) {
          replyTo = await prisma.chatMessage.findUnique({
            where: { id: replyId },
            select: { id: true, senderId: true, message: true, courseId: true },
          })
          if (!replyTo || replyTo.courseId !== id) {
            socket.emit('chat_error', { message: 'Invalid reply target' })
            return
          }
        }

        const created = await prisma.chatMessage.create({
          data: {
            courseId: id,
            senderId: sender.id,
            message: text,
            replyToMessageId: replyTo?.id ?? null,
          },
        })

        // Engagement scoring for students only.
        if (sender.role === 'STUDENT') {
          let points = engagementPointsByLength(text)
          if (replyTo && replyTo.senderId !== sender.id && /\?\s*$/.test(replyTo.message.trim())) {
            points += 10
          }
          await prisma.chatEngagement.upsert({
            where: { studentId_courseId: { studentId: sender.id, courseId: id } },
            create: { studentId: sender.id, courseId: id, score: points, lastScoreAt: new Date(), lastMessageAt: new Date() },
            update: { score: { increment: points }, lastScoreAt: new Date(), lastMessageAt: new Date() },
          })
        }

        io?.to(`course:${id}`).emit('message_received', {
          id: created.id,
          courseId: id,
          senderId: sender.id,
          senderName: sender.name,
          senderRole: sender.role,
          displayName: sender.role === 'INSTRUCTOR' ? `${sender.name} (INSTRUCTOR)` : sender.name,
          message: created.message,
          replyToMessageId: created.replyToMessageId ?? null,
          createdAt: created.createdAt,
        })
      } catch (e) {
        console.error('send_message error', e)
        socket.emit('chat_error', { message: 'Failed to send message' })
      }
    })
  })

  return io
}

export function getIO() {
  return io
}

/** Push to one user (after DB notification insert). */
export function emitNotificationRefresh(userId) {
  try {
    io?.to(`user:${userId}`).emit('notification:new', { refresh: true })
  } catch (e) {
    console.error('emitNotificationRefresh', e)
  }
}
