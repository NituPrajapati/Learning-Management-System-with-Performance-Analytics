
Object.defineProperty(exports, "__esModule", { value: true });

const {
  Decimal,
  objectEnumValues,
  makeStrictEnum,
  Public,
  getRuntime,
  skip
} = require('./runtime/index-browser.js')


const Prisma = {}

exports.Prisma = Prisma
exports.$Enums = {}

/**
 * Prisma Client JS version: 5.22.0
 * Query Engine version: 605197351a3c8bdd595af2d2a9bc3025bca48ea2
 */
Prisma.prismaVersion = {
  client: "5.22.0",
  engine: "605197351a3c8bdd595af2d2a9bc3025bca48ea2"
}

Prisma.PrismaClientKnownRequestError = () => {
  const runtimeName = getRuntime().prettyName;
  throw new Error(`PrismaClientKnownRequestError is unable to run in this browser environment, or has been bundled for the browser (running in ${runtimeName}).
In case this error is unexpected for you, please report it in https://pris.ly/prisma-prisma-bug-report`,
)};
Prisma.PrismaClientUnknownRequestError = () => {
  const runtimeName = getRuntime().prettyName;
  throw new Error(`PrismaClientUnknownRequestError is unable to run in this browser environment, or has been bundled for the browser (running in ${runtimeName}).
In case this error is unexpected for you, please report it in https://pris.ly/prisma-prisma-bug-report`,
)}
Prisma.PrismaClientRustPanicError = () => {
  const runtimeName = getRuntime().prettyName;
  throw new Error(`PrismaClientRustPanicError is unable to run in this browser environment, or has been bundled for the browser (running in ${runtimeName}).
In case this error is unexpected for you, please report it in https://pris.ly/prisma-prisma-bug-report`,
)}
Prisma.PrismaClientInitializationError = () => {
  const runtimeName = getRuntime().prettyName;
  throw new Error(`PrismaClientInitializationError is unable to run in this browser environment, or has been bundled for the browser (running in ${runtimeName}).
In case this error is unexpected for you, please report it in https://pris.ly/prisma-prisma-bug-report`,
)}
Prisma.PrismaClientValidationError = () => {
  const runtimeName = getRuntime().prettyName;
  throw new Error(`PrismaClientValidationError is unable to run in this browser environment, or has been bundled for the browser (running in ${runtimeName}).
In case this error is unexpected for you, please report it in https://pris.ly/prisma-prisma-bug-report`,
)}
Prisma.NotFoundError = () => {
  const runtimeName = getRuntime().prettyName;
  throw new Error(`NotFoundError is unable to run in this browser environment, or has been bundled for the browser (running in ${runtimeName}).
In case this error is unexpected for you, please report it in https://pris.ly/prisma-prisma-bug-report`,
)}
Prisma.Decimal = Decimal

/**
 * Re-export of sql-template-tag
 */
Prisma.sql = () => {
  const runtimeName = getRuntime().prettyName;
  throw new Error(`sqltag is unable to run in this browser environment, or has been bundled for the browser (running in ${runtimeName}).
In case this error is unexpected for you, please report it in https://pris.ly/prisma-prisma-bug-report`,
)}
Prisma.empty = () => {
  const runtimeName = getRuntime().prettyName;
  throw new Error(`empty is unable to run in this browser environment, or has been bundled for the browser (running in ${runtimeName}).
In case this error is unexpected for you, please report it in https://pris.ly/prisma-prisma-bug-report`,
)}
Prisma.join = () => {
  const runtimeName = getRuntime().prettyName;
  throw new Error(`join is unable to run in this browser environment, or has been bundled for the browser (running in ${runtimeName}).
In case this error is unexpected for you, please report it in https://pris.ly/prisma-prisma-bug-report`,
)}
Prisma.raw = () => {
  const runtimeName = getRuntime().prettyName;
  throw new Error(`raw is unable to run in this browser environment, or has been bundled for the browser (running in ${runtimeName}).
In case this error is unexpected for you, please report it in https://pris.ly/prisma-prisma-bug-report`,
)}
Prisma.validator = Public.validator

