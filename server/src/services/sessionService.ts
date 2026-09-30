import { prisma } from '../config/db.js';
import { ParkingSession, Vehicle } from '../types/index.js';
import { broadcastSlotUpdate, broadcastSessionNew, broadcastSessionUpdate } from './iotIngestService.js';

export class SessionService {
  async getSessions(filters?: { status?: string; vehiclePlate?: string; slotId?: string }): Promise<ParkingSession[]> {
    try {
      const andConditions: any[] = [];

      if (filters?.status && filters.status !== 'ALL') {
        andConditions.push({ status: filters.status });
      }

      if (filters?.vehiclePlate && filters.vehiclePlate.trim()) {
        const query = filters.vehiclePlate.trim();
        andConditions.push({
          OR: [
            { vehiclePlate: { contains: query, mode: 'insensitive' } },
            { sessionId: { contains: query, mode: 'insensitive' } },
            { id: { contains: query, mode: 'insensitive' } },
            { slot: { slotNumber: { contains: query, mode: 'insensitive' } } },
          ],
        });
      }

      if (filters?.slotId && filters.slotId !== 'ALL') {
        andConditions.push({
          OR: [
            { slotId: filters.slotId },
            { slot: { id: filters.slotId } },
            { slot: { slotNumber: { equals: filters.slotId, mode: 'insensitive' } } },
          ],
        });
      }

      const where = andConditions.length > 0 ? { AND: andConditions } : {};

      const dbSessions = await prisma.parkingSession.findMany({
        where,
        include: { slot: { include: { area: true, sensor: true } }, vehicle: true },
        orderBy: { entryTime: 'desc' },
      });
      return dbSessions as any;
    } catch (err: any) {
      console.error('Error fetching sessions from DB:', err.message);
      return [];
    }
  }

  async getActiveSessions(): Promise<ParkingSession[]> {
    return this.getSessions({ status: 'ACTIVE' });
  }

  async createManualSession(data: { slotId: string; vehiclePlate: string }): Promise<ParkingSession> {
    const slot = await prisma.parkingSlot.findFirst({
      where: { OR: [{ id: data.slotId }, { slotNumber: { equals: data.slotId, mode: 'insensitive' } }] },
      include: { area: true },
    });
    if (!slot) throw new Error(`Parking slot '${data.slotId}' not found in database.`);

    const cleanPlate = data.vehiclePlate.trim().toUpperCase();
    const ratePerHour = slot.area?.hourlyRate ?? 20.0;

    // 1. Create active session in PostgreSQL
    const newSession = await prisma.parkingSession.create({
      data: {
        id: `ses-${Date.now()}`,
        sessionId: `SES-${new Date().toISOString().slice(0, 10).replace(/-/g, '')}-${Math.floor(100 + Math.random() * 900)}`,
        slotId: slot.id,
        vehiclePlate: cleanPlate,
        entryTime: new Date(),
        feeAmount: ratePerHour,
        status: 'ACTIVE',
      },
      include: { slot: { include: { area: true } }, vehicle: true },
    });

    // 2. If there is an active reservation for this slot, transition it to OCCUPIED
    const activeRes = await prisma.reservation.findFirst({
      where: { slotId: slot.id, status: 'RESERVED' },
      orderBy: { createdAt: 'desc' },
    });
    if (activeRes) {
      await prisma.reservation.update({
        where: { id: activeRes.id },
        data: { status: 'OCCUPIED' },
      });
    }

    // 3. Update slot status to OCCUPIED in PostgreSQL
    const updatedSlot = await prisma.parkingSlot.update({
      where: { id: slot.id },
      data: {
        status: 'OCCUPIED',
        currentVehicle: cleanPlate,
        lastStatusChange: new Date(),
      },
      include: { sensor: true, area: true },
    });

    // 4. Create Notification
    const notif = await prisma.notification.create({
      data: {
        id: `notif-${Date.now()}`,
        title: `Manual Check-In: Bay ${slot.slotNumber}`,
        message: `Vehicle ${cleanPlate} checked in manually to Bay ${slot.slotNumber}. Rate: ₹${ratePerHour}/hr.`,
        severity: 'INFO',
        category: 'PARKING',
        isRead: false,
      },
    });

    // 5. Broadcast live WebSocket events
    broadcastSlotUpdate(updatedSlot);
    broadcastSessionNew(newSession);
    try {
      const { broadcastNotification } = await import('./iotIngestService.js');
      broadcastNotification(notif);
    } catch {}

    return newSession as any;
  }

