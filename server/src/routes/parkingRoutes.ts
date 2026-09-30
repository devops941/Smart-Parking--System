import { Router, Request, Response } from 'express';
import { parkingService } from '../services/parkingService.js';
import { SlotStatus } from '../types/index.js';

const router = Router();

// --- Parking Areas ---
router.get('/areas', async (req: Request, res: Response) => {
  try {
    const areas = await parkingService.getAreas();
    res.json({ success: true, data: areas });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message });
  }
});

router.get('/areas/:id', async (req: Request, res: Response) => {
  try {
    const area = await parkingService.getAreaById(String(req.params.id));
    if (!area) return res.status(404).json({ success: false, message: 'Area not found' });
    res.json({ success: true, data: area });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message });
  }
});

router.post('/areas', async (req: Request, res: Response) => {
  try {
    const { name, code, description, floorLevel, hourlyRate } = req.body;
    if (!name || !code) {
      return res.status(400).json({ success: false, message: 'Area Name and Code are required' });
    }
    const parsedRate = hourlyRate !== undefined ? parseFloat(String(hourlyRate)) : 20.0;
    const parsedFloor = floorLevel !== undefined ? parseInt(String(floorLevel)) : 0;
    const newArea = await parkingService.createArea({
      name,
      code,
      description,
      floorLevel: isNaN(parsedFloor) ? 0 : parsedFloor,
      hourlyRate: isNaN(parsedRate) ? 20.0 : parsedRate,
    });
    res.status(201).json({ success: true, data: newArea });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message });
  }
});

router.put('/areas/:id', async (req: Request, res: Response) => {
  try {
    const updateData: any = { ...req.body };
    if (updateData.hourlyRate !== undefined) {
      const parsed = parseFloat(String(updateData.hourlyRate));
      updateData.hourlyRate = isNaN(parsed) ? 20.0 : parsed;
    }
    if (updateData.floorLevel !== undefined) {
      const parsed = parseInt(String(updateData.floorLevel));
      updateData.floorLevel = isNaN(parsed) ? 0 : parsed;
    }
    const updated = await parkingService.updateArea(String(req.params.id), updateData);
    if (!updated) return res.status(404).json({ success: false, message: 'Area not found' });
    res.json({ success: true, data: updated });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message });
  }
});

router.delete('/areas/:id', async (req: Request, res: Response) => {
  try {
    const deleted = await parkingService.deleteArea(String(req.params.id));
    if (!deleted) return res.status(404).json({ success: false, message: 'Area not found' });
    res.json({ success: true, message: 'Area and associated slots deleted successfully' });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// --- Parking Slots ---
router.get('/slots', async (req: Request, res: Response) => {
  try {
    const areaId = req.query.areaId as string;
    const status = req.query.status as SlotStatus;
    const slots = await parkingService.getSlots({ areaId, status });
    res.json({ success: true, data: slots });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message });
  }
});

router.get('/slots/:id', async (req: Request, res: Response) => {
  try {
    const slot = await parkingService.getSlotById(String(req.params.id));
    if (!slot) return res.status(404).json({ success: false, message: 'Slot not found' });
    res.json({ success: true, data: slot });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message });
  }
});

router.post('/slots', async (req: Request, res: Response) => {
  try {
    const { slotNumber, areaId, slotType, sensorId } = req.body;
    if (!slotNumber || !areaId) {
      return res.status(400).json({ success: false, message: 'Slot Number and Area are required' });
    }
    const slot = await parkingService.createSlot({ slotNumber, areaId, slotType, sensorId });
    res.status(201).json({ success: true, data: slot });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message });
  }
});

router.put('/slots/:id', async (req: Request, res: Response) => {
  try {
    const updated = await parkingService.updateSlot(String(req.params.id), req.body);
    if (!updated) return res.status(404).json({ success: false, message: 'Slot not found' });
    res.json({ success: true, data: updated });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message });
  }
});

router.patch('/slots/:id/toggle-active', async (req: Request, res: Response) => {
  try {
    const updated = await parkingService.toggleSlotActive(String(req.params.id));
    if (!updated) return res.status(404).json({ success: false, message: 'Slot not found' });
    res.json({ success: true, data: updated });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// --- Slot Reservations (PostgreSQL Database) ---
router.get('/reservations', async (req: Request, res: Response) => {
  try {
    const status = req.query.status as string;
    const vehiclePlate = req.query.vehiclePlate as string;
    const slotId = req.query.slotId as string;
    const reservations = await parkingService.getReservations({ status, vehiclePlate, slotId });
    res.json({ success: true, data: reservations });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message });
  }
});

router.post('/reservations', async (req: Request, res: Response) => {
  try {
    const { slotId, vehiclePlate, vehicleType, driverName, driverPhone, startTime, endTime, durationMinutes, estimatedFee, bookingDate } = req.body;
    if (!slotId || !vehiclePlate || !driverName || !driverPhone) {
      return res.status(400).json({
        success: false,
        message: 'Slot, Vehicle Plate, Driver Name, and Driver Phone are required.',
      });
    }

    const reservation = await parkingService.createReservation({
      slotId,
      vehiclePlate,
      vehicleType,
      driverName,
      driverPhone,
      startTime: startTime || '11:00',
      endTime: endTime || '12:00',
      durationMinutes,
      estimatedFee,
      bookingDate,
    });

    res.status(201).json({ success: true, data: reservation, message: 'Slot reserved successfully in database.' });
  } catch (err: any) {
    res.status(400).json({ success: false, message: err.message });
  }
});

router.patch('/reservations/:id/cancel', async (req: Request, res: Response) => {
  try {
    const cancelled = await parkingService.cancelReservation(String(req.params.id));
    res.json({ success: true, data: cancelled, message: 'Reservation cancelled and slot released to Available.' });
  } catch (err: any) {
    res.status(400).json({ success: false, message: err.message });
  }
});

export default router;
