'use client';

import React, { useState, useEffect } from 'react';
import { useParking } from '../../context/ParkingContext';
import { Card } from '../../components/common/Card';
import { Input } from '../../components/common/Input';
import { Button } from '../../components/common/Button';
import { api } from '../../services/api';
import {
  Settings,
  Shield,
  Radio,
  Bell,
  Sliders,
  Save,
  Server,
  Database,
  CheckCircle2,
} from 'lucide-react';

export default function SettingsPage() {
  const { showToast } = useParking();
  const [activeTab, setActiveTab] = useState('general');
  const [isSaving, setIsSaving] = useState(false);

  const [settings, setSettings] = useState({
    systemName: 'IoT Smart Parking Management Platform',
    currency: 'INR',
    defaultHourlyRate: 20,
    occupiedThresholdCm: 50.0,
    sensorOfflineTimeoutSec: 60,
    mqttBrokerUrl: 'mqtt://broker.hivemq.com:1883',
    mqttTopic: 'smartparking/sensors/data',
    emailAlerts: true,
    soundAlerts: true,
    enableAutoCheckout: true,
  });

  useEffect(() => {
    const fetchSettings = async () => {
      try {
        const data = await api.getSettings();
        if (data) setSettings(prev => ({ ...prev, ...data }));
      } catch (err: any) {
        console.warn('Settings load fallback:', err.message);
      }
    };
    fetchSettings();
  }, []);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaving(true);
    try {
      await api.updateSettings(settings);
      showToast('success', 'Configuration Saved', 'System preferences updated successfully.');
    } catch (err: any) {
      showToast('error', 'Save Failed', err.message);
    } finally {
      setIsSaving(false);
    }
  };

  const tabs = [
    { id: 'general', label: 'General System', icon: <Settings className="w-4 h-4" /> },
    { id: 'parking', label: 'Parking & Tariffs', icon: <Sliders className="w-4 h-4" /> },
    { id: 'sensors', label: 'Sensor Hardware & IoT', icon: <Radio className="w-4 h-4" /> },
    { id: 'notifications', label: 'Alerts & WebSockets', icon: <Bell className="w-4 h-4" /> },
    { id: 'system', label: 'Database & Engine', icon: <Server className="w-4 h-4" /> },
  ];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight flex items-center gap-2">
            <Settings className="w-6 h-6 text-teal-700" /> Platform Configuration
          </h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Manage global parameters, MQTT brokers, distance occupancy thresholds, and pricing
          </p>
        </div>

        <Button
          size="sm"
          variant="primary"
          onClick={handleSave}
          isLoading={isSaving}
          leftIcon={<Save className="w-4 h-4" />}
        >
          Save Configuration
        </Button>
      </div>

      {/* Main Grid: Tabs on Left, Content on Right */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left Tabs */}
        <div className="lg:col-span-3 space-y-1">
          {tabs.map(tab => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`w-full flex items-center gap-2.5 px-3.5 py-2.5 rounded-xl text-xs font-bold transition-colors text-left ${
                activeTab === tab.id
                  ? 'bg-teal-700 text-white shadow-xs'
                  : 'bg-white text-slate-600 hover:bg-slate-100 border border-slate-200/80'
              }`}
            >
              <span>{tab.icon}</span>
              <span>{tab.label}</span>
            </button>
          ))}
        </div>

        {/* Right Settings Content */}
        <div className="lg:col-span-9">
          <form onSubmit={handleSave}>
            {activeTab === 'general' && (
              <Card
                header={<h3 className="text-sm font-bold text-slate-900">General Platform Settings</h3>}
              >
                <div className="space-y-4">
                  <Input
                    label="Application Title"
                    value={settings.systemName}
                    onChange={e => setSettings({ ...settings, systemName: e.target.value })}
                  />

                  <div className="grid grid-cols-2 gap-3">
                    <Input
                      label="Currency Symbol / Code"
                      value={settings.currency}
                      onChange={e => setSettings({ ...settings, currency: e.target.value })}
                    />

                    <Input
                      label="Default Hourly Parking Rate"
                      type="number"
                      value={settings.defaultHourlyRate}
                      onChange={e => setSettings({ ...settings, defaultHourlyRate: parseFloat(e.target.value) || 20 })}
                    />
                  </div>
                </div>
              </Card>
            )}

            {activeTab === 'parking' && (
              <Card
                header={<h3 className="text-sm font-bold text-slate-900">Parking Rules & Tariffs</h3>}
              >
                <div className="space-y-4 text-xs">
                  <div className="p-3 bg-slate-50 border border-slate-200 rounded-lg flex items-center justify-between">
                    <div>
                      <h4 className="font-bold text-slate-800">Auto-Generate Parking Sessions</h4>
                      <p className="text-slate-500">Automatically create active billable sessions when vehicle occupies slot</p>
                    </div>
                    <input
                      type="checkbox"
                      checked={settings.enableAutoCheckout}
                      onChange={e => setSettings({ ...settings, enableAutoCheckout: e.target.checked })}
                      className="w-4 h-4 text-teal-600 rounded border-slate-300"
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <Input
                      label="Grace Period (Minutes)"
                      type="number"
                      defaultValue={15}
                      helperText="Free parking duration before hourly fee starts"
                    />

                    <Input
                      label="Overstay Penalty Rate (INR/hr)"
                      type="number"
                      defaultValue={50}
                    />
                  </div>
                </div>
              </Card>
            )}

            {activeTab === 'sensors' && (
              <Card
                header={<h3 className="text-sm font-bold text-slate-900">Sensor Hardware & IoT Protocols</h3>}
              >
                <div className="space-y-4">
                  <div className="grid grid-cols-2 gap-3">
                    <Input
                      label="Occupancy Distance Threshold (cm)"
                      type="number"
                      value={settings.occupiedThresholdCm}
                      helperText="Distance below this value triggers OCCUPIED state"
                      onChange={e => setSettings({ ...settings, occupiedThresholdCm: parseFloat(e.target.value) || 50 })}
                    />

                    <Input
                      label="Sensor Heartbeat Offline Timeout (Seconds)"
                      type="number"
                      value={settings.sensorOfflineTimeoutSec}
                      helperText="Mark sensor OFFLINE if no telemetry is received"
                      onChange={e => setSettings({ ...settings, sensorOfflineTimeoutSec: parseInt(e.target.value) || 60 })}
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <Input
                      label="MQTT Broker URL"
                      value={settings.mqttBrokerUrl}
                      onChange={e => setSettings({ ...settings, mqttBrokerUrl: e.target.value })}
                    />

                    <Input
                      label="MQTT Telemetry Topic"
                      value={settings.mqttTopic}
                      onChange={e => setSettings({ ...settings, mqttTopic: e.target.value })}
                    />
                  </div>
                </div>
              </Card>
            )}

            {activeTab === 'notifications' && (
              <Card
                header={<h3 className="text-sm font-bold text-slate-900">Notifications & Alert Triggers</h3>}
              >
                <div className="space-y-4 text-xs">
                  <div className="p-3 bg-slate-50 border border-slate-200 rounded-lg flex items-center justify-between">
                    <div>
                      <h4 className="font-bold text-slate-800">Browser Audio Alerts</h4>
                      <p className="text-slate-500">Play acoustic alert chime when parking state transitions</p>
                    </div>
                    <input
                      type="checkbox"
                      checked={settings.soundAlerts}
                      onChange={e => setSettings({ ...settings, soundAlerts: e.target.checked })}
                      className="w-4 h-4 text-teal-600 rounded border-slate-300"
                    />
                  </div>

                  <div className="p-3 bg-slate-50 border border-slate-200 rounded-lg flex items-center justify-between">
                    <div>
                      <h4 className="font-bold text-slate-800">Sensor Failure Push Notifications</h4>
                      <p className="text-slate-500">Send high-priority critical alerts when sensors disconnect</p>
                    </div>
                    <input
                      type="checkbox"
                      checked={settings.emailAlerts}
                      onChange={e => setSettings({ ...settings, emailAlerts: e.target.checked })}
                      className="w-4 h-4 text-teal-600 rounded border-slate-300"
                    />
                  </div>
                </div>
              </Card>
            )}

            {activeTab === 'system' && (
              <Card
                header={<h3 className="text-sm font-bold text-slate-900">Database & Engine Topology</h3>}
              >
                <div className="space-y-4 text-xs">
                  <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 space-y-2">
                    <div className="flex items-center gap-2 text-teal-800 font-bold">
                      <Database className="w-4 h-4" /> Database Engine
                    </div>
                    <p className="text-slate-600">
                      Primary Engine: <strong>PostgreSQL 16 + Prisma ORM</strong>. With automatic zero-downtime persistence synchronization fallback.
                    </p>
                  </div>

                  <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 space-y-2">
                    <div className="flex items-center gap-2 text-teal-800 font-bold">
                      <Server className="w-4 h-4" /> Real-time Streaming Stack
                    </div>
                    <p className="text-slate-600">
                      Engine: <strong>WebSocket (Socket.IO) + MQTT Ingestion Pipeline</strong> on Node.js / Express.
                    </p>
                  </div>
                </div>
              </Card>
            )}

            <div className="mt-5 flex justify-end">
              <Button type="submit" variant="primary" size="md" isLoading={isSaving} leftIcon={<Save className="w-4 h-4" />}>
                Save All Preferences
              </Button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
