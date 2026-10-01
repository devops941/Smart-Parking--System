import express, { Request, Response } from 'express';
import http from 'http';
import { Server as SocketIOServer } from 'socket.io';
import cors from 'cors';
import dotenv from 'dotenv';
import mqtt from 'mqtt';

import { initDatabase } from './config/db.js';
import { setSocketIO, iotIngestService } from './services/iotIngestService.js';
import dashboardRoutes from './routes/dashboardRoutes.js';
import parkingRoutes from './routes/parkingRoutes.js';
import sensorRoutes from './routes/sensorRoutes.js';
import vehicleRoutes from './routes/vehicleRoutes.js';
import sessionRoutes from './routes/sessionRoutes.js';
import analyticsRoutes from './routes/analyticsRoutes.js';
import reportRoutes from './routes/reportRoutes.js';
import { notifRouter, settingRouter } from './routes/notificationRoutes.js';
import authRouter from './routes/authRoutes.js';
import {
  startAutoSimulation,
  stopAutoSimulation,
  runLiveSimulationStep,
  isSimulationActive,
} from './simulator/iotSimulator.js';

dotenv.config();

const app = express();
const server = http.createServer(app);

const PORT = process.env.PORT || 5000;
const CLIENT_ORIGIN = process.env.CLIENT_ORIGIN || 'http://localhost:3000';

// Setup CORS
app.use(
  cors({
    origin: '*',
    credentials: true,
  })
);

app.use(express.json());

// Setup Socket.IO
const io = new SocketIOServer(server, {
  cors: {
    origin: '*',
    methods: ['GET', 'POST', 'PUT', 'DELETE'],
  },
});

setSocketIO(io);

io.on('connection', (socket) => {
  console.log(`⚡ [WebSocket] Client connected: ${socket.id}`);

  socket.on('disconnect', () => {
    console.log(`🔌 [WebSocket] Client disconnected: ${socket.id}`);
  });

  // Client can emit direct slot manual trigger
  socket.on('client:trigger-slot', (data) => {
    console.log('Received manual slot trigger from client:', data);
    runLiveSimulationStep();
  });
});

// Setup MQTT Client for real ESP32 sensors
const MQTT_BROKER = process.env.MQTT_BROKER_URL || 'mqtt://broker.hivemq.com:1883';
const MQTT_TOPIC = process.env.MQTT_TOPIC_INGEST || 'smartparking/sensors/data';

try {
  const mqttClient = mqtt.connect(MQTT_BROKER, {
    clientId: `smart_parking_server_${Math.random().toString(16).substring(2, 8)}`,
    clean: true,
    connectTimeout: 4000,
    reconnectPeriod: 10000,
  });

  mqttClient.on('connect', () => {
    console.log(`📡 [MQTT] Connected to broker: ${MQTT_BROKER}`);
    mqttClient.subscribe(MQTT_TOPIC, (err) => {
      if (!err) {
        console.log(`📡 [MQTT] Subscribed to topic: ${MQTT_TOPIC}`);
      }
    });
  });

  mqttClient.on('message', async (topic, message) => {
    try {
      const payloadStr = message.toString();
      console.log(`📡 [MQTT Ingest] Topic: ${topic} => ${payloadStr}`);
      const payload = JSON.parse(payloadStr);
      await iotIngestService.processSensorTelemetry(payload);
    } catch (err: any) {
      console.error('❌ [MQTT Error] Failed to parse payload:', err.message);
    }
  });

  mqttClient.on('error', (err) => {
    console.warn(`⚠️ [MQTT Notice] MQTT Broker connection notice: ${err.message}`);
  });
} catch (err: any) {
  console.warn(`⚠️ [MQTT Notice] Could not initialize MQTT client: ${err.message}`);
}

// Root Route & Health Checks
app.get('/', (req: Request, res: Response) => {
  res.status(200).json({
    status: 'online',
    message: '🚀 Smart Parking Management System IoT Backend is running successfully!',
    system: 'Smart Parking Management IoT Backend',
    uptime: `${Math.floor(process.uptime())}s`,
    timestamp: new Date().toISOString(),
    endpoints: {
      health: '/api/health',
      auth: '/api/auth',
      dashboard: '/api/dashboard',
      parking: '/api/parking',
      sensors: '/api/sensors',
      vehicles: '/api/vehicles',
      sessions: '/api/parking-sessions',
      analytics: '/api/analytics',
      reports: '/api/reports',
      notifications: '/api/notifications',
      settings: '/api/settings',
      simulator: '/api/simulator/status',
    },
    simulationActive: isSimulationActive(),
  });
});

app.get(['/health', '/api/health'], (req: Request, res: Response) => {
  res.status(200).json({
    status: 'online',
    system: 'Smart Parking Management IoT Backend',
    uptime: `${Math.floor(process.uptime())}s`,
    timestamp: new Date().toISOString(),
    simulationActive: isSimulationActive(),
  });
});

// Simulator Control APIs
app.post('/api/simulator/toggle', (req: Request, res: Response) => {
  const { action, interval } = req.body;
  if (action === 'start') {
    startAutoSimulation(interval || 5000);
    res.json({ success: true, message: 'IoT auto-simulation started', active: true });
  } else if (action === 'step') {
    runLiveSimulationStep();
    res.json({ success: true, message: 'Single simulation step triggered' });
  } else {
    stopAutoSimulation();
    res.json({ success: true, message: 'IoT auto-simulation stopped', active: false });
  }
});

app.get('/api/simulator/status', (req: Request, res: Response) => {
  res.json({ success: true, active: isSimulationActive() });
});

// Register REST Routes
app.use('/api/auth', authRouter);
app.use('/api/dashboard', dashboardRoutes);
app.use('/api/parking', parkingRoutes);
app.use('/api/sensors', sensorRoutes);
app.use('/api/vehicles', vehicleRoutes);
app.use('/api/parking-sessions', sessionRoutes);
app.use('/api/analytics', analyticsRoutes);
app.use('/api/reports', reportRoutes);
app.use('/api/notifications', notifRouter);
app.use('/api/settings', settingRouter);

// Start background heartbeat monitor (12s timeout for 3s heartbeat stream)
iotIngestService.startHeartbeatWatcher(12);

// Initialize DB and launch server
async function startServer() {
  await initDatabase();
  server.listen(PORT, () => {
    console.log(`\n======================================================`);
    console.log(`🚗 Smart Parking IoT Server running on http://localhost:${PORT}`);
    console.log(`🔌 WebSocket Server active on ws://localhost:${PORT}`);
    console.log(`📡 ESP32 HTTP Ingestion: http://localhost:${PORT}/api/sensors/data`);
    console.log(`📡 ESP32 MQTT Ingestion: ${MQTT_BROKER} -> ${MQTT_TOPIC}`);
    console.log(`======================================================\n`);
  });
}

startServer();
