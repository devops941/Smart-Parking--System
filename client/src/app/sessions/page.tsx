'use client';

import React, { useState, useEffect } from 'react';
import { useParking } from '../../context/ParkingContext';
import { Table, Pagination } from '../../components/common/Table';
import { Card } from '../../components/common/Card';
import { Input } from '../../components/common/Input';
import { Button } from '../../components/common/Button';
import { Modal } from '../../components/common/Modal';
import { Select } from '../../components/common/Select';
import { StatusBadge } from '../../components/common/StatusBadge';
import { ParkingSession } from '../../types';
import { api } from '../../services/api';
import { getSocket } from '../../services/socket';
import { Clock, Plus, CheckCircle2, Car, RefreshCw, Search, Banknote } from 'lucide-react';

export default function ParkingSessionsPage() {
  const { slots, showToast, refreshAll } = useParking();
  const [sessions, setSessions] = useState<ParkingSession[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState('ALL');
  const [searchQuery, setSearchQuery] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [isCheckInOpen, setIsCheckInOpen] = useState(false);
  const [checkInSlot, setCheckInSlot] = useState('');
  const [checkInPlate, setCheckInPlate] = useState('');
  const [isCompletingId, setIsCompletingId] = useState<string | null>(null);
  const [isCheckingIn, setIsCheckingIn] = useState(false);
  const pageSize = 10;

  const fetchSessions = async (showLoading = true) => {
    if (showLoading) setIsLoading(true);
    try {
      const data = await api.getSessions({
        status: statusFilter,
        vehiclePlate: searchQuery,
      });
      setSessions(data);
    } catch (err: any) {
      console.warn('Session fetch fallback:', err.message);
    } finally {
      if (showLoading) setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchSessions();
  }, [statusFilter, searchQuery]);

  // Real-time WebSocket synchronization
  useEffect(() => {
    const socket = getSocket();

    const handleSessionNew = (newSession: ParkingSession) => {
      setSessions(prev => {
        const matchesStatus = statusFilter === 'ALL' || newSession.status === statusFilter;
        const matchesSearch = !searchQuery || newSession.vehiclePlate?.toLowerCase().includes(searchQuery.toLowerCase());
        if (matchesStatus && matchesSearch) {
          return [newSession, ...prev.filter(s => s.id !== newSession.id && s.sessionId !== newSession.sessionId)];
        }
        return prev;
      });
    };

    const handleSessionUpdated = (updatedSession: ParkingSession) => {
      setSessions(prev => {
        const exists = prev.some(s => s.id === updatedSession.id || s.sessionId === updatedSession.sessionId);
        if (exists) {
          const matchesStatus = statusFilter === 'ALL' || updatedSession.status === statusFilter;
          if (!matchesStatus) {
            return prev.filter(s => s.id !== updatedSession.id && s.sessionId !== updatedSession.sessionId);
          }
          return prev.map(s => (s.id === updatedSession.id || s.sessionId === updatedSession.sessionId) ? { ...s, ...updatedSession } : s);
        } else {
          const matchesStatus = statusFilter === 'ALL' || updatedSession.status === statusFilter;
          const matchesSearch = !searchQuery || updatedSession.vehiclePlate?.toLowerCase().includes(searchQuery.toLowerCase());
          if (matchesStatus && matchesSearch) {
            return [updatedSession, ...prev];
          }
          return prev;
        }
      });
    };

    const handleSlotOrSensorUpdated = () => {
      fetchSessions(false);
    };

    socket.on('session:new', handleSessionNew);
    socket.on('session:updated', handleSessionUpdated);
    socket.on('parking:slot-updated', handleSlotOrSensorUpdated);

    return () => {
      socket.off('session:new', handleSessionNew);
      socket.off('session:updated', handleSessionUpdated);
      socket.off('parking:slot-updated', handleSlotOrSensorUpdated);
    };
  }, [statusFilter, searchQuery]);

  const handleManualCheckIn = async (e: React.FormEvent) => {
    e.preventDefault();
    const cleanPlate = checkInPlate.trim().toUpperCase();
    if (!cleanPlate) {
      showToast('error', 'Missing Information', 'Vehicle License Plate is required');
      return;
    }

    const targetSlotId = checkInSlot || slots.find(s => s.status === 'AVAILABLE')?.id || slots[0]?.id;
    if (!targetSlotId) {
      showToast('error', 'No Slot Available', 'Please ensure parking slots exist in database.');
      return;
    }

    setIsCheckingIn(true);
    try {
      await api.createSession({ slotId: targetSlotId, vehiclePlate: cleanPlate });
      showToast('success', 'Vehicle Checked-In', `${cleanPlate} parked at assigned slot.`);
      setIsCheckInOpen(false);
      setCheckInPlate('');
      await refreshAll();
      fetchSessions();
    } catch (err: any) {
      showToast('error', 'Check-in Failed', err.message);
    } finally {
      setIsCheckingIn(false);
    }
  };

  const handleCompleteSession = async (session: ParkingSession) => {
    setIsCompletingId(session.id);
    try {
      await api.completeSession(session.id);
      showToast('success', 'Session Completed', `Vehicle ${session.vehiclePlate} marked as departed.`);
      await refreshAll();
      fetchSessions();
    } catch (err: any) {
      showToast('error', 'Checkout Failed', err.message);
    } finally {
      setIsCompletingId(null);
    }
  };

  const totalPages = Math.ceil(sessions.length / pageSize) || 1;
  const paginatedSessions = sessions.slice((currentPage - 1) * pageSize, currentPage * pageSize);

  const availableSlots = slots.filter(s => s.status === 'AVAILABLE');
  const slotOptions = (availableSlots.length > 0 ? availableSlots : slots).map(s => ({
    value: s.id,
    label: `${s.slotNumber} — (${s.status})${s.area?.name ? ` • ${s.area.name}` : ''}`,
  }));

  const columns = [
    {
      header: 'Session ID',
      render: (s: ParkingSession) => (
        <span className="font-mono font-bold text-slate-900 text-xs">
          {s.sessionId}
        </span>
      ),
    },
    {
      header: 'Vehicle Plate',
      render: (s: ParkingSession) => (
        <div className="flex items-center gap-1.5 font-bold font-mono text-slate-800 text-xs bg-slate-50 px-2 py-0.5 rounded border border-slate-200 w-fit">
          <Car className="w-3.5 h-3.5 text-teal-700 shrink-0" />
          <span>{s.vehiclePlate}</span>
        </div>
      ),
    },
    {
      header: 'Assigned Slot',
      render: (s: ParkingSession) => (
        <span className="font-extrabold text-slate-900 text-xs bg-teal-50 text-teal-800 px-2 py-1 rounded border border-teal-200">
          {s.slot?.slotNumber || s.slotId}
        </span>
      ),
    },
    {
      header: 'Entry Time',
      render: (s: ParkingSession) => (
        <span className="text-xs text-slate-700">
          {new Date(s.entryTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
        </span>
      ),
    },
    {
      header: 'Exit Time',
      render: (s: ParkingSession) => (
        <span className="text-xs text-slate-500">
          {s.exitTime ? new Date(s.exitTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : 'In Progress'}
        </span>
      ),
    },
    {
      header: 'Duration',
      render: (s: ParkingSession) => {
        const mins = s.durationMin ?? Math.max(1, Math.round((Date.now() - new Date(s.entryTime).getTime()) / 60000));
        return (
          <span className="font-mono text-xs text-slate-800 font-semibold">
            {Math.floor(mins / 60)}h {mins % 60}m
          </span>
        );
      },
    },
    {
      header: 'Tariff Fee',
      render: (s: ParkingSession) => (
        <span className="font-bold text-xs text-slate-900">
          INR {s.feeAmount || 20}
        </span>
      ),
    },
    {
      header: 'Session Status',
      render: (s: ParkingSession) => (
        <span
          className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-bold ${
            s.status === 'ACTIVE'
              ? 'bg-emerald-100 text-emerald-800 animate-pulse'
              : 'bg-slate-100 text-slate-700'
          }`}
        >
          {s.status}
        </span>
      ),
    },
    {
      header: 'Actions',
      className: 'text-right',
      render: (s: ParkingSession) => (
        s.status === 'ACTIVE' ? (
          <Button
            size="sm"
            variant="outline"
            onClick={() => handleCompleteSession(s)}
            isLoading={isCompletingId === s.id}
            leftIcon={<CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />}
            className="text-xs py-1 px-2.5 h-7"
          >
            Checkout
          </Button>
        ) : (
          <span className="text-slate-400 text-xs italic">Closed</span>
        )
      ),
    },
  ];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight flex items-center gap-2">
            <Clock className="w-6 h-6 text-teal-700" /> Parking Sessions & Toll Management
          </h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Active and completed parking transactions, automated entry timestamps, and fee settlement
          </p>
        </div>

        <div className="flex items-center gap-2">
          <Button
            size="sm"
            variant="outline"
            onClick={() => fetchSessions()}
            isLoading={isLoading}
            leftIcon={<RefreshCw className="w-3.5 h-3.5" />}
          >
            Refresh
          </Button>
          <Button
            size="sm"
            variant="primary"
            onClick={() => {
              const defaultSlot = slots.find(s => s.status === 'AVAILABLE') || slots[0];
              setCheckInSlot(defaultSlot?.id || '');
              setCheckInPlate('');
              setIsCheckInOpen(true);
            }}
            leftIcon={<Plus className="w-4 h-4" />}
          >
            Manual Check-In
          </Button>
        </div>
      </div>

      {/* Filter Toolbar */}
      <Card className="p-4 bg-white">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <Input
            placeholder="Search Vehicle Plate or Session ID..."
            value={searchQuery}
            onChange={e => {
              setSearchQuery(e.target.value);
              setCurrentPage(1);
            }}
            leftIcon={<Search className="w-4 h-4" />}
          />

          <select
            value={statusFilter}
            onChange={e => {
              setStatusFilter(e.target.value);
              setCurrentPage(1);
            }}
            className="block w-full rounded-lg border border-slate-300 text-xs text-slate-700 bg-white px-3 py-2"
          >
            <option value="ALL">All Session States</option>
            <option value="ACTIVE">Active (Currently Parked)</option>
            <option value="COMPLETED">Completed (Departed)</option>
          </select>
        </div>
      </Card>

      {/* Sessions Table */}
      <Card>
        <Table
          columns={columns}
          data={paginatedSessions}
          keyExtractor={s => s.id}
          isLoading={isLoading}
          emptyMessage="No parking sessions found."
        />

        <Pagination
          currentPage={currentPage}
          totalPages={totalPages}
          totalItems={sessions.length}
          pageSize={pageSize}
          onPageChange={page => setCurrentPage(page)}
        />
      </Card>

      {/* Manual Check-in Modal */}
      <Modal
        isOpen={isCheckInOpen}
        onClose={() => setIsCheckInOpen(false)}
        title="Manual Vehicle Check-In"
        subtitle="Authorize vehicle entry without automated IoT recognition"
        footer={
          <>
            <Button variant="outline" size="sm" onClick={() => setIsCheckInOpen(false)} disabled={isCheckingIn}>
              Cancel
            </Button>
            <Button variant="primary" size="sm" onClick={handleManualCheckIn} isLoading={isCheckingIn}>
              Check-In Vehicle
            </Button>
          </>
        }
      >
        <form onSubmit={handleManualCheckIn} className="space-y-4">
          <Input
            label="Vehicle License Plate *"
            placeholder="e.g. TN-58-AB-1234"
            value={checkInPlate}
            onChange={e => setCheckInPlate(e.target.value.toUpperCase())}
            required
          />

          <Select
            label="Assign Available Slot *"
            options={slotOptions.length > 0 ? slotOptions : [{ value: '', label: 'No bays configured' }]}
            value={checkInSlot}
            onChange={e => setCheckInSlot(e.target.value)}
            helperText={availableSlots.length === 0 && slots.length > 0 ? 'All bays are currently occupied or reserved.' : undefined}
          />
        </form>
      </Modal>
    </div>
  );
}
