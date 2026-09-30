'use client';

import React, { useState, useEffect } from 'react';
import { useParking } from '../../context/ParkingContext';
import { VehicleModal } from '../../components/vehicles/VehicleModal';
import { Table, Pagination } from '../../components/common/Table';
import { Card } from '../../components/common/Card';
import { Input } from '../../components/common/Input';
import { Button } from '../../components/common/Button';
import { Vehicle } from '../../types';
import { api } from '../../services/api';
import { getSocket } from '../../services/socket';
import { Car, Plus, Search, Phone, User, RefreshCw, Layers } from 'lucide-react';

export default function VehiclesPage() {
  const { showToast, slots } = useParking();
  const [vehicles, setVehicles] = useState<Vehicle[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const pageSize = 10;

  const fetchVehicles = async (showLoading = true) => {
    if (showLoading) setIsLoading(true);
    try {
      const data = await api.getVehicles(searchQuery);
      setVehicles(data);
    } catch (err: any) {
      console.warn('Vehicle fetch fallback:', err.message);
    } finally {
      if (showLoading) setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchVehicles();
  }, [searchQuery]);

  // Real-time WebSocket synchronization for Vehicles
  useEffect(() => {
    const socket = getSocket();

    const handleUpdate = () => {
      fetchVehicles(false);
    };

    socket.on('session:new', handleUpdate);
    socket.on('session:updated', handleUpdate);
    socket.on('parking:slot-updated', handleUpdate);

    return () => {
      socket.off('session:new', handleUpdate);
      socket.off('session:updated', handleUpdate);
      socket.off('parking:slot-updated', handleUpdate);
    };
  }, [searchQuery]);

  const totalPages = Math.ceil(vehicles.length / pageSize) || 1;
  const paginatedVehicles = vehicles.slice((currentPage - 1) * pageSize, currentPage * pageSize);

  const columns = [
    {
      header: 'Vehicle Plate',
      render: (v: Vehicle) => (
        <div className="flex items-center gap-2">
          <div className="w-7 h-7 rounded-lg bg-teal-50 border border-teal-200 flex items-center justify-center text-teal-700">
            <Car className="w-4 h-4" />
          </div>
          <div>
            <span className="font-mono font-bold text-slate-900 text-xs bg-slate-100 px-2 py-0.5 rounded border border-slate-300 shadow-sm inline-block tracking-wider">
              {v.plateNumber || (v as any).licensePlate || 'UNKNOWN'}
            </span>
            <p className="text-[10px] text-slate-500 mt-0.5">{v.color ? `${v.color} • ` : ''}{v.model || ''}</p>
          </div>
        </div>
      ),
    },
    {
      header: 'Vehicle Category',
      render: (v: Vehicle) => (
        <span className="text-xs bg-slate-50 text-slate-700 px-2 py-1 rounded font-medium border border-slate-200">
          {v.vehicleType}
        </span>
      ),
    },
    {
      header: 'Owner Name',
      render: (v: Vehicle) => (
        <div className="flex items-center gap-1.5 text-xs text-slate-800">
          <User className="w-3.5 h-3.5 text-slate-400" />
          <span className="font-semibold">{v.ownerName || 'Guest User'}</span>
        </div>
      ),
    },
    {
      header: 'Contact Phone',
      render: (v: Vehicle) => (
        <div className="flex items-center gap-1.5 text-xs text-slate-600 font-mono">
          <Phone className="w-3.5 h-3.5 text-slate-400" />
          <span>{v.ownerPhone || 'N/A'}</span>
        </div>
      ),
    },
    {
      header: 'Current Active Slot',
      render: (v: Vehicle) => {
        const plate = v.plateNumber || (v as any).licensePlate;
        const activeSlot = slots.find(s => s.currentVehicle === plate);
        return activeSlot ? (
          <span className="font-bold text-xs bg-rose-50 text-rose-700 px-2 py-1 rounded border border-rose-200">
            {activeSlot.slotNumber} ({activeSlot.area?.code || 'Area'})
          </span>
        ) : (
          <span className="text-xs text-slate-400">Not Parked</span>
        );
      },
    },
    {
      header: 'Registered Date',
      render: (v: Vehicle) => (
        <span className="text-[11px] text-slate-500">
          {new Date(v.createdAt).toLocaleDateString()}
        </span>
      ),
    },
  ];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight flex items-center gap-2">
            <Car className="w-6 h-6 text-teal-700" /> Vehicle Directory & Registry
          </h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Registered fleet, guest vehicles, automated license plate recognition mapping
          </p>
        </div>

        <div className="flex items-center gap-2">
          <Button
            size="sm"
            variant="outline"
            onClick={() => fetchVehicles()}
            isLoading={isLoading}
            leftIcon={<RefreshCw className="w-3.5 h-3.5" />}
          >
            Refresh
          </Button>
          <Button
            size="sm"
            variant="primary"
            onClick={() => setIsModalOpen(true)}
            leftIcon={<Plus className="w-4 h-4" />}
          >
            Register Vehicle
          </Button>
        </div>
      </div>

      {/* Search Toolbar */}
      <Card className="p-4 bg-white">
        <div className="w-full sm:w-80">
          <Input
            placeholder="Search Plate, Owner, Model..."
            value={searchQuery}
            onChange={e => {
              setSearchQuery(e.target.value);
              setCurrentPage(1);
            }}
            leftIcon={<Search className="w-4 h-4" />}
          />
        </div>
      </Card>

      {/* Vehicles Table */}
      <Card>
        <Table
          columns={columns}
          data={paginatedVehicles}
          keyExtractor={v => v.id}
          isLoading={isLoading}
          emptyMessage="No vehicle records found."
        />

        <Pagination
          currentPage={currentPage}
          totalPages={totalPages}
          totalItems={vehicles.length}
          pageSize={pageSize}
          onPageChange={page => setCurrentPage(page)}
        />
      </Card>

      {/* Vehicle Modal */}
      <VehicleModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onSuccess={fetchVehicles}
      />
    </div>
  );
}
