import { prisma } from '../config/db.js';
import { ParkingArea, ParkingSlot, SlotStatus, SlotType } from '../types/index.js';
import { broadcastSlotUpdate, broadcastNotification } from './iotIngestService.js';

export class ParkingService {
  // --- Parking Areas ---
  async getAreas(): Promise<ParkingArea[]> {
    try {
      const dbAreas = await prisma.parkingArea.findMany({
        include: { slots: true },
        orderBy: { floorLevel: 'asc' },
      });
      return dbAreas.map(a => ({
        id: a.id,
        name: a.name,
        code: a.code,
        description: a.description,
        floorLevel: a.floorLevel,
        totalSlots: a.slots.length,
        hourlyRate: a.hourlyRate,
        slots: a.slots as any,
        createdAt: a.createdAt,
        updatedAt: a.updatedAt,
      }));
    } catch (err: any) {
      console.error('Error fetching areas from DB:', err.message);
      return [];
    }
  }

  async getAreaById(id: string): Promise<ParkingArea | null> {
    try {
      const area = await prisma.parkingArea.findFirst({
        where: { OR: [{ id }, { code: id }] },
        include: { slots: true },
      });
      if (!area) return null;
      return {
        id: area.id,
        name: area.name,
        code: area.code,
        description: area.description,
        floorLevel: area.floorLevel,
        totalSlots: area.slots.length,
        hourlyRate: area.hourlyRate,
        slots: area.slots as any,
        createdAt: area.createdAt,
        updatedAt: area.updatedAt,
      };
    } catch {
      return null;
    }
  }

  async createArea(data: { name: string; code: string; description?: string; floorLevel?: number; hourlyRate?: number }): Promise<ParkingArea> {
    const created = await prisma.parkingArea.create({
      data: {
        id: `area-${Date.now()}`,
        name: data.name,
        code: data.code.toUpperCase(),
        description: data.description || null,
        floorLevel: data.floorLevel ?? 0,
        hourlyRate: data.hourlyRate ?? 20.0,
      },
      include: { slots: true },
    });
    return {
      ...created,
      totalSlots: created.slots.length,
      slots: created.slots as any,
    };
  }

  async updateArea(id: string, data: Partial<ParkingArea>): Promise<ParkingArea | null> {
    try {
      const updated = await prisma.parkingArea.update({
        where: { id },
        data: {
          name: data.name,
          code: data.code ? data.code.toUpperCase() : undefined,
          description: data.description,
          floorLevel: data.floorLevel,
          hourlyRate: data.hourlyRate,
        },
        include: { slots: true },
      });
      return {
        ...updated,
        totalSlots: updated.slots.length,
        slots: updated.slots as any,
      };
    } catch {
      return null;
    }
  }

  async deleteArea(id: string): Promise<boolean> {
    try {
      await prisma.parkingArea.delete({ where: { id } });
      return true;
    } catch {
      return false;
    }
  }

  // --- Parking Slots ---
  async getSlots(filters?: { areaId?: string; status?: SlotStatus }): Promise<ParkingSlot[]> {
    try {
      const where: any = {};
      if (filters?.areaId && filters.areaId !== 'ALL') {
        where.areaId = filters.areaId;
      }
      if (filters?.status && (filters.status as string) !== 'ALL') {
        where.status = filters.status;
      }

      const dbSlots = await prisma.parkingSlot.findMany({
        where,
        include: { area: true, sensor: true },
        orderBy: { slotNumber: 'asc' },
      });

      return dbSlots.map(slot => ({
        id: slot.id,
        slotNumber: slot.slotNumber,
        areaId: slot.areaId,
        area: slot.area as any,
        sensorId: slot.sensorId,
        sensor: slot.sensor as any,
        slotType: slot.slotType as any,
        status: slot.status as any,
        currentVehicle: slot.currentVehicle,
        isActive: slot.isActive,
        lastStatusChange: slot.lastStatusChange,
        createdAt: slot.createdAt,
        updatedAt: slot.updatedAt,
      }));
    } catch (err: any) {
      console.error('Error fetching slots from DB:', err.message);
      return [];
    }
  }

