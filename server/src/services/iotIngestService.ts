import { Server as SocketIOServer } from 'socket.io';
import { prisma } from '../config/db.js';
import { ESP32Payload, ParkingSlot, Sensor } from '../types/index.js';

let ioInstance: SocketIOServer | null = null;

export function setSocketIO(io: SocketIOServer) {
  ioInstance = io;
}

export function getSocketIO(): SocketIOServer | null {
  return ioInstance;
}

export async function broadcastSlotUpdate(slot: any) {
  if (ioInstance) {
    ioInstance.emit('parking:slot-updated', {
      slotId: slot.id,
      slotNumber: slot.slotNumber,
      status: slot.status,
      currentVehicle: slot.currentVehicle,
      sensorId: slot.sensorId,
      lastStatusChange: slot.lastStatusChange,
      timestamp: new Date().toISOString(),
    });

    // Also broadcast updated summary metrics
    try {
      const metrics = await getDashboardMetrics();
      ioInstance.emit('dashboard:summary-updated', metrics);
    } catch {}
  }
}

export function broadcastNotification(notification: any) {
  if (ioInstance) {
    ioInstance.emit('notification:new', notification);
  }
}

export function broadcastSessionUpdate(session: any) {
  if (ioInstance) {
    ioInstance.emit('session:updated', session);
  }
}

export function broadcastSessionNew(session: any) {
  if (ioInstance) {
    ioInstance.emit('session:new', session);
  }
}

export function broadcastSensorUpdate(sensor: any) {
  if (ioInstance) {
    ioInstance.emit('sensor:reading-updated', {
      sensorId: sensor.id,
      sensorCode: sensor.sensorCode,
      status: sensor.status,
      lastReading: sensor.lastReading,
      batteryLevel: sensor.batteryLevel,
      lastSeen: sensor.lastSeen,
      timestamp: new Date().toISOString(),
    });
  }
}

export async function getDashboardMetrics() {
  try {
    const [slots, sensors, areas, sessions] = await Promise.all([
      prisma.parkingSlot.findMany(),
      prisma.sensor.findMany(),
      prisma.parkingArea.findMany(),
      prisma.parkingSession.findMany(),
    ]);

    const totalSlots = slots.length;
    const availableSlots = slots.filter(s => s.status === 'AVAILABLE').length;
    const occupiedSlots = slots.filter(s => s.status === 'OCCUPIED').length;
    const reservedSlots = slots.filter(s => s.status === 'RESERVED').length;
    const offlineSensors = sensors.filter(s => s.status === 'OFFLINE').length;
    const occupancyRate = totalSlots > 0 ? Math.round((occupiedSlots / totalSlots) * 100) : 0;
    const totalAreas = areas.length;
    const totalSensors = sensors.length;
    const onlineSensors = sensors.filter(s => s.status === 'ONLINE').length;
    const activeSessions = sessions.filter(s => s.status === 'ACTIVE').length;
    const completedSessions = sessions.filter(s => s.status === 'COMPLETED');
    const todayRevenue = sessions.reduce((acc, s) => acc + (s.feeAmount || 0), 0);
    const avgDuration = completedSessions.length > 0
      ? Math.round(completedSessions.reduce((acc, s) => acc + (s.durationMin || 0), 0) / completedSessions.length)
      : 0;

    return {
      totalSlots,
      availableSlots,
      occupiedSlots,
      reservedSlots,
      offlineSensors,
      occupancyRate,
      totalAreas,
      totalSensors,
      onlineSensors,
      activeSessions,
      todayTotalVehicles: sessions.length,
      todayRevenue,
      averageParkingDurationMin: avgDuration,
    };
  } catch (err: any) {
    return {
      totalSlots: 1,
      availableSlots: 0,
      occupiedSlots: 0,
      reservedSlots: 0,
      offlineSensors: 1,
      occupancyRate: 0,
      totalAreas: 1,
      totalSensors: 1,
      onlineSensors: 0,
      activeSessions: 0,
      todayTotalVehicles: 0,
      todayRevenue: 0,
      averageParkingDurationMin: 0,
    };
  }
}

