import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Seeding Smart Parking Database...');

  // 1. Seed Users
  await prisma.user.upsert({
    where: { email: 'superadmin@smartparking.io' },
    update: {
      password: 'superadmin123',
      role: 'SUPER_ADMIN',
    },
    create: {
      id: 'user-0',
      name: 'Super Administrator',
      email: 'superadmin@smartparking.io',
      role: 'SUPER_ADMIN',
      password: 'superadmin123',
    },
  });

  await prisma.user.upsert({
    where: { email: 'admin@smartparking.io' },
    update: {
      password: 'password123',
      role: 'ADMIN',
    },
    create: {
      id: 'user-1',
      name: 'Admin Officer',
      email: 'admin@smartparking.io',
      role: 'ADMIN',
      password: 'password123',
    },
  });

  await prisma.user.upsert({
    where: { email: 'operator@smartparking.io' },
    update: {
      password: 'password123',
      role: 'OPERATOR',
    },
    create: {
      id: 'user-2',
      name: 'Terminal Operator',
      email: 'operator@smartparking.io',
      role: 'OPERATOR',
      password: 'password123',
    },
  });

  // 2. Seed Parking Area
  const area = await prisma.parkingArea.upsert({
    where: { code: 'AREA-A' },
    update: {},
    create: {
      id: 'area-1',
      name: 'Smart Parking Bay',
      code: 'AREA-A',
      description: 'Hardware Demo Deck with Live IR Sensor',
      floorLevel: 0,
      totalSlots: 1,
      hourlyRate: 20.0,
    },
  });

  // 3. Seed Sensor
  const sensor = await prisma.sensor.upsert({
    where: { sensorCode: 'SENSOR-001' },
    update: {},
    create: {
      id: 'sensor-1',
      sensorCode: 'SENSOR-001',
      sensorType: 'INFRARED',
      connectionType: 'HTTP_REST',
      status: 'OFFLINE',
      ipAddress: 'USB-Serial COM3',
      macAddress: 'ARDUINO-UNO-01',
      firmwareVer: 'v1.0.0-arduino',
      batteryLevel: 100,
      thresholdCm: 50.0,
      lastSeen: new Date(0),
    },
  });

  // 4. Seed Slot
  await prisma.parkingSlot.upsert({
    where: { slotNumber: 'A-01' },
    update: {},
    create: {
      id: 'slot-1',
      slotNumber: 'A-01',
      areaId: area.id,
      sensorId: sensor.id,
      slotType: 'STANDARD',
      status: 'OFFLINE',
      isActive: true,
    },
  });

  console.log('✅ Seeding completed successfully!');
}

main()
  .catch((e) => {
    console.error('❌ Error during seeding:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
