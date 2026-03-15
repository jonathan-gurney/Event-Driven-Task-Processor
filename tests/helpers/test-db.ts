import { prisma } from "../../src/infrastructure/prisma.js";

export async function resetDatabase(): Promise<void> {
  await prisma.eventLog.deleteMany();
  await prisma.task.deleteMany();
}

export async function disconnectDatabase(): Promise<void> {
  await prisma.$disconnect();
}
