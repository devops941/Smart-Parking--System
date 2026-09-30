'use client';

import React, { useState, useEffect } from 'react';
import { Modal } from '../common/Modal';
import { Input } from '../common/Input';
import { Select } from '../common/Select';
import { Button } from '../common/Button';
import { ParkingSlot, ParkingArea, Sensor, SlotType, SlotStatus } from '../../types';
import { api } from '../../services/api';
import { useParking } from '../../context/ParkingContext';

interface SlotModalProps {
  isOpen: boolean;
  onClose: () => void;
  slotToEdit?: ParkingSlot | null;
  areas: ParkingArea[];
  sensors: Sensor[];
  onSuccess?: () => void;
}

export const SlotModal = ({
  isOpen,
  onClose,
  slotToEdit,
  areas,
  sensors,
  onSuccess,
}: SlotModalProps) => {
  const { showToast, refreshAll } = useParking();
  const [formData, setFormData] = useState({
    slotNumber: '',
    areaId: '',
    slotType: 'STANDARD' as SlotType,
    status: 'AVAILABLE' as SlotStatus,
    sensorId: '',
  });
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (slotToEdit) {
      setFormData({
        slotNumber: slotToEdit.slotNumber,
        areaId: slotToEdit.areaId,
        slotType: slotToEdit.slotType,
        status: slotToEdit.status,
        sensorId: slotToEdit.sensorId || '',
      });
    } else {
      setFormData({
        slotNumber: '',
        areaId: areas[0]?.id || '',
        slotType: 'STANDARD',
        status: 'AVAILABLE',
        sensorId: '',
      });
    }
  }, [slotToEdit, areas, isOpen]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.slotNumber || !formData.areaId) {
      showToast('error', 'Missing Information', 'Slot Number and Area are required');
      return;
    }

    setIsSubmitting(true);
    try {
      if (slotToEdit) {
        await api.updateSlot(slotToEdit.id, formData);
        showToast('success', 'Slot Updated', `Slot ${formData.slotNumber} updated successfully.`);
      } else {
        await api.createSlot(formData);
        showToast('success', 'Slot Created', `New Slot ${formData.slotNumber} added successfully.`);
      }
      await refreshAll();
      if (onSuccess) onSuccess();
      onClose();
    } catch (err: any) {
      showToast('error', 'Operation Failed', err.message);
    } finally {
      setIsSubmitting(false);
    }
  };

  const slotTypeOptions = [
    { value: 'STANDARD', label: 'Standard Vehicle' },
    { value: 'VIP', label: 'VIP Reserved' },
    { value: 'EV_CHARGING', label: 'EV Charging Station' },
    { value: 'HANDICAPPED', label: 'Handicapped Accessible' },
    { value: 'TWO_WHEELER', label: 'Two Wheeler / Bike' },
  ];

  const statusOptions = [
    { value: 'AVAILABLE', label: 'AVAILABLE (Vacant)' },
    { value: 'OCCUPIED', label: 'OCCUPIED (Parked)' },
    { value: 'RESERVED', label: 'RESERVED' },
    { value: 'OFFLINE', label: 'OFFLINE' },
  ];

  const areaOptions = areas.map(a => ({ value: a.id, label: `${a.name} (${a.code})` }));

  const sensorOptions = [
    { value: '', label: 'None (Assign Later / Virtual)' },
    ...sensors.map(s => ({
      value: s.sensorCode,
      label: `${s.sensorCode} (${s.sensorType} • ${s.status})`,
    })),
  ];

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={slotToEdit ? 'Edit Parking Slot' : 'Add New Parking Slot'}
      subtitle="Configure slot number, zone assignment, and IoT sensor mapping"
      footer={
        <>
          <Button variant="outline" size="sm" onClick={onClose} disabled={isSubmitting}>
            Cancel
          </Button>
          <Button variant="primary" size="sm" onClick={handleSubmit} isLoading={isSubmitting}>
            {slotToEdit ? 'Save Changes' : 'Create Slot'}
          </Button>
        </>
      }
    >
      <form onSubmit={handleSubmit} className="space-y-4">
        <Input
          label="Slot Number *"
          placeholder="e.g. A-01, B-102"
          value={formData.slotNumber}
          onChange={e => setFormData({ ...formData, slotNumber: e.target.value.toUpperCase() })}
          required
        />

        <Select
          label="Parking Area *"
          options={areaOptions}
          value={formData.areaId}
          onChange={e => setFormData({ ...formData, areaId: e.target.value })}
        />

        <div className="grid grid-cols-2 gap-3">
          <Select
            label="Slot Category / Type"
            options={slotTypeOptions}
            value={formData.slotType}
            onChange={e => setFormData({ ...formData, slotType: e.target.value as SlotType })}
          />

          <Select
            label="Initial Status"
            options={statusOptions}
            value={formData.status}
            onChange={e => setFormData({ ...formData, status: e.target.value as SlotStatus })}
          />
        </div>

        <Select
          label="Attached IoT Sensor"
          options={sensorOptions}
          value={formData.sensorId}
          onChange={e => setFormData({ ...formData, sensorId: e.target.value })}
        />
      </form>
    </Modal>
  );
};
