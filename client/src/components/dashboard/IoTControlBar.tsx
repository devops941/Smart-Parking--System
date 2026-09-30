'use client';

import React, { useState } from 'react';
import { useParking } from '../../context/ParkingContext';
import { Play, Pause, Zap, Send, Radio, Info } from 'lucide-react';
import { Button } from '../common/Button';
import { api } from '../../services/api';

export const IoTControlBar = () => {
  const {
    isConnected,
    simulatorActive,
    toggleSimulator,
    triggerManualSimulationStep,
    showToast,
  } = useParking();

  const [customDistance, setCustomDistance] = useState('12.5');
  const [selectedSensor, setSelectedSensor] = useState('SENSOR-001');
  const [isSending, setIsSending] = useState(false);

  const handleSendCustomTelemetry = async () => {
    setIsSending(true);
    try {
      const dist = parseFloat(customDistance) || 15.0;
      await api.sendSensorTelemetry({
        sensorId: selectedSensor,
        distance: dist,
        status: dist < 50 ? 'occupied' : 'available',
      });
      showToast(
        'success',
        'ESP32 Telemetry Transmitted',
        `${selectedSensor} -> ${dist} cm (${dist < 50 ? 'OCCUPIED' : 'AVAILABLE'})`
      );
    } catch (err: any) {
      showToast('error', 'Transmission Failed', err.message);
    } finally {
      setIsSending(false);
    }
  };

  return (
    <div className="bg-white border border-teal-200/90 rounded-2xl p-4 sm:p-5 shadow-xs mb-6">
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
        {/* Left Side: IoT Status */}
        <div className="flex items-start sm:items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-teal-50 border border-teal-200 flex items-center justify-center text-teal-700 shrink-0">
            <Radio className="w-5 h-5 animate-pulse" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h3 className="text-sm font-bold text-slate-900">
                ESP32 / IoT Telemetry Control Hub
              </h3>
              <span
                className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                  isConnected
                    ? 'bg-emerald-100 text-emerald-800'
                    : 'bg-amber-100 text-amber-800'
                }`}
              >
                {isConnected ? 'WebSocket Active' : 'Polling Sync Mode'}
              </span>
            </div>
            <p className="text-xs text-slate-500 mt-0.5">
              Live bi-directional MQTT & HTTP endpoint: <code className="text-teal-700 font-mono bg-teal-50 px-1 py-0.5 rounded">POST /api/sensors/data</code>
            </p>
          </div>
        </div>

        {/* Right Side: Interactive Live Triggers */}
        <div className="flex flex-wrap items-center gap-2">
          {/* Custom Distance Ingest */}
          <div className="flex items-center gap-1.5 bg-slate-50 border border-slate-200 px-2 py-1 rounded-lg">
            <select
              value={selectedSensor}
              onChange={e => setSelectedSensor(e.target.value)}
              className="text-xs bg-transparent font-mono font-semibold text-slate-700 focus:outline-none"
            >
              <option value="SENSOR-001">SENSOR-001 (Slot A-01)</option>
              <option value="SENSOR-002">SENSOR-002 (Slot A-02)</option>
              <option value="SENSOR-003">SENSOR-003 (Slot A-03)</option>
              <option value="SENSOR-004">SENSOR-004 (Slot A-04)</option>
              <option value="SENSOR-005">SENSOR-005 (Slot A-05)</option>
            </select>
            <span className="text-xs text-slate-400">|</span>
            <input
              type="number"
              value={customDistance}
              onChange={e => setCustomDistance(e.target.value)}
              className="w-16 text-xs bg-white border border-slate-200 rounded px-1.5 py-0.5 font-mono text-center"
              placeholder="cm"
              title="Distance reading in cm (< 50cm = Occupied)"
            />
            <span className="text-xs text-slate-500 font-medium">cm</span>
            <Button
              size="sm"
              variant="outline"
              onClick={handleSendCustomTelemetry}
              isLoading={isSending}
              className="h-6 text-xs px-2 py-0"
              leftIcon={<Send className="w-3 h-3" />}
            >
              Emit
            </Button>
          </div>

          {/* Quick Random Trigger */}
          <Button
            size="sm"
            variant="outline"
            onClick={triggerManualSimulationStep}
            leftIcon={<Zap className="w-3.5 h-3.5 text-amber-500" />}
          >
            1-Click Event
          </Button>

          {/* Auto Simulator Stream Toggle */}
          <Button
            size="sm"
            variant={simulatorActive ? 'danger' : 'primary'}
            onClick={() => toggleSimulator()}
            leftIcon={simulatorActive ? <Pause className="w-3.5 h-3.5" /> : <Play className="w-3.5 h-3.5" />}
          >
            {simulatorActive ? 'Stop Stream' : 'Live IoT Stream'}
          </Button>
        </div>
      </div>
    </div>
  );
};
