'use client';

import React, { useState } from 'react';
import { useParking } from '../../../context/ParkingContext';
import { ParkingSlotCard } from '../../../components/parking/ParkingSlotCard';
import { SlotDetailModal } from '../../../components/parking/SlotDetailModal';
import { Input } from '../../../components/common/Input';
import { Button } from '../../../components/common/Button';
import { ParkingSlot } from '../../../types';
import { Search, Filter, RefreshCw, MapPin, Layers, CheckCircle2, Car, Zap, ShieldAlert } from 'lucide-react';

export default function LiveParkingPage() {
  const { slots, areas, refreshAll, isLoading } = useParking();
  const [selectedArea, setSelectedArea] = useState<string>('ALL');
  const [selectedStatus, setSelectedStatus] = useState<string>('ALL');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedSlotForModal, setSelectedSlotForModal] = useState<ParkingSlot | null>(null);

  const filteredSlots = slots.filter(slot => {
    // Area filter
    if (selectedArea !== 'ALL' && slot.areaId !== selectedArea) return false;

    // Status filter
    if (selectedStatus !== 'ALL' && slot.status !== selectedStatus) return false;

    // Search query (slot number or plate)
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      const matchSlot = slot.slotNumber.toLowerCase().includes(q);
      const matchPlate = slot.currentVehicle?.toLowerCase().includes(q);
      const matchSensor = slot.sensor?.sensorCode.toLowerCase().includes(q) || slot.sensorId?.toLowerCase().includes(q);
      if (!matchSlot && !matchPlate && !matchSensor) return false;
    }

    return true;
  });

  const availableCount = slots.filter(s => s.status === 'AVAILABLE').length;
  const occupiedCount = slots.filter(s => s.status === 'OCCUPIED').length;
  const reservedCount = slots.filter(s => s.status === 'RESERVED').length;
  const offlineCount = slots.filter(s => s.status === 'OFFLINE').length;

  return (
    <div className="space-y-5">
      {/* Page Header with Stats Summary */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight flex items-center gap-2">
              <MapPin className="w-5 h-5 text-teal-600" /> Live Interactive Bay Map
            </h1>
          </div>
          <p className="text-xs text-slate-500 mt-0.5">
            Real-time visual 2D bay occupancy telemetry streamed from ESP32 ultrasonic sensors
          </p>
        </div>
      </div>

      {/* Quick Status KPI Strip */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <div
          onClick={() => setSelectedStatus('AVAILABLE')}
          className={`p-3 rounded-xl border cursor-pointer transition-all flex items-center justify-between ${
            selectedStatus === 'AVAILABLE'
              ? 'bg-emerald-500/10 border-emerald-500 shadow-xs'
              : 'bg-white border-slate-200 hover:border-slate-300'
          }`}
        >
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-emerald-100 text-emerald-700 flex items-center justify-center">
              <CheckCircle2 className="w-4 h-4" />
            </div>
            <div>
              <p className="text-xs text-slate-500 font-medium">Available Bays</p>
              <p className="text-lg font-extrabold text-emerald-700">{availableCount}</p>
            </div>
          </div>
          <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-emerald-100 text-emerald-800">
            {Math.round((availableCount / (slots.length || 1)) * 100)}%
          </span>
        </div>

        <div
          onClick={() => setSelectedStatus('OCCUPIED')}
          className={`p-3 rounded-xl border cursor-pointer transition-all flex items-center justify-between ${
            selectedStatus === 'OCCUPIED'
              ? 'bg-rose-500/10 border-rose-500 shadow-xs'
              : 'bg-white border-slate-200 hover:border-slate-300'
          }`}
        >
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-rose-100 text-rose-700 flex items-center justify-center">
              <Car className="w-4 h-4" />
            </div>
            <div>
              <p className="text-xs text-slate-500 font-medium">Occupied Bays</p>
              <p className="text-lg font-extrabold text-rose-700">{occupiedCount}</p>
            </div>
          </div>
          <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-rose-100 text-rose-800">
            {Math.round((occupiedCount / (slots.length || 1)) * 100)}%
          </span>
        </div>

        <div
          onClick={() => setSelectedStatus('RESERVED')}
          className={`p-3 rounded-xl border cursor-pointer transition-all flex items-center justify-between ${
            selectedStatus === 'RESERVED'
              ? 'bg-amber-500/10 border-amber-500 shadow-xs'
              : 'bg-white border-slate-200 hover:border-slate-300'
          }`}
        >
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-amber-100 text-amber-700 flex items-center justify-center">
              <Zap className="w-4 h-4" />
            </div>
            <div>
              <p className="text-xs text-slate-500 font-medium">Reserved Bays</p>
              <p className="text-lg font-extrabold text-amber-700">{reservedCount}</p>
            </div>
          </div>
        </div>

        <div
          onClick={() => setSelectedStatus('OFFLINE')}
          className={`p-3 rounded-xl border cursor-pointer transition-all flex items-center justify-between ${
            selectedStatus === 'OFFLINE'
              ? 'bg-slate-200 border-slate-400 shadow-xs'
              : 'bg-white border-slate-200 hover:border-slate-300'
          }`}
        >
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-slate-100 text-slate-700 flex items-center justify-center">
              <ShieldAlert className="w-4 h-4" />
            </div>
            <div>
              <p className="text-xs text-slate-500 font-medium">Offline Sensors</p>
              <p className="text-lg font-extrabold text-slate-700">{offlineCount}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Search & Area Filter Strip */}
      <div className="p-3.5 bg-white rounded-xl border border-slate-200 shadow-xs flex flex-col lg:flex-row items-stretch lg:items-center justify-between gap-3">
        {/* Search */}
        <div className="w-full lg:w-72">
          <Input
            placeholder="Search bay, plate or sensor..."
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
            leftIcon={<Search className="w-4 h-4 text-slate-400" />}
          />
        </div>

        {/* Deck Filters */}
        <div className="flex items-center gap-1.5 overflow-x-auto">
          <span className="text-xs font-semibold text-slate-500 mr-1 flex items-center gap-1 shrink-0">
            <Layers className="w-3.5 h-3.5" /> Deck:
          </span>
          <button
            onClick={() => setSelectedArea('ALL')}
            className={`px-3 py-1.5 text-xs font-semibold rounded-lg transition-all shrink-0 ${
              selectedArea === 'ALL'
                ? 'bg-teal-600 text-white shadow-xs'
                : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
            }`}
          >
            All Decks ({slots.length})
          </button>
          {areas.map(area => (
            <button
              key={area.id}
              onClick={() => setSelectedArea(area.id)}
              className={`px-3 py-1.5 text-xs font-semibold rounded-lg transition-all shrink-0 ${
                selectedArea === area.id
                  ? 'bg-teal-600 text-white shadow-xs'
                  : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
              }`}
            >
              {area.name}
            </button>
          ))}
          {selectedStatus !== 'ALL' && (
            <button
              onClick={() => setSelectedStatus('ALL')}
              className="px-2.5 py-1.5 text-xs font-semibold rounded-lg bg-slate-900 text-white shrink-0 ml-2"
            >
              Clear Status Filter ✕
            </button>
          )}
        </div>
      </div>

      {/* Main Parking Slot Grid */}
      <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-xs">
        <div className="flex items-center justify-between mb-4 pb-3 border-b border-slate-100">
          <div className="flex items-center gap-2">
            <span className="text-xs font-bold text-slate-800 uppercase tracking-wider">
              Parking Bay Layout ({filteredSlots.length} Slots Matching)
            </span>
          </div>

          <div className="hidden sm:flex items-center gap-4 text-xs font-medium text-slate-500">
            <span className="flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-emerald-500" /> Free
            </span>
            <span className="flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-rose-500" /> Occupied
            </span>
            <span className="flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-amber-500" /> Reserved
            </span>
            <span className="flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-slate-400" /> Offline
            </span>
          </div>
        </div>

        {filteredSlots.length === 0 ? (
          <div className="py-16 text-center text-slate-400">
            <p className="text-sm font-semibold">No parking slots matched your filter criteria.</p>
            <Button
              variant="outline"
              size="sm"
              className="mt-3"
              onClick={() => {
                setSelectedArea('ALL');
                setSelectedStatus('ALL');
                setSearchQuery('');
              }}
            >
              Reset Filters
            </Button>
          </div>
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-3">
            {filteredSlots.map(slot => (
              <ParkingSlotCard
                key={slot.id}
                slot={slot}
                onClick={() => setSelectedSlotForModal(slot)}
              />
            ))}
          </div>
        )}
      </div>

      {/* Slot Details Inspector Modal */}
      <SlotDetailModal
        slot={selectedSlotForModal}
        isOpen={!!selectedSlotForModal}
        onClose={() => setSelectedSlotForModal(null)}
      />
    </div>
  );
}
