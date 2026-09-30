'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { useParking } from '../../../context/ParkingContext';
import { api } from '../../../services/api';
import { Button } from '../../../components/common/Button';
import { ReservationModal } from '../../../components/parking/ReservationModal';
import { ReceiptModal, ReceiptData } from '../../../components/receipt/ReceiptModal';
import {
  CalendarCheck,
  Clock,
  Car,
  CheckCircle2,
  Bookmark,
  Radio,
  Search,
  Plus,
  Receipt,
  Printer,
} from 'lucide-react';

export interface ReservationRecord {
  id: string;
  reservationCode: string;
  slotNumber: string;
  slotId: string;
  vehiclePlate: string;
  vehicleType: string;
  driverName: string;
  driverPhone: string;
  startTime: string;
  endTime: string;
  durationMinutes: number;
  estimatedFee: number;
  bookingDate: string;
  status: 'RESERVED' | 'OCCUPIED' | 'COMPLETED' | 'CANCELLED';
  createdAt: string;
}

function format12Hour(timeStr: string) {
  if (!timeStr) return '';
  const [h, m] = timeStr.split(':').map(Number);
  if (isNaN(h)) return timeStr;
  const period = h >= 12 ? 'PM' : 'AM';
  const hour12 = h % 12 || 12;
  const minStr = m !== undefined ? String(m).padStart(2, '0') : '00';
  return `${hour12}:${minStr} ${period}`;
}

