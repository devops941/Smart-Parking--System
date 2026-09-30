import { Router, Request, Response } from 'express';
import { sensorService } from '../services/sensorService.js';
import { iotIngestService } from '../services/iotIngestService.js';
import { SensorStatus, SensorType } from '../types/index.js';

const router = Router();

// Get all sensors
router.get('/', async (req: Request, res: Response) => {
  try {
    const status = req.query.status as SensorStatus;
    const type = req.query.type as SensorType;
    const sensors = await sensorService.getSensors({ status, type });
    res.json({ success: true, data: sensors });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// Get sensor details + readings
router.get('/:id', async (req: Request, res: Response) => {
  try {
    const sensor = await sensorService.getSensorById(String(req.params.id));
    if (!sensor) return res.status(404).json({ success: false, message: 'Sensor not found' });
    res.json({ success: true, data: sensor });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// Create new sensor
router.post('/', async (req: Request, res: Response) => {
  try {
    const { sensorCode, sensorType, connectionType, thresholdCm, ipAddress } = req.body;
    if (!sensorCode) {
      return res.status(400).json({ success: false, message: 'Sensor code is required' });
    }
    const sensor = await sensorService.createSensor({ sensorCode, sensorType, connectionType, thresholdCm, ipAddress });
    res.status(201).json({ success: true, data: sensor });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// Update sensor
router.put('/:id', async (req: Request, res: Response) => {
  try {
    const updated = await sensorService.updateSensor(String(req.params.id), req.body);
    if (!updated) return res.status(404).json({ success: false, message: 'Sensor not found' });
    res.json({ success: true, data: updated });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// Delete sensor
router.delete('/:id', async (req: Request, res: Response) => {
  try {
    const deleted = await sensorService.deleteSensor(String(req.params.id));
    if (!deleted) return res.status(404).json({ success: false, message: 'Sensor not found' });
    res.json({ success: true, message: 'Sensor deleted successfully' });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// IoT Data Ingestion endpoint for ESP32 / Arduino (HTTP REST)
router.post('/data', async (req: Request, res: Response) => {
  try {
    const { sensorId, slotId, distance, status, battery, rssi } = req.body;

    if (!sensorId || distance === undefined) {
      return res.status(400).json({
        success: false,
        message: 'Invalid payload: sensorId and distance are required',
        example: {
          sensorId: 'SENSOR-001',
          slotId: 'A-01',
          distance: 12.5,
          status: 'occupied',
          timestamp: new Date().toISOString(),
        },
      });
    }

    const result = await iotIngestService.processSensorTelemetry({
      sensorId,
      slotId,
      distance: Number(distance),
      status,
      battery: battery ? Number(battery) : undefined,
      rssi: rssi ? Number(rssi) : undefined,
    });

    res.json(result);
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// Get recent telemetry readings
router.get('/readings/recent', async (req: Request, res: Response) => {
  try {
    const sensorId = req.query.sensorId as string;
    const limit = req.query.limit ? Number(req.query.limit) : 50;
    const readings = await sensorService.getRecentReadings(sensorId, limit);
    res.json({ success: true, data: readings });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message });
  }
});

export default router;
