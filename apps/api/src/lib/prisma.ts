import { PrismaClient } from '@prisma/client';

// Single shared PrismaClient for the whole API process.
// Every service/middleware file previously created its own `new PrismaClient()`,
// meaning ~16 independent connection pools were opened against Supabase's
// pgbouncer pooler. Under repeated dev restarts (tsx watch) or sustained
// production load, that compounds until pgbouncer's max client ceiling
// (EMAXCONN) is hit. One shared instance = one pool for the entire process.
//
// In dev, tsx watch fully restarts the process on every file save, so a
// fresh client each time is fine. The risk is Node's module cache surviving
// across hot-reloads in some setups — guarding via globalThis avoids ever
// accidentally constructing a second client within the same process.
const globalForPrisma = globalThis as unknown as { prisma?: PrismaClient };

export const prisma = globalForPrisma.prisma ?? new PrismaClient();

if (process.env.NODE_ENV !== 'production') {
  globalForPrisma.prisma = prisma;
}
