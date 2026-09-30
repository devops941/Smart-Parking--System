import { Router, Request, Response } from 'express';
import { notificationService } from '../services/analyticsService.js';
import { prisma } from '../config/db.js';

const notifRouter = Router();

notifRouter.get('/', async (req: Request, res: Response) => {
  try {
    const unreadOnly = req.query.unread === 'true';
    const notifications = await notificationService.getNotifications(unreadOnly);
    res.json({ success: true, data: notifications });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message });
  }
});

notifRouter.patch('/:id/read', async (req: Request, res: Response) => {
  try {
    const updated = await notificationService.markAsRead(String(req.params.id));
    res.json({ success: true, data: updated });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message });
  }
});

notifRouter.post('/mark-all-read', async (req: Request, res: Response) => {
  try {
    const result = await notificationService.markAllAsRead();
    res.json({ success: true, result });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message });
  }
});

notifRouter.delete('/clear', async (req: Request, res: Response) => {
  try {
    await notificationService.clearAll();
    res.json({ success: true, message: 'All notifications cleared' });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// --- Setting Routes ---
const settingRouter = Router();

settingRouter.get('/', async (req: Request, res: Response) => {
  try {
    const settings = await prisma.systemSetting.findMany();
    const settingsMap: Record<string, any> = {
      occupiedThresholdCm: 50.0,
      hourlyRate: 20.0,
    };
    settings.forEach(s => {
      settingsMap[s.key] = s.value;
    });
    res.json({ success: true, data: settingsMap });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message });
  }
});

settingRouter.put('/', async (req: Request, res: Response) => {
  try {
    for (const [key, value] of Object.entries(req.body)) {
      await prisma.systemSetting.upsert({
        where: { key },
        update: { value: String(value) },
        create: {
          key,
          value: String(value),
          category: 'GENERAL',
        },
      });
    }
    res.json({ success: true, data: req.body, message: 'Settings updated in database successfully' });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message });
  }
});

export { notifRouter, settingRouter };