  async completeSession(sessionId: string): Promise<ParkingSession | null> {
    const session = await prisma.parkingSession.findFirst({
      where: { OR: [{ id: sessionId }, { sessionId }] },
      include: { slot: { include: { area: true } } },
    });
    if (!session) return null;

    const exitTime = new Date();
    const durationMin = Math.max(1, Math.round((exitTime.getTime() - new Date(session.entryTime).getTime()) / (60 * 1000)));
    const ratePerHour = session.slot?.area?.hourlyRate ?? 20.0;
    const feeAmount = Math.max(ratePerHour, Math.round((durationMin / 60) * ratePerHour));

    // 1. Complete Session in PostgreSQL
    const completed = await prisma.parkingSession.update({
      where: { id: session.id },
      data: {
        exitTime,
        durationMin,
        feeAmount,
        status: 'COMPLETED',
      },
      include: { slot: { include: { area: true } }, vehicle: true },
    });

    // 2. If there was an occupied reservation, complete it
    const activeRes = await prisma.reservation.findFirst({
      where: { slotId: session.slotId, status: 'OCCUPIED' },
      orderBy: { createdAt: 'desc' },
    });
    if (activeRes) {
      await prisma.reservation.update({
        where: { id: activeRes.id },
        data: { status: 'COMPLETED' },
      });
    }

    // 3. Reset slot to AVAILABLE
    const updatedSlot = await prisma.parkingSlot.update({
      where: { id: session.slotId },
      data: {
        status: 'AVAILABLE',
        currentVehicle: null,
        lastStatusChange: new Date(),
      },
      include: { sensor: true, area: true },
    });

    // 4. Create Notification
    const notif = await prisma.notification.create({
      data: {
        id: `notif-${Date.now()}`,
        title: `Vehicle Departed: Bay ${updatedSlot.slotNumber}`,
        message: `Vehicle ${session.vehiclePlate} departed. Total Duration: ${durationMin} mins, Fee: ₹${feeAmount}.`,
        severity: 'INFO',
        category: 'PARKING',
        isRead: false,
      },
    });

    // 5. Broadcast live WebSocket events
    broadcastSlotUpdate(updatedSlot);
    broadcastSessionUpdate(completed);
    try {
      const { broadcastNotification } = await import('./iotIngestService.js');
      broadcastNotification(notif);
    } catch {}

    return completed as any;
  }
}

export class VehicleService {
  async getVehicles(search?: string): Promise<Vehicle[]> {
    try {
      const where: any = {};
      if (search) {
        where.OR = [
          { plateNumber: { contains: search, mode: 'insensitive' } },
          { ownerName: { contains: search, mode: 'insensitive' } },
          { model: { contains: search, mode: 'insensitive' } },
        ];
      }
      const vehicles = await prisma.vehicle.findMany({ where, orderBy: { createdAt: 'desc' } });
      return vehicles as any;
    } catch {
      return [];
    }
  }

  async createVehicle(data: {
    plateNumber: string;
    vehicleType?: string;
    ownerName?: string;
    ownerPhone?: string;
    color?: string;
    model?: string;
  }): Promise<Vehicle> {
    const newVehicle = await prisma.vehicle.create({
      data: {
        id: `veh-${Date.now()}`,
        plateNumber: data.plateNumber.toUpperCase(),
        vehicleType: data.vehicleType || 'Car',
        ownerName: data.ownerName || null,
        ownerPhone: data.ownerPhone || null,
        color: data.color || null,
        model: data.model || null,
      },
    });
    return newVehicle as any;
  }
}

export const sessionService = new SessionService();
export const vehicleService = new VehicleService();
