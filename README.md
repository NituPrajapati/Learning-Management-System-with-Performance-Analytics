# Learning Management System (LMS)

A full-stack Learning Management System with role-based access for **Admin**, **Instructor**, and **Student** users.

The project includes:
- Course creation, publishing, and owner-only course editing
- Student enrollment and saved courses
- Instructor module management (create + delete with Cloudinary cleanup)
- Video and PDF upload via Cloudinary (with size limits + validation)
- Student course viewer with tab navigation (Video, Notes, Chat, Quiz)
- Progress tracking + activity logs + analytics
- Real-time **course chat** and **notifications** using **Socket.IO**
- Course **Exams** (Easy -> Intermediate -> Advanced progression; one attempt each)
- Student **Performance Report** (breakdown + suggestions)

## Tech Stack

- **Frontend:** React, TypeScript, Vite, React Router, Zustand, React Query, Tailwind CSS, Axios, Video.js
- **Backend:** Node.js, Express, Prisma ORM, MySQL, JWT authentication, Multer, Cloudinary, Socket.IO

## Project Structure

```text
LMS/
  client/   # React + Vite frontend
  server/   # Express + Prisma backend
```

## Prerequisites

- Node.js 18+ (recommended 20+)
- npm
- MySQL database
- Cloudinary account (for video/PDF uploads)

## Environment Variables

Create environment files before running.

### 1) Backend (`server/.env`)

```env
PORT=5000
DATABASE_URL="mysql://USER:PASSWORD@localhost:3306/lms_db"
JWT_SECRET="your_jwt_secret"
JWT_EXPIRES_IN="1d"

CLOUDINARY_CLOUD_NAME="your_cloud_name"
CLOUDINARY_API_KEY="your_api_key"
CLOUDINARY_API_SECRET="your_api_secret"
```

### 2) Frontend (`client/.env`)

```env
VITE_API_BASE_URL=http://localhost:5000
```

## Installation

Install dependencies for both apps:

```bash
cd client
npm install

cd ../server
npm install
```

## Database Setup (Prisma)

From the `server` folder:

```bash
npm run prisma:generate
npm run prisma:migrate
```

Optional seed:

```bash
npm run prisma:seed
```

## Run the Project

Open two terminals.

### Terminal 1: Backend

```bash
cd server
npm run dev
```

### Terminal 2: Frontend

```bash
cd client
npm run dev
```

Frontend runs on Vite default URL (usually `http://localhost:5173`).

## Core Routes

### Auth
- `POST /api/auth/register`
- `POST /api/auth/login`
- `GET /api/auth/me`

### Instructor
- `GET /api/instructor/courses`
- `POST /api/instructor/courses`
- `PUT /api/instructor/courses/:id`
- `PATCH /api/instructor/courses/:id/publish`
- `POST /api/instructor/courses/:id/modules`
- `PUT /api/instructor/modules/:id`
- `DELETE /api/instructor/modules/:id` (deletes module + quiz; also deletes Cloudinary asset if `publicId` exists)
- `POST /api/instructor/upload/video`
- `POST /api/instructor/upload/pdf`

### Student
- `POST /api/student/me/daily-visit` (daily streak + last visit; idempotent per UTC day)
- `GET /api/student/me/enrollments`
- `GET /api/student/me/saved-courses`
- `POST /api/student/me/saved-courses/:courseId`
- `DELETE /api/student/me/saved-courses/:courseId`
- `POST /api/student/progress`
- `GET /api/student/me/report` (performance report)

### Exams
- `POST /api/exams/course/:courseId` (INSTRUCTOR/ADMIN)
- `GET /api/exams/course/:courseId` (STUDENT)
- `GET /api/exams/:examId` (STUDENT)
- `POST /api/exams/:examId/submit` (STUDENT, one attempt)

Exam rules (current):
- Instructors create exam with title, difficulty, duration, and full question/options payload.
- Exam duration validation: **1 to 180 minutes**.
- Difficulty unlock is currently by completing previous level attempt (Easy -> Intermediate -> Advanced).

### Chat
- `GET /api/chat/:courseId/messages?cursor=<id>&limit=<n>` (requires access to that course)

### Notifications
- `GET /api/notifications`
- `PATCH /api/notifications/:id/read`
- `PATCH /api/notifications/read-all`

### Analytics
- `GET /api/analytics/...` (see `server/src/routes/analytics.js`)

### Public/General
- `GET /api/health`
- `GET /api/courses`
- `GET /api/courses/:id`
- `POST /api/courses/:id/enroll`

## Real-time (Socket.IO)

Socket.IO is attached to the same HTTP server as Express.

- **Auth**: client connects with `auth: { token }` (JWT)
- **Rooms**:
  - `user:<userId>` for targeted notifications
  - `course:<courseId>` for course chat
- **Chat events**:
  - Client → Server: `join_room`, `leave_room`, `send_message`
  - Server → Room: `message_received`
- **Notification events**:
  - Server → User room: `notification:new` (client invalidates notifications query)

Access rules are enforced server-side:
- **Students**: must have an ACTIVE (non-expired) enrollment for the course
- **Instructors**: must be the course owner

## Frontend Navigation (Current)

- `/` Home
- `/login`, `/register`
- `/admin/dashboard`
- `/instructor/dashboard`
- `/instructor/chats` (select a course → join that course chat room)
- `/instructor/courses/:id` (add modules, create exams, delete modules, edit course details)
- `/student/dashboard`
- `/student/courses`
- `/student/courses/:id` (course viewer tabs: Video, Notes, Chat, Quiz + Course Exams)
- `/student/progress`
- `/student/report`

## Performance Report Formula

Report uses:

- **50% factors**: completion + quiz average (each contributes up to 25)
- **10% bonus**: streak (up to 5) + chat engagement (up to 5)
- **40% exam**: exam percentage × 0.4

Suggestion highlights the weakest area (completion / quizzes / engagement / exam).

## Timezone (IST)

Key UI timestamps are rendered in **IST** (`Asia/Kolkata`) for a consistent India-friendly experience.

## Useful Scripts

### Client
- `npm run dev` - start Vite dev server
- `npm run build` - production build
- `npm run lint` - lint frontend code

### Server
- `npm run dev` - start backend with nodemon
- `npm run start` - start backend normally
- `npm run prisma:migrate` - run migrations
- `npm run prisma:generate` - generate Prisma client
- `npm run prisma:seed` - seed data

## Notes

- Auth state is persisted in browser storage, so opening a new tab on the same browser origin reuses the last logged-in account.
- Upload limits are currently configured in backend:
  - Video: 100 MB
  - PDF: 50 MB
- Module `duration` field is used for **VIDEO** modules only in creation UI.

## License

ISC

