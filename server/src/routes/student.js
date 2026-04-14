import express from "express";
import prisma from "../prisma.js";
import { protect, allowRoles } from "../middleware/authMiddleware.js";
import { applyDailyVisit } from "../utils/streak.js";
import { notifyExpiringSoonForStudent } from "../utils/expiringEnrollments.js";

const router = express.Router();

// All routes require authentication and student role
router.use(protect);
router.use(allowRoles('STUDENT'));

function clamp(n, min, max) {
  return Math.max(min, Math.min(max, n))
}

function gradeFromPercent(pct) {
  const p = Number(pct) || 0
  if (p >= 90) return 'A+'
  if (p >= 80) return 'A'
  if (p >= 70) return 'B'
  if (p >= 60) return 'C'
  if (p >= 50) return 'D'
  return 'E'
}

function suggestionFromWeakest(components) {
  // components: [{ key, label, score0to100 }]
  const sorted = [...components].sort((a, b) => a.score0to100 - b.score0to100)
  const weakest = sorted[0]
  if (!weakest) return 'Keep going — you are doing great.'
  if (weakest.key === 'completion') return 'Focus on completing modules consistently to improve overall performance.'
  if (weakest.key === 'quiz') return 'Revise concepts and practice quizzes to raise your scores.'
  if (weakest.key === 'engagement') return 'Increase daily learning streak and participate in course discussions to earn bonus points.'
  if (weakest.key === 'exam') return 'Prepare well for the next exam difficulty level and attempt it when ready.'
  return 'Work on consistency and practice to improve.'
}

// GET /api/student/me/report — overall performance report
router.get('/me/report', async (req, res) => {
  try {
    const studentId = req.user.id

    const student = await prisma.user.findUnique({
      where: { id: studentId },
      select: { id: true, name: true, email: true },
    })
    if (!student) return res.status(404).json({ message: 'Student not found' })

    const enrollments = await prisma.enrollment.findMany({
      where: { studentId, status: { not: 'DROPPED' } },
      include: { course: { select: { id: true, title: true } } },
      orderBy: { enrolledAt: 'desc' },
    })

    const streakRow = await prisma.studentProgress.findUnique({
      where: { studentId },
      select: { streak: true, lastVisit: true },
    })
    const streak = streakRow?.streak ?? 0

    const chatRows = await prisma.chatEngagement.findMany({
      where: { studentId },
      select: { courseId: true, score: true },
    })
    const chatByCourseId = new Map(chatRows.map((r) => [r.courseId, r.score]))

    // Bonus (10%): 5% streak + 5% chat, both capped.
    const streakBonus5 = clamp((streak / 10) * 5, 0, 5) // 10-day streak => full 5%

    const courseReports = await Promise.all(
      enrollments.map(async (e) => {
        const courseId = e.courseId

        // Quiz avg score: recompute from attempts for this course (more reliable than cached quizAvgScore).
        const quizAttempts = await prisma.quizAttempt.findMany({
          where: { studentId, quiz: { module: { courseId } } },
          select: { percentage: true },
        })
        const avgQuiz = quizAttempts.length
          ? quizAttempts.reduce((s, a) => s + a.percentage, 0) / quizAttempts.length
          : 0

        // Exam: best/latest attempt among difficulties (only one attempt each).
        const examAttempts = await prisma.courseExamAttempt.findMany({
          where: { studentId, exam: { courseId } },
          include: { exam: { select: { difficulty: true, title: true } } },
          orderBy: { submittedAt: 'desc' },
        })
        const bestExam = examAttempts[0] || null
        const examPct = bestExam?.percentage ?? 0
        const examDifficulty = bestExam?.exam?.difficulty ?? null

        // 50% factors: completion + quizzes (simple and transparent)
        const completionPct = Number(e.completionRate) || 0
        const factor50 =
          (clamp(completionPct, 0, 100) * 0.25) + // up to 25
          (clamp(avgQuiz, 0, 100) * 0.25)         // up to 25

        // Chat bonus 5% (per-course, scaled)
        const chatScore = chatByCourseId.get(courseId) ?? 0
        const chatBonus5 = clamp((chatScore / 50) * 5, 0, 5) // score 50 => full 5%

        const bonus10 = streakBonus5 + chatBonus5 // max 10

        // Exam 40%
        const exam40 = clamp(examPct, 0, 100) * 0.4

        const overall = clamp(factor50 + bonus10 + exam40, 0, 100)

        const components = [
          { key: 'completion', label: 'Completion', score0to100: completionPct },
          { key: 'quiz', label: 'Quizzes', score0to100: avgQuiz },
          { key: 'engagement', label: 'Streak & Chat', score0to100: (bonus10 / 10) * 100 },
          { key: 'exam', label: 'Exam', score0to100: examPct },
        ]

        const examLabel =
          examDifficulty === 'EASY'
            ? 'Good'
            : examDifficulty === 'INTERMEDIATE'
              ? 'Better'
              : examDifficulty === 'ADVANCED'
                ? 'Excellent'
                : 'Not attempted'

        return {
          courseId,
          courseTitle: e.course.title,
          completionRate: Math.round(completionPct),
          avgQuizScore: Math.round(avgQuiz),
          streak,
          chatEngagementScore: chatScore,
          bonus10: Math.round(bonus10),
          exam: bestExam
            ? {
                title: bestExam.exam?.title ?? null,
                difficulty: examDifficulty,
                percentage: Math.round(examPct),
                label: examLabel,
              }
            : null,
          breakdown: {
            factor50: Math.round(factor50),
            bonus10: Math.round(bonus10),
            exam40: Math.round(exam40),
          },
          overall: Math.round(overall),
          grade: gradeFromPercent(overall),
          suggestion: suggestionFromWeakest(components),
        }
      })
    )

    return res.json({
      student,
      streak: { streak, lastVisit: streakRow?.lastVisit ?? null },
      courses: courseReports,
    })
  } catch (e) {
    console.error('student report', e)
    return res.status(500).json({ message: 'Failed to build report' })
  }
})

