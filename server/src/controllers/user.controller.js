import bcrypt from 'bcryptjs'
import prisma from '../prisma.js'

export const getAllUsers = async (req, res) => {
  try {
    const users = await prisma.user.findMany({
      where: { role: { not: 'ADMIN' } }, // ✅ exclude admin
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        isActive: true,
        createdAt: true
      },
      orderBy: { createdAt: 'desc' }
    })
    res.json(users)
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message })
  }
}

export const getAdminStats = async (req, res) => {
  try {
    const [
      totalUsers,
      activeUsers,
      inactiveUsers,
      totalStudents,
      totalInstructors,
      totalAdmins
    ] = await Promise.all([
      prisma.user.count({ where: { role: { not: 'ADMIN' } } }),
      prisma.user.count({ where: { role: { not: 'ADMIN' }, isActive: true } }),
      prisma.user.count({ where: { role: { not: 'ADMIN' }, isActive: false } }),
      prisma.user.count({ where: { role: 'STUDENT' } }),
      prisma.user.count({ where: { role: 'INSTRUCTOR' } }),
      prisma.user.count({ where: { role: 'ADMIN' } })
    ])

    res.json({
      totalUsers,
      activeUsers,
      inactiveUsers,
      totalStudents,
      totalInstructors,
      totalAdmins
    })
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message })
  }
}

export const createInstructor = async (req, res) => {
  try {
    const { name, email, password } = req.body

    if (!name || !email || !password) {
      return res.status(400).json({ message: 'All fields are required' })
    }

    const existing = await prisma.user.findUnique({ where: { email } })
    if (existing) {
      return res.status(400).json({ message: 'Email already exists' })
    }

    const hashedPassword = await bcrypt.hash(password, 10)

    const instructor = await prisma.user.create({
      data: {
        name,
        email,
        password: hashedPassword,
        role: 'INSTRUCTOR' // always hardcoded
      },
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        isActive: true,
        createdAt: true
      }
    })

    res.status(201).json(instructor)
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message })
  }
}

export const toggleUserStatus = async (req, res) => {
  try {
    const userId = parseInt(req.params.id)
    const user = await prisma.user.findUnique({ where: { id: userId } })

    if (!user) return res.status(404).json({ message: 'User not found' })
    if (user.role === 'ADMIN') {
      return res.status(403).json({ message: 'Cannot deactivate admin' })
    }

    const updated = await prisma.user.update({
      where: { id: userId },
      data: { isActive: !user.isActive },
      select: { id: true, name: true, isActive: true }
    })

    res.json(updated)
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message })
  }
}

export const deleteUser = async (req, res) => {
  try {
    const userId = parseInt(req.params.id)
    const user = await prisma.user.findUnique({ where: { id: userId } })

    if (!user) return res.status(404).json({ message: 'User not found' })
    if (user.role === 'ADMIN') {
      return res.status(403).json({ message: 'Cannot delete admin' })
    }

    await prisma.user.delete({ where: { id: userId } })
    res.json({ message: 'User deleted successfully' })
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message })
  }
}