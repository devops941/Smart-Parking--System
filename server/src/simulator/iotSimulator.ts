import { iotIngestService } from '../services/iotIngestService.js';
import { prisma } from '../config/db.js';

export async function runLiveSimulationStep() {
  try {
    // Exclude A-01 / slot-1 because it's linked to the physical Arduino hardware
    const slots = await prisma.parkingSlot.findMany({
      where: {
        NOT: [
          { id: 'slot-1' },
          { slotNumber: { equals: 'A-01', mode: 'insensitive' } },
        ],
      },
      include: { sensor: true },
    });

    if (slots.length === 0) return;

    // Pick a random simulated slot
    const randomSlotIndex = Math.floor(Math.random() * slots.length);
    const targetSlot = slots[randomSlotIndex];
    const sensorCode = targetSlot.sensor?.sensorCode || `SENSOR-0${randomSlotIndex + 2}`;

    // Toggle status
    const currentlyOccupied = targetSlot.status === 'OCCUPIED';
    const shouldOccupy = !currentlyOccupied;

    // Generate realistic distance: 8-25cm for occupied vehicle, 160-220cm for clear slot
    const distance = shouldOccupy
      ? Number((8 + Math.random() * 15).toFixed(1))
      : Number((160 + Math.random() * 60).toFixed(1));

    await iotIngestService.processSensorTelemetry({
      sensorId: sensorCode,
      slotId: targetSlot.slotNumber,
      distance,
      status: shouldOccupy ? 'occupied' : 'available',
      battery: Math.floor(75 + Math.random() * 25),
      rssi: -1 * Math.floor(45 + Math.random() * 35),
      timestamp: new Date().toISOString(),
    });

    console.log(`📡 [IoT Stream] Live Event: Slot ${targetSlot.slotNumber} (${sensorCode}) -> ${shouldOccupy ? '🚗 OCCUPIED' : '🟢 AVAILABLE'} (${distance} cm)`);
  } catch (err: any) {
    console.error('Error in simulation step:', err.message);
  }
}

let simulationInterval: NodeJS.Timeout | null = null;

export function startAutoSimulation(intervalMs = 6000) {
  if (simulationInterval) clearInterval(simulationInterval);
  console.log(`🚀 [IoT Simulator] Auto-simulation started (Interval: ${intervalMs}ms)`);
  simulationInterval = setInterval(runLiveSimulationStep, intervalMs);
}

export function stopAutoSimulation() {
  if (simulationInterval) {
    clearInterval(simulationInterval);
    simulationInterval = null;
    console.log('🛑 [IoT Simulator] Auto-simulation stopped');
  }
}

export function isSimulationActive(): boolean {
  return simulationInterval !== null;
}
