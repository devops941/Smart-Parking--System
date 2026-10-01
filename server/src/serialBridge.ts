import 'dotenv/config';
import { SerialPort } from 'serialport';
import { ReadlineParser } from '@serialport/parser-readline';
import { io, Socket } from 'socket.io-client';

const SERVER_URL = process.env.SERVER_URL || 'https://smart-parking-system-xyde.vercel.app/api/sensors/data';
const WS_URL = process.env.WS_URL || 'https://smart-parking-system-xyde.vercel.app';

// const SERVER_URL = process.env.SERVER_URL || 'http://localhost:5000/api/sensors/data';
// const WS_URL = process.env.WS_URL || 'http://localhost:5000';



const BAUD_RATE = 9600;
const RECONNECT_INTERVAL_MS = 2000;

let currentPort: SerialPort | null = null;
let currentParser: ReadlineParser | null = null;
let socket: Socket | null = null;
let isReconnecting = false;
let lastKnownSlotStatus = '';

function isArduinoOrUsbPort(portInfo: any): boolean {
  const desc = `${portInfo.manufacturer || ''} ${portInfo.friendlyName || ''} ${portInfo.path || ''} ${portInfo.pnpId || ''}`.toLowerCase();
  const knownIdentifiers = ['arduino', 'usb', 'ftdi', 'ch340', 'ch341', 'cp210', 'silicon', 'wch', 'prolific', 'acm', 'ttyusb'];
  return knownIdentifiers.some(keyword => desc.includes(keyword));
}

function isMotherboardDummyPort(portInfo: any): boolean {
  const desc = `${portInfo.manufacturer || ''} ${portInfo.friendlyName || ''}`.toLowerCase();
  return (
    portInfo.path.toUpperCase() === 'COM1' &&
    (desc.includes('standard port') || desc.includes('communications port') || !portInfo.manufacturer)
  );
}

async function findBestPort(): Promise<{ path: string; info: any } | null> {
  const cliPort = process.argv[2];
  const specifiedPort = process.env.COM_PORT || cliPort;

  const ports = await SerialPort.list();

  if (ports.length === 0) {
    return null;
  }

  // 1. If specific port requested explicitly (e.g., node serialBridge COM3)
  if (specifiedPort) {
    const found = ports.find(p => p.path.toLowerCase() === specifiedPort.toLowerCase());
    return found ? { path: found.path, info: found } : { path: specifiedPort, info: { path: specifiedPort } };
  }

  // 2. Look for USB / FTDI / Arduino device
  const usbPort = ports.find(isArduinoOrUsbPort);
  if (usbPort) {
    return { path: usbPort.path, info: usbPort };
  }

  // 3. Check for any non-COM1 serial ports (e.g. COM2, COM3, COM4...)
  const nonCom1 = ports.filter(p => !isMotherboardDummyPort(p));
  if (nonCom1.length > 0) {
    return { path: nonCom1[0].path, info: nonCom1[0] };
  }

  // If only standard motherboard COM1 is present, do NOT connect to it automatically.
  // Wait for the real Arduino USB port to be plugged in.
  return null;
}

function initWebSocket(getPort: () => SerialPort | null) {
  if (socket) return;

  socket = io(WS_URL, {
    reconnection: true,
    reconnectionDelay: 2000,
  });

  socket.on('connect', async () => {
    console.log('🔗 Serial Bridge connected to Dashboard WebSocket for 2-way hardware sync');
    syncInitialState(getPort());
  });

  socket.on('parking:slot-updated', (data: { slotNumber: string; status: string }) => {
    const port = getPort();
    if (!port || !port.isOpen) return;
    if (data.slotNumber !== 'A-01') return;
    if (data.status === lastKnownSlotStatus) return;
    lastKnownSlotStatus = data.status;

    if (data.status === 'RESERVED') {
      console.log(`🟡 [Dashboard -> Arduino]: Slot ${data.slotNumber} RESERVED! Turning Yellow LED ON.`);
      port.write('CMD:RESERVE\n');
    } else if (data.status === 'AVAILABLE') {
      console.log(`🟢 [Dashboard -> Arduino]: Slot ${data.slotNumber} AVAILABLE.`);
      port.write('CMD:AVAILABLE\n');
    }
  });

  socket.on('disconnect', () => {
    console.log('⚠️ WebSocket disconnected from server. Will auto-reconnect...');
  });
}

