import express from "express";
import prisma from "../prisma.js";
import { protect, allowRoles } from "../middleware/authMiddleware.js";

const router = express.Router();

// All routes require authentication and student role
router.use(protect);
router.use(allowRoles('STUDENT'));

// GET /api/student/me/enrollments - Get student's enrolled courses
router.get("/me/enrollments", async (req, res) => {
  try {
    const enrollments = await prisma.enrollment.findMany({
      where: {
        studentId: req.user.id,
      },
      include: {
        course: {
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
              },
            },
          },
        },
      },
      orderBy: {
        enrolledAt: "desc",
      },
    });

    // Check for expired enrollments
    const now = new Date();
    const processed = enrollments.map((enrollment) => {
      const isExpired =
        enrollment.expiresAt && new Date(enrollment.expiresAt) < now && enrollment.status === "ACTIVE";

      if (isExpired) {
        // Optionally update status to EXPIRED (async)
        prisma.enrollment
          .update({
            where: { id: enrollment.id },
            data: { status: "EXPIRED" },
          })
          .catch(console.error);
      }

      return {
        ...enrollment,
        isExpired,
        status: isExpired ? "EXPIRED" : enrollment.status,
      };
    });

    return res.json({ enrollments: processed });
  } catch (error) {
    console.error("Get enrollments error", error);
    return res.status(500).json({ message: "Failed to fetch enrollments" });
  }
});

// GET /api/student/me/saved-courses - Get student's saved/bookmarked courses
router.get("/me/saved-courses", async (req, res) => {
  try {
    const savedCourses = await prisma.savedCourse.findMany({
      where: {
        studentId: req.user.id,
      },
      include: {
        course: {
          include: {
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
        },
      },
      orderBy: {
        createdAt: "desc",
      },
    });

    return res.json({ savedCourses });
  } catch (error) {
    console.error("Get saved courses error", error);
    return res.status(500).json({ message: "Failed to fetch saved courses" });
  }
});

// POST /api/student/me/saved-courses/:courseId - Save/bookmark a course
router.post("/me/saved-courses/:courseId", async (req, res) => {
  try {
    const { courseId } = req.params;
    const id = parseInt(courseId);

    if (isNaN(id)) {
      return res.status(400).json({ message: "Invalid course ID" });
    }

    // Check if course exists
    const course = await prisma.course.findUnique({
      where: { id },
    });

    if (!course) {
      return res.status(404).json({ message: "Course not found" });
    }

    // Check if already saved
    const existing = await prisma.savedCourse.findUnique({
      where: {
        studentId_courseId: {
          studentId: req.user.id,
          courseId: id,
        },
      },
    });

    if (existing) {
      return res.status(409).json({ message: "Course already saved" });
    }

    const saved = await prisma.savedCourse.create({
      data: {
        studentId: req.user.id,
        courseId: id,
      },
      include: {
        course: {
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
                name: true,
              },
            },
          },
        },
      },
    });

    return res.status(201).json({
      message: "Course saved successfully",
      savedCourse: saved,
    });
  } catch (error) {
    console.error("Save course error", error);
    return res.status(500).json({ message: "Failed to save course" });
  }
});

// DELETE /api/student/me/saved-courses/:courseId - Unsave/unbookmark a course
router.delete("/me/saved-courses/:courseId", async (req, res) => {
  try {
    const { courseId } = req.params;
    const id = parseInt(courseId);

    if (isNaN(id)) {
      return res.status(400).json({ message: "Invalid course ID" });
    }

    const saved = await prisma.savedCourse.findUnique({
      where: {
        studentId_courseId: {
          studentId: req.user.id,
          courseId: id,
        },
      },
    });

    if (!saved) {
      return res.status(404).json({ message: "Saved course not found" });
    }

    await prisma.savedCourse.delete({
      where: {
        studentId_courseId: {
          studentId: req.user.id,
          courseId: id,
        },
      },
    });

    return res.json({ message: "Course unsaved successfully" });
  } catch (error) {
    console.error("Unsave course error", error);
    return res.status(500).json({ message: "Failed to unsave course" });
  }
});

export default router;