/**
* Extensions
*/
Prisma.getExtensionContext = () => {
  const runtimeName = getRuntime().prettyName;
  throw new Error(`Extensions.getExtensionContext is unable to run in this browser environment, or has been bundled for the browser (running in ${runtimeName}).
In case this error is unexpected for you, please report it in https://pris.ly/prisma-prisma-bug-report`,
)}
Prisma.defineExtension = () => {
  const runtimeName = getRuntime().prettyName;
  throw new Error(`Extensions.defineExtension is unable to run in this browser environment, or has been bundled for the browser (running in ${runtimeName}).
In case this error is unexpected for you, please report it in https://pris.ly/prisma-prisma-bug-report`,
)}

/**
 * Shorthand utilities for JSON filtering
 */
Prisma.DbNull = objectEnumValues.instances.DbNull
Prisma.JsonNull = objectEnumValues.instances.JsonNull
Prisma.AnyNull = objectEnumValues.instances.AnyNull

Prisma.NullTypes = {
  DbNull: objectEnumValues.classes.DbNull,
  JsonNull: objectEnumValues.classes.JsonNull,
  AnyNull: objectEnumValues.classes.AnyNull
}



/**
 * Enums
 */

exports.Prisma.TransactionIsolationLevel = makeStrictEnum({
  ReadUncommitted: 'ReadUncommitted',
  ReadCommitted: 'ReadCommitted',
  RepeatableRead: 'RepeatableRead',
  Serializable: 'Serializable'
});

exports.Prisma.UserScalarFieldEnum = {
  id: 'id',
  name: 'name',
  email: 'email',
  password: 'password',
  role: 'role',
  profileImage: 'profileImage',
  isActive: 'isActive',
  createdAt: 'createdAt',
  updatedAt: 'updatedAt'
};

exports.Prisma.CourseScalarFieldEnum = {
  id: 'id',
  title: 'title',
  description: 'description',
  thumbnail: 'thumbnail',
  durationWeeks: 'durationWeeks',
  courseType: 'courseType',
  level: 'level',
  isPublished: 'isPublished',
  instructorId: 'instructorId',
  createdAt: 'createdAt',
  updatedAt: 'updatedAt'
};

exports.Prisma.ModuleScalarFieldEnum = {
  id: 'id',
  title: 'title',
  description: 'description',
  orderIndex: 'orderIndex',
  contentType: 'contentType',
  contentUrl: 'contentUrl',
  contentText: 'contentText',
  duration: 'duration',
  isPublished: 'isPublished',
  courseId: 'courseId',
  createdAt: 'createdAt',
  updatedAt: 'updatedAt'
};

exports.Prisma.EnrollmentScalarFieldEnum = {
  id: 'id',
  studentId: 'studentId',
  courseId: 'courseId',
  enrolledAt: 'enrolledAt',
  expiresAt: 'expiresAt',
  completedAt: 'completedAt',
  status: 'status',
  completionRate: 'completionRate'
};

exports.Prisma.SavedCourseScalarFieldEnum = {
  id: 'id',
  studentId: 'studentId',
  courseId: 'courseId',
  createdAt: 'createdAt'
};

exports.Prisma.ModuleProgressScalarFieldEnum = {
  id: 'id',
  studentId: 'studentId',
  moduleId: 'moduleId',
  courseId: 'courseId',
  isCompleted: 'isCompleted',
  startedAt: 'startedAt',
  completedAt: 'completedAt',
  timeSpent: 'timeSpent'
};

exports.Prisma.QuizScalarFieldEnum = {
  id: 'id',
  title: 'title',
  moduleId: 'moduleId',
  timeLimit: 'timeLimit',
  passingScore: 'passingScore',
  maxAttempts: 'maxAttempts',
  createdAt: 'createdAt'
};

exports.Prisma.QuestionScalarFieldEnum = {
  id: 'id',
  quizId: 'quizId',
  questionText: 'questionText',
  questionType: 'questionType',
  orderIndex: 'orderIndex',
  marks: 'marks'
};

exports.Prisma.OptionScalarFieldEnum = {
  id: 'id',
  questionId: 'questionId',
  optionText: 'optionText',
  isCorrect: 'isCorrect'
};