  async getSlotById(id: string): Promise<ParkingSlot | null> {
    try {
      const slot = await prisma.parkingSlot.findFirst({
        where: {
          OR: [{ id }, { slotNumber: { equals: id, mode: 'insensitive' } }],
        },
        include: { area: true, sensor: true, sessions: { take: 10, orderBy: { entryTime: 'desc' } }, reservations: { take: 10, orderBy: { createdAt: 'desc' } } },
      });
      if (!slot) return null;
      return {
        id: slot.id,
        slotNumber: slot.slotNumber,
        areaId: slot.areaId,
        area: slot.area as any,
        sensorId: slot.sensorId,
        sensor: slot.sensor as any,
        slotType: slot.slotType as any,
        status: slot.status as any,
        currentVehicle: slot.currentVehicle,
        isActive: slot.isActive,
        lastStatusChange: slot.lastStatusChange,
        sessions: slot.sessions as any,
        createdAt: slot.createdAt,
        updatedAt: slot.updatedAt,
      };
    } catch {
      return null;
    }
  }

  async createSlot(data: { slotNumber: string; areaId: string; slotType?: SlotType; sensorId?: string }): Promise<ParkingSlot> {
    const created = await prisma.parkingSlot.create({
      data: {
        id: `slot-${Date.now()}`,
        slotNumber: data.slotNumber.toUpperCase(),
        areaId: data.areaId,
        slotType: (data.slotType as any) || 'STANDARD',
        status: 'AVAILABLE',
        isActive: true,
        sensorId: data.sensorId || null,
      },
      include: { area: true, sensor: true },
    });
    return created as any;
  }

  async updateSlot(id: string, data: Partial<ParkingSlot>): Promise<ParkingSlot | null> {
    try {
      const existing = await prisma.parkingSlot.findFirst({
        where: {
          OR: [{ id }, { slotNumber: { equals: id, mode: 'insensitive' } }],
        },
      });
      if (!existing) return null;

      const updated = await prisma.parkingSlot.update({
        where: { id: existing.id },
        data: {
          status: data.status ? (data.status as any) : undefined,
          currentVehicle: data.currentVehicle !== undefined ? data.currentVehicle : undefined,
          isActive: data.isActive !== undefined ? data.isActive : undefined,
          slotType: data.slotType ? (data.slotType as any) : undefined,
          sensorId: data.sensorId !== undefined ? data.sensorId : undefined,
          lastStatusChange: new Date(),
        },
        include: { area: true, sensor: true },
      });

      if (data.status === 'RESERVED') {
        const notif = await prisma.notification.create({
          data: {
            id: `notif-${Date.now()}`,
            title: `Bay ${updated.slotNumber} Reserved`,
            message: data.currentVehicle
              ? `Advance booking confirmed for ${data.currentVehicle}.`
              : `Bay ${updated.slotNumber} reserved successfully.`,
            severity: 'INFO',
            category: 'PARKING',
            isRead: false,
          },
        });
        broadcastNotification(notif);
      }

      broadcastSlotUpdate(updated);

      return updated as any;
    } catch (err: any) {
      console.error('Error updating slot in DB:', err.message);
      return null;
    }
  }

  async toggleSlotActive(id: string): Promise<ParkingSlot | null> {
    try {
      const slot = await prisma.parkingSlot.findUnique({ where: { id } });
      if (!slot) return null;
      const newActive = !slot.isActive;
      const newStatus = newActive ? 'AVAILABLE' : 'OFFLINE';

      const updated = await prisma.parkingSlot.update({
        where: { id },
        data: {
          isActive: newActive,
          status: newStatus as any,
          lastStatusChange: new Date(),
        },
        include: { area: true, sensor: true },
      });
      broadcastSlotUpdate(updated);
      return updated as any;
    } catch {
      return null;
    }
  }

