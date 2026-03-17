import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import authRouter from "./routes/auth.js";
import usersRouter from "./routes/users.js";
import coursesRouter from "./routes/courses.js";
import instructorRouter from "./routes/instructor.js";
import studentRouter from "./routes/student.js";
import { authMiddleware } from "./middleware/authMiddleware.js";
import prisma from "./prisma.js";
import morgan from "morgan"

dotenv.config();

const app = express();

const PORT = process.env.PORT || 5000;

app.use(cors());
app.use(morgan("dev"))
app.use(express.json());

// Health check
app.get("/api/health", async (req, res) => {
  try {
    await prisma.$queryRaw`SELECT 1`;
    return res.json({ ok: true, message: "Server and DB are healthy" });
  } catch (error) {
    console.error("Health check failed", error);
    return res.status(500).json({ ok: false, error: "Database connection failed" });
  }
});

app.use("/api/auth", authRouter);
app.use("/api/users", usersRouter);
app.use("/api/courses", coursesRouter);
app.use("/api/instructor", instructorRouter);
app.use("/api/student", studentRouter);

// GET /api/auth/me - Get current logged in user (preferred endpoint)
app.get("/api/auth/me", authMiddleware, async (req, res) => {
  return res.json({ user: req.user });
});

app.use((err, req, res, next) => {
  console.error(err);
  res.status(err.status || 500).json({
    message: err.message || "Internal server error",
  });
});

app.listen(PORT, () => {
  console.log(`Server listening on port ${PORT}`);
});


