import express from "express";
import prisma from "../prisma.js";
import { protect, allowRoles } from "../middleware/authMiddleware.js";
import { notifyUser } from "../utils/notify.js";

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

    const isOwnerInstructor =
      req.user &&
      req.user.role === "INSTRUCTOR" &&
      course.instructorId === req.user.id;

    // Published OR enrolled student OR owning instructor (draft editing)
    if (!course.isPublished && !isEnrolled && !isOwnerInstructor) {
      return res.status(403).json({ message: "Course not available" });
    }

    const modules = await prisma.module.findMany({
      where: {
        courseId,
        ...(isOwnerInstructor ? {} : { isPublished: true }),
      },
      orderBy: { orderIndex: "asc" },
      include: {
        quiz: { select: { id: true, title: true } },
      },
    });

    const courseWithModules = { ...course, modules };

    // Check if enrollment expired
    if (enrollment && enrollment.expiresAt && new Date(enrollment.expiresAt) < new Date()) {
      return res.json({
        course: courseWithModules,
        isEnrolled: false,
        enrollmentExpired: true,
      });
    }

    return res.json({
      course: courseWithModules,
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

    const enrollmentCourseSelect = {
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
    };

    const calcExpiresAt = () => {
      if (!course.durationWeeks) return null;
      const d = new Date();
      d.setDate(d.getDate() + course.durationWeeks * 7);
      return d;
    };

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
      // Idempotent: active or completed — no error, same shape as success
      if (existing.status === "ACTIVE" || existing.status === "COMPLETED") {
        const enrollment = await prisma.enrollment.findUnique({
          where: {
            studentId_courseId: { studentId, courseId },
          },
          include: {
            course: { select: enrollmentCourseSelect },
          },
        });
        return res.status(200).json({
          message: "Already enrolled in this course",
          alreadyEnrolled: true,
          enrollment,
        });
      }

      // Dropped: allow enrolling again
      if (existing.status === "DROPPED") {
        const expiresAt = calcExpiresAt();
        const enrollment = await prisma.enrollment.update({
          where: {
            studentId_courseId: { studentId, courseId },
          },
          data: {
            status: "ACTIVE",
            enrolledAt: new Date(),
            expiresAt,
            completedAt: null,
            completionRate: 0,
          },
          include: {
            course: { select: enrollmentCourseSelect },
          },
        });
        await notifyUser({
          userId: studentId,
          title: `Welcome back to ${enrollment.course.title}`,
          message: `You're re-enrolled in "${enrollment.course.title}". Happy learning!`,
          type: "ENROLLMENT",
          courseId,
          enrollmentId: enrollment.id,
        });

        return res.status(200).json({
          message: "Successfully re-enrolled in course",
          enrollment,
        });
      }

      // Expired (or other non-active states): explicit conflict
      return res.status(409).json({
        code: "ENROLLMENT_NOT_AVAILABLE",
        message:
          existing.status === "EXPIRED"
            ? "Your enrollment in this course has expired."
            : "You cannot enroll in this course in your current enrollment state.",
      });
    }

    const expiresAt = calcExpiresAt();

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
          select: enrollmentCourseSelect,
        },
      },
    });

    await notifyUser({
      userId: studentId,
      title: `Welcome to ${course.title}`,
      message: `You're enrolled in "${course.title}". Happy learning!`,
      type: "ENROLLMENT",
      courseId,
      enrollmentId: enrollment.id,
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

