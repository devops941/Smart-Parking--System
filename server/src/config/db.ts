import { PrismaClient } from '@prisma/client';

export const prisma = new PrismaClient({
  log: ['error'],
});

export let isPrismaAvailable = false;

export async function initDatabase(): Promise<{ isPrisma: boolean }> {
  try {
    await prisma.$connect();
    await prisma.$queryRaw`SELECT 1`;
    isPrismaAvailable = true;
    console.log('✅ Connected to PostgreSQL database via Prisma ORM');

    // Count live rows in database
    const [slotsCount, sensorsCount, areasCount] = await Promise.all([
      prisma.parkingSlot.count(),
      prisma.sensor.count(),
      prisma.parkingArea.count(),
    ]);

    console.log(`📦 PostgreSQL Database Active: ${slotsCount} slots, ${sensorsCount} sensors, ${areasCount} areas.`);
    return { isPrisma: true };
  } catch (err: any) {
    console.warn('⚠️ PostgreSQL connection notice:', err.message?.split('\n')[0]);
    isPrismaAvailable = false;
    return { isPrisma: false };
  }
}

export function getPrisma(): PrismaClient {
  return prisma;
}

export function checkPrismaAvailable(): boolean {
  return isPrismaAvailable;
}
