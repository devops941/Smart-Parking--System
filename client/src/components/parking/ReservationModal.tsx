'use client';

import React, { useState, useEffect, useMemo } from 'react';
import { Modal } from '../common/Modal';
import { Input } from '../common/Input';
import { Select } from '../common/Select';
import { Button } from '../common/Button';
import { ParkingSlot } from '../../types';
import { api } from '../../services/api';
import { useParking } from '../../context/ParkingContext';
import { Clock, Car, Zap, IndianRupee, Timer } from 'lucide-react';
import { ReservationRecord } from '../../app/parking/booking/page';

interface ReservationModalProps {
  isOpen: boolean;
  onClose: () => void;
  slots: ParkingSlot[];
  onReservationCreated: (newRes: ReservationRecord) => void;
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

function getCurrentTimeWindow() {
  const now = new Date();
  const startH = String(now.getHours()).padStart(2, '0');
  const startM = String(now.getMinutes()).padStart(2, '0');
  const endH = String((now.getHours() + 1) % 24).padStart(2, '0');
  const endM = startM;
  return {
    startTime: `${startH}:${startM}`,
    endTime: `${endH}:${endM}`,
    bookingDate: now.toISOString().slice(0, 10),
  };
}

interface TimeSelectProps {
  label: string;
  value: string;
  onChange: (val: string) => void;
  error?: string;
  helperText?: string;
}

const TIME_OPTIONS = Array.from({ length: 48 }, (_, i) => {
  const totalM = i * 30; // 30-min intervals
  const h = Math.floor(totalM / 60);
  const m = totalM % 60;
  const time24 = `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}`;
  return {
    value: time24,
    label: format12Hour(time24),
  };
});

const CustomTimePicker = ({ label, value, onChange, error, helperText }: TimeSelectProps) => {
  const [isOpen, setIsOpen] = useState(false);
  const containerRef = React.useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleOutside = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleOutside);
    return () => document.removeEventListener('mousedown', handleOutside);
  }, []);

  const handleSelect = (timeVal: string) => {
    onChange(timeVal);
    setIsOpen(false); // Instantly closes dropdown on click!
  };

  return (
    <div className="w-full relative" ref={containerRef}>
      <label className="block text-xs font-semibold text-slate-700 mb-1.5">
        {label}
      </label>

      {/* Clickable Time Input Box */}
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className={`w-full flex items-center justify-between px-3.5 py-2 rounded-lg border text-sm text-left bg-white transition-all shadow-xs ${
          isOpen ? 'ring-2 ring-teal-600 border-transparent' : error ? 'border-rose-400 bg-rose-50/20' : 'border-slate-300 hover:border-slate-400'
        }`}
      >
        <span className="font-semibold text-slate-900">{format12Hour(value) || 'Select Time'}</span>
        <Clock className="w-4 h-4 text-teal-700 shrink-0" />
      </button>

      {error && <p className="mt-1 text-xs text-rose-600 font-medium">{error}</p>}
      {!error && helperText && <p className="mt-1 text-[11px] text-slate-500">{helperText}</p>}

      {/* Auto-closing Dropdown List */}
      {isOpen && (
        <div className="absolute top-full left-0 right-0 mt-1.5 bg-white border border-slate-200 rounded-xl shadow-xl z-50 max-h-56 overflow-y-auto p-1.5 divide-y divide-slate-50 animate-in fade-in zoom-in-95">
          <div className="px-2 py-1 text-[10px] font-bold text-slate-400 uppercase tracking-wider">
            Select Time (Click to Set)
          </div>
          <div className="grid grid-cols-2 gap-1 pt-1">
            {TIME_OPTIONS.map((opt) => {
              const isSelected = opt.value === value;
              return (
                <button
                  key={opt.value}
                  type="button"
                  onClick={() => handleSelect(opt.value)}
                  className={`px-2.5 py-1.5 rounded-lg text-xs font-semibold transition-all text-left flex items-center justify-between ${
                    isSelected
                      ? 'bg-teal-600 text-white shadow-xs'
                      : 'text-slate-700 hover:bg-teal-50 hover:text-teal-800'
                  }`}
                >
                  <span>{opt.label}</span>
                  {isSelected && <span className="text-[10px]">✓</span>}
                </button>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
};

export const ReservationModal = ({
  isOpen,
  onClose,
  slots,
  onReservationCreated,
}: ReservationModalProps) => {
  const { showToast, updateSlotLocally } = useParking();

  const [formData, setFormData] = useState({
    slotId: slots[0]?.id || 'slot-1',
    bookingDate: new Date().toISOString().slice(0, 10),
    startTime: '10:00',
    endTime: '11:00',
    vehiclePlate: 'TN-38-BK-1122',
    vehicleType: 'CAR',
    driverName: 'Gokul',
    driverPhone: '9876543210',
  });

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errors, setErrors] = useState<{ [key: string]: string }>({});

  useEffect(() => {
    if (isOpen) {
      const timeWindow = getCurrentTimeWindow();
      setFormData(prev => ({
        ...prev,
        slotId: prev.slotId && slots.some(s => s.id === prev.slotId) ? prev.slotId : (slots[0]?.id || 'slot-1'),
        bookingDate: timeWindow.bookingDate,
        startTime: timeWindow.startTime,
        endTime: timeWindow.endTime,
      }));
      setErrors({});
    }
  }, [isOpen]);

  // Duration & Fee calculation
  const { durationMinutes, durationText, estimatedFee } = useMemo(() => {
    if (!formData.startTime || !formData.endTime) {
      return { durationMinutes: 60, durationText: '1 hr', estimatedFee: 20 };
    }
    const [startH, startM] = formData.startTime.split(':').map(Number);
    const [endH, endM] = formData.endTime.split(':').map(Number);
    const diff = (endH * 60 + endM) - (startH * 60 + startM);

    if (diff <= 0) {
      return { durationMinutes: 0, durationText: 'Invalid Range', estimatedFee: 0 };
    }

    const hrs = Math.floor(diff / 60);
    const mins = diff % 60;
    const fee = Math.max(20, Math.ceil(diff / 60) * 20); // 20 INR per hr
    return {
      durationMinutes: diff,
      durationText: `${hrs > 0 ? `${hrs} hr ` : ''}${mins > 0 ? `${mins} min` : ''}`.trim() || `${hrs} hr`,
      estimatedFee: fee,
    };
  }, [formData.startTime, formData.endTime]);

  const validate = () => {
    const errs: { [key: string]: string } = {};

    if (durationMinutes <= 0) {
      errs.time = 'End time must be after Start time (minimum 15 mins).';
    }

    if (!formData.vehiclePlate.trim()) {
      errs.plate = 'Vehicle number plate is required.';
    }

    if (!formData.driverName.trim()) {
      errs.driver = 'Driver name is required.';
    }

    const cleanPhone = formData.driverPhone.replace(/\D/g, '');
    if (!cleanPhone || cleanPhone.length < 10) {
      errs.phone = 'Enter a valid 10-digit mobile number.';
    }

    setErrors(errs);
    return Object.keys(errs).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validate()) return;

    const targetSlot = slots.find(s => s.id === formData.slotId) || slots[0];
    if (!targetSlot) return;

    if (targetSlot.status === 'OCCUPIED') {
      showToast('error', 'Slot Occupied', `Slot ${targetSlot.slotNumber} currently has a parked car.`);
      return;
    }

    setIsSubmitting(true);
    try {
      const timeWindow = `${format12Hour(formData.startTime)} - ${format12Hour(formData.endTime)}`;

      const res = await api.createReservation({
        slotId: targetSlot.id,
        vehiclePlate: formData.vehiclePlate.toUpperCase(),
        vehicleType: formData.vehicleType,
        driverName: formData.driverName,
        driverPhone: `+91 ${formData.driverPhone.slice(-10)}`,
        startTime: formData.startTime,
        endTime: formData.endTime,
        durationMinutes,
        estimatedFee,
        bookingDate: formData.bookingDate,
      });

      const newRecord: ReservationRecord = res.data || res;
      onReservationCreated(newRecord);

      updateSlotLocally(targetSlot.id, {
        status: 'RESERVED',
        currentVehicle: `${formData.vehiclePlate.toUpperCase()} [${timeWindow}]`,
        lastStatusChange: new Date().toISOString(),
      });

      showToast(
        'success',
        `Slot ${targetSlot.slotNumber} Reserved Successfully!`,
        `Booked for ${timeWindow} • Vehicle: ${formData.vehiclePlate}`
      );

      onClose();
    } catch (err: any) {
      showToast('error', 'Reservation Failed', err.message);
    } finally {
      setIsSubmitting(false);
    }
  };

  const slotOptions = slots.map(s => ({
    value: s.id,
    label: `${s.slotNumber} — (${s.status})`,
  }));

  const vehicleTypeOptions = [
    { value: 'CAR', label: 'Car (Sedan / Hatchback)' },
    { value: 'SUV', label: 'SUV / Premium' },
    { value: 'EV', label: 'Electric Vehicle (EV)' },
    { value: 'TWO_WHEELER', label: 'Two Wheeler / Bike' },
  ];

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Book New Parking Slot"
      subtitle="Define reservation details, vehicle info, and time window"
      maxWidth="2xl"
      footer={
        <>
          <Button variant="outline" size="sm" onClick={onClose} disabled={isSubmitting}>
            Cancel
          </Button>
          <Button variant="primary" size="sm" onClick={handleSubmit} isLoading={isSubmitting} leftIcon={<Zap className="w-3.5 h-3.5" />}>
            Confirm Reservation
          </Button>
        </>
      }
    >
      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <Select
            label="Select Parking Bay *"
            value={formData.slotId}
            onChange={e => setFormData({ ...formData, slotId: e.target.value })}
            options={slotOptions}
            required
          />

          <Input
            label="Reservation Date *"
            type="date"
            value={formData.bookingDate}
            onChange={e => setFormData({ ...formData, bookingDate: e.target.value })}
            required
          />
        </div>

        {/* Manual Time Range Picker */}
        <div className="bg-slate-50 border border-slate-200 rounded-xl p-4 space-y-3">
          <div className="flex items-center justify-between text-xs">
            <span className="font-bold text-slate-800 flex items-center gap-1.5">
              <Clock className="w-4 h-4 text-teal-700" /> Manual Time Window *
            </span>
            <span className="text-xs font-bold px-2.5 py-1 rounded bg-teal-100 text-teal-800 font-mono shadow-2xs">
              Duration: {durationText}
            </span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <CustomTimePicker
              label="Start Time *"
              value={formData.startTime}
              onChange={(newTime) => {
                setFormData(prev => {
                  const [startH, startM] = newTime.split(':').map(Number);
                  const endH = String((startH + 1) % 24).padStart(2, '0');
                  const endM = String(startM).padStart(2, '0');
                  return {
                    ...prev,
                    startTime: newTime,
                    endTime: `${endH}:${endM}`,
                  };
                });
                setErrors(prev => ({ ...prev, time: '' }));
              }}
              helperText={`Starts at: ${format12Hour(formData.startTime)}`}
            />

            <CustomTimePicker
              label="End Time *"
              value={formData.endTime}
              onChange={(newTime) => {
                setFormData(prev => ({ ...prev, endTime: newTime }));
                setErrors(prev => ({ ...prev, time: '' }));
              }}
              helperText={`Ends at: ${format12Hour(formData.endTime)}`}
              error={errors.time}
            />
          </div>
        </div>

        {/* Vehicle Information */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <Input
            label="Vehicle Number Plate *"
            placeholder="e.g. TN-38-BK-1122"
            value={formData.vehiclePlate}
            onChange={e => {
              setFormData({ ...formData, vehiclePlate: e.target.value.toUpperCase() });
              setErrors({ ...errors, plate: '' });
            }}
            error={errors.plate}
            required
          />

          <Select
            label="Vehicle Category *"
            value={formData.vehicleType}
            onChange={e => setFormData({ ...formData, vehicleType: e.target.value })}
            options={vehicleTypeOptions}
            required
          />
        </div>

        {/* Driver / Contact Details */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <Input
            label="Driver / Owner Name *"
            placeholder="e.g. Gokul"
            value={formData.driverName}
            onChange={e => {
              setFormData({ ...formData, driverName: e.target.value });
              setErrors({ ...errors, driver: '' });
            }}
            error={errors.driver}
            required
          />

          <Input
            label="10-Digit Mobile Phone *"
            placeholder="e.g. 9876543210"
            value={formData.driverPhone}
            onChange={e => {
              setFormData({ ...formData, driverPhone: e.target.value.replace(/\D/g, '') });
              setErrors({ ...errors, phone: '' });
            }}
            error={errors.phone}
            maxLength={10}
            required
          />
        </div>

        {/* Tariff Estimate Box */}
        <div className="bg-teal-50/80 border border-teal-200/80 rounded-xl p-3 flex items-center justify-between text-xs">
          <span className="text-teal-900 font-semibold flex items-center gap-1.5">
            <IndianRupee className="w-4 h-4 text-teal-700" /> Estimated Parking Tariff (₹20/hr):
          </span>
          <span className="text-sm font-black text-teal-900 font-mono">₹{estimatedFee}</span>
        </div>
      </form>
    </Modal>
  );
};
