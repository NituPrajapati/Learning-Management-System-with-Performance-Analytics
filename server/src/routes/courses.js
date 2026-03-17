import express from "express";
import prisma from "../prisma.js";
import { protect, allowRoles } from "../middleware/authMiddleware.js";

const router = express.Router();

// GET /api/courses - Public: Get all published courses (for homepage)
router.get("/", async (req, res) => {
  try {
    const courses = await prisma.course.findMany({
      where: {
        isPublished: true,
      },
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
        createdAt: "desc",
      },
    });

    return res.json({ courses });
  } catch (error) {
    console.error("Get courses error", error);
    return res.status(500).json({ message: "Failed to fetch courses" });
  }
});

// GET /api/courses/:id - Public: Get single course detail (if published or enrolled)
router.get("/:id", protect, async (req, res) => {
  try {
    const { id } = req.params;
    const courseId = parseInt(id);

    if (isNaN(courseId)) {
      return res.status(400).json({ message: "Invalid course ID" });
    }

    const course = await prisma.course.findUnique({
      where: { id: courseId },
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
        modules: {
          where: {
            isPublished: true,
          },
          orderBy: {
            orderIndex: "asc",
          },
        },
      },
    });

    if (!course) {
      return res.status(404).json({ message: "Course not found" });
    }

    // Check if user is enrolled (if logged in)
    let isEnrolled = false;
    let enrollment = null;
    if (req.user) {
      enrollment = await prisma.enrollment.findUnique({
        where: {
          studentId_courseId: {
            studentId: req.user.id,
            courseId: courseId,
          },
        },
      });
      isEnrolled = !!enrollment && enrollment.status === "ACTIVE";
    }

    // Only show course if published OR user is enrolled
    if (!course.isPublished && !isEnrolled) {
      return res.status(403).json({ message: "Course not available" });
    }

    // Check if enrollment expired
    if (enrollment && enrollment.expiresAt && new Date(enrollment.expiresAt) < new Date()) {
      return res.json({
        course,
        isEnrolled: false,
        enrollmentExpired: true,
      });
    }

    return res.json({
      course,
      isEnrolled,
      enrollment,
    });
  } catch (error) {
    console.error("Get course error", error);
    return res.status(500).json({ message: "Failed to fetch course" });
  }
});

// POST /api/courses/:id/enroll - Student: Enroll in a course
router.post("/:id/enroll", protect, allowRoles('STUDENT'), async (req, res) => {
  try {
    const { id } = req.params;
    const courseId = parseInt(id);
    const studentId = req.user.id;

    if (isNaN(courseId)) {
      return res.status(400).json({ message: "Invalid course ID" });
    }

    // Check if course exists and is published
    const course = await prisma.course.findUnique({
      where: { id: courseId },
    });

    if (!course) {
      return res.status(404).json({ message: "Course not found" });
    }

    if (!course.isPublished) {
      return res.status(400).json({ message: "Course is not available for enrollment" });
    }

    // Check if already enrolled
    const existing = await prisma.enrollment.findUnique({
      where: {
        studentId_courseId: {
          studentId,
          courseId,
        },
      },
    });

    if (existing) {
      return res.status(409).json({ message: "Already enrolled in this course" });
    }

    // Calculate expiration date (durationWeeks * 7 days)
    let expiresAt = null;
    if (course.durationWeeks) {
      expiresAt = new Date();
      expiresAt.setDate(expiresAt.getDate() + course.durationWeeks * 7);
    }
    // Create enrollment
    const enrollment = await prisma.enrollment.create({
      data: {
        studentId,
        courseId,
        expiresAt,
        status: "ACTIVE",
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
      message: "Successfully enrolled in course",
      enrollment,
    });
  } catch (error) {
    console.error("Enroll error", error);
    return res.status(500).json({ message: "Failed to enroll in course" });
  }
});

export default router;

