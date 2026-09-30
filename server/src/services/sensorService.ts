import { prisma } from '../config/db.js';
import { Sensor, SensorStatus, SensorType, ConnectionType } from '../types/index.js';
import { broadcastSensorUpdate } from './iotIngestService.js';

export class SensorService {
  async getSensors(filters?: { status?: SensorStatus; type?: SensorType }): Promise<Sensor[]> {
    try {
      const where: any = {};
      if (filters?.status && (filters.status as string) !== 'ALL') {
        where.status = filters.status;
      }
      if (filters?.type && (filters.type as string) !== 'ALL') {
        where.sensorType = filters.type;
      }

      const dbSensors = await prisma.sensor.findMany({
        where,
        include: { slot: true },
        orderBy: { sensorCode: 'asc' },
      });

      return dbSensors as any;
    } catch (err: any) {
      console.error('Error fetching sensors from DB:', err.message);
      return [];
    }
  }

  async getSensorById(id: string): Promise<Sensor | null> {
    try {
      const sensor = await prisma.sensor.findFirst({
        where: {
          OR: [{ id }, { sensorCode: { equals: id, mode: 'insensitive' } }],
        },
        include: {
          slot: true,
          readings: {
            take: 20,
            orderBy: { timestamp: 'desc' },
          },
        },
      });
      return sensor as any;
    } catch {
      return null;
    }
  }

  async createSensor(data: {
    sensorCode: string;
    sensorType?: SensorType;
    connectionType?: ConnectionType;
    thresholdCm?: number;
    ipAddress?: string;
  }): Promise<Sensor> {
    const newSensor = await prisma.sensor.create({
      data: {
        id: `sensor-${Date.now()}`,
        sensorCode: data.sensorCode.toUpperCase(),
        sensorType: (data.sensorType as any) || 'ULTRASONIC',
        connectionType: (data.connectionType as any) || 'WIFI',
        status: 'ONLINE',
        ipAddress: data.ipAddress || `192.168.1.${Math.floor(100 + Math.random() * 150)}`,
        macAddress: `24:6F:28:${Math.floor(10 + Math.random() * 89)}:${Math.floor(10 + Math.random() * 89)}:${Math.floor(10 + Math.random() * 89)}`,
        firmwareVer: 'v1.2.0-esp32',
        batteryLevel: 100,
        lastReading: 180.0,
        thresholdCm: data.thresholdCm || 50.0,
        lastSeen: new Date(),
      },
      include: { slot: true },
    });
    broadcastSensorUpdate(newSensor);
    return newSensor as any;
  }

  async updateSensor(id: string, data: Partial<Sensor>): Promise<Sensor | null> {
    try {
      const existing = await prisma.sensor.findFirst({
        where: { OR: [{ id }, { sensorCode: { equals: id, mode: 'insensitive' } }] },
      });
      if (!existing) return null;

      const updated = await prisma.sensor.update({
        where: { id: existing.id },
        data: {
          status: data.status ? (data.status as any) : undefined,
          lastReading: data.lastReading !== undefined ? data.lastReading : undefined,
          batteryLevel: data.batteryLevel !== undefined ? data.batteryLevel : undefined,
          thresholdCm: data.thresholdCm !== undefined ? data.thresholdCm : undefined,
          ipAddress: data.ipAddress !== undefined ? data.ipAddress : undefined,
          firmwareVer: data.firmwareVer !== undefined ? data.firmwareVer : undefined,
          lastSeen: new Date(),
        },
        include: { slot: true },
      });
      broadcastSensorUpdate(updated);
      return updated as any;
    } catch {
      return null;
    }
  }

  async deleteSensor(id: string): Promise<boolean> {
    try {
      const existing = await prisma.sensor.findFirst({
        where: { OR: [{ id }, { sensorCode: { equals: id, mode: 'insensitive' } }] },
      });
      if (!existing) return false;
      await prisma.sensor.delete({ where: { id: existing.id } });
      return true;
    } catch {
      return false;
    }
  }

  async getRecentReadings(sensorId?: string, limit = 50) {
    try {
      return await prisma.sensorReading.findMany({
        where: sensorId ? { sensorId } : {},
        take: limit,
        orderBy: { timestamp: 'desc' },
      });
    } catch {
      return [];
    }
  }
}

export const sensorService = new SensorService();