export class IoTIngestService {
  async processSensorTelemetry(payload: ESP32Payload): Promise<{ success: boolean; slot?: any; sensor?: any; message: string }> {
    const { sensorId, slotId, distance, status, battery, rssi } = payload;
    const distanceVal = Number(distance);

    if (isNaN(distanceVal)) {
      return { success: false, message: 'Invalid distance reading provided' };
    }

    try {
      // 1. Locate or create sensor in PostgreSQL
      let sensor = await prisma.sensor.findFirst({
        where: {
          OR: [
            { sensorCode: { equals: sensorId, mode: 'insensitive' } },
            { id: sensorId },
          ],
        },
      });

      if (!sensor) {
        sensor = await prisma.sensor.create({
          data: {
            id: `sensor-${Date.now()}`,
            sensorCode: sensorId.toUpperCase(),
            sensorType: 'ULTRASONIC',
            connectionType: 'WIFI',
            status: 'ONLINE',
            batteryLevel: battery ?? 100,
            lastReading: distanceVal,
            thresholdCm: 50.0,
            lastSeen: new Date(),
          },
        });
      } else {
        sensor = await prisma.sensor.update({
          where: { id: sensor.id },
          data: {
            lastReading: distanceVal,
            status: 'ONLINE',
            lastSeen: new Date(),
            batteryLevel: battery !== undefined ? battery : sensor.batteryLevel,
          },
        });
      }

      // 2. Locate linked slot in PostgreSQL
      let slot = await prisma.parkingSlot.findFirst({
        where: {
          OR: [
            { sensorId: sensor.id },
            { sensor: { sensorCode: sensor.sensorCode } },
            ...(slotId ? [{ slotNumber: { equals: String(slotId), mode: 'insensitive' as const } }, { id: String(slotId) }] : []),
          ],
        },
        include: { sensor: true, area: true },
      });

      if (!slot && slotId) {
        slot = await prisma.parkingSlot.findFirst({
          where: { slotNumber: { equals: String(slotId), mode: 'insensitive' } },
          include: { sensor: true, area: true },
        });
        if (slot) {
          slot = await prisma.parkingSlot.update({
            where: { id: slot.id },
            data: { sensorId: sensor.id },
            include: { sensor: true, area: true },
          });
        }
      }

      // Determine state based on ultrasonic distance or status override
      const isOccupied = status ? status.toLowerCase() === 'occupied' : distanceVal < (sensor.thresholdCm || 50.0);
      const isExplicitReserved = status ? status.toLowerCase() === 'reserved' : false;

      let newSlotStatus: 'AVAILABLE' | 'OCCUPIED' | 'RESERVED' = 'AVAILABLE';
      if (isOccupied) {
        newSlotStatus = 'OCCUPIED';
      } else if (isExplicitReserved || slot?.status === 'RESERVED') {
        newSlotStatus = 'RESERVED';
      } else {
        newSlotStatus = 'AVAILABLE';
      }

      const prevStatus = slot?.status;
      const statusChanged = !prevStatus || prevStatus !== newSlotStatus;

      // 3. Record sensor reading in PostgreSQL ONLY when status changes (State Transition)
      if (statusChanged) {
        await prisma.sensorReading.create({
          data: {
            id: `read-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
            sensorId: sensor.id,
            slotId: slot ? slot.id : null,
            distanceCm: distanceVal,
            rawPayload: JSON.stringify(payload),
            isOccupied,
            rssi: rssi ?? -65,
            timestamp: new Date(),
          },
        });
        console.log(`💾 [DB Saved]: ${sensor.sensorCode} state changed from ${prevStatus || 'NONE'} -> ${newSlotStatus} (Distance: ${distanceVal}cm)`);
      }

      // 4. Update slot status and manage sessions in PostgreSQL
      if (slot) {
        const prevStatus = slot.status;
        if (prevStatus !== newSlotStatus) {
          let currentVehicle = slot.currentVehicle;

          if (newSlotStatus === 'OCCUPIED') {
            // Check if there is an active reservation for this slot
            const activeRes = await prisma.reservation.findFirst({
              where: { slotId: slot.id, status: 'RESERVED' },
              orderBy: { createdAt: 'desc' },
            });

            const samplePlate = activeRes
              ? activeRes.vehiclePlate
              : (slot.currentVehicle && !slot.currentVehicle.includes('[')
                ? slot.currentVehicle
                : `TN-${Math.floor(10 + Math.random() * 89)}-${String.fromCharCode(65 + Math.floor(Math.random() * 26))}${String.fromCharCode(65 + Math.floor(Math.random() * 26))}-${Math.floor(1000 + Math.random() * 9000)}`);
            
            if (activeRes) {
              await prisma.reservation.update({
                where: { id: activeRes.id },
                data: { status: 'OCCUPIED' },
              });
            }

            currentVehicle = samplePlate;

            const slotWithArea = await prisma.parkingSlot.findUnique({
              where: { id: slot.id },
              include: { area: true },
            });
            const ratePerHour = slotWithArea?.area?.hourlyRate ?? 20.0;

            // Create active parking session in PostgreSQL
            const createdSession = await prisma.parkingSession.create({
              data: {
                id: `ses-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
                sessionId: `SES-${new Date().toISOString().slice(0, 10).replace(/-/g, '')}-${Math.floor(100 + Math.random() * 900)}`,
                slotId: slot.id,
                vehiclePlate: samplePlate,
                entryTime: new Date(),
                status: 'ACTIVE',
                feeAmount: ratePerHour,
              },
              include: { slot: { include: { area: true, sensor: true } }, vehicle: true },
            });
            broadcastSessionNew(createdSession);
          } else if (newSlotStatus === 'AVAILABLE') {
            // Mark any occupied reservation as COMPLETED
            const occupiedRes = await prisma.reservation.findFirst({
              where: { slotId: slot.id, status: 'OCCUPIED' },
              orderBy: { createdAt: 'desc' },
            });
            if (occupiedRes) {
              await prisma.reservation.update({
                where: { id: occupiedRes.id },
                data: { status: 'COMPLETED' },
              });
            }

            // Find active session and complete it in PostgreSQL
            const activeSession = await prisma.parkingSession.findFirst({
              where: { slotId: slot.id, status: 'ACTIVE' },
              include: { slot: { include: { area: true } } },
            });

            if (activeSession) {
              const exitTime = new Date();
              const durationMin = Math.max(1, Math.round((exitTime.getTime() - new Date(activeSession.entryTime).getTime()) / (60 * 1000)));
              const ratePerHour = activeSession.slot?.area?.hourlyRate ?? 20.0;
              const feeAmount = Math.max(ratePerHour, Math.round((durationMin / 60) * ratePerHour));

              const completedSession = await prisma.parkingSession.update({
                where: { id: activeSession.id },
                data: {
                  exitTime,
                  durationMin,
                  feeAmount,
                  status: 'COMPLETED',
                },
                include: { slot: { include: { area: true, sensor: true } }, vehicle: true },
              });
              broadcastSessionUpdate(completedSession);
            }
            currentVehicle = null;
          }

          slot = await prisma.parkingSlot.update({
            where: { id: slot.id },
            data: {
              status: newSlotStatus as any,
              currentVehicle,
              lastStatusChange: new Date(),
            },
            include: { sensor: true, area: true },
          });
        }

        broadcastSlotUpdate(slot);
      }