export default function SlotBookingPage() {
  const { slots, refreshAll, updateSlotLocally, showToast } = useParking();

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedReceipt, setSelectedReceipt] = useState<ReceiptData | null>(null);
  const [isReceiptModalOpen, setIsReceiptModalOpen] = useState(false);
  const [reservations, setReservations] = useState<ReservationRecord[]>([]);
  const [tableSearch, setTableSearch] = useState('');
  const [tableStatusFilter, setTableStatusFilter] = useState('ALL');
  const [isCancellingId, setIsCancellingId] = useState<string | null>(null);

  const handlePrintBookingReceipt = (res: ReservationRecord) => {
    const base = res.estimatedFee || Math.max(20, Math.ceil((res.durationMinutes || 60) / 60) * 20);
    const tax = Number((base * 0.18).toFixed(2));
    const total = Number((base + tax).toFixed(2));

    const receiptData: ReceiptData = {
      receiptNo: `REC-${res.reservationCode || res.id.slice(-6)}`,
      transactionId: `TXN-${Math.floor(100000 + Math.random() * 900000)}`,
      vehiclePlate: res.vehiclePlate,
      vehicleType: res.vehicleType || 'Car',
      slotNumber: res.slotNumber,
      areaName: 'Zone A',
      driverName: res.driverName,
      driverPhone: res.driverPhone,
      entryTime: format12Hour(res.startTime),
      exitTime: format12Hour(res.endTime),
      durationMinutes: res.durationMinutes || 60,
      ratePerHour: 20,
      baseAmount: base,
      taxAmount: tax,
      totalAmount: total,
      paymentMethod: 'UPI',
      paymentStatus: 'PAID',
      issuedAt: res.createdAt || new Date().toISOString(),
      operatorName: 'System Admin',
    };

    setSelectedReceipt(receiptData);
    setIsReceiptModalOpen(true);
  };

  // Load reservations directly from PostgreSQL Database
  const loadDbReservations = useCallback(async () => {
    try {
      const data = await api.getReservations();
      if (Array.isArray(data)) {
        setReservations(data);
      }
    } catch (err: any) {
      console.warn('Could not load reservations from DB:', err.message);
    }
  }, []);

  useEffect(() => {
    loadDbReservations();
  }, [loadDbReservations]);

  // Auto-sync reservation lifecycle with live slots:
  // - RESERVED -> OCCUPIED when car arrives and parks
  // - OCCUPIED -> COMPLETED when car departs
  useEffect(() => {
    if (!slots || slots.length === 0) return;

    setReservations(prev => {
      let changed = false;
      const updated = prev.map(res => {
        const matchingSlot = slots.find(
          s => s.id === res.slotId || s.slotNumber.toUpperCase() === res.slotNumber.toUpperCase()
        );
        if (!matchingSlot) return res;

        if (matchingSlot.status === 'OCCUPIED' && res.status === 'RESERVED') {
          changed = true;
          return { ...res, status: 'OCCUPIED' as const };
        } else if (matchingSlot.status === 'AVAILABLE' && res.status === 'OCCUPIED') {
          changed = true;
          return { ...res, status: 'COMPLETED' as const };
        }
        return res;
      });
      return changed ? updated : prev;
    });
  }, [slots]);

  const handleReservationCreated = (newRes: ReservationRecord) => {
    setReservations(prev => [newRes, ...prev]);
    refreshAll();
  };

  const handleCancelReservation = async (res: ReservationRecord) => {
    setIsCancellingId(res.id);
    try {
      await api.cancelReservation(res.id);

      updateSlotLocally(res.slotId, {
        status: 'AVAILABLE',
        currentVehicle: null,
        lastStatusChange: new Date().toISOString(),
      });

      setReservations(prev =>
        prev.map(r => (r.id === res.id ? { ...r, status: 'CANCELLED' } : r))
      );

      showToast(
        'success',
        `Slot ${res.slotNumber} Reservation Cancelled`,
        'Slot is now Available for new bookings'
      );
      refreshAll();
    } catch (err: any) {
      showToast('error', 'Cancellation Failed', err.message);
    } finally {
      setIsCancellingId(null);
    }
  };

  const filteredReservations = reservations.filter(res => {
    if (tableStatusFilter !== 'ALL' && res.status !== tableStatusFilter) return false;
    if (tableSearch.trim()) {
      const q = tableSearch.toLowerCase();
      const matchPlate = res.vehiclePlate?.toLowerCase().includes(q);
      const matchDriver = res.driverName?.toLowerCase().includes(q);
      const matchCode = res.reservationCode?.toLowerCase().includes(q);
      const matchSlot = res.slotNumber?.toLowerCase().includes(q);
      if (!matchPlate && !matchDriver && !matchCode && !matchSlot) return false;
    }
    return true;
  });

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight flex items-center gap-2">
            <CalendarCheck className="w-6 h-6 text-teal-700" /> Slot Booking & Reservations
          </h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Organize advance parking bay bookings, time windows, and vehicle details
          </p>
        </div>

        <div className="flex items-center gap-2.5">
          <Button
            size="sm"
            variant="primary"
            onClick={() => setIsModalOpen(true)}
            leftIcon={<Plus className="w-4 h-4" />}
          >
            Book New Slot
          </Button>
        </div>
      </div>

      {/* KPI Stats Strip */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white border border-slate-200/90 rounded-2xl p-4 shadow-xs flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-emerald-500/10 text-emerald-600 flex items-center justify-center border border-emerald-500/20">
              <CheckCircle2 className="w-5 h-5" />
            </div>
            <div>
              <p className="text-[11px] font-bold uppercase tracking-wider text-slate-400">Available Bays</p>
              <p className="text-xl font-extrabold text-slate-900">{slots.filter(s => s.status === 'AVAILABLE').length}</p>
            </div>
          </div>
        </div>

        <div className="bg-white border border-slate-200/90 rounded-2xl p-4 shadow-xs flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-amber-500/10 text-amber-600 flex items-center justify-center border border-amber-500/20">
              <Bookmark className="w-5 h-5" />
            </div>
            <div>
              <p className="text-[11px] font-bold uppercase tracking-wider text-slate-400">Reserved Bays</p>
              <p className="text-xl font-extrabold text-amber-600">{slots.filter(s => s.status === 'RESERVED').length}</p>
            </div>
          </div>
        </div>

        <div className="bg-white border border-slate-200/90 rounded-2xl p-4 shadow-xs flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-rose-500/10 text-rose-600 flex items-center justify-center border border-rose-500/20">
              <Car className="w-5 h-5" />
            </div>
            <div>
              <p className="text-[11px] font-bold uppercase tracking-wider text-slate-400">Occupied Bays</p>
              <p className="text-xl font-extrabold text-rose-600">{slots.filter(s => s.status === 'OCCUPIED').length}</p>
            </div>
          </div>
        </div>

        <div className="bg-white border border-slate-200/90 rounded-2xl p-4 shadow-xs flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-teal-500/10 text-teal-600 flex items-center justify-center border border-teal-500/20">
              <CalendarCheck className="w-5 h-5" />
            </div>
            <div>
              <p className="text-[11px] font-bold uppercase tracking-wider text-slate-400">Total Bookings</p>
              <p className="text-xl font-extrabold text-teal-700">{reservations.length}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Reservation Registry Table */}
      <div className="bg-white border border-slate-200/80 rounded-2xl shadow-xs overflow-hidden">
        {/* Table Controls */}
        <div className="p-4 sm:p-5 border-b border-slate-100 flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-slate-50/50">
          <div>
            <h2 className="text-sm font-bold text-slate-900 flex items-center gap-2">
              <CalendarCheck className="w-4 h-4 text-teal-700" /> Reservation Registry & History
            </h2>
            <p className="text-xs text-slate-500 mt-0.5">
              Live record of all scheduled bookings, manual start & end times, vehicle details, and driver contacts
            </p>
          </div>

          <div className="flex items-center gap-2.5">
            <div className="relative w-full sm:w-64">
              <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
              <input
                type="text"
                placeholder="Search plate, driver, ID..."
                value={tableSearch}
                onChange={e => setTableSearch(e.target.value)}
                className="w-full pl-8 pr-3 py-1.5 text-xs bg-white border border-slate-200 rounded-lg placeholder:text-slate-400 focus:outline-none focus:ring-1 focus:ring-teal-500"
              />
            </div>

            <select
              value={tableStatusFilter}
              onChange={e => setTableStatusFilter(e.target.value)}
              className="py-1.5 px-2.5 text-xs bg-white border border-slate-200 rounded-lg text-slate-700 font-medium focus:outline-none focus:ring-1 focus:ring-teal-500"
            >
              <option value="ALL">All Statuses ({reservations.length})</option>
              <option value="RESERVED">Reserved</option>
              <option value="OCCUPIED">Occupied</option>
              <option value="COMPLETED">Completed</option>
              <option value="CANCELLED">Cancelled</option>
            </select>
          </div>
        </div>

        {/* Table Content */}
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-slate-100 bg-slate-50/30 text-[11px] font-bold text-slate-400 uppercase tracking-wider">
                <th className="py-3 px-4">Reservation Code</th>
                <th className="py-3 px-4">Bay</th>
                <th className="py-3 px-4">Vehicle Plate</th>
                <th className="py-3 px-4">Time Window</th>
                <th className="py-3 px-4">Duration & Fee</th>
                <th className="py-3 px-4">Driver / Contact</th>
                <th className="py-3 px-4">Status</th>
                <th className="py-3 px-4 text-right">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-xs text-slate-700">
              {filteredReservations.length === 0 ? (
                <tr>
                  <td colSpan={8} className="py-12 text-center text-slate-400">
                    <Bookmark className="w-8 h-8 text-slate-300 mx-auto mb-2" />
                    <p className="font-semibold text-slate-600">No reservations found matching your filter.</p>
                    <button
                      onClick={() => setIsModalOpen(true)}
                      className="mt-2 text-xs font-bold text-teal-700 hover:text-teal-800 bg-teal-50 px-3 py-1.5 rounded-lg border border-teal-200 inline-block transition-colors"
                    >
                      Create First Reservation
                    </button>
                  </td>
                </tr>
              ) : (
                filteredReservations.map(res => {
                  const isReserved = res.status === 'RESERVED';
                  const isOccupied = res.status === 'OCCUPIED';
                  const isCompleted = res.status === 'COMPLETED';
                  const isCancelled = res.status === 'CANCELLED';

                  return (
                    <tr key={res.id} className="hover:bg-slate-50/50 transition-colors">
                      <td className="py-3 px-4 font-mono font-bold text-slate-900">
                        {res.reservationCode}
                      </td>
                      <td className="py-3 px-4">
                        <span className="font-black text-slate-900 px-2 py-0.5 rounded bg-slate-100 border border-slate-200">
                          {res.slotNumber}
                        </span>
                      </td>
                      <td className="py-3 px-4 font-mono font-bold text-slate-800">
                        {res.vehiclePlate}
                        <span className="block text-[10px] text-slate-400 font-sans font-normal uppercase">
                          {res.vehicleType}
                        </span>
                      </td>
                      <td className="py-3 px-4">
                        <span className="flex items-center gap-1 font-medium text-slate-900">
                          <Clock className="w-3 h-3 text-slate-400" />
                          {format12Hour(res.startTime)} - {format12Hour(res.endTime)}
                        </span>
                        <span className="text-[10px] text-slate-400 block">{res.bookingDate}</span>
                      </td>
                      <td className="py-3 px-4">
                        <span className="font-bold text-slate-900">{res.durationMinutes} mins</span>
                        <span className="block text-[11px] text-emerald-600 font-semibold">
                          ₹{res.estimatedFee} (Est.)
                        </span>
                      </td>
                      <td className="py-3 px-4">
                        <p className="font-semibold text-slate-900">{res.driverName}</p>
                        <p className="text-[11px] text-slate-400 font-mono">{res.driverPhone}</p>
                      </td>
                      <td className="py-3 px-4">
                        <span
                          className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-bold uppercase tracking-wider border ${
                            isReserved
                              ? 'bg-amber-50 text-amber-800 border-amber-200'
                              : isOccupied
                              ? 'bg-rose-50 text-rose-800 border-rose-200 animate-pulse'
                              : isCompleted
                              ? 'bg-emerald-50 text-emerald-800 border-emerald-200'
                              : 'bg-slate-100 text-slate-600 border-slate-200'
                          }`}
                        >
                          {isReserved && <Radio className="w-2.5 h-2.5 text-amber-600 animate-pulse" />}
                          {isOccupied && <Car className="w-2.5 h-2.5 text-rose-600" />}
                          {isCompleted && <CheckCircle2 className="w-2.5 h-2.5 text-emerald-600" />}
                          {res.status}
                        </span>
                      </td>
                      <td className="py-3 px-4 text-right">
                        <div className="flex items-center justify-end gap-1.5">
                          <button
                            onClick={() => handlePrintBookingReceipt(res)}
                            title="Print Parking Receipt"
                            className="text-[11px] font-bold text-teal-700 hover:text-teal-800 bg-teal-50 hover:bg-teal-100 px-2.5 py-1 rounded-lg border border-teal-200 transition-colors inline-flex items-center gap-1"
                          >
                            <Printer className="w-3 h-3" /> Receipt
                          </button>

                          {isReserved && (
                            <button
                              onClick={() => handleCancelReservation(res)}
                              disabled={isCancellingId === res.id}
                              className="text-[11px] font-bold text-rose-600 hover:text-rose-700 bg-rose-50 hover:bg-rose-100 px-2.5 py-1 rounded-lg border border-rose-200 transition-colors disabled:opacity-50"
                            >
                              {isCancellingId === res.id ? 'Cancelling...' : 'Cancel'}
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>

        {/* Footer */}
        <div className="p-3.5 border-t border-slate-100 bg-slate-50/30 flex items-center justify-between text-xs text-slate-400">
          <span>Showing {filteredReservations.length} of {reservations.length} total entries</span>
        </div>
      </div>

      {/* Reservation Modal */}
      <ReservationModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        slots={slots}
        onReservationCreated={handleReservationCreated}
      />

      {/* Printable Receipt Modal */}
      <ReceiptModal
        isOpen={isReceiptModalOpen}
        onClose={() => setIsReceiptModalOpen(false)}
        receipt={selectedReceipt}
      />
    </div>
  );
}
