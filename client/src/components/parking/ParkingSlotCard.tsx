'use client';

import React from 'react';
import { ParkingSlot } from '../../types';
import { Car, Radio, Zap, BatteryCharging, Accessibility, ShieldAlert } from 'lucide-react';
import { clsx } from 'clsx';

interface ParkingSlotCardProps {
  slot: ParkingSlot;
  onClick?: () => void;
}

export const ParkingSlotCard = ({ slot, onClick }: ParkingSlotCardProps) => {
  const isAvailable = slot.status === 'AVAILABLE';
  const isOccupied = slot.status === 'OCCUPIED';
  const isReserved = slot.status === 'RESERVED';
  const isOffline = slot.status === 'OFFLINE' || slot.status === 'MAINTENANCE';

  // Sensor reading if available
  const sensorDistance = slot.sensor?.lastReading;

  // Theme-compliant modern styling
  const cardBorder = isAvailable
    ? 'border-emerald-500/40 bg-emerald-500/[0.03] hover:border-emerald-500 hover:bg-emerald-500/[0.07]'
    : isOccupied
    ? 'border-rose-500/40 bg-rose-500/[0.03] hover:border-rose-500 hover:bg-rose-500/[0.07]'
    : isReserved
    ? 'border-amber-500/40 bg-amber-500/[0.03] hover:border-amber-500 hover:bg-amber-500/[0.07]'
    : 'border-slate-300 bg-slate-50 hover:border-slate-400';

  const statusPill = isAvailable
    ? 'bg-emerald-100 text-emerald-800 border-emerald-300'
    : isOccupied
    ? 'bg-rose-100 text-rose-800 border-rose-300'
    : isReserved
    ? 'bg-amber-100 text-amber-800 border-amber-300'
    : 'bg-slate-200 text-slate-700 border-slate-300';

  const ledColor = isAvailable
    ? 'bg-emerald-500 ring-emerald-300'
    : isOccupied
    ? 'bg-rose-500 ring-rose-300'
    : isReserved
    ? 'bg-amber-500 ring-amber-300'
    : 'bg-slate-400 ring-slate-200';

  return (
    <div
      onClick={onClick}
      className={clsx(
        'relative rounded-xl border p-3.5 cursor-pointer transition-all duration-200 hover:shadow-md select-none flex flex-col justify-between min-h-[135px] bg-white group',
        cardBorder
      )}
    >
      {/* Top Row: Bay Code + Type Icon + Status LED */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          {/* Overhead LED indicator */}
          <span className={clsx('w-2.5 h-2.5 rounded-full ring-4 transition-all', ledColor)} />
          <span className="text-sm font-bold text-slate-900 tracking-tight">{slot.slotNumber}</span>
          
          {slot.slotType === 'EV_CHARGING' && (
            <span className="p-0.5 rounded bg-teal-50 text-teal-700 border border-teal-200" title="EV Charging Bay">
              <BatteryCharging className="w-3 h-3" />
            </span>
          )}
          {slot.slotType === 'VIP' && (
            <span className="p-0.5 rounded bg-purple-50 text-purple-700 border border-purple-200" title="VIP Reserved Bay">
              <Zap className="w-3 h-3" />
            </span>
          )}
          {slot.slotType === 'HANDICAPPED' && (
            <span className="p-0.5 rounded bg-blue-50 text-blue-700 border border-blue-200" title="Accessible Bay">
              <Accessibility className="w-3 h-3" />
            </span>
          )}
        </div>

        <span className={clsx('text-[10px] font-bold px-2 py-0.5 rounded-md uppercase tracking-wider border', statusPill)}>
          {slot.status}
        </span>
      </div>

      {/* Middle Content: Vehicle / Bay State */}
      <div className="my-2">
        {isOccupied ? (
          <div className="flex items-center gap-2 px-2.5 py-1.5 rounded-lg bg-slate-900 text-white shadow-xs">
            <Car className="w-3.5 h-3.5 text-teal-400 shrink-0" />
            <span className="text-xs font-mono font-bold tracking-wider truncate">
              {slot.currentVehicle || 'PARKED'}
            </span>
          </div>
        ) : isAvailable ? (
          <div className="flex items-center gap-1.5 text-xs text-emerald-700 font-semibold py-1">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
            <span>Ready for Parking</span>
          </div>
        ) : isReserved ? (
          <div className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg bg-amber-50 text-amber-900 border border-amber-200 shadow-2xs">
            <span className="w-1.5 h-1.5 rounded-full bg-amber-500 shrink-0" />
            <span className="text-xs font-mono font-bold tracking-tight truncate">
              {slot.currentVehicle || 'Reserved Booking'}
            </span>
          </div>
        ) : (
          <div className="flex items-center gap-1.5 text-xs text-slate-500 py-1">
            <ShieldAlert className="w-3.5 h-3.5 text-slate-400" />
            <span>Sensor Offline</span>
          </div>
        )}
      </div>

      {/* Bottom Row: Ultrasonic Sensor Telemetry */}
      <div className="pt-2 border-t border-slate-100 flex items-center justify-between text-[11px] text-slate-500">
        <div className="flex items-center gap-1.5">
          <Radio className="w-3 h-3 text-slate-400 shrink-0" />
          <span className="font-mono text-[10px] text-slate-600 truncate max-w-[90px]">
            {slot.sensor?.sensorCode || 'HC-SR04'}
          </span>
        </div>

        {sensorDistance !== undefined && sensorDistance !== null ? (
          <span className="font-mono font-bold text-[10px] px-1.5 py-0.5 rounded bg-slate-100 text-slate-700 border border-slate-200">
            {sensorDistance} cm
          </span>
        ) : (
          <span className="text-[10px] text-slate-400 font-mono">-- cm</span>
        )}
      </div>
    </div>
  );
};
