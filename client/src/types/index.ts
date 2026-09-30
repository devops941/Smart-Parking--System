export type Role = 'SUPER_ADMIN' | 'ADMIN' | 'OPERATOR' | 'VIEWER';

export type SlotStatus = 'AVAILABLE' | 'OCCUPIED' | 'RESERVED' | 'MAINTENANCE' | 'OFFLINE';

export type SlotType = 'STANDARD' | 'VIP' | 'EV_CHARGING' | 'HANDICAPPED' | 'TWO_WHEELER';

export type SensorType = 'ULTRASONIC' | 'INFRARED' | 'MAGNETIC' | 'CAMERA_AI';

export type SensorStatus = 'ONLINE' | 'OFFLINE' | 'WARNING' | 'ERROR';

export type ConnectionType = 'WIFI' | 'MQTT' | 'HTTP_REST' | 'LORA' | 'BLUETOOTH';

export type SessionStatus = 'ACTIVE' | 'COMPLETED' | 'CANCELLED';

export type NotificationSeverity = 'INFO' | 'WARNING' | 'CRITICAL';

export interface User {
  id: string;
  email: string;
  name: string;
  role: Role;
  avatar?: string | null;
}

export interface ParkingArea {
  id: string;
  name: string;
  code: string;
  description?: string | null;
  floorLevel: number;
  totalSlots: number;
  hourlyRate: number;
  slots?: ParkingSlot[];
  createdAt: string;
  updatedAt: string;
}

export interface Sensor {
  id: string;
  sensorCode: string;
  sensorType: SensorType;
  connectionType: ConnectionType;
  status: SensorStatus;
  ipAddress?: string | null;
  macAddress?: string | null;
  firmwareVer?: string | null;
  batteryLevel?: number | null;
  lastReading?: number | null;
  thresholdCm: number;
  lastSeen: string;
  slot?: ParkingSlot | null;
  slotId?: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface ParkingSlot {
  id: string;
  slotNumber: string;
  areaId: string;
  area?: ParkingArea;
  slotType: SlotType;
  status: SlotStatus;
  isActive: boolean;
  sensorId?: string | null;
  sensor?: Sensor | null;
  currentVehicle?: string | null;
  lastStatusChange: string;
  sessions?: ParkingSession[];
  createdAt: string;
  updatedAt: string;
}

export interface Vehicle {
  id: string;
  plateNumber: string;
  vehicleType: string;
  ownerName?: string | null;
  ownerPhone?: string | null;
  color?: string | null;
  model?: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface ParkingSession {
  id: string;
  sessionId: string;
  slotId: string;
  slot?: ParkingSlot;
  vehicleId?: string | null;
  vehicle?: Vehicle | null;
  vehiclePlate: string;
  entryTime: string;
  exitTime?: string | null;
  durationMin?: number | null;
  feeAmount?: number | null;
  status: SessionStatus;
  createdAt: string;
  updatedAt: string;
}

export interface SensorReading {
  id: string;
  sensorId: string;
  distanceCm: number;
  isOccupied: boolean;
  rssi?: number | null;
  timestamp: string;
}

export interface Notification {
  id: string;
  title: string;
  message: string;
  severity: NotificationSeverity;
  category: string;
  isRead: boolean;
  metadata?: string | null;
  createdAt: string;
}

export interface DashboardSummary {
  totalSlots: number;
  availableSlots: number;
  occupiedSlots: number;
  reservedSlots: number;
  offlineSensors: number;
  occupancyRate: number;
  totalAreas: number;
  totalSensors: number;
  onlineSensors: number;
  activeSessions: number;
  todayTotalVehicles: number;
  todayRevenue?: number;
  averageParkingDurationMin: number;
}
