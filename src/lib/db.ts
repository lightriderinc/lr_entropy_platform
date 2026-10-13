import { PrismaClient } from "@prisma/client";

// Server-only. The entropy platform's own database: the "entropy" schema,
// reached as the entropy_app role (see prisma/schema.prisma). Singleton so
// dev hot-reload does not open a new pool per edit.
const globalForPrisma = globalThis as unknown as { entropyDb?: PrismaClient };

export const db = globalForPrisma.entropyDb ?? new PrismaClient();

if (process.env.NODE_ENV !== "production") globalForPrisma.entropyDb = db;
