import pkg from "@prisma/client";

const { PrismaClient, Role } = pkg;

const prisma = new PrismaClient({});

export { Role };
export default prisma;