  // --- Slot Reservations (PostgreSQL Database) ---
  async getReservations(filters?: { status?: string; vehiclePlate?: string; slotId?: string }) {
    try {
      const where: any = {};
      if (filters?.status && filters.status !== 'ALL') where.status = filters.status;
      if (filters?.vehiclePlate) where.vehiclePlate = { contains: filters.vehiclePlate, mode: 'insensitive' };
      if (filters?.slotId) where.slotId = filters.slotId;

      return await prisma.reservation.findMany({
        where,
        include: { slot: true },
        orderBy: { createdAt: 'desc' },
      });
    } catch (err: any) {
      console.error('Error fetching reservations from DB:', err.message);
      return [];
    }
  }

  async createReservation(data: {
    slotId: string;
    vehiclePlate: string;
    vehicleType?: string;
    driverName: string;
    driverPhone: string;
    startTime: string;
    endTime: string;
    durationMinutes?: number;
    estimatedFee?: number;
    bookingDate?: string;
  }) {
    // 1. Check if slot exists
    const slot = await prisma.parkingSlot.findFirst({
      where: { OR: [{ id: data.slotId }, { slotNumber: { equals: data.slotId, mode: 'insensitive' } }] },
    });

    if (!slot) {
      throw new Error(`Parking slot '${data.slotId}' not found in database.`);
    }

    if (slot.status === 'OCCUPIED') {
      throw new Error(`Slot ${slot.slotNumber} currently has an occupied vehicle.`);
    }

    const cleanPlate = data.vehiclePlate.trim().toUpperCase();
    const timeWindow = `${data.startTime} - ${data.endTime}`;
    const reservationTag = `${cleanPlate} [${timeWindow}]`;

    // 2. Create reservation in PostgreSQL
    const resCode = `RES-${new Date().toISOString().slice(0, 10).replace(/-/g, '')}-${Math.floor(100 + Math.random() * 900)}`;
    const newReservation = await prisma.reservation.create({
      data: {
        id: `res-${Date.now()}`,
        reservationCode: resCode,
        slotId: slot.id,
        slotNumber: slot.slotNumber,
        vehiclePlate: cleanPlate,
        vehicleType: data.vehicleType || 'Car',
        driverName: data.driverName,
        driverPhone: data.driverPhone,
        startTime: data.startTime,
        endTime: data.endTime,
        durationMinutes: data.durationMinutes || 60,
        estimatedFee: data.estimatedFee || 20.0,
        bookingDate: data.bookingDate || new Date().toISOString().slice(0, 10),
        status: 'RESERVED',
      },
      include: { slot: true },
    });

    // 3. Update slot status in PostgreSQL
    const updatedSlot = await prisma.parkingSlot.update({
      where: { id: slot.id },
      data: {
        status: 'RESERVED',
        currentVehicle: reservationTag,
        lastStatusChange: new Date(),
      },
      include: { area: true, sensor: true },
    });

    // 4. Create Notification in PostgreSQL
    const notif = await prisma.notification.create({
      data: {
        id: `notif-${Date.now()}`,
        title: `Bay ${slot.slotNumber} Reserved`,
        message: `Advance booking confirmed for ${cleanPlate} (${data.driverName}) for ${timeWindow}.`,
        severity: 'INFO',
        category: 'PARKING',
        isRead: false,
      },
    });

    // 5. Broadcast updates via WebSocket
    broadcastNotification(notif);
    broadcastSlotUpdate(updatedSlot);

    return newReservation;
  }

  async cancelReservation(id: string) {
    const reservation = await prisma.reservation.findFirst({
      where: { OR: [{ id }, { reservationCode: id }] },
    });

    if (!reservation) throw new Error('Reservation not found');

    const updatedReservation = await prisma.reservation.update({
      where: { id: reservation.id },
      data: { status: 'CANCELLED' },
      include: { slot: true },
    });

    // Reset slot back to AVAILABLE if it was reserved by this booking
    const slot = await prisma.parkingSlot.findUnique({ where: { id: reservation.slotId } });
    if (slot && slot.status === 'RESERVED') {
      const updatedSlot = await prisma.parkingSlot.update({
        where: { id: slot.id },
        data: {
          status: 'AVAILABLE',
          currentVehicle: null,
          lastStatusChange: new Date(),
        },
        include: { area: true, sensor: true },
      });
      broadcastSlotUpdate(updatedSlot);
    }

    return updatedReservation;
  }
}

export const parkingService = new ParkingService();
