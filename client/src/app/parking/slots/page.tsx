'use client';

import React, { useState } from 'react';
import { useParking } from '../../../context/ParkingContext';
import { SlotModal } from '../../../components/parking/SlotModal';
import { SlotDetailModal } from '../../../components/parking/SlotDetailModal';
import { Table, Pagination } from '../../../components/common/Table';
import { Card } from '../../../components/common/Card';
import { Input } from '../../../components/common/Input';
import { Button } from '../../../components/common/Button';
import { StatusBadge } from '../../../components/common/StatusBadge';
import { ParkingSlot } from '../../../types';
import { api } from '../../../services/api';
import {
  Grid,
  Plus,
  Eye,
  Edit2,
  Power,
  Search,
  Radio,
  Car,
  Filter,
} from 'lucide-react';

export default function ParkingSlotsPage() {
  const { slots, areas, sensors, refreshAll, updateSlotLocally, showToast, isLoading } = useParking();
  const [selectedSlotForEdit, setSelectedSlotForEdit] = useState<ParkingSlot | null>(null);
  const [selectedSlotForDetail, setSelectedSlotForDetail] = useState<ParkingSlot | null>(null);
  const [isSlotModalOpen, setIsSlotModalOpen] = useState(false);
  const [areaFilter, setAreaFilter] = useState('ALL');
  const [statusFilter, setStatusFilter] = useState('ALL');
  const [searchQuery, setSearchQuery] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const pageSize = 10;

  const handleOpenAdd = () => {
    setSelectedSlotForEdit(null);
    setIsSlotModalOpen(true);
  };

  const handleOpenEdit = (slot: ParkingSlot) => {
    setSelectedSlotForEdit(slot);
    setIsSlotModalOpen(true);
  };

  const handleToggleSlotActive = async (slot: ParkingSlot) => {
    try {
      const updated = await api.toggleSlotActive(slot.id);
      updateSlotLocally(slot.id, {
        isActive: updated.isActive,
        status: updated.status,
      });
      showToast('info', `Slot ${slot.slotNumber} Updated`, updated.isActive ? 'Slot enabled' : 'Slot disabled');
    } catch (err: any) {
      showToast('error', 'Operation Failed', err.message);
    }
  };

  const filteredSlots = slots.filter(slot => {
    if (areaFilter !== 'ALL' && slot.areaId !== areaFilter) return false;
    if (statusFilter !== 'ALL' && slot.status !== statusFilter) return false;
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      const matchSlot = slot.slotNumber.toLowerCase().includes(q);
      const matchPlate = slot.currentVehicle?.toLowerCase().includes(q);
      const matchSensor = slot.sensor?.sensorCode.toLowerCase().includes(q) || slot.sensorId?.toLowerCase().includes(q);
      if (!matchSlot && !matchPlate && !matchSensor) return false;
    }
    return true;
  });

  const totalPages = Math.ceil(filteredSlots.length / pageSize) || 1;
  const paginatedSlots = filteredSlots.slice((currentPage - 1) * pageSize, currentPage * pageSize);

  const columns = [
    {
      header: 'Slot Number',
      render: (slot: ParkingSlot) => (
        <div className="flex items-center gap-2">
          <span className="font-extrabold text-slate-900 text-sm">{slot.slotNumber}</span>
          {!slot.isActive && (
            <span className="text-[10px] bg-slate-200 text-slate-600 px-1.5 py-0.5 rounded font-bold">
              Disabled
            </span>
          )}
        </div>
      ),
    },
    {
      header: 'Parking Area',
      render: (slot: ParkingSlot) => (
        <span className="font-medium text-slate-700">
          {slot.area?.name || 'Area Ground Floor'}
        </span>
      ),
    },
    {
      header: 'Slot Category',
      render: (slot: ParkingSlot) => (
        <span className="text-xs bg-slate-100 text-slate-700 px-2 py-1 rounded font-medium border border-slate-200">
          {slot.slotType}
        </span>
      ),
    },
    {
      header: 'Real-time Status',
      render: (slot: ParkingSlot) => (
        <StatusBadge status={slot.status} size="sm" pulse={slot.status === 'OCCUPIED'} />
      ),
    },
    {
      header: 'Sensor Node',
      render: (slot: ParkingSlot) => (
        <div className="flex items-center gap-1.5 text-slate-600">
          <Radio className="w-3.5 h-3.5 text-teal-700 shrink-0" />
          <span className="font-mono text-xs">{slot.sensor?.sensorCode || slot.sensorId || 'Unassigned'}</span>
        </div>
      ),
    },
    {
      header: 'Current Vehicle',
      render: (slot: ParkingSlot) => (
        slot.currentVehicle ? (
          <div className="flex items-center gap-1.5 font-bold font-mono text-rose-800 text-xs bg-rose-50 px-2 py-0.5 rounded border border-rose-200 w-fit">
            <Car className="w-3.5 h-3.5 text-rose-600 shrink-0" />
            <span>{slot.currentVehicle}</span>
          </div>
        ) : (
          <span className="text-slate-400 text-xs italic">—</span>
        )
      ),
    },
    {
      header: 'Last Updated',
      render: (slot: ParkingSlot) => (
        <span className="text-[11px] text-slate-500">
          {new Date(slot.lastStatusChange || slot.updatedAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
        </span>
      ),
    },
    {
      header: 'Actions',
      className: 'text-right',
      render: (slot: ParkingSlot) => (
        <div className="flex items-center justify-end gap-1">
          <Button
            size="sm"
            variant="ghost"
            onClick={() => setSelectedSlotForDetail(slot)}
            title="View Details"
            className="p-1.5 h-7 w-7"
          >
            <Eye className="w-3.5 h-3.5 text-slate-600" />
          </Button>
          <Button
            size="sm"
            variant="ghost"
            onClick={() => handleOpenEdit(slot)}
            title="Edit Slot"
            className="p-1.5 h-7 w-7"
          >
            <Edit2 className="w-3.5 h-3.5 text-teal-700" />
          </Button>
          <Button
            size="sm"
            variant="ghost"
            onClick={() => handleToggleSlotActive(slot)}
            title={slot.isActive ? 'Disable Slot' : 'Enable Slot'}
            className="p-1.5 h-7 w-7"
          >
            <Power className={`w-3.5 h-3.5 ${slot.isActive ? 'text-slate-400 hover:text-rose-600' : 'text-emerald-600'}`} />
          </Button>
        </div>
      ),
    },
  ];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight flex items-center gap-2">
            <Grid className="w-6 h-6 text-teal-700" /> Parking Slot Management
          </h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Configure individual slots, sensor bindings, maintenance toggles, and occupancy overrides
          </p>
        </div>

        <Button
          size="sm"
          variant="primary"
          onClick={handleOpenAdd}
          leftIcon={<Plus className="w-4 h-4" />}
        >
          Add Parking Slot
        </Button>
      </div>

      {/* Filter Toolbar */}
      <Card className="p-4 bg-white">
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          <Input
            placeholder="Search Slot, Vehicle Plate, Sensor..."
            value={searchQuery}
            onChange={e => {
              setSearchQuery(e.target.value);
              setCurrentPage(1);
            }}
            leftIcon={<Search className="w-4 h-4" />}
          />

          <select
            value={areaFilter}
            onChange={e => {
              setAreaFilter(e.target.value);
              setCurrentPage(1);
            }}
            className="block w-full rounded-lg border border-slate-300 text-xs text-slate-700 bg-white px-3 py-2"
          >
            <option value="ALL">All Parking Areas</option>
            {areas.map(a => (
              <option key={a.id} value={a.id}>
                {a.name} ({a.code})
              </option>
            ))}
          </select>

          <select
            value={statusFilter}
            onChange={e => {
              setStatusFilter(e.target.value);
              setCurrentPage(1);
            }}
            className="block w-full rounded-lg border border-slate-300 text-xs text-slate-700 bg-white px-3 py-2"
          >
            <option value="ALL">All Statuses</option>
            <option value="AVAILABLE">Available</option>
            <option value="OCCUPIED">Occupied</option>
            <option value="RESERVED">Reserved</option>
            <option value="OFFLINE">Offline</option>
          </select>
        </div>
      </Card>

      {/* Slots Table */}
      <Card>
        <Table
          columns={columns}
          data={paginatedSlots}
          keyExtractor={slot => slot.id}
          isLoading={isLoading}
          emptyMessage="No parking slots found matching the criteria"
        />

        <Pagination
          currentPage={currentPage}
          totalPages={totalPages}
          totalItems={filteredSlots.length}
          pageSize={pageSize}
          onPageChange={page => setCurrentPage(page)}
        />
      </Card>

      {/* Modals */}
      <SlotModal
        isOpen={isSlotModalOpen}
        onClose={() => setIsSlotModalOpen(false)}
        slotToEdit={selectedSlotForEdit}
        areas={areas}
        sensors={sensors}
      />

      <SlotDetailModal
        slot={selectedSlotForDetail}
        isOpen={!!selectedSlotForDetail}
        onClose={() => setSelectedSlotForDetail(null)}
      />
    </div>
  );
}
