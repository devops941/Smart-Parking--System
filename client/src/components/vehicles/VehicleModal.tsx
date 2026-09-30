'use client';

import React, { useState } from 'react';
import { Modal } from '../common/Modal';
import { Input } from '../common/Input';
import { Select } from '../common/Select';
import { Button } from '../common/Button';
import { api } from '../../services/api';
import { useParking } from '../../context/ParkingContext';

interface VehicleModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess?: () => void;
}

export const VehicleModal = ({ isOpen, onClose, onSuccess }: VehicleModalProps) => {
  const { showToast } = useParking();
  const [formData, setFormData] = useState({
    plateNumber: '',
    vehicleType: 'Car (Sedan)',
    ownerName: '',
    ownerPhone: '',
    color: '',
    model: '',
  });
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.plateNumber) {
      showToast('error', 'Plate Number Required', 'Please enter a vehicle license plate.');
      return;
    }

    setIsSubmitting(true);
    try {
      await api.createVehicle(formData);
      showToast('success', 'Vehicle Registered', `Vehicle ${formData.plateNumber} added.`);
      if (onSuccess) onSuccess();
      onClose();
    } catch (err: any) {
      showToast('error', 'Registration Failed', err.message);
    } finally {
      setIsSubmitting(false);
    }
  };

  const vehicleTypeOptions = [
    { value: 'Car (Sedan)', label: 'Car (Sedan)' },
    { value: 'Car (SUV)', label: 'Car (SUV)' },
    { value: 'Car (Hatchback)', label: 'Car (Hatchback)' },
    { value: 'EV (Electric Vehicle)', label: 'EV (Electric Vehicle)' },
    { value: 'Motorcycle / Bike', label: 'Motorcycle / Bike' },
    { value: 'Commercial / Van', label: 'Commercial / Van' },
  ];

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Register Vehicle Record"
      subtitle="Add vehicle details for smart lookup, automated parking gate access, and billing"
      footer={
        <>
          <Button variant="outline" size="sm" onClick={onClose} disabled={isSubmitting}>
            Cancel
          </Button>
          <Button variant="primary" size="sm" onClick={handleSubmit} isLoading={isSubmitting}>
            Save Vehicle
          </Button>
        </>
      }
    >
      <form onSubmit={handleSubmit} className="space-y-4">
        <Input
          label="License Plate Number *"
          placeholder="e.g. TN-58-AB-1234"
          value={formData.plateNumber}
          onChange={e => setFormData({ ...formData, plateNumber: e.target.value.toUpperCase() })}
          required
        />

        <div className="grid grid-cols-2 gap-3">
          <Select
            label="Vehicle Category"
            options={vehicleTypeOptions}
            value={formData.vehicleType}
            onChange={e => setFormData({ ...formData, vehicleType: e.target.value })}
          />

          <Input
            label="Make & Model"
            placeholder="e.g. Honda City ZX"
            value={formData.model}
            onChange={e => setFormData({ ...formData, model: e.target.value })}
          />
        </div>

        <div className="grid grid-cols-2 gap-3">
          <Input
            label="Owner Name"
            placeholder="e.g. Rajesh Kumar"
            value={formData.ownerName}
            onChange={e => setFormData({ ...formData, ownerName: e.target.value })}
          />

          <Input
            label="Phone Number"
            placeholder="e.g. +91 98765 43210"
            value={formData.ownerPhone}
            onChange={e => setFormData({ ...formData, ownerPhone: e.target.value })}
          />
        </div>

        <Input
          label="Vehicle Color"
          placeholder="e.g. Metallic Silver"
          value={formData.color}
          onChange={e => setFormData({ ...formData, color: e.target.value })}
        />
      </form>
    </Modal>
  );
};
