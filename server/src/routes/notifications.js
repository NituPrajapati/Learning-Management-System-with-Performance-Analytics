import express from 'express'
import prisma from '../prisma.js'
import { protect } from '../middleware/authMiddleware.js'

const router = express.Router()

router.use(protect)

// Must be before /:id/read so "read-all" is not parsed as an id
router.patch('/read-all', async (req, res) => {
  try {
    await prisma.notification.updateMany({
      where: { userId: req.user.id, isRead: false },
      data:  { isRead: true }
    })
    return res.json({ message: 'All marked as read' })
  } catch (error) {
    return res.status(500).json({ message: 'Failed to update' })
  }
})

// GET all notifications
router.get('/', async (req, res) => {
  try {
    const notifications = await prisma.notification.findMany({
      where: { userId: req.user.id },
      orderBy: { createdAt: 'desc' },
      take: 20
    })

    const unreadCount = await prisma.notification.count({
      where: { userId: req.user.id, isRead: false }
    })

    return res.json({ notifications, unreadCount })
  } catch (error) {
    return res.status(500).json({ message: 'Failed to fetch notifications' })
  }
})

// PATCH mark one as read (only own notifications)
router.patch('/:id/read', async (req, res) => {
  try {
    const id = parseInt(req.params.id, 10)
    if (Number.isNaN(id)) {
      return res.status(400).json({ message: 'Invalid notification id' })
    }
    const updated = await prisma.notification.updateMany({
      where: { id, userId: req.user.id },
      data: { isRead: true }
    })
    if (updated.count === 0) {
      return res.status(404).json({ message: 'Notification not found' })
    }
    return res.json({ message: 'Marked as read' })
  } catch (error) {
    return res.status(500).json({ message: 'Failed to update' })
  }
})

export default router