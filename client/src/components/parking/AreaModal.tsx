'use client';

import React, { useState, useEffect } from 'react';
import { Modal } from '../common/Modal';
import { Input } from '../common/Input';
import { Button } from '../common/Button';
import { ParkingArea } from '../../types';
import { api } from '../../services/api';
import { useParking } from '../../context/ParkingContext';

interface AreaModalProps {
  isOpen: boolean;
  onClose: () => void;
  areaToEdit?: ParkingArea | null;
  onSuccess?: () => void;
}

export const AreaModal = ({ isOpen, onClose, areaToEdit, onSuccess }: AreaModalProps) => {
  const { showToast, refreshAll } = useParking();
  const [formData, setFormData] = useState({
    name: '',
    code: '',
    description: '',
    floorLevel: 0,
    hourlyRate: 20,
  });
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (areaToEdit) {
      setFormData({
        name: areaToEdit.name,
        code: areaToEdit.code,
        description: areaToEdit.description || '',
        floorLevel: areaToEdit.floorLevel,
        hourlyRate: areaToEdit.hourlyRate,
      });
    } else {
      setFormData({
        name: '',
        code: '',
        description: '',
        floorLevel: 0,
        hourlyRate: 20,
      });
    }
  }, [areaToEdit, isOpen]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name || !formData.code) {
      showToast('error', 'Missing Fields', 'Area Name and Code are required');
      return;
    }

    setIsSubmitting(true);
    try {
      if (areaToEdit) {
        await api.updateArea(areaToEdit.id, formData);
        showToast('success', 'Area Updated', `Area ${formData.name} updated successfully.`);
      } else {
        await api.createArea(formData);
        showToast('success', 'Area Created', `New Area ${formData.name} added successfully.`);
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

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={areaToEdit ? 'Edit Parking Area' : 'Add New Parking Area'}
      subtitle="Define zone properties, floor level, and tariff"
      footer={
        <>
          <Button variant="outline" size="sm" onClick={onClose} disabled={isSubmitting}>
            Cancel
          </Button>
          <Button variant="primary" size="sm" onClick={handleSubmit} isLoading={isSubmitting}>
            {areaToEdit ? 'Save Changes' : 'Create Area'}
          </Button>
        </>
      }
    >
      <form onSubmit={handleSubmit} className="space-y-4">
        <Input
          label="Area Name *"
          placeholder="e.g. Parking Area A - Ground Floor"
          value={formData.name}
          onChange={e => setFormData({ ...formData, name: e.target.value })}
          required
        />

        <div className="grid grid-cols-2 gap-3">
          <Input
            label="Area Code *"
            placeholder="e.g. AREA-A"
            value={formData.code}
            onChange={e => setFormData({ ...formData, code: e.target.value.toUpperCase() })}
            required
          />

          <Input
            label="Floor Level"
            type="number"
            placeholder="e.g. 0, 1, -1"
            value={formData.floorLevel}
            onChange={e => setFormData({ ...formData, floorLevel: parseInt(e.target.value) || 0 })}
          />
        </div>

        <Input
          label="Hourly Rate (INR)"
          type="number"
          placeholder="e.g. 20"
          value={formData.hourlyRate}
          onChange={e => setFormData({ ...formData, hourlyRate: parseFloat(e.target.value) || 0 })}
        />

        <Input
          label="Description / Location Notes"
          placeholder="e.g. Main entrance, near EV charging stations"
          value={formData.description}
          onChange={e => setFormData({ ...formData, description: e.target.value })}
        />
      </form>
    </Modal>
  );
};
