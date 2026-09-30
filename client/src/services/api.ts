import {
  DashboardSummary,
  ParkingArea,
  ParkingSlot,
  Sensor,
  Vehicle,
  ParkingSession,
  Notification,
} from '../types';

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000/api';

async function fetchWithFallback<T>(endpoint: string, options?: RequestInit): Promise<T> {
  try {
    const res = await fetch(`${API_BASE_URL}${endpoint}`, {
      ...options,
      headers: {
        'Content-Type': 'application/json',
        ...(options?.headers || {}),
      },
    });

    if (!res.ok) {
      let errorMsg = `API error: ${res.status} ${res.statusText}`;
      try {
        const errorJson = await res.json();
        if (errorJson && (errorJson.message || errorJson.error)) {
          errorMsg = errorJson.message || errorJson.error;
        }
      } catch {}
      throw new Error(errorMsg);
    }

    const json = await res.json();
    return json.data !== undefined ? json.data : json;
  } catch (err: any) {
    console.warn(`[API] Remote call to ${endpoint} failed:`, err.message);
    throw err;
  }
}

export const api = {
  // --- Dashboard ---
  getDashboardSummary: async (): Promise<DashboardSummary> => {
    return fetchWithFallback<DashboardSummary>('/dashboard/summary');
  },

  getLiveOverview: async () => {
    return fetchWithFallback<any>('/dashboard/live-overview');
  },

  // --- Parking Areas ---
  getAreas: async (): Promise<ParkingArea[]> => {
    return fetchWithFallback<ParkingArea[]>('/parking/areas');
  },

  getAreaById: async (id: string): Promise<ParkingArea> => {
    return fetchWithFallback<ParkingArea>(`/parking/areas/${id}`);
  },

  createArea: async (data: Partial<ParkingArea>): Promise<ParkingArea> => {
    return fetchWithFallback<ParkingArea>('/parking/areas', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  },

  updateArea: async (id: string, data: Partial<ParkingArea>): Promise<ParkingArea> => {
    return fetchWithFallback<ParkingArea>(`/parking/areas/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    });
  },

  deleteArea: async (id: string) => {
    return fetchWithFallback<any>(`/parking/areas/${id}`, {
      method: 'DELETE',
    });
  },

  // --- Parking Slots ---
  getSlots: async (filters?: { areaId?: string; status?: string }): Promise<ParkingSlot[]> => {
    const params = new URLSearchParams();
    if (filters?.areaId) params.append('areaId', filters.areaId);
    if (filters?.status) params.append('status', filters.status);
    const query = params.toString() ? `?${params.toString()}` : '';
    return fetchWithFallback<ParkingSlot[]>(`/parking/slots${query}`);
  },

  getSlotById: async (id: string): Promise<ParkingSlot> => {
    return fetchWithFallback<ParkingSlot>(`/parking/slots/${id}`);
  },

  createSlot: async (data: Partial<ParkingSlot>): Promise<ParkingSlot> => {
    return fetchWithFallback<ParkingSlot>('/parking/slots', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  },

  updateSlot: async (id: string, data: Partial<ParkingSlot>): Promise<ParkingSlot> => {
    return fetchWithFallback<ParkingSlot>(`/parking/slots/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    });
  },

  toggleSlotActive: async (id: string): Promise<ParkingSlot> => {
    return fetchWithFallback<ParkingSlot>(`/parking/slots/${id}/toggle-active`, {
      method: 'PATCH',
    });
  },

  // --- Sensors ---
  getSensors: async (filters?: { status?: string; type?: string }): Promise<Sensor[]> => {
    const params = new URLSearchParams();
    if (filters?.status) params.append('status', filters.status);
    if (filters?.type) params.append('type', filters.type);
    const query = params.toString() ? `?${params.toString()}` : '';
    return fetchWithFallback<Sensor[]>(`/sensors${query}`);
  },

  getSensorById: async (id: string): Promise<Sensor> => {
    return fetchWithFallback<Sensor>(`/sensors/${id}`);
  },

  createSensor: async (data: Partial<Sensor>): Promise<Sensor> => {
    return fetchWithFallback<Sensor>('/sensors', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  },

  updateSensor: async (id: string, data: Partial<Sensor>): Promise<Sensor> => {
    return fetchWithFallback<Sensor>(`/sensors/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    });
  },

  deleteSensor: async (id: string): Promise<any> => {
    return fetchWithFallback<any>(`/sensors/${id}`, {
      method: 'DELETE',
    });
  },

  sendSensorTelemetry: async (payload: { sensorId: string; slotId?: string; distance: number; status?: string }) => {
    return fetchWithFallback<any>('/sensors/data', {
      method: 'POST',
      body: JSON.stringify(payload),
    });
  },

  // --- Vehicles ---
  getVehicles: async (search?: string): Promise<Vehicle[]> => {
    const query = search ? `?search=${encodeURIComponent(search)}` : '';
    return fetchWithFallback<Vehicle[]>(`/vehicles${query}`);
  },

  createVehicle: async (data: Partial<Vehicle>): Promise<Vehicle> => {
    return fetchWithFallback<Vehicle>('/vehicles', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  },

  // --- Sessions ---
  getSessions: async (filters?: { status?: string; vehiclePlate?: string; slotId?: string }): Promise<ParkingSession[]> => {
    const params = new URLSearchParams();
    if (filters?.status) params.append('status', filters.status);
    if (filters?.vehiclePlate) params.append('vehiclePlate', filters.vehiclePlate);
    if (filters?.slotId) params.append('slotId', filters.slotId);
    const query = params.toString() ? `?${params.toString()}` : '';
    return fetchWithFallback<ParkingSession[]>(`/parking-sessions${query}`);
  },

  createSession: async (data: { slotId: string; vehiclePlate: string }): Promise<ParkingSession> => {
    return fetchWithFallback<ParkingSession>('/parking-sessions', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  },

  completeSession: async (id: string): Promise<ParkingSession> => {
    return fetchWithFallback<ParkingSession>(`/parking-sessions/${id}/complete`, {
      method: 'PATCH',
    });
  },

  // --- Slot Reservations ---
  getReservations: async (filters?: { status?: string; vehiclePlate?: string; slotId?: string }) => {
    const params = new URLSearchParams();
    if (filters?.status) params.append('status', filters.status);
    if (filters?.vehiclePlate) params.append('vehiclePlate', filters.vehiclePlate);
    if (filters?.slotId) params.append('slotId', filters.slotId);
    const query = params.toString() ? `?${params.toString()}` : '';
    return fetchWithFallback<any[]>(`/parking/reservations${query}`);
  },

  createReservation: async (data: {
    slotId: string;
    vehiclePlate: string;
    vehicleType?: string;
    driverName: string;
    driverPhone: string;
    startTime: string;
    endTime: string;
    durationMinutes?: number;
    estimatedFee?: number;
    bookingDate?: string;
  }) => {
    return fetchWithFallback<any>('/parking/reservations', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  },

  cancelReservation: async (id: string) => {
    return fetchWithFallback<any>(`/parking/reservations/${id}/cancel`, {
      method: 'PATCH',
    });
  },

  // --- Analytics & Reports ---
  getAnalytics: async () => {
    return fetchWithFallback<any>('/analytics');
  },

  getReportData: async (type = 'daily', startDate?: string, endDate?: string) => {
    const params = new URLSearchParams({ type });
    if (startDate) params.append('startDate', startDate);
    if (endDate) params.append('endDate', endDate);
    return fetchWithFallback<any>(`/reports/data?${params.toString()}`);
  },

  // --- Notifications ---
  getNotifications: async (unreadOnly = false): Promise<Notification[]> => {
    return fetchWithFallback<Notification[]>(`/notifications?unread=${unreadOnly}`);
  },

  markNotificationAsRead: async (id: string): Promise<Notification> => {
    return fetchWithFallback<Notification>(`/notifications/${id}/read`, {
      method: 'PATCH',
    });
  },

  markAllNotificationsAsRead: async () => {
    return fetchWithFallback<any>('/notifications/mark-all-read', {
      method: 'POST',
    });
  },

  clearAllNotifications: async () => {
    return fetchWithFallback<any>('/notifications/clear', {
      method: 'DELETE',
    });
  },

  // --- Settings ---
  getSettings: async () => {
    return fetchWithFallback<any>('/settings');
  },

  updateSettings: async (settings: any) => {
    return fetchWithFallback<any>('/settings', {
      method: 'PUT',
      body: JSON.stringify(settings),
    });
  },

  // --- Simulator Controls ---
  toggleSimulator: async (action: 'start' | 'stop' | 'step', interval?: number) => {
    return fetchWithFallback<any>('/simulator/toggle', {
      method: 'POST',
      body: JSON.stringify({ action, interval }),
    });
  },

  getSimulatorStatus: async () => {
    return fetchWithFallback<any>('/simulator/status');
  },

  // --- Auth ---
  login: async (credentials: { email: string; password: string }) => {
    return fetchWithFallback<any>('/auth/login', {
      method: 'POST',
      body: JSON.stringify(credentials),
    });
  },

  logout: async () => {
    return fetchWithFallback<any>('/auth/logout', {
      method: 'POST',
    });
  },

  getCurrentUser: async () => {
    return fetchWithFallback<any>('/auth/me');
  },
};

