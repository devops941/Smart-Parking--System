'use client';

import React, { createContext, useContext, useEffect, useState, useCallback, ReactNode } from 'react';
import {
  DashboardSummary,
  ParkingArea,
  ParkingSlot,
  Sensor,
  ParkingSession,
  Notification,
  User,
} from '../types';
import { api } from '../services/api';
import { getSocket } from '../services/socket';

export interface ToastMessage {
  id: string;
  type: 'success' | 'error' | 'info' | 'warning';
  title: string;
  message?: string;
}

interface ParkingContextType {
  // Data
  summary: DashboardSummary | null;
  slots: ParkingSlot[];
  areas: ParkingArea[];
  sensors: Sensor[];
  sessions: ParkingSession[];
  notifications: Notification[];
  unreadCount: number;
  currentUser: User | null;

  // Status
  isLoading: boolean;
  isConnected: boolean;
  simulatorActive: boolean;
  soundEnabled: boolean;

  // Actions
  refreshAll: () => Promise<void>;
  updateSlotLocally: (slotId: string, partial: Partial<ParkingSlot>) => void;
  triggerManualSimulationStep: () => Promise<void>;
  toggleSimulator: (action?: 'start' | 'stop') => Promise<void>;
  toggleSound: () => void;
  showToast: (type: ToastMessage['type'], title: string, message?: string) => void;
  dismissToast: (id: string) => void;
  toasts: ToastMessage[];
  markNotificationRead: (id: string) => Promise<void>;
  markAllNotificationsRead: () => Promise<void>;
  dismissNotification: (id: string) => Promise<void>;
  clearAllNotifications: (showToastMsg?: boolean) => Promise<void>;
  logout: () => void;
  loginUser: (user: User) => void;
}

const ParkingContext = createContext<ParkingContextType | undefined>(undefined);

