import { PrismaClient } from "@prisma/client"

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined
}

export const prisma =
  globalForPrisma.prisma ??
  new PrismaClient({
    // Reduced logging - connection errors are handled by Supabase fallback
    log: process.env.NODE_ENV === "development" ? ["warn"] : ["error"],
    errorFormat: "minimal",
  })

if (process.env.NODE_ENV !== "production") {
  globalForPrisma.prisma = prisma
}
