'use client';

import React, { useState } from 'react';
import { ParkingSlot } from '../../types';
import { Modal } from '../common/Modal';
import { StatusBadge } from '../common/StatusBadge';
import { Button } from '../common/Button';
import { api } from '../../services/api';
import { useParking } from '../../context/ParkingContext';
import {
  Radio,
  Car,
  Power,
  RefreshCw,
} from 'lucide-react';

interface SlotDetailModalProps {
  slot: ParkingSlot | null;
  isOpen: boolean;
  onClose: () => void;
}

export const SlotDetailModal = ({ slot, isOpen, onClose }: SlotDetailModalProps) => {
  const { updateSlotLocally, showToast } = useParking();
  const [isUpdating, setIsUpdating] = useState(false);

  if (!slot) return null;

  const isOccupied = slot.status === 'OCCUPIED';
  const durationText = slot.lastStatusChange
    ? `${Math.max(1, Math.round((Date.now() - new Date(slot.lastStatusChange).getTime()) / 60000))} mins`
    : 'N/A';

  const handleToggleOccupancy = async () => {
    setIsUpdating(true);
    try {
      const nextStatus = isOccupied ? 'AVAILABLE' : 'OCCUPIED';
      const samplePlate = nextStatus === 'OCCUPIED' ? `TN-58-AB-${Math.floor(1000 + Math.random() * 9000)}` : null;

      await api.updateSlot(slot.id, {
        status: nextStatus,
        currentVehicle: samplePlate,
      });

      updateSlotLocally(slot.id, {
        status: nextStatus,
        currentVehicle: samplePlate,
        lastStatusChange: new Date().toISOString(),
      });

      showToast('success', `Slot ${slot.slotNumber} Updated`, `Marked as ${nextStatus}`);
      onClose();
    } catch (err: any) {
      showToast('error', 'Update Failed', err.message);
    } finally {
      setIsUpdating(false);
    }
  };

  const handleToggleActive = async () => {
    setIsUpdating(true);
    try {
      const updated = await api.toggleSlotActive(slot.id);
      updateSlotLocally(slot.id, {
        isActive: updated.isActive,
        status: updated.status,
      });
      showToast('info', `Slot ${slot.slotNumber} State Changed`, updated.isActive ? 'Slot Activated' : 'Slot Disabled');
      onClose();
    } catch (err: any) {
      showToast('error', 'Toggle Failed', err.message);
    } finally {
      setIsUpdating(false);
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={`Slot Details — ${slot.slotNumber}`}
      subtitle={`Zone / Area: ${slot.area?.name || 'Area Deck'} • Slot Type: ${slot.slotType}`}
      maxWidth="lg"
      footer={
        <>
          <Button variant="outline" size="sm" onClick={onClose}>
            Close
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={handleToggleActive}
            isLoading={isUpdating}
            leftIcon={<Power className="w-3.5 h-3.5" />}
          >
            {slot.isActive ? 'Disable Slot' : 'Enable Slot'}
          </Button>
          <Button
            variant={isOccupied ? 'success' : 'danger'}
            size="sm"
            onClick={handleToggleOccupancy}
            isLoading={isUpdating}
            leftIcon={<RefreshCw className="w-3.5 h-3.5" />}
          >
            {isOccupied ? 'Force Vacant (Exit)' : 'Force Occupied (Park)'}
          </Button>
        </>
      }
    >
      <div className="space-y-5">
        {/* Status Header Bar */}
        <div className="bg-slate-50 border border-slate-200/90 rounded-xl p-4 flex items-center justify-between">
          <div>
            <p className="text-xs text-slate-500 font-semibold uppercase">Current State</p>
            <div className="mt-1">
              <StatusBadge status={slot.status} size="md" pulse={isOccupied} />
            </div>
          </div>

          <div className="text-right">
            <p className="text-xs text-slate-500 font-semibold uppercase">Duration in State</p>
            <p className="text-sm font-bold text-slate-900 mt-0.5">{durationText}</p>
          </div>
        </div>

        {/* Two Column Details Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* Sensor Information */}
          <div className="border border-slate-200 rounded-xl p-4 space-y-3 bg-white">
            <div className="flex items-center gap-2 text-xs font-bold text-teal-800 uppercase tracking-wide border-b pb-2">
              <Radio className="w-4 h-4 text-teal-600" /> IoT Sensor Telemetry
            </div>

            <div className="space-y-2 text-xs">
              <div className="flex justify-between py-1 border-b border-slate-100">
                <span className="text-slate-500">Sensor ID:</span>
                <span className="font-mono font-bold text-slate-900">
                  {slot.sensor?.sensorCode || slot.sensorId || 'SENSOR-001'}
                </span>
              </div>
              <div className="flex justify-between py-1 border-b border-slate-100">
                <span className="text-slate-500">Sensor Type:</span>
                <span className="font-medium text-slate-800">
                  {slot.sensor?.sensorType || 'IR Sensor'}
                </span>
              </div>
              <div className="flex justify-between py-1 border-b border-slate-100">
                <span className="text-slate-500">Distance Reading:</span>
                <span className="font-mono font-bold text-teal-700">
                  {slot.sensor?.lastReading !== undefined && slot.sensor?.lastReading !== null
                    ? `${slot.sensor.lastReading} cm`
                    : '150 cm'}
                </span>
              </div>
              <div className="flex justify-between py-1 border-b border-slate-100">
                <span className="text-slate-500">Sensor Status:</span>
                <span className="font-semibold text-emerald-600">
                  {slot.sensor?.status || 'ONLINE'}
                </span>
              </div>
              <div className="flex justify-between py-1">
                <span className="text-slate-500">Battery Level:</span>
                <span className="font-medium text-slate-700">
                  {slot.sensor?.batteryLevel || 100}%
                </span>
              </div>
            </div>
          </div>

          {/* Vehicle & Session Information */}
          <div className="border border-slate-200 rounded-xl p-4 space-y-3 bg-white">
            <div className="flex items-center gap-2 text-xs font-bold text-teal-800 uppercase tracking-wide border-b pb-2">
              <Car className="w-4 h-4 text-teal-600" /> Vehicle & Session
            </div>

            <div className="space-y-2 text-xs">
              <div className="flex justify-between py-1 border-b border-slate-100">
                <span className="text-slate-500">Vehicle Number:</span>
                <span className="font-mono font-bold text-slate-900">
                  {slot.currentVehicle || 'None (Slot Vacant)'}
                </span>
              </div>
              <div className="flex justify-between py-1 border-b border-slate-100">
                <span className="text-slate-500">Entry Time:</span>
                <span className="font-medium text-slate-800">
                  {slot.lastStatusChange
                    ? new Date(slot.lastStatusChange).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
                    : 'N/A'}
                </span>
              </div>
              <div className="flex justify-between py-1 border-b border-slate-100">
                <span className="text-slate-500">Hourly Rate:</span>
                <span className="font-bold text-slate-900">
                  INR {slot.area?.hourlyRate || 20}/hr
                </span>
              </div>
              <div className="flex justify-between py-1 border-b border-slate-100">
                <span className="text-slate-500">Slot Type:</span>
                <span className="font-semibold text-slate-800">{slot.slotType}</span>
              </div>
              <div className="flex justify-between py-1">
                <span className="text-slate-500">Operational:</span>
                <span className={slot.isActive ? 'font-bold text-emerald-600' : 'font-bold text-rose-600'}>
                  {slot.isActive ? 'Active & Enabled' : 'Disabled / In Maintenance'}
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </Modal>
  );
};
