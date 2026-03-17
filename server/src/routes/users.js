import express from 'express'
import {
  getAllUsers,
  getAdminStats,
  createInstructor,
  toggleUserStatus,
  deleteUser
} from '../controllers/user.controller.js'
import { protect } from '../middleware/authMiddleware.js'
import { allowRoles } from '../middleware/authMiddleware.js'
import prisma from '../prisma.js'

const router = express.Router()

router.use(protect, allowRoles('ADMIN'))

router.get('/stats', getAdminStats)
router.get('/', getAllUsers)
router.post('/create-instructor', createInstructor)
router.patch('/:id/toggle-status', toggleUserStatus)
router.delete('/:id', deleteUser)

// GET /api/users/courses - Admin: Get all courses
router.get('/courses', async (req, res) => {
  try {
    const courses = await prisma.course.findMany({
      select: {
        id: true,
        title: true,
        description: true,
        thumbnail: true,
        durationWeeks: true,
        courseType: true,
        level: true,
        price: true,
        isPublished: true,
        instructorId: true,
        createdAt: true,
        updatedAt: true,
        instructor: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
        _count: {
          select: {
            modules: true,
            enrollments: true,
          },
        },
      },
      orderBy: {
        createdAt: 'desc',
      },
    })

    return res.json({ courses })
  } catch (error) {
    console.error('Get all courses error', error)
    return res.status(500).json({ message: 'Failed to fetch courses' })
  }
})

export default router