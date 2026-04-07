import prisma from '../prisma.js'

function startOfUTCDay(d) {
  return new Date(Date.UTC(d.getUTCFullYear(), d.getUTCMonth(), d.getUTCDate()))
}

/**
 * Daily streak: null lastVisit → 1; same UTC day → unchanged; previous UTC day → +1; else → 1.
 * Always refreshes lastVisit to now (idempotent for multiple calls same day).
 */
export async function applyDailyVisit(userId) {
  const now = new Date()
  const existing = await prisma.studentProgress.findUnique({ where: { studentId: userId } })
  const currentStreak = existing?.streak ?? 0
  const lastVisit = existing?.lastVisit

  const today = startOfUTCDay(now)
  let newStreak = currentStreak

  if (!lastVisit) {
    newStreak = 1
  } else {
    const lastDay = startOfUTCDay(new Date(lastVisit))
    const diffDays = Math.round((today.getTime() - lastDay.getTime()) / 86400000)
    if (diffDays === 0) {
      newStreak = currentStreak
    } else if (diffDays === 1) {
      newStreak = currentStreak + 1
    } else {
      newStreak = 1
    }
  }

  const row = await prisma.studentProgress.upsert({
    where: { studentId: userId },
    create: { studentId: userId, streak: newStreak, lastVisit: now },
    update: { streak: newStreak, lastVisit: now },
  })

  return { streak: row.streak, lastVisit: row.lastVisit }
}
