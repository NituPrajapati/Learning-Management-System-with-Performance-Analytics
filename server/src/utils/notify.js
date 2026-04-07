import prisma from '../prisma.js'
import { emitNotificationRefresh } from '../socket.js'

export const notifyUser = async ({
  userId, title, message, type, courseId, moduleId, enrollmentId
}) => {
  try {
    await prisma.notification.create({
      data: {
        userId,
        title,
        message,
        type:         type         || 'INFO',
        courseId:     courseId     || null,
        moduleId:     moduleId     || null,
        enrollmentId: enrollmentId || null,
      }
    })
    emitNotificationRefresh(userId)
  } catch (error) {
    console.error('Notify user error:', error)
  }
}

export const notifyCourseStudents = async ({
  courseId, title, message, type, moduleId
}) => {
  try {
    const enrollments = await prisma.enrollment.findMany({
      where: { courseId, status: 'ACTIVE' },
      select: { studentId: true, id: true }
    })

    const notifications = enrollments.map(e => ({
      userId:   e.studentId,
      title,
      message,
      type:     type || 'INFO',
      courseId: courseId || null,
      moduleId: moduleId || null,
    }))

    if (notifications.length > 0) {
      await prisma.notification.createMany({ data: notifications })
      const seen = new Set()
      for (const e of enrollments) {
        if (!seen.has(e.studentId)) {
          seen.add(e.studentId)
          emitNotificationRefresh(e.studentId)
        }
      }
    }
  } catch (error) {
    console.error('Notify course students error:', error)
  }
}