      broadcastSensorUpdate(sensor);

      return {
        success: true,
        slot,
        sensor,
        message: `Telemetry processed for ${sensor.sensorCode}. Distance: ${distanceVal}cm -> ${newSlotStatus}`,
      };
    } catch (err: any) {
      console.error('Error processing telemetry in PostgreSQL:', err.message);
      return {
        success: false,
        message: `Database error processing telemetry: ${err.message}`,
      };
    }
  }

  // Periodic check to mark sensors and linked slots offline if no heartbeat received within timeout
  startHeartbeatWatcher(timeoutSeconds = 12) {
    setInterval(async () => {
      try {
        const timeoutMs = timeoutSeconds * 1000;
        const thresholdDate = new Date(Date.now() - timeoutMs);

        // Find all online sensors that haven't sent a heartbeat within threshold
        const timedOutSensors = await prisma.sensor.findMany({
          where: {
            status: 'ONLINE',
            lastSeen: { lt: thresholdDate },
          },
          include: { slot: true },
        });

        for (const sensor of timedOutSensors) {
          const updatedSensor = await prisma.sensor.update({
            where: { id: sensor.id },
            data: { status: 'OFFLINE' },
          });
          broadcastSensorUpdate(updatedSensor);

          // If linked slot is not already OFFLINE, update to OFFLINE
          if (sensor.slot && sensor.slot.status !== 'OFFLINE') {
            const updatedSlot = await prisma.parkingSlot.update({
              where: { id: sensor.slot.id },
              data: {
                status: 'OFFLINE',
                lastStatusChange: new Date(),
              },
            });
            broadcastSlotUpdate(updatedSlot);
          }
        }
      } catch (err: any) {
        // Safe catch for serverless or initial DB connect period
      }
    }, 5000);
  }
}

export const iotIngestService = new IoTIngestService();
