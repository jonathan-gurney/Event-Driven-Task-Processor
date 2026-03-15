import { PrismaClient } from "@prisma/client";

// A shared Prisma client keeps connection management simple for this small project.
export const prisma = new PrismaClient();
