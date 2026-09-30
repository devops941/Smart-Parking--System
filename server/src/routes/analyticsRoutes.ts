import { Router, Request, Response } from 'express';
import { analyticsService } from '../services/analyticsService.js';

const router = Router();

router.get('/', async (req: Request, res: Response) => {
  try {
    const data = await analyticsService.getAnalyticsData();
    res.json({ success: true, data });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message });
  }
});

export default router;
