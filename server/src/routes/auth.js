import express from "express";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import prisma, { Role } from "../prisma.js";
import { authMiddleware } from "../middleware/authMiddleware.js";

const router = express.Router();

const signToken = (user) => {
  return jwt.sign(
    {
      id: user.id,
      email: user.email,
      role: user.role,
      name: user.name,
    },
    process.env.JWT_SECRET,
    {
      expiresIn: "7d",
    }
  );
};

router.post("/register", async (req, res) => {
  try {
    const { name, email, password } = req.body;

    if (!name || !email || !password) {
      return res.status(400).json({ message: "Name, email and password are required" });
    }

    const existing = await prisma.user.findUnique({ where: { email } });
    if (existing) {
      return res.status(409).json({ message: "User with this email already exists" });
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    // Always register as STUDENT
    const user = await prisma.user.create({
      data: {
        name,
        email,
        password: hashedPassword,
        role: Role.STUDENT,
      },
    });

    const token = signToken(user);

    return res.status(201).json({
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        role: user.role,
      },
      token,
    });
  } catch (error) {
    console.error("Register error", error);
    return res.status(500).json({ message: "Something went wrong during registration" });
  }
});

router.post("/login", async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ message: "Email and password are required" });
    }

    const user = await prisma.user.findUnique({ where: { email } });
    if (!user) {
      return res.status(401).json({ message: "Invalid credentials" });
    }

    if (user.isActive === false) {
      return res.status(403).json({ message: "Account is inactive. Please contact admin." });
    }

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return res.status(401).json({ message: "Invalid credentials" });
    }

    const token = signToken(user);

    return res.json({
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        role: user.role,
      },
      token,
    });
  } catch (error) {
    console.error("Login error", error);
    return res.status(500).json({ message: "Something went wrong during login" });
  }
});

// GET /api/auth/me - Current logged in user
router.get("/me", authMiddleware, async (req, res) => {
  try {
    const dbUser = await prisma.user.findUnique({
      where: { id: req.user.id },
      select: { id: true, name: true, email: true, role: true, isActive: true, createdAt: true },
    });

    if (!dbUser) return res.status(404).json({ message: "User not found" });
    return res.json({ user: dbUser });
  } catch (error) {
    console.error("Me error", error);
    return res.status(500).json({ message: "Failed to load current user" });
  }
});

export default router;


