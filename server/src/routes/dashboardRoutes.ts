import { Router, Request, Response } from 'express';
import { getDashboardMetrics, broadcastSlotUpdate } from '../services/iotIngestService.js';
import { prisma } from '../config/db.js';

const router = Router();

router.get('/summary', async (req: Request, res: Response) => {
  try {
    const summary = await getDashboardMetrics();
    res.json({
      success: true,
      data: summary,
    });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message });
  }
});

router.get('/live-overview', async (req: Request, res: Response) => {
  try {
    const summary = await getDashboardMetrics();
    const [recentSessions, unreadNotifications, areas, slots] = await Promise.all([
      prisma.parkingSession.findMany({ take: 5, orderBy: { entryTime: 'desc' } }),
      prisma.notification.findMany({ where: { isRead: false }, take: 5, orderBy: { createdAt: 'desc' } }),
      prisma.parkingArea.findMany(),
      prisma.parkingSlot.findMany(),
    ]);

    const areaBreakdown = areas.map(area => {
      const areaSlots = slots.filter(s => s.areaId === area.id);
      return {
        id: area.id,
        name: area.name,
        code: area.code,
        total: areaSlots.length,
        available: areaSlots.filter(s => s.status === 'AVAILABLE').length,
        occupied: areaSlots.filter(s => s.status === 'OCCUPIED').length,
        reserved: areaSlots.filter(s => s.status === 'RESERVED').length,
      };
    });

    res.json({
      success: true,
      data: {
        metrics: summary,
        areaBreakdown,
        recentSessions,
        unreadNotifications,
      },
    });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message });
  }
});

router.post('/reset', async (req: Request, res: Response) => {
  try {
    const sensors = await prisma.sensor.findMany();
    const slots = await prisma.parkingSlot.findMany({ include: { sensor: true } });

    for (const slot of slots) {
      const linkedSensor = sensors.find(s => s.id === slot.sensorId || s.sensorCode === slot.sensorId);
      const isOnline = linkedSensor?.status === 'ONLINE';

      const updated = await prisma.parkingSlot.update({
        where: { id: slot.id },
        data: {
          status: isOnline ? 'AVAILABLE' : 'OFFLINE',
          currentVehicle: null,
          lastStatusChange: new Date(),
        },
      });
      broadcastSlotUpdate(updated);
    }

    // Clean up sessions, readings, notifications from DB
    await Promise.all([
      prisma.parkingSession.deleteMany(),
      prisma.sensorReading.deleteMany(),
      prisma.notification.deleteMany(),
    ]);

    const summary = await getDashboardMetrics();
    res.json({
      success: true,
      message: 'PostgreSQL database fully reset and synchronized successfully.',
      data: summary,
    });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message });
  }
});

export default router;
