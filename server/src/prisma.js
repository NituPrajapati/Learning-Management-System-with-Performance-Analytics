import { PrismaClient, CourseType, CourseLevel, Role } from '@prisma/client'

const prisma = new PrismaClient()

export { CourseType, CourseLevel, Role }
export default prisma