import { Router, Request, Response } from 'express';
import { sessionService } from '../services/sessionService.js';

const router = Router();

router.get('/', async (req: Request, res: Response) => {
  try {
    const status = req.query.status as string;
    const vehiclePlate = req.query.vehiclePlate as string;
    const slotId = req.query.slotId as string;
    const sessions = await sessionService.getSessions({ status, vehiclePlate, slotId });
    res.json({ success: true, data: sessions });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message });
  }
});

router.post('/', async (req: Request, res: Response) => {
  try {
    const { slotId, vehiclePlate } = req.body;
    if (!slotId || !vehiclePlate) {
      return res.status(400).json({ success: false, message: 'Slot ID and Vehicle Plate are required' });
    }
    const session = await sessionService.createManualSession({ slotId, vehiclePlate });
    res.status(201).json({ success: true, data: session });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message });
  }
});

router.patch('/:id/complete', async (req: Request, res: Response) => {
  try {
    const session = await sessionService.completeSession(String(req.params.id));
    if (!session) return res.status(404).json({ success: false, message: 'Session not found' });
    res.json({ success: true, data: session });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message });
  }
});

export default router;
