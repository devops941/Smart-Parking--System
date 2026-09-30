'use client';

import React, { useState, useEffect } from 'react';
import { useParking } from '../../context/ParkingContext';
import { Table, Pagination } from '../../components/common/Table';
import { Card } from '../../components/common/Card';
import { Input } from '../../components/common/Input';
import { Button } from '../../components/common/Button';
import { ReceiptModal, ReceiptData } from '../../components/receipt/ReceiptModal';
import { ParkingSession } from '../../types';
import { api } from '../../services/api';
import { getSocket } from '../../services/socket';
import { Clock, History, Search, Car, Calendar, RefreshCw, CheckCircle2, IndianRupee, Timer, Printer } from 'lucide-react';

export default function HistoryPage() {
  const { slots, sessions: contextSessions } = useParking();
  const [sessions, setSessions] = useState<ParkingSession[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchPlate, setSearchPlate] = useState('');
  const [statusFilter, setStatusFilter] = useState('ALL');
  const [selectedSlot, setSelectedSlot] = useState('ALL');
  const [currentPage, setCurrentPage] = useState(1);
  const [selectedReceipt, setSelectedReceipt] = useState<ReceiptData | null>(null);
  const [isReceiptModalOpen, setIsReceiptModalOpen] = useState(false);
  const pageSize = 10;

  const handlePrintSessionReceipt = (s: ParkingSession) => {
    const rate = s.slot?.area?.hourlyRate || 20;
    const mins = s.durationMin || (s.status === 'ACTIVE' ? Math.max(1, Math.round((Date.now() - new Date(s.entryTime).getTime()) / (60 * 1000))) : 60);
    const base = s.feeAmount || Math.max(rate, Math.ceil(mins / 60) * rate);
    const tax = Number((base * 0.18).toFixed(2));
    const total = Number((base + tax).toFixed(2));

    const receiptData: ReceiptData = {
      receiptNo: `REC-${s.sessionId || s.id.slice(-6)}`,
      transactionId: `TXN-${Math.floor(100000 + Math.random() * 900000)}`,
      vehiclePlate: s.vehiclePlate || 'TN-38-BK-1122',
      vehicleType: 'Car',
      slotNumber: s.slot?.slotNumber || 'A-01',
      areaName: s.slot?.area?.name || 'Smart Parking Bay',
      driverName: 'Verified Driver',
      driverPhone: '+91 9876543210',
      entryTime: new Date(s.entryTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      exitTime: s.exitTime ? new Date(s.exitTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : 'Still Parked',
      durationMinutes: mins,
      ratePerHour: rate,
      baseAmount: base,
      taxAmount: tax,
      totalAmount: total,
      paymentMethod: 'UPI',
      paymentStatus: 'PAID',
      issuedAt: (s.exitTime || s.entryTime || new Date()).toString(),
      operatorName: 'System Admin',
    };

    setSelectedReceipt(receiptData);
    setIsReceiptModalOpen(true);
  };

  const fetchHistory = async (showLoading = true) => {
    if (showLoading) setIsLoading(true);
    try {
      const data = await api.getSessions({
        status: statusFilter !== 'ALL' ? statusFilter : undefined,
        vehiclePlate: searchPlate.trim() || undefined,
        slotId: selectedSlot !== 'ALL' ? selectedSlot : undefined,
      });
      if (Array.isArray(data) && (data.length > 0 || searchPlate.trim() || statusFilter !== 'ALL' || selectedSlot !== 'ALL')) {
        setSessions(data);
      } else if (contextSessions && contextSessions.length > 0) {
        setSessions(contextSessions);
      } else {
        setSessions(data || []);
      }
    } catch (err: any) {
      console.warn('History fetch fallback:', err.message);
      // Fallback: filter contextSessions locally
      if (contextSessions && contextSessions.length > 0) {
        let filtered = [...contextSessions];
        if (statusFilter !== 'ALL') filtered = filtered.filter(s => s.status === statusFilter);
        if (searchPlate.trim()) {
          const q = searchPlate.trim().toLowerCase();
          filtered = filtered.filter(s =>
            s.vehiclePlate?.toLowerCase().includes(q) ||
            s.sessionId?.toLowerCase().includes(q) ||
            s.slot?.slotNumber?.toLowerCase().includes(q)
          );
        }
        if (selectedSlot !== 'ALL') {
          filtered = filtered.filter(s => s.slotId === selectedSlot || s.slot?.id === selectedSlot || s.slot?.slotNumber === selectedSlot);
        }
        setSessions(filtered);
      }
    } finally {
      if (showLoading) setIsLoading(false);
    }
  };

  // Sync with contextSessions if local state is empty
  useEffect(() => {
    if (sessions.length === 0 && contextSessions.length > 0 && !searchPlate && statusFilter === 'ALL' && selectedSlot === 'ALL') {
      setSessions(contextSessions);
      setIsLoading(false);
    }
  }, [contextSessions]);

  useEffect(() => {
    fetchHistory();
  }, [searchPlate, statusFilter, selectedSlot]);

  // Real-time WebSocket synchronization for History
  useEffect(() => {
    const socket = getSocket();

    const handleSessionEvent = () => {
      fetchHistory(false);
    };

    socket.on('session:new', handleSessionEvent);
    socket.on('session:updated', handleSessionEvent);
    socket.on('parking:slot-updated', handleSessionEvent);

    return () => {
      socket.off('session:new', handleSessionEvent);
      socket.off('session:updated', handleSessionEvent);
      socket.off('parking:slot-updated', handleSessionEvent);
    };
  }, [searchPlate, statusFilter, selectedSlot]);

  const totalRevenue = sessions.reduce((acc, s) => acc + (s.feeAmount || 0), 0);
  const completedCount = sessions.filter(s => s.status === 'COMPLETED').length;
  const activeCount = sessions.filter(s => s.status === 'ACTIVE').length;

  const totalPages = Math.ceil(sessions.length / pageSize) || 1;
  const paginatedSessions = sessions.slice((currentPage - 1) * pageSize, currentPage * pageSize);

  const columns = [
    {
      header: 'Session Ref',
      render: (s: ParkingSession) => (
        <span className="font-mono text-xs font-bold text-slate-800">{s.sessionId}</span>
      ),
    },
    {
      header: 'Vehicle Number',
      render: (s: ParkingSession) => (
        <div className="flex items-center gap-1.5 font-bold font-mono text-slate-900 text-xs bg-slate-100 px-2 py-0.5 rounded border border-slate-200 w-fit">
          <Car className="w-3.5 h-3.5 text-teal-700 shrink-0" />
          <span>{s.vehiclePlate}</span>
        </div>
      ),
    },
    {
      header: 'Bay / Slot',
      render: (s: ParkingSession) => (
        <span className="font-bold text-xs bg-slate-100 text-slate-800 px-2 py-1 rounded font-mono border border-slate-200">
          {s.slot?.slotNumber || 'A-01'}
        </span>
      ),
    },
    {
      header: 'Entry Timestamp',
      render: (s: ParkingSession) => (
        <span className="text-xs text-slate-700 font-medium">
          {new Date(s.entryTime).toLocaleString([], { dateStyle: 'short', timeStyle: 'short' })}
        </span>
      ),
    },
    {
      header: 'Exit Timestamp',
      render: (s: ParkingSession) => (
        <span className="text-xs text-slate-700 font-medium">
          {s.exitTime ? new Date(s.exitTime).toLocaleString([], { dateStyle: 'short', timeStyle: 'short' }) : 'Still Parked'}
        </span>
      ),
    },
    {
      header: 'Total Duration',
      render: (s: ParkingSession) => {
        const mins = s.durationMin || (s.status === 'ACTIVE' ? Math.max(1, Math.round((Date.now() - new Date(s.entryTime).getTime()) / (60 * 1000))) : 60);
        return (
          <span className="font-mono text-xs font-semibold text-slate-900">
            {Math.floor(mins / 60)}h {mins % 60}m
          </span>
        );
      },
    },
    {
      header: 'Tariff / Fee',
      render: (s: ParkingSession) => (
        <span className="font-bold text-xs text-teal-800 font-mono">
          ₹{s.feeAmount || 20}
        </span>
      ),
    },
    {
      header: 'Status',
      render: (s: ParkingSession) => (
        <span
          className={`text-[10px] font-bold px-2.5 py-0.5 rounded-full uppercase tracking-wider border inline-flex items-center gap-1 ${
            s.status === 'COMPLETED'
              ? 'bg-emerald-50 text-emerald-800 border-emerald-300'
              : s.status === 'ACTIVE'
              ? 'bg-rose-50 text-rose-800 border-rose-300'
              : 'bg-slate-100 text-slate-700 border-slate-200'
          }`}
        >
          <span className={`w-1.5 h-1.5 rounded-full ${s.status === 'COMPLETED' ? 'bg-emerald-500' : 'bg-rose-500'}`} />
          {s.status}
        </span>
      ),
    },
    {
      header: 'Action',
      render: (s: ParkingSession) => (
        <button
          onClick={() => handlePrintSessionReceipt(s)}
          title="Print Customer Receipt"
          className="text-xs font-bold text-teal-700 hover:text-teal-800 bg-teal-50 hover:bg-teal-100 px-2.5 py-1 rounded-lg border border-teal-200 transition-colors inline-flex items-center gap-1"
        >
          <Printer className="w-3.5 h-3.5" /> Receipt
        </button>
      ),
    },
  ];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight flex items-center gap-2">
            <History className="w-6 h-6 text-teal-700" /> Historical Parking Logs
          </h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Audit trail of all previous parking sessions, vehicle entries, exits, and tariffs
          </p>
        </div>

        <Button
          size="sm"
          variant="outline"
          onClick={() => fetchHistory()}
          isLoading={isLoading}
          leftIcon={<RefreshCw className="w-3.5 h-3.5" />}
        >
          Refresh Logs
        </Button>
      </div>

      {/* KPI Stats Strip */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white border border-slate-200/90 rounded-2xl p-4 shadow-xs flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-teal-500/10 text-teal-600 flex items-center justify-center border border-teal-500/20">
              <History className="w-5 h-5" />
            </div>
            <div>
              <p className="text-[11px] font-bold uppercase tracking-wider text-slate-400">Total Sessions</p>
              <p className="text-xl font-extrabold text-slate-900">{sessions.length}</p>
            </div>
          </div>
        </div>

        <div className="bg-white border border-slate-200/90 rounded-2xl p-4 shadow-xs flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-emerald-500/10 text-emerald-600 flex items-center justify-center border border-emerald-500/20">
              <CheckCircle2 className="w-5 h-5" />
            </div>
            <div>
              <p className="text-[11px] font-bold uppercase tracking-wider text-slate-400">Completed Exits</p>
              <p className="text-xl font-extrabold text-emerald-600">{completedCount}</p>
            </div>
          </div>
        </div>

        <div className="bg-white border border-slate-200/90 rounded-2xl p-4 shadow-xs flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-rose-500/10 text-rose-600 flex items-center justify-center border border-rose-500/20">
              <Car className="w-5 h-5" />
            </div>
            <div>
              <p className="text-[11px] font-bold uppercase tracking-wider text-slate-400">Active Parked</p>
              <p className="text-xl font-extrabold text-rose-600">{activeCount}</p>
            </div>
          </div>
        </div>

        <div className="bg-white border border-slate-200/90 rounded-2xl p-4 shadow-xs flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-amber-500/10 text-amber-600 flex items-center justify-center border border-amber-500/20">
              <IndianRupee className="w-5 h-5" />
            </div>
            <div>
              <p className="text-[11px] font-bold uppercase tracking-wider text-slate-400">Revenue Collected</p>
              <p className="text-xl font-extrabold text-amber-700">₹{totalRevenue}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Filters Toolbar */}
      <Card className="p-4 bg-white">
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          <Input
            placeholder="Search Vehicle Plate or Session Ref..."
            value={searchPlate}
            onChange={e => {
              setSearchPlate(e.target.value);
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
            className="block w-full rounded-xl border border-slate-300 text-xs font-bold text-slate-700 bg-white px-3 py-2 focus:outline-none focus:ring-2 focus:ring-teal-500"
          >
            <option value="ALL">All Session Statuses</option>
            <option value="COMPLETED">Completed Exits</option>
            <option value="ACTIVE">Currently Active</option>
          </select>

          <select
            value={selectedSlot}
            onChange={e => {
              setSelectedSlot(e.target.value);
              setCurrentPage(1);
            }}
            className="block w-full rounded-xl border border-slate-300 text-xs font-bold text-slate-700 bg-white px-3 py-2 focus:outline-none focus:ring-2 focus:ring-teal-500"
          >
            <option value="ALL">All Parking Slots</option>
            {slots.map(s => (
              <option key={s.id} value={s.id}>
                {s.slotNumber} ({s.area?.code || 'Area'})
              </option>
            ))}
          </select>
        </div>
      </Card>

      {/* History Table */}
      <Card>
        <Table
          columns={columns}
          data={paginatedSessions}
          keyExtractor={s => s.id}
          isLoading={isLoading}
          emptyMessage="No historical parking sessions found."
        />

        <Pagination
          currentPage={currentPage}
          totalPages={totalPages}
          totalItems={sessions.length}
          pageSize={pageSize}
          onPageChange={page => setCurrentPage(page)}
        />
      </Card>

      {/* Printable Receipt Modal */}
      <ReceiptModal
        isOpen={isReceiptModalOpen}
        onClose={() => setIsReceiptModalOpen(false)}
        receipt={selectedReceipt}
      />
    </div>
  );
}