async function syncInitialState(port: SerialPort | null) {
  if (!port || !port.isOpen) return;
  try {
    const slotsUrl = SERVER_URL.replace('/sensors/data', '/parking/slots');
    const res = await fetch(slotsUrl);
    const data = (await res.json()) as any;
    if (data && data.success && Array.isArray(data.data)) {
      const slotA1 = data.data.find((s: any) => s.slotNumber === 'A-01');
      if (slotA1 && slotA1.status === 'RESERVED') {
        lastKnownSlotStatus = 'RESERVED';
        console.log('🟡 [Sync on Connect]: Slot A-01 is currently RESERVED. Turning Yellow LED ON.');
        port.write('CMD:RESERVE\n');
      }
    }
  } catch {}
}

async function attemptConnect() {
  if (isReconnecting) return;
  isReconnecting = true;

  try {
    const ports = await SerialPort.list();
    const target = await findBestPort();

    if (!target) {
      console.log(`⏳ [Auto-Scan]: No Arduino/USB device found (Available: ${ports.map(p => p.path).join(', ') || 'None'}). Waiting for Arduino plug-in...`);
      scheduleReconnect();
      return;
    }

    console.log(`\n🔍 Found Arduino device on ${target.path} (${target.info.manufacturer || 'USB Serial'})`);
    console.log(`🚀 Connecting to ${target.path} at ${BAUD_RATE} baud...`);

    const port = new SerialPort({
      path: target.path,
      baudRate: BAUD_RATE,
      autoOpen: false,
    });

    port.open((err) => {
      if (err) {
        console.error(`❌ Failed to open ${target.path}: ${err.message}`);
        scheduleReconnect();
        return;
      }

      currentPort = port;
      isReconnecting = false;
      console.log(`✅ Serial Bridge Connected successfully to ${target.path}!`);
      console.log(`📡 Forwarding data to Smart Parking Server: ${SERVER_URL}\n`);

      initWebSocket(() => currentPort);
      syncInitialState(currentPort);

      currentParser = port.pipe(new ReadlineParser({ delimiter: '\n' }));

      currentParser.on('data', async (line: string) => {
        const trimmed = line.trim();
        if (!trimmed) return;

        console.log(`📥 [Arduino Serial]: ${trimmed}`);

        try {
          const jsonStart = trimmed.indexOf('{');
          const jsonEnd = trimmed.lastIndexOf('}');
          if (jsonStart === -1 || jsonEnd === -1 || jsonEnd < jsonStart) return;

          const cleanJson = trimmed.substring(jsonStart, jsonEnd + 1);
          const payload = JSON.parse(cleanJson);

          if (payload.sensorId) {
            const response = await fetch(SERVER_URL, {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify(payload),
            });

            const result = (await response.json()) as any;
            if (result && result.success) {
              console.log(`✨ [Dashboard Updated]: Slot ${payload.slotId} is now ${payload.status.toUpperCase()}`);
            }
          }
        } catch (err: any) {
          // Ignore non-json lines
        }
      });
    });

    port.on('close', () => {
      console.log('⚠️ Serial Port closed or Arduino disconnected. Re-scanning for Arduino...');
      currentPort = null;
      currentParser = null;
      scheduleReconnect();
    });

    port.on('error', (err) => {
      console.error('❌ Serial Port Error:', err.message);
      if (currentPort && currentPort.isOpen) {
        try { currentPort.close(); } catch {}
      }
      currentPort = null;
      currentParser = null;
      scheduleReconnect();
    });

  } catch (err: any) {
    console.error('❌ Connection error:', err.message);
    scheduleReconnect();
  }
}

function scheduleReconnect() {
  currentPort = null;
  currentParser = null;
  setTimeout(() => {
    isReconnecting = false;
    attemptConnect();
  }, RECONNECT_INTERVAL_MS);
}

// Start auto-connect loop
attemptConnect();