export const ParkingProvider = ({ children }: { children: ReactNode }) => {
  const [summary, setSummary] = useState<DashboardSummary | null>(null);
  const [slots, setSlots] = useState<ParkingSlot[]>([]);
  const [areas, setAreas] = useState<ParkingArea[]>([]);
  const [sensors, setSensors] = useState<Sensor[]>([]);
  const [sessions, setSessions] = useState<ParkingSession[]>([]);
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [currentUser, setCurrentUser] = useState<User | null>(null);

  const [isLoading, setIsLoading] = useState(true);
  const [isConnected, setIsConnected] = useState(false);
  const [simulatorActive, setSimulatorActive] = useState(false);
  const [soundEnabled, setSoundEnabled] = useState(false);
  const [toasts, setToasts] = useState<ToastMessage[]>([]);

  const showToast = useCallback((type: ToastMessage['type'], title: string, message?: string) => {
    const id = `toast-${Date.now()}-${Math.random().toString(36).substr(2, 4)}`;
    setToasts(prev => [...prev, { id, type, title, message }]);
    setTimeout(() => {
      setToasts(prev => prev.filter(t => t.id !== id));
    }, 4500);
  }, []);

  const dismissToast = useCallback((id: string) => {
    setToasts(prev => prev.filter(t => t.id !== id));
  }, []);

  const playBeep = useCallback((isOccupied: boolean) => {
    if (!soundEnabled || typeof window === 'undefined') return;
    try {
      const ctx = new (window.AudioContext || (window as any).webkitAudioContext)();
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = isOccupied ? 'sine' : 'triangle';
      osc.frequency.setValueAtTime(isOccupied ? 587.33 : 880, ctx.currentTime); // D5 or A5
      gain.gain.setValueAtTime(0.1, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.2);
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start();
      osc.stop(ctx.currentTime + 0.2);
    } catch {
      // AudioContext policy
    }
  }, [soundEnabled]);

  const refreshAll = useCallback(async () => {
    try {
      const [sumRes, slotsRes, areasRes, sensorsRes, notifsRes, sessionsRes] = await Promise.allSettled([
        api.getDashboardSummary(),
        api.getSlots(),
        api.getAreas(),
        api.getSensors(),
        api.getNotifications(),
        api.getSessions(),
      ]);

      if (sumRes.status === 'fulfilled') setSummary(sumRes.value);
      if (slotsRes.status === 'fulfilled') setSlots(slotsRes.value);
      if (areasRes.status === 'fulfilled') setAreas(areasRes.value);
      if (sensorsRes.status === 'fulfilled') setSensors(sensorsRes.value);
      if (notifsRes.status === 'fulfilled') setNotifications(notifsRes.value);
      if (sessionsRes.status === 'fulfilled') setSessions(sessionsRes.value);
    } catch (err: any) {
      console.warn('Error fetching initial parking data:', err.message);
    } finally {
      setIsLoading(false);
    }
  }, []);

  // Initialize data and real-time WebSocket listeners
  useEffect(() => {
    // Check saved user in localStorage
    if (typeof window !== 'undefined') {
      const savedUser = localStorage.getItem('smart_parking_user');
      if (savedUser) {
        try {
          setCurrentUser(JSON.parse(savedUser));
        } catch {
          localStorage.removeItem('smart_parking_user');
          setCurrentUser(null);
        }
      } else {
        setCurrentUser(null);
      }
    }

    // WebSocket setup
    const socket = getSocket();

    if (socket.connected) {
      setIsConnected(true);
    }

    socket.on('connect', () => {
      setIsConnected(true);
      refreshAll();
    });

    socket.on('reconnect', () => {
      setIsConnected(true);
      refreshAll();
    });

    socket.on('disconnect', () => {
      setIsConnected(false);
    });

    // Real-time Slot Update
    socket.on('parking:slot-updated', (data: {
      slotId: string;
      slotNumber: string;
      status: any;
      currentVehicle: string | null;
      lastStatusChange: string;
    }) => {
      setSlots(prevSlots => {
        return prevSlots.map(s => {
          if (s.id === data.slotId || s.slotNumber === data.slotNumber) {
            const isNowOccupied = data.status === 'OCCUPIED';
            playBeep(isNowOccupied);
            return {
              ...s,
              status: data.status,
              currentVehicle: data.currentVehicle,
              lastStatusChange: data.lastStatusChange || new Date().toISOString(),
            };
          }
          return s;
        });
      });
    });

    // Real-time Sensor Update
    socket.on('sensor:reading-updated', (data: {
      sensorId: string;
      sensorCode: string;
      status: any;
      lastReading: number | null;
      batteryLevel: number;
    }) => {
      setSensors(prev => {
        const exists = prev.some(s => s.id === data.sensorId || s.sensorCode === data.sensorCode);
        if (!exists) {
          return [
            ...prev,
            {
              id: data.sensorId,
              sensorCode: data.sensorCode,
              status: data.status,
              lastReading: data.lastReading,
              thresholdCm: 50.0,
              batteryLevel: data.batteryLevel || 100,
              lastSeen: new Date().toISOString(),
              sensorType: 'INFRARED' as const,
              connectionType: 'HTTP_REST' as const,
              createdAt: new Date().toISOString(),
              updatedAt: new Date().toISOString(),
            },
          ];
        }
        return prev.map(s => {
          if (s.id === data.sensorId || s.sensorCode === data.sensorCode) {
            return {
              ...s,
              status: data.status,
              lastReading: data.lastReading,
              batteryLevel: data.batteryLevel ?? s.batteryLevel,
              lastSeen: new Date().toISOString(),
            };
          }
          return s;
        });
      });
    });

    // Real-time Summary Update
    socket.on('dashboard:summary-updated', (newSummary: DashboardSummary) => {
      setSummary(newSummary);
    });

    // Real-time New Session (Vehicle Arrived / Check-in)
    socket.on('session:new', (newSession: ParkingSession) => {
      setSessions(prev => [newSession, ...prev.filter(s => s.id !== newSession.id && s.sessionId !== newSession.sessionId)]);
      // Refresh summary & slots to guarantee complete consistency
      api.getDashboardSummary().then(setSummary).catch(() => {});
    });

    // Real-time Session Updated (Vehicle Departed / Paid / Checkout)
    socket.on('session:updated', (updatedSession: ParkingSession) => {
      setSessions(prev => {
        const exists = prev.some(s => s.id === updatedSession.id || s.sessionId === updatedSession.sessionId);
        if (exists) {
          return prev.map(s => (s.id === updatedSession.id || s.sessionId === updatedSession.sessionId) ? { ...s, ...updatedSession } : s);
        }
        return [updatedSession, ...prev];
      });
      // Refresh summary & slots to guarantee complete consistency
      api.getDashboardSummary().then(setSummary).catch(() => {});
    });

    // Real-time New Notification
    socket.on('notification:new', (newNotif: Notification) => {
      setNotifications(prev => [newNotif, ...prev.filter(n => n.id !== newNotif.id)]);
      showToast('info', newNotif.title, newNotif.message);
    });

    // Periodic fallback polling every 15s to keep perfectly synchronized
    const interval = setInterval(refreshAll, 15000);

    return () => {
      clearInterval(interval);
      socket.off('connect');
      socket.off('disconnect');
      socket.off('parking:slot-updated');
      socket.off('sensor:reading-updated');
      socket.off('dashboard:summary-updated');
      socket.off('session:new');
      socket.off('session:updated');
      socket.off('notification:new');
    };
  }, [refreshAll, playBeep, showToast]);

  const updateSlotLocally = (slotId: string, partial: Partial<ParkingSlot>) => {
    setSlots(prev => prev.map(s => (s.id === slotId ? { ...s, ...partial } : s)));
  };

  const triggerManualSimulationStep = async () => {
    try {
      await api.toggleSimulator('step');
      showToast('info', 'IoT Sensor Signal Sent', 'Simulated ultrasonic reading change.');
    } catch {
      // Offline fallback: simulate locally
      if (slots.length > 0) {
        const randIdx = Math.floor(Math.random() * slots.length);
        const target = slots[randIdx];
        const newStatus = target.status === 'OCCUPIED' ? 'AVAILABLE' : 'OCCUPIED';
        const samplePlate = newStatus === 'OCCUPIED' ? `TN-58-XY-${Math.floor(1000 + Math.random() * 9000)}` : null;

        updateSlotLocally(target.id, {
          status: newStatus,
          currentVehicle: samplePlate,
          lastStatusChange: new Date().toISOString(),
        });
        showToast('info', `Slot ${target.slotNumber} Updated`, `Simulated ${newStatus}`);
      }
    }
  };

  const toggleSimulator = async (action?: 'start' | 'stop') => {
    const nextState = action ? action === 'start' : !simulatorActive;
    try {
      await api.toggleSimulator(nextState ? 'start' : 'stop', 4000);
      setSimulatorActive(nextState);
      showToast(
        nextState ? 'success' : 'info',
        nextState ? 'IoT Auto-Simulator Started' : 'IoT Auto-Simulator Paused',
        nextState ? 'Emitting live sensor distance pulses every 4s' : 'Simulation halted'
      );
    } catch {
      setSimulatorActive(nextState);
    }
  };

  const toggleSound = () => {
    setSoundEnabled(prev => !prev);
    showToast('info', !soundEnabled ? 'Audio Alerts Enabled' : 'Audio Alerts Muted');
  };

  const markNotificationRead = async (id: string) => {
    try {
      await api.markNotificationAsRead(id);
    } catch {
      // local fallback
    }
    setNotifications(prev => prev.map(n => (n.id === id ? { ...n, isRead: true } : n)));
  };

  const markAllNotificationsRead = async () => {
    try {
      await api.markAllNotificationsAsRead();
    } catch {
      // local fallback
    }
    setNotifications(prev => prev.map(n => ({ ...n, isRead: true })));
    showToast('success', 'All notifications marked as read');
  };

  const dismissNotification = async (id: string) => {
    try {
      await api.markNotificationAsRead(id);
    } catch {}
    setNotifications(prev => prev.filter(n => n.id !== id));
  };

  const clearAllNotifications = async (showToastMsg = false) => {
    try {
      await api.clearAllNotifications();
    } catch {}
    setNotifications([]);
    if (showToastMsg) {
      showToast('info', 'Notifications Cleared', 'All notification alerts have been dismissed.');
    }
  };

  const loginUser = (user: User) => {
    setCurrentUser(user);
    if (typeof window !== 'undefined') {
      localStorage.setItem('smart_parking_user', JSON.stringify(user));
    }
  };

  const logout = async () => {
    try {
      await api.logout();
    } catch {
      // ignore network errors on logout
    }
    setCurrentUser(null);
    if (typeof window !== 'undefined') {
      localStorage.removeItem('smart_parking_user');
      window.location.href = '/';
    }
  };

  const unreadCount = notifications.filter(n => !n.isRead).length;

  return (
    <ParkingContext.Provider
      value={{
        summary,
        slots,
        areas,
        sensors,
        sessions,
        notifications,
        unreadCount,
        currentUser,
        isLoading,
        isConnected,
        simulatorActive,
        soundEnabled,
        refreshAll,
        updateSlotLocally,
        triggerManualSimulationStep,
        toggleSimulator,
        toggleSound,
        showToast,
        dismissToast,
        toasts,
        markNotificationRead,
        markAllNotificationsRead,
        dismissNotification,
        clearAllNotifications,
        logout,
        loginUser,
      }}
    >
      {children}
    </ParkingContext.Provider>
  );
};

export const useParking = () => {
  const context = useContext(ParkingContext);
  if (!context) {
    throw new Error('useParking must be used within a ParkingProvider');
  }
  return context;
};
