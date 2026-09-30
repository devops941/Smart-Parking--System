'use client';

import React, { useState, useEffect } from 'react';
import { Modal } from '../common/Modal';
import { Input } from '../common/Input';
import { Select } from '../common/Select';
import { Button } from '../common/Button';
import { Sensor, SensorType, ConnectionType } from '../../types';
import { api } from '../../services/api';
import { useParking } from '../../context/ParkingContext';

interface SensorModalProps {
  isOpen: boolean;
  onClose: () => void;
  sensorToEdit?: Sensor | null;
  onSuccess?: () => void;
}

export const SensorModal = ({ isOpen, onClose, sensorToEdit, onSuccess }: SensorModalProps) => {
  const { showToast, refreshAll } = useParking();
  const [formData, setFormData] = useState({
    sensorCode: '',
    sensorType: 'ULTRASONIC' as SensorType,
    connectionType: 'WIFI' as ConnectionType,
    thresholdCm: 50,
    ipAddress: '',
  });
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (sensorToEdit) {
      setFormData({
        sensorCode: sensorToEdit.sensorCode,
        sensorType: sensorToEdit.sensorType,
        connectionType: sensorToEdit.connectionType,
        thresholdCm: sensorToEdit.thresholdCm || 50,
        ipAddress: sensorToEdit.ipAddress || '',
      });
    } else {
      setFormData({
        sensorCode: '',
        sensorType: 'ULTRASONIC',
        connectionType: 'WIFI',
        thresholdCm: 50,
        ipAddress: '192.168.1.101',
      });
    }
  }, [sensorToEdit, isOpen]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.sensorCode) {
      showToast('error', 'Missing Information', 'Sensor Code is required');
      return;
    }

    setIsSubmitting(true);
    try {
      if (sensorToEdit) {
        await api.updateSensor(sensorToEdit.id, formData);
        showToast('success', 'Sensor Updated', `Sensor ${formData.sensorCode} modified.`);
      } else {
        await api.createSensor(formData);
        showToast('success', 'Sensor Registered', `Sensor ${formData.sensorCode} registered on network.`);
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

  const sensorTypeOptions = [
    { value: 'ULTRASONIC', label: 'HC-SR04 Ultrasonic Distance' },
    { value: 'INFRARED', label: 'IR Obstacle Detector' },
    { value: 'MAGNETIC', label: 'Geomagnetic Loop Sensor' },
    { value: 'CAMERA_AI', label: 'Computer Vision / Camera AI' },
  ];

  const connectionOptions = [
    { value: 'WIFI', label: 'Wi-Fi 802.11 b/g/n (ESP32)' },
    { value: 'MQTT', label: 'MQTT Telemetry Broker' },
    { value: 'HTTP_REST', label: 'Direct HTTP REST Ingestion' },
    { value: 'LORA', label: 'LoRaWAN Long Range' },
    { value: 'BLUETOOTH', label: 'Bluetooth Low Energy (BLE)' },
  ];

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={sensorToEdit ? 'Edit IoT Sensor Node' : 'Register New IoT Sensor Node'}
      subtitle="Configure hardware communication protocol and distance trigger threshold"
      footer={
        <>
          <Button variant="outline" size="sm" onClick={onClose} disabled={isSubmitting}>
            Cancel
          </Button>
          <Button variant="primary" size="sm" onClick={handleSubmit} isLoading={isSubmitting}>
            {sensorToEdit ? 'Save Changes' : 'Register Sensor'}
          </Button>
        </>
      }
    >
      <form onSubmit={handleSubmit} className="space-y-4">
        <Input
          label="Sensor Identifier Code *"
          placeholder="e.g. SENSOR-001"
          value={formData.sensorCode}
          onChange={e => setFormData({ ...formData, sensorCode: e.target.value.toUpperCase() })}
          required
        />

        <div className="grid grid-cols-2 gap-3">
          <Select
            label="Sensor Technology"
            options={sensorTypeOptions}
            value={formData.sensorType}
            onChange={e => setFormData({ ...formData, sensorType: e.target.value as SensorType })}
          />

          <Select
            label="Connection Protocol"
            options={connectionOptions}
            value={formData.connectionType}
            onChange={e => setFormData({ ...formData, connectionType: e.target.value as ConnectionType })}
          />
        </div>

        <div className="grid grid-cols-2 gap-3">
          <Input
            label="Occupancy Distance Threshold (cm)"
            type="number"
            placeholder="e.g. 50"
            helperText="Distance < threshold indicates vehicle presence"
            value={formData.thresholdCm}
            onChange={e => setFormData({ ...formData, thresholdCm: parseFloat(e.target.value) || 50 })}
          />

          <Input
            label="IP Address (ESP32 Node)"
            placeholder="e.g. 192.168.1.105"
            value={formData.ipAddress}
            onChange={e => setFormData({ ...formData, ipAddress: e.target.value })}
          />
        </div>
      </form>
    </Modal>
  );
};