// POST /api/student/me/daily-visit — streak + lastVisit (idempotent per UTC day for streak count)
router.post("/me/daily-visit", async (req, res) => {
  try {
    const result = await applyDailyVisit(req.user.id);
    return res.json(result);
  } catch (error) {
    console.error("Daily visit error", error);
    return res.status(500).json({ message: "Failed to update visit streak" });
  }
});

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

    try {
      await notifyExpiringSoonForStudent(req.user.id);
    } catch (e) {
      console.error("notifyExpiringSoonForStudent", e);
    }

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

// POST track progress
router.post('/progress', async (req, res) => {
  try {
    const { moduleId, courseId, action } = req.body
    const studentId = req.user.id

    if (action === 'MODULE_STARTED') {
      await prisma.moduleProgress.upsert({
        where: { studentId_moduleId: { studentId, moduleId } },
        update: { startedAt: new Date() },
        create: { studentId, moduleId, courseId }
      })
    }

    if (action === 'MODULE_COMPLETED') {
      await prisma.moduleProgress.upsert({
        where: { studentId_moduleId: { studentId, moduleId } },
        update: { isCompleted: true, completedAt: new Date() },
        create: {
          studentId, moduleId, courseId,
          isCompleted: true, completedAt: new Date()
        }
      })

      // Update completion rate
      const totalModules = await prisma.module.count({ where: { courseId } })
      const completedModules = await prisma.moduleProgress.count({
        where: { studentId, courseId, isCompleted: true }
      })
      const completionRate = (completedModules / totalModules) * 100

      await prisma.enrollment.update({
        where: { studentId_courseId: { studentId, courseId } },
        data: {
          completionRate,
          lastAccessedAt: new Date(),
          status: completionRate === 100 ? 'COMPLETED' : 'ACTIVE'
        }
      })
    }

    // Log activity
    await prisma.activityLog.create({
      data: { studentId, courseId, moduleId, action }
    })

    res.json({ message: 'Progress tracked' })
  } catch (error) {
    res.status(500).json({ message: 'Failed to track progress' })
  }
})
export default router;

