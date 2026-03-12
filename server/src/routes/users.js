import express from "express";
import bcrypt from "bcryptjs";
import prisma, { Role } from "../prisma.js";
import { authMiddleware } from "../middleware/authMiddleware.js";
import { roleMiddleware } from "../middleware/authMiddleware.js";

const router = express.Router();

// All routes require authentication and admin role
router.use(authMiddleware);
router.use(roleMiddleware("ADMIN"));

// GET /api/users - Get all users
router.get("/", async (req, res) => {
  try {
    const users = await prisma.user.findMany({
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        isActive: true,
        createdAt: true,
        updatedAt: true,
      },
      orderBy: {
        createdAt: "desc",
      },
    });

    return res.json({ users });
  } catch (error) {
    console.error("Get all users error", error);
    return res.status(500).json({ message: "Failed to fetch users" });
  }
});

// GET /api/users/stats - Dashboard stats (admin)
router.get("/stats", async (req, res) => {
  try {
    const [
      totalUsers,
      activeUsers,
      inactiveUsers,
      totalStudents,
      totalInstructors,
      totalAdmins,
    ] = await Promise.all([
      prisma.user.count(),
      prisma.user.count({ where: { isActive: true } }),
      prisma.user.count({ where: { isActive: false } }),
      prisma.user.count({ where: { role: Role.STUDENT } }),
      prisma.user.count({ where: { role: Role.INSTRUCTOR } }),
      prisma.user.count({ where: { role: Role.ADMIN } }),
    ]);

    return res.json({
      totalUsers,
      activeUsers,
      inactiveUsers,
      totalStudents,
      totalInstructors,
      totalAdmins,
    });
  } catch (error) {
    console.error("User stats error", error);
    return res.status(500).json({ message: "Failed to fetch user stats" });
  }
});

// GET /api/users/:id - Single user detail (admin)
router.get("/:id", async (req, res) => {
  try {
    const userId = parseInt(req.params.id);
    if (isNaN(userId)) return res.status(400).json({ message: "Invalid user ID" });

    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        isActive: true,
        createdAt: true,
        updatedAt: true,
      },
    });

    if (!user) return res.status(404).json({ message: "User not found" });
    return res.json({ user });
  } catch (error) {
    console.error("Get user detail error", error);
    return res.status(500).json({ message: "Failed to fetch user" });
  }
});

// POST /api/users/create-instructor - Create new instructor (admin)
router.post("/create-instructor", async (req, res) => {
  try {
    const { name, email, password } = req.body;

    if (!name || !email || !password) {
      return res.status(400).json({
        message: "Name, email and password are required",
      });
    }

    // Check if user already exists
    const existing = await prisma.user.findUnique({ where: { email } });
    if (existing) {
      return res.status(409).json({
        message: "User with this email already exists",
      });
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(password, 10);

    // Create instructor
    const instructor = await prisma.user.create({
      data: {
        name,
        email,
        password: hashedPassword,
        role: Role.INSTRUCTOR,
        isActive: true,
      },
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        isActive: true,
        createdAt: true,
      },
    });

    return res.status(201).json({
      message: "Instructor created successfully",
      user: instructor,
    });
  } catch (error) {
    console.error("Create instructor error", error);
    return res.status(500).json({ message: "Failed to create instructor" });
  }
});

// PATCH /api/users/:id/role - Change user role (admin)
router.patch("/:id/role", async (req, res) => {
  try {
    const userId = parseInt(req.params.id);
    const { role } = req.body;

    if (isNaN(userId)) return res.status(400).json({ message: "Invalid user ID" });
    if (!role || typeof role !== "string") {
      return res.status(400).json({ message: "Role is required" });
    }

    // Only allow switching between STUDENT and INSTRUCTOR
    if (![Role.STUDENT, Role.INSTRUCTOR].includes(role)) {
      return res.status(400).json({ message: "Invalid role. Allowed: STUDENT, INSTRUCTOR" });
    }

    const target = await prisma.user.findUnique({
      where: { id: userId },
      select: { id: true, role: true },
    });
    if (!target) return res.status(404).json({ message: "User not found" });

    if (target.id === req.user.id) {
      return res.status(400).json({ message: "You cannot change your own role" });
    }

    if (target.role === Role.ADMIN) {
      return res.status(403).json({ message: "Cannot change admin role" });
    }

    const updated = await prisma.user.update({
      where: { id: userId },
      data: { role },
      select: { id: true, name: true, email: true, role: true, isActive: true, updatedAt: true },
    });

    return res.json({ message: "Role updated", user: updated });
  } catch (error) {
    console.error("Change role error", error);
    return res.status(500).json({ message: "Failed to change role" });
  }
});

// PATCH /api/users/:id/toggle-status - Toggle user active status
router.patch("/:id/toggle-status", async (req, res) => {
  try {
    const { id } = req.params;
    const userId = parseInt(id);

    if (isNaN(userId)) {
      return res.status(400).json({ message: "Invalid user ID" });
    }

    // Get current user
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { id: true, isActive: true, role: true },
    });

    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    // Prevent deactivating yourself
    if (user.id === req.user.id) {
      return res.status(400).json({
        message: "You cannot deactivate your own account",
      });
    }

    // Prevent deactivating other admins
    if (user.role === Role.ADMIN) {
      return res.status(403).json({
        message: "Cannot deactivate admin accounts",
      });
    }

    // Toggle status
    const updatedUser = await prisma.user.update({
      where: { id: userId },
      data: { isActive: !user.isActive },
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        isActive: true,
        updatedAt: true,
      },
    });

    return res.json({
      message: `User ${updatedUser.isActive ? "activated" : "deactivated"} successfully`,
      user: updatedUser,
    });
  } catch (error) {
    console.error("Toggle user status error", error);
    return res.status(500).json({ message: "Failed to toggle user status" });
  }
});

// DELETE /api/users/:id - Delete user
router.delete("/:id", async (req, res) => {
  try {
    const { id } = req.params;
    const userId = parseInt(id);

    if (isNaN(userId)) {
      return res.status(400).json({ message: "Invalid user ID" });
    }

    // Get user to check
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { id: true, role: true },
    });

    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    // Prevent deleting yourself
    if (user.id === req.user.id) {
      return res.status(400).json({
        message: "You cannot delete your own account",
      });
    }

    // Prevent deleting other admins
    if (user.role === Role.ADMIN) {
      return res.status(403).json({
        message: "Cannot delete admin accounts",
      });
    }

    // Delete user
    await prisma.user.delete({
      where: { id: userId },
    });

    return res.json({
      message: "User deleted successfully",
    });
  } catch (error) {
    console.error("Delete user error", error);
    return res.status(500).json({ message: "Failed to delete user" });
  }
});

export default router;

