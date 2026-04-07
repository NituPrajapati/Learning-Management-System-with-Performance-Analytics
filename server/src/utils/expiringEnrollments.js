import prisma from '../prisma.js'
import { notifyUser } from './notify.js'

const EXPIRY_TITLE = 'Course access expiring soon'

/** Mark ACTIVE enrollments past expiresAt as EXPIRED (runs on an interval). */
export async function expireStaleEnrollments() {
  const now = new Date()
  const r = await prisma.enrollment.updateMany({
    where: {
      status: 'ACTIVE',
      expiresAt: { lt: now },
    },
    data: { status: 'EXPIRED' },
  })
  return r.count
}

/**
 * Notify student once per ~36h per enrollment when access ends within 3 days.
 */
export async function notifyExpiringSoonForStudent(studentId) {
  const enrollments = await prisma.enrollment.findMany({
    where: {
      studentId,
      status: 'ACTIVE',
      expiresAt: { not: null },
    },
    include: {
      course: { select: { title: true } },
    },
  })

  const now = new Date()
  const windowMs = 3 * 86400000

  for (const e of enrollments) {
    const exp = new Date(e.expiresAt)
    const msLeft = exp.getTime() - now.getTime()
    if (msLeft <= 0 || msLeft > windowMs) continue

    const exists = await prisma.notification.findFirst({
      where: {
        userId: studentId,
        enrollmentId: e.id,
        title: EXPIRY_TITLE,
        createdAt: { gte: new Date(now.getTime() - 36 * 3600000) },
      },
    })
    if (exists) continue

    await notifyUser({
      userId: studentId,
      title: EXPIRY_TITLE,
      message: `Your access to "${e.course.title}" ends on ${exp.toLocaleDateString()}. Happy learning — wrap up before it expires!`,
      type: 'COURSE_EXPIRING',
      courseId: e.courseId,
      enrollmentId: e.id,
    })
  }
}
