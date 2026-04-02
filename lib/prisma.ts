import { PrismaClient } from ".prisma/client";

function createPrismaClient() {
  return new PrismaClient({
    log: process.env.NODE_ENV === "development" ? ["warn", "error"] : ["error"],
  });
}

export const prisma =
  process.env.NODE_ENV === "production"
    ? createPrismaClient()
    : createPrismaClient();
