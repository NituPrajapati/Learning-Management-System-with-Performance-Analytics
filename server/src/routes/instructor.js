import express from "express";
import { protect, allowRoles } from "../middleware/authMiddleware.js";
import prisma from "../prisma.js";
import { uploadVideo, uploadPDF } from '../config/cloudinary.js'

const router = express.Router();

// All routes require authentication and instructor role
router.use(protect);
router.use(allowRoles('INSTRUCTOR'));

// GET /api/instructor/courses - Get all courses created by instructor
router.get("/courses", async (req, res) => {
  try {
    const courses = await prisma.course.findMany({
      where: {
        instructorId: req.user.id,
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
    console.error("Get instructor courses error", error);
    return res.status(500).json({ message: "Failed to fetch courses" });
  }
});

// POST /api/instructor/courses - Create new course
router.post("/courses", async (req, res) => {
  try {
    const { title, description, thumbnail, durationWeeks, courseType, level, price } = req.body;

    if (!title || !description) {
      return res.status(400).json({ message: "Title and description are required" });
    }

    // Generate slug from title (optional, can be null)
    const slug = title
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-*|-*$/g, '') || null;

    // Validate price for paid courses
    const finalPrice = courseType === 'PAID' && price ? parseFloat(price) : null;
    if (courseType === 'PAID' && (!price || finalPrice <= 0)) {
      return res.status(400).json({ message: "Price is required for paid courses and must be greater than 0" });
    }

    const course = await prisma.course.create({
      data: {
        title,
        slug,
        description,
        thumbnail: thumbnail || null,
        durationWeeks: durationWeeks ? parseInt(durationWeeks) : null,
        courseType: courseType || 'FREE',
        level: level || 'BEGINNER',
        price: finalPrice,
        instructorId: req.user.id,
        isPublished: false,
      },
    });

    return res.status(201).json({
      message: "Course created successfully",
      course,
    });
  } catch (error) {
    console.error("Create course error", error);
    return res.status(500).json({ message: "Failed to create course" });
  }
});

// PUT /api/instructor/courses/:id - Update course (only owner)
router.put("/courses/:id", async (req, res) => {
  try {
    const { id } = req.params;
    const courseId = parseInt(id);

    if (isNaN(courseId)) {
      return res.status(400).json({ message: "Invalid course ID" });
    }

    // Check ownership
    const existing = await prisma.course.findUnique({
      where: { id: courseId },
    });

    if (!existing) {
      return res.status(404).json({ message: "Course not found" });
    }

    if (existing.instructorId !== req.user.id) {
      return res.status(403).json({ message: "You don't have permission to edit this course" });
    }

    const { title, description, thumbnail, durationWeeks, courseType, level, price } = req.body;

    const updateData = {};
    if (title) {
      updateData.title = title;
      // Regenerate slug if title changes
      updateData.slug = title
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, '-')
        .replace(/^-*|-*$/g, '') || null;
    }
    if (description) updateData.description = description;
    if (thumbnail !== undefined) updateData.thumbnail = thumbnail;
    if (durationWeeks !== undefined) updateData.durationWeeks = durationWeeks ? parseInt(durationWeeks) : null;
    if (courseType && ['FREE', 'PAID'].includes(courseType)) {
      updateData.courseType = courseType;
      // Update price based on course type
      if (courseType === 'PAID') {
        const finalPrice = price ? parseFloat(price) : null;
        if (!finalPrice || finalPrice <= 0) {
          return res.status(400).json({ message: "Price is required for paid courses and must be greater than 0" });
        }
        updateData.price = finalPrice;
      } else {
        updateData.price = null;
      }
    }
    if (price !== undefined && courseType === 'PAID') {
      const finalPrice = parseFloat(price);
      if (finalPrice <= 0) {
        return res.status(400).json({ message: "Price must be greater than 0" });
      }
      updateData.price = finalPrice;
    }
    if (level && ['BEGINNER', 'INTERMEDIATE', 'ADVANCED'].includes(level)) updateData.level = level;

    const course = await prisma.course.update({
      where: { id: courseId },
      data: updateData,
    });

    return res.json({
      message: "Course updated successfully",
      course,
    });
  } catch (error) {
    console.error("Update course error", error);
    return res.status(500).json({ message: "Failed to update course" });
  }
});

// POST /api/instructor/courses/:id/modules - Add module to course
router.post("/courses/:id/modules", async (req, res) => {
  try {
    const { id } = req.params;
    const courseId = parseInt(id);

    if (isNaN(courseId)) {
      return res.status(400).json({ message: "Invalid course ID" });
    }

    // Check ownership
    const course = await prisma.course.findUnique({
      where: { id: courseId },
    });

    if (!course) {
      return res.status(404).json({ message: "Course not found" });
    }

    if (course.instructorId !== req.user.id) {
      return res.status(403).json({ message: "You don't have permission to add modules to this course" });
    }

    const { title, description, orderIndex, contentType, contentUrl, contentText, duration } = req.body;

    if (!title || !contentType) {
      return res.status(400).json({ message: "Title and contentType are required" });
    }

    // Get max orderIndex if not provided
    let finalOrderIndex = orderIndex;
    if (!finalOrderIndex) {
      const maxModule = await prisma.module.findFirst({
        where: { courseId },
        orderBy: { orderIndex: "desc" },
      });
      finalOrderIndex = maxModule ? maxModule.orderIndex + 1 : 1;
    }

    const module = await prisma.module.create({
      data: {
        title,
        description: description || null,
        orderIndex: finalOrderIndex,
        contentType,
        contentUrl: contentUrl || null,
        contentText: contentText || null,
        duration: duration ? parseInt(duration) : null,
        courseId,
        isPublished: false,
      },
    });

    return res.status(201).json({
      message: "Module added successfully",
      module,
    });
  } catch (error) {
    console.error("Add module error", error);
    return res.status(500).json({ message: "Failed to add module" });
  }
});

// PUT /api/instructor/modules/:id - Update module
router.put("/modules/:id", async (req, res) => {
  try {
    const { id } = req.params;
    const moduleId = parseInt(id);

    if (isNaN(moduleId)) {
      return res.status(400).json({ message: "Invalid module ID" });
    }

    // Check ownership via course
    const module = await prisma.module.findUnique({
      where: { id: moduleId },
      include: { course: true },
    });

    if (!module) {
      return res.status(404).json({ message: "Module not found" });
    }

    if (module.course.instructorId !== req.user.id) {
      return res.status(403).json({ message: "You don't have permission to edit this module" });
    }

    const { title, description, orderIndex, contentType, contentUrl, contentText, duration, isPublished } = req.body;

    const updated = await prisma.module.update({
      where: { id: moduleId },
      data: {
        ...(title && { title }),
        ...(description !== undefined && { description }),
        ...(orderIndex !== undefined && { orderIndex: parseInt(orderIndex) }),
        ...(contentType && { contentType }),
        ...(contentUrl !== undefined && { contentUrl }),
        ...(contentText !== undefined && { contentText }),
        ...(duration !== undefined && { duration: duration ? parseInt(duration) : null }),
        ...(isPublished !== undefined && { isPublished }),
      },
    });

    return res.json({
      message: "Module updated successfully",
      module: updated,
    });
  } catch (error) {
    console.error("Update module error", error);
    return res.status(500).json({ message: "Failed to update module" });
  }
});

// PATCH /api/instructor/courses/:id/publish - Publish/unpublish course
router.patch("/courses/:id/publish", async (req, res) => {
  try {
    const { id } = req.params;
    const courseId = parseInt(id);
    const { isPublished } = req.body;

    if (isNaN(courseId)) {
      return res.status(400).json({ message: "Invalid course ID" });
    }

    // Check ownership
    const course = await prisma.course.findUnique({
      where: { id: courseId },
    });

    if (!course) {
      return res.status(404).json({ message: "Course not found" });
    }

    if (course.instructorId !== req.user.id) {
      return res.status(403).json({ message: "You don't have permission to publish this course" });
    }

    const updated = await prisma.course.update({
      where: { id: courseId },
      data: { isPublished: isPublished === true },
    });

    return res.json({
      message: `Course ${updated.isPublished ? "published" : "unpublished"} successfully`,
      course: updated,
    });
  } catch (error) {
    console.error("Publish course error", error);
    return res.status(500).json({ message: "Failed to update course status" });
  }
});

// POST /api/instructor/upload/video
router.post('/upload/video',
  uploadVideo.single('video'),
  async (req, res) => {
    try {
      if (!req.file) {
        return res.status(400).json({ message: 'No video file uploaded' })
      }

      return res.status(201).json({
        url:          req.file.path,
        publicId:     req.file.filename,
        originalName: req.file.originalname,
        size:         req.file.size,
        format:       req.file.format || 'mp4'
      })
    } catch (error) {
      console.error('Video upload error:', error)
      return res.status(500).json({ message: 'Video upload failed' })
    }
  }
)

// POST /api/instructor/upload/pdf
router.post('/upload/pdf',
  uploadPDF.single('pdf'),
  async (req, res) => {
    try {
      if (!req.file) {
        return res.status(400).json({ message: 'No PDF file uploaded' })
      }

      return res.status(201).json({
        url:          req.file.path,
        publicId:     req.file.filename,
        originalName: req.file.originalname,
        size:         req.file.size
      })
    } catch (error) {
      console.error('PDF upload error:', error)
      return res.status(500).json({ message: 'PDF upload failed' })
    }
  }
)

export default router;

