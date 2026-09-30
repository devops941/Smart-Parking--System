import { Router, Request, Response } from 'express';
import { vehicleService } from '../services/sessionService.js';

const router = Router();

router.get('/', async (req: Request, res: Response) => {
  try {
    const search = req.query.search as string;
    const vehicles = await vehicleService.getVehicles(search);
    res.json({ success: true, data: vehicles });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message });
  }
});

router.post('/', async (req: Request, res: Response) => {
  try {
    const { plateNumber, vehicleType, ownerName, ownerPhone, color, model } = req.body;
    if (!plateNumber) {
      return res.status(400).json({ success: false, message: 'Vehicle Plate Number is required' });
    }
    const vehicle = await vehicleService.createVehicle({ plateNumber, vehicleType, ownerName, ownerPhone, color, model });
    res.status(201).json({ success: true, data: vehicle });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message });
  }
});

export default router;
