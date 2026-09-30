'use client';

import React, { useState } from 'react';
import { useParking } from '../../context/ParkingContext';
import { SensorModal } from '../../components/sensors/SensorModal';
import { StatCard } from '../../components/common/StatCard';
import { Table, Pagination } from '../../components/common/Table';
import { Card } from '../../components/common/Card';
import { Input } from '../../components/common/Input';
import { Button } from '../../components/common/Button';
import { StatusBadge } from '../../components/common/StatusBadge';
import { Sensor, SensorStatus } from '../../types';
import {
  Radio,
  Plus,
  Edit2,
  RefreshCw,
  Search,
  Wifi,
  Activity,
  AlertTriangle,
  CheckCircle2,
  AlertOctagon,
  Battery,
} from 'lucide-react';

export default function SensorsPage() {
  const { sensors, refreshAll, showToast, isLoading } = useParking();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [sensorToEdit, setSensorToEdit] = useState<Sensor | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('ALL');
  const [currentPage, setCurrentPage] = useState(1);
  const pageSize = 10;

  const handleOpenAdd = () => {
    setSensorToEdit(null);
    setIsModalOpen(true);
  };

  const handleOpenEdit = (sensor: Sensor) => {
    setSensorToEdit(sensor);
    setIsModalOpen(true);
  };

  const totalSensors = sensors.length;
  const onlineSensors = sensors.filter(s => s.status === 'ONLINE').length;
  const offlineSensors = sensors.filter(s => s.status === 'OFFLINE').length;
  const warningSensors = sensors.filter(s => s.status === 'WARNING').length;

  const filteredSensors = sensors.filter(sensor => {
    if (statusFilter !== 'ALL' && sensor.status !== statusFilter) return false;
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      const matchCode = sensor.sensorCode.toLowerCase().includes(q);
      const matchSlot = sensor.slot?.slotNumber.toLowerCase().includes(q) || sensor.slotId?.toLowerCase().includes(q);
      const matchIp = sensor.ipAddress?.toLowerCase().includes(q);
      if (!matchCode && !matchSlot && !matchIp) return false;
    }
    return true;
  });

  const totalPages = Math.ceil(filteredSensors.length / pageSize) || 1;
  const paginatedSensors = filteredSensors.slice((currentPage - 1) * pageSize, currentPage * pageSize);

  const columns = [
    {
      header: 'Sensor Identifier',
      render: (sensor: Sensor) => (
        <div className="flex items-center gap-2">
          <Radio className="w-4 h-4 text-teal-700 shrink-0" />
          <div>
            <span className="font-mono font-extrabold text-slate-900">{sensor.sensorCode}</span>
            <p className="text-[10px] text-slate-400 font-mono">{sensor.firmwareVer || 'v1.2.0-esp32'}</p>
          </div>
        </div>
      ),
    },
    {
      header: 'Assigned Slot',
      render: (sensor: Sensor) => (
        <span className="font-bold text-slate-800 text-xs bg-slate-100 px-2 py-1 rounded border border-slate-200">
          {sensor.slot?.slotNumber || sensor.slotId || 'Slot 01'}
        </span>
      ),
    },
    {
      header: 'Sensor Tech',
      render: (sensor: Sensor) => (
        <span className="text-xs text-slate-700 font-medium">
          {sensor.sensorType}
        </span>
      ),
    },
    {
      header: 'Connection Protocol',
      render: (sensor: Sensor) => (
        <div className="flex items-center gap-1.5 text-xs text-slate-600">
          <Wifi className="w-3.5 h-3.5 text-teal-600" />
          <span>{sensor.connectionType}</span>
        </div>
      ),
    },
    {
      header: 'Last Distance Reading',
      render: (sensor: Sensor) => (
        sensor.lastReading !== null && sensor.lastReading !== undefined ? (
          <span className="font-mono font-bold text-xs bg-teal-50 text-teal-900 px-2 py-0.5 rounded border border-teal-200">
            {sensor.lastReading} cm
          </span>
        ) : (
          <span className="text-slate-400 italic text-xs">No Signal</span>
        )
      ),
    },
    {
      header: 'Battery / Signal',
      render: (sensor: Sensor) => (
        <div className="flex items-center gap-1.5 text-xs">
          <Battery className={`w-3.5 h-3.5 ${((sensor.batteryLevel || 100) < 30) ? 'text-amber-500' : 'text-emerald-600'}`} />
          <span className="font-mono">{sensor.batteryLevel ?? 98}%</span>
        </div>
      ),
    },
    {
      header: 'Last Heartbeat',
      render: (sensor: Sensor) => (
        <span className="text-[11px] text-slate-500">
          {new Date(sensor.lastSeen || sensor.updatedAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })}
        </span>
      ),
    },
    {
      header: 'Health Status',
      render: (sensor: Sensor) => (
        <StatusBadge status={sensor.status} size="sm" pulse={sensor.status === 'ONLINE'} />
      ),
    },
    {
      header: 'Actions',
      className: 'text-right',
      render: (sensor: Sensor) => (
        <Button
          size="sm"
          variant="ghost"
          onClick={() => handleOpenEdit(sensor)}
          title="Configure Sensor"
          className="p-1.5 h-7 w-7"
        >
          <Edit2 className="w-3.5 h-3.5 text-slate-600" />
        </Button>
      ),
    },
  ];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight flex items-center gap-2">
            <Radio className="w-6 h-6 text-teal-700" /> Sensor Hardware & Telemetry Monitor
          </h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Real-time ping status, distance readings, battery levels, and ESP32 nodes
          </p>
        </div>

        <div className="flex items-center gap-2">
          <Button
            size="sm"
            variant="outline"
            onClick={refreshAll}
            isLoading={isLoading}
            leftIcon={<RefreshCw className="w-3.5 h-3.5" />}
          >
            Refresh Telemetry
          </Button>
          <Button
            size="sm"
            variant="primary"
            onClick={handleOpenAdd}
            leftIcon={<Plus className="w-4 h-4" />}
          >
            Register Sensor
          </Button>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <StatCard
          title="Total Sensors"
          value={totalSensors}
          subtitle="Deployed IoT nodes"
          highlightColor="teal"
          icon={<Radio className="w-5 h-5 text-teal-700" />}
          iconBgColor="bg-teal-50 border-teal-200"
        />

        <StatCard
          title="Online Sensors"
          value={onlineSensors}
          subtitle="Streaming telemetry"
          highlightColor="green"
          icon={<CheckCircle2 className="w-5 h-5 text-emerald-600" />}
          iconBgColor="bg-emerald-50 border-emerald-200"
        />

        <StatCard
          title="Offline Sensors"
          value={offlineSensors}
          subtitle="No heartbeat > 60s"
          highlightColor="slate"
          icon={<AlertOctagon className="w-5 h-5 text-slate-500" />}
          iconBgColor="bg-slate-100 border-slate-300"
        />

        <StatCard
          title="Warning Sensors"
          value={warningSensors}
          subtitle="Low battery / noise"
          highlightColor="amber"
          icon={<AlertTriangle className="w-5 h-5 text-amber-600" />}
          iconBgColor="bg-amber-50 border-amber-200"
        />
      </div>

      {/* Filter Toolbar */}
      <Card className="p-4 bg-white">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <Input
            placeholder="Search Sensor Code, Assigned Slot, IP..."
            value={searchQuery}
            onChange={e => {
              setSearchQuery(e.target.value);
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
            className="block w-full rounded-lg border border-slate-300 text-xs text-slate-700 bg-white px-3 py-2"
          >
            <option value="ALL">All Hardware Statuses</option>
            <option value="ONLINE">Online (Active)</option>
            <option value="OFFLINE">Offline</option>
            <option value="WARNING">Warning</option>
          </select>
        </div>
      </Card>

      {/* Sensor Table */}
      <Card>
        <Table
          columns={columns}
          data={paginatedSensors}
          keyExtractor={sensor => sensor.id}
          isLoading={isLoading}
          emptyMessage="No IoT sensor nodes found matching query"
        />

        <Pagination
          currentPage={currentPage}
          totalPages={totalPages}
          totalItems={filteredSensors.length}
          pageSize={pageSize}
          onPageChange={page => setCurrentPage(page)}
        />
      </Card>

      {/* Sensor Modal */}
      <SensorModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        sensorToEdit={sensorToEdit}
      />
    </div>
  );
}
