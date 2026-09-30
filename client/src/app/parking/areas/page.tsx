'use client';

import React, { useState } from 'react';
import { useParking } from '../../../context/ParkingContext';
import { AreaModal } from '../../../components/parking/AreaModal';
import { Card } from '../../../components/common/Card';
import { Button } from '../../../components/common/Button';
import { ParkingArea } from '../../../types';
import { api } from '../../../services/api';
import Link from 'next/link';
import {
  Layers,
  Plus,
  Edit2,
  Trash2,
  Car,
  CheckCircle2,
  ExternalLink,
  MapPin,
  Banknote,
} from 'lucide-react';

export default function ParkingAreasPage() {
  const { areas, slots, refreshAll, showToast } = useParking();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [areaToEdit, setAreaToEdit] = useState<ParkingArea | null>(null);
  const [isDeletingId, setIsDeletingId] = useState<string | null>(null);

  const handleOpenAdd = () => {
    setAreaToEdit(null);
    setIsModalOpen(true);
  };

  const handleOpenEdit = (area: ParkingArea) => {
    setAreaToEdit(area);
    setIsModalOpen(true);
  };

  const handleDeleteArea = async (id: string, name: string) => {
    if (!confirm(`Are you sure you want to delete "${name}" and all associated slots?`)) return;
    setIsDeletingId(id);
    try {
      await api.deleteArea(id);
      showToast('success', 'Area Deleted', `Parking Area ${name} has been removed.`);
      await refreshAll();
    } catch (err: any) {
      showToast('error', 'Delete Failed', err.message);
    } finally {
      setIsDeletingId(null);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight flex items-center gap-2">
            <Layers className="w-6 h-6 text-teal-700" /> Parking Area Management
          </h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Organize multi-deck parking facilities, zones, floor levels, and tariff policies
          </p>
        </div>

        <Button
          size="sm"
          variant="primary"
          onClick={handleOpenAdd}
          leftIcon={<Plus className="w-4 h-4" />}
        >
          Add New Area
        </Button>
      </div>

      {/* Areas Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
        {areas.map(area => {
          const areaSlots = slots.filter(s => s.areaId === area.id);
          const available = areaSlots.filter(s => s.status === 'AVAILABLE').length;
          const occupied = areaSlots.filter(s => s.status === 'OCCUPIED').length;
          const reserved = areaSlots.filter(s => s.status === 'RESERVED').length;
          const total = areaSlots.length || area.totalSlots;
          const occupancyRate = total > 0 ? Math.round((occupied / total) * 100) : 0;

          return (
            <Card
              key={area.id}
              className="flex flex-col justify-between hover:shadow-md transition-shadow"
              header={
                <div className="flex items-center justify-between w-full">
                  <div>
                    <span className="text-[10px] font-bold uppercase tracking-wider text-teal-700 bg-teal-50 px-2 py-0.5 rounded border border-teal-200">
                      Level {area.floorLevel} • {area.code}
                    </span>
                    <h3 className="text-base font-bold text-slate-900 mt-1">{area.name}</h3>
                  </div>

                  <div className="flex items-center gap-1">
                    <button
                      onClick={() => handleOpenEdit(area)}
                      className="p-1.5 rounded-lg text-slate-400 hover:text-teal-700 hover:bg-slate-100 transition-colors"
                      title="Edit Area"
                    >
                      <Edit2 className="w-3.5 h-3.5" />
                    </button>
                    <button
                      onClick={() => handleDeleteArea(area.id, area.name)}
                      disabled={isDeletingId === area.id}
                      className="p-1.5 rounded-lg text-slate-400 hover:text-rose-600 hover:bg-rose-50 transition-colors"
                      title="Delete Area"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              }
            >
              <div className="space-y-4">
                {/* Description */}
                {area.description && (
                  <p className="text-xs text-slate-500 leading-relaxed line-clamp-2">
                    {area.description}
                  </p>
                )}

                {/* Capacity breakdown pills */}
                <div className="grid grid-cols-3 gap-2 text-center text-xs">
                  <div className="p-2 rounded-lg bg-slate-50 border border-slate-200">
                    <p className="text-[10px] text-slate-400 uppercase font-bold">Total</p>
                    <p className="text-base font-bold text-slate-900 mt-0.5">{total}</p>
                  </div>
                  <div className="p-2 rounded-lg bg-emerald-50 border border-emerald-200">
                    <p className="text-[10px] text-emerald-700 uppercase font-bold">Available</p>
                    <p className="text-base font-bold text-emerald-700 mt-0.5">{available}</p>
                  </div>
                  <div className="p-2 rounded-lg bg-rose-50 border border-rose-200">
                    <p className="text-[10px] text-rose-700 uppercase font-bold">Occupied</p>
                    <p className="text-base font-bold text-rose-700 mt-0.5">{occupied}</p>
                  </div>
                </div>

                {/* Occupancy Progress Bar */}
                <div className="space-y-1">
                  <div className="flex justify-between text-xs font-semibold text-slate-600">
                    <span>Occupancy Rate</span>
                    <span>{occupancyRate}%</span>
                  </div>
                  <div className="h-2 w-full bg-slate-100 rounded-full overflow-hidden">
                    <div
                      className={`h-full rounded-full transition-all duration-300 ${
                        occupancyRate > 85 ? 'bg-rose-500' : occupancyRate > 60 ? 'bg-amber-500' : 'bg-teal-600'
                      }`}
                      style={{ width: `${occupancyRate}%` }}
                    />
                  </div>
                </div>

                {/* Tariff Info */}
                <div className="pt-2 border-t border-slate-100 flex items-center justify-between text-xs text-slate-500">
                  <div className="flex items-center gap-1 font-medium">
                    <Banknote className="w-3.5 h-3.5 text-teal-700" />
                    <span>Rate: <strong>INR {area.hourlyRate || 20}/hr</strong></span>
                  </div>

                  <Link
                    href={`/parking/live?area=${area.id}`}
                    className="text-teal-700 hover:text-teal-800 font-semibold flex items-center gap-1"
                  >
                    View Map <ExternalLink className="w-3 h-3" />
                  </Link>
                </div>
              </div>
            </Card>
          );
        })}
      </div>

      {/* Area Modal */}
      <AreaModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        areaToEdit={areaToEdit}
      />
    </div>
  );
}