exports.Prisma.QuizAttemptScalarFieldEnum = {
  id: 'id',
  studentId: 'studentId',
  quizId: 'quizId',
  score: 'score',
  totalMarks: 'totalMarks',
  percentage: 'percentage',
  isPassed: 'isPassed',
  attemptNumber: 'attemptNumber',
  startedAt: 'startedAt',
  submittedAt: 'submittedAt',
  answers: 'answers'
};

exports.Prisma.ActivityLogScalarFieldEnum = {
  id: 'id',
  studentId: 'studentId',
  courseId: 'courseId',
  moduleId: 'moduleId',
  action: 'action',
  metadata: 'metadata',
  createdAt: 'createdAt'
};

exports.Prisma.SortOrder = {
  asc: 'asc',
  desc: 'desc'
};

exports.Prisma.JsonNullValueInput = {
  JsonNull: Prisma.JsonNull
};

exports.Prisma.NullableJsonNullValueInput = {
  DbNull: Prisma.DbNull,
  JsonNull: Prisma.JsonNull
};

exports.Prisma.NullsOrder = {
  first: 'first',
  last: 'last'
};

exports.Prisma.JsonNullValueFilter = {
  DbNull: Prisma.DbNull,
  JsonNull: Prisma.JsonNull,
  AnyNull: Prisma.AnyNull
};
exports.Role = exports.$Enums.Role = {
  ADMIN: 'ADMIN',
  INSTRUCTOR: 'INSTRUCTOR',
  STUDENT: 'STUDENT'
};

exports.CourseType = exports.$Enums.CourseType = {
  FREE: 'FREE',
  PAID: 'PAID'
};

exports.CourseLevel = exports.$Enums.CourseLevel = {
  BEGINNER: 'BEGINNER',
  INTERMEDIATE: 'INTERMEDIATE',
  ADVANCED: 'ADVANCED'
};

exports.ContentType = exports.$Enums.ContentType = {
  VIDEO: 'VIDEO',
  PDF: 'PDF',
  TEXT: 'TEXT',
  LINK: 'LINK'
};

exports.EnrollmentStatus = exports.$Enums.EnrollmentStatus = {
  ACTIVE: 'ACTIVE',
  COMPLETED: 'COMPLETED',
  DROPPED: 'DROPPED',
  EXPIRED: 'EXPIRED'
};

exports.QuestionType = exports.$Enums.QuestionType = {
  MCQ: 'MCQ',
  TRUE_FALSE: 'TRUE_FALSE'
};

exports.ActivityType = exports.$Enums.ActivityType = {
  LOGIN: 'LOGIN',
  LOGOUT: 'LOGOUT',
  COURSE_ENROLLED: 'COURSE_ENROLLED',
  MODULE_STARTED: 'MODULE_STARTED',
  MODULE_COMPLETED: 'MODULE_COMPLETED',
  QUIZ_STARTED: 'QUIZ_STARTED',
  QUIZ_SUBMITTED: 'QUIZ_SUBMITTED',
  CONTENT_VIEWED: 'CONTENT_VIEWED'
};

exports.Prisma.ModelName = {
  User: 'User',
  Course: 'Course',
  Module: 'Module',
  Enrollment: 'Enrollment',
  SavedCourse: 'SavedCourse',
  ModuleProgress: 'ModuleProgress',
  Quiz: 'Quiz',
  Question: 'Question',
  Option: 'Option',
  QuizAttempt: 'QuizAttempt',
  ActivityLog: 'ActivityLog'
};

/**
 * This is a stub Prisma Client that will error at runtime if called.
 */
class PrismaClient {
  constructor() {
    return new Proxy(this, {
      get(target, prop) {
        let message
        const runtime = getRuntime()
        if (runtime.isEdge) {
          message = `PrismaClient is not configured to run in ${runtime.prettyName}. In order to run Prisma Client on edge runtime, either:
- Use Prisma Accelerate: https://pris.ly/d/accelerate
- Use Driver Adapters: https://pris.ly/d/driver-adapters
`;
        } else {
          message = 'PrismaClient is unable to run in this browser environment, or has been bundled for the browser (running in `' + runtime.prettyName + '`).'
        }
        
        message += `
If this is unexpected, please open an issue: https://pris.ly/prisma-prisma-bug-report`

        throw new Error(message)
      }
    })
  }
}

exports.PrismaClient = PrismaClient

Object.assign(exports, Prisma)
