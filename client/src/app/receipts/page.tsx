'use client';

import React, { useState, useEffect } from 'react';
import { useParking } from '../../context/ParkingContext';
import { api } from '../../services/api';
import { Card } from '../../components/common/Card';
import { Button } from '../../components/common/Button';
import { Input } from '../../components/common/Input';
import { Select } from '../../components/common/Select';
import { ReceiptModal, ReceiptData } from '../../components/receipt/ReceiptModal';
import {
  Printer,
  Receipt,
  Search,
  Filter,
  Download,
  Plus,
  IndianRupee,
  Car,
  Clock,
  CheckCircle2,
  Calendar,
  FileText,
  CreditCard,
  QrCode,
  Zap,
} from 'lucide-react';

export default function ReceiptsPage() {
  const { slots, sessions, showToast } = useParking();

  const [selectedReceipt, setSelectedReceipt] = useState<ReceiptData | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isCreatingManual, setIsCreatingManual] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [methodFilter, setMethodFilter] = useState('ALL');

  // Manual Generator Form State
  const [manualForm, setManualForm] = useState({
    vehiclePlate: 'TN-38-BK-1122',
    vehicleType: 'Car',
    slotNumber: 'A-01',
    driverName: 'Gokul',
    driverPhone: '9876543210',
    durationMinutes: 60,
    ratePerHour: 20,
    paymentMethod: 'UPI' as const,
  });

  // Generated receipts list (saved locally & derived from DB sessions)
  const [receiptsList, setReceiptsList] = useState<ReceiptData[]>([]);

  // Build live receipt records from database parking sessions & sample records
  useEffect(() => {
    const generated: ReceiptData[] = sessions.map((s, idx) => {
      const matchedSlot = slots.find(sl => sl.id === s.slotId || sl.slotNumber === s.slotId);
      const rate = s.slot?.area?.hourlyRate || matchedSlot?.area?.hourlyRate || 20;
      const dur = s.durationMin && s.durationMin > 0
        ? s.durationMin
        : Math.max(15, Math.round((Date.now() - new Date(s.entryTime).getTime()) / (60 * 1000)));
      const base = s.feeAmount || Math.max(rate, Math.ceil(dur / 60) * rate);
      const tax = Number((base * 0.18).toFixed(2));
      const total = Number((base + tax).toFixed(2));

      return {
        receiptNo: `REC-${new Date(s.entryTime).toISOString().slice(0, 10).replace(/-/g, '')}-${String(idx + 101).padStart(4, '0')}`,
        transactionId: `TXN-${Math.floor(100000 + Math.random() * 900000)}`,
        vehiclePlate: s.vehiclePlate || 'TN-38-BK-1122',
        vehicleType: 'Car',
        slotNumber: matchedSlot?.slotNumber || s.slot?.slotNumber || 'A-01',
        areaName: matchedSlot?.area?.name || s.slot?.area?.name || 'Smart Parking Bay',
        driverName: 'Verified Driver',
        driverPhone: '+91 9876543210',
        entryTime: new Date(s.entryTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        exitTime: s.exitTime ? new Date(s.exitTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : 'Active',
        durationMinutes: dur,
        ratePerHour: rate,
        baseAmount: base,
        taxAmount: tax,
        totalAmount: total,
        paymentMethod: (['UPI', 'CASH', 'FASTAG', 'CARD'][idx % 4]) as any,
        paymentStatus: 'PAID',
        issuedAt: (s.exitTime || s.entryTime || new Date()).toString(),
        operatorName: 'System Operator',
      };
    });

    // If no sessions yet, include default recent sample receipts
    if (generated.length === 0) {
      setReceiptsList([
        {
          receiptNo: 'REC-20260930-0101',
          transactionId: 'TXN-849201',
          vehiclePlate: 'TN-38-BK-1122',
          vehicleType: 'Car',
          slotNumber: 'A-01',
          areaName: 'Zone A',
          driverName: 'Gokul',
          driverPhone: '+91 9876543210',
          entryTime: '10:00 AM',
          exitTime: '12:00 PM',
          durationMinutes: 120,
          ratePerHour: 20,
          baseAmount: 40,
          taxAmount: 7.20,
          totalAmount: 47.20,
          paymentMethod: 'UPI',
          paymentStatus: 'PAID',
          issuedAt: new Date().toISOString(),
          operatorName: 'System Admin',
        },
        {
          receiptNo: 'REC-20260930-0102',
          transactionId: 'TXN-932184',
          vehiclePlate: 'TN-45-AZ-9988',
          vehicleType: 'SUV',
          slotNumber: 'A-02',
          areaName: 'Zone A',
          driverName: 'Karthik',
          driverPhone: '+91 9443218765',
          entryTime: '01:30 PM',
          exitTime: '02:30 PM',
          durationMinutes: 60,
          ratePerHour: 20,
          baseAmount: 20,
          taxAmount: 3.60,
          totalAmount: 23.60,
          paymentMethod: 'FASTAG',
          paymentStatus: 'PAID',
          issuedAt: new Date().toISOString(),
          operatorName: 'System Admin',
        },
      ]);
    } else {
      setReceiptsList(generated);
    }
  }, [sessions, slots]);

  const handleCreateManualReceipt = (e: React.FormEvent) => {
    e.preventDefault();
    const dur = Number(manualForm.durationMinutes) || 60;
    const base = Math.max(20, Math.ceil(dur / 60) * manualForm.ratePerHour);
    const tax = Number((base * 0.18).toFixed(2));
    const total = Number((base + tax).toFixed(2));

    const newReceipt: ReceiptData = {
      receiptNo: `REC-${new Date().toISOString().slice(0, 10).replace(/-/g, '')}-${Math.floor(1000 + Math.random() * 9000)}`,
      transactionId: `TXN-${Math.floor(100000 + Math.random() * 900000)}`,
      vehiclePlate: manualForm.vehiclePlate.toUpperCase(),
      vehicleType: manualForm.vehicleType,
      slotNumber: manualForm.slotNumber,
      areaName: 'Zone A',
      driverName: manualForm.driverName,
      driverPhone: `+91 ${manualForm.driverPhone.slice(-10)}`,
      entryTime: new Date(Date.now() - dur * 60 * 1000).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      exitTime: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      durationMinutes: dur,
      ratePerHour: manualForm.ratePerHour,
      baseAmount: base,
      taxAmount: tax,
      totalAmount: total,
      paymentMethod: manualForm.paymentMethod,
      paymentStatus: 'PAID',
      issuedAt: new Date().toISOString(),
      operatorName: 'System Admin',
    };

    setReceiptsList(prev => [newReceipt, ...prev]);
    setSelectedReceipt(newReceipt);
    setIsModalOpen(true);
    setIsCreatingManual(false);
    showToast('success', 'Receipt Generated Successfully!', `Receipt #${newReceipt.receiptNo} created.`);
  };

  const handleOpenReceipt = (receipt: ReceiptData) => {
    setSelectedReceipt(receipt);
    setIsModalOpen(true);
  };

  const filteredReceipts = receiptsList.filter(r => {
    if (methodFilter !== 'ALL' && r.paymentMethod !== methodFilter) return false;
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      const matchPlate = r.vehiclePlate.toLowerCase().includes(q);
      const matchRec = r.receiptNo.toLowerCase().includes(q);
      const matchDriver = r.driverName?.toLowerCase().includes(q);
      const matchSlot = r.slotNumber.toLowerCase().includes(q);
      if (!matchPlate && !matchRec && !matchDriver && !matchSlot) return false;
    }
    return true;
  });

  const totalRevenue = receiptsList.reduce((acc, r) => acc + r.totalAmount, 0);

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight flex items-center gap-2">
            <Receipt className="w-6 h-6 text-teal-700" /> Parking Receipts & Invoicing
          </h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Generate, print, and audit customer parking receipts with POS Thermal and Tax Invoice formats
          </p>
        </div>

        <div className="flex items-center gap-2.5">
          <Button
            size="sm"
            variant="primary"
            onClick={() => setIsCreatingManual(true)}
            leftIcon={<Plus className="w-4 h-4" />}
          >
            Generate New Receipt
          </Button>
        </div>
      </div>

      {/* KPI Stats Strip */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white border border-slate-200/90 rounded-2xl p-4 shadow-xs flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-teal-500/10 text-teal-600 flex items-center justify-center border border-teal-500/20">
              <Receipt className="w-5 h-5" />
            </div>
            <div>
              <p className="text-[11px] font-bold uppercase tracking-wider text-slate-400">Total Receipts</p>
              <p className="text-xl font-extrabold text-slate-900">{receiptsList.length}</p>
            </div>
          </div>
        </div>

        <div className="bg-white border border-slate-200/90 rounded-2xl p-4 shadow-xs flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-emerald-500/10 text-emerald-600 flex items-center justify-center border border-emerald-500/20">
              <IndianRupee className="w-5 h-5" />
            </div>
            <div>
              <p className="text-[11px] font-bold uppercase tracking-wider text-slate-400">Total Billed</p>
              <p className="text-xl font-extrabold text-emerald-700">₹{totalRevenue.toFixed(2)}</p>
            </div>
          </div>
        </div>

        <div className="bg-white border border-slate-200/90 rounded-2xl p-4 shadow-xs flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-blue-500/10 text-blue-600 flex items-center justify-center border border-blue-500/20">
              <CreditCard className="w-5 h-5" />
            </div>
            <div>
              <p className="text-[11px] font-bold uppercase tracking-wider text-slate-400">Top Method</p>
              <p className="text-xl font-extrabold text-blue-700">UPI / Digital</p>
            </div>
          </div>
        </div>

        <div className="bg-white border border-slate-200/90 rounded-2xl p-4 shadow-xs flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-amber-500/10 text-amber-600 flex items-center justify-center border border-amber-500/20">
              <CheckCircle2 className="w-5 h-5" />
            </div>
            <div>
              <p className="text-[11px] font-bold uppercase tracking-wider text-slate-400">Tax Status</p>
              <p className="text-xl font-extrabold text-amber-700">18% GST Paid</p>
            </div>
          </div>
        </div>
      </div>

      {/* Manual Quick Receipt Generator Form (Collapsible) */}
      {isCreatingManual && (
        <Card
          header={
            <div className="flex items-center justify-between w-full">
              <div>
                <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                  <FileText className="w-4 h-4 text-teal-700" /> Instant Receipt / Bill Generator
                </h3>
                <p className="text-xs text-slate-500">Fill vehicle and time details to create & print an instant receipt</p>
              </div>
              <button
                onClick={() => setIsCreatingManual(false)}
                className="text-xs font-bold text-slate-400 hover:text-slate-700"
              >
                Close ✕
              </button>
            </div>
          }
        >
          <form onSubmit={handleCreateManualReceipt} className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
              <Input
                label="Vehicle Plate *"
                placeholder="e.g. TN-38-BK-1122"
                value={manualForm.vehiclePlate}
                onChange={e => setManualForm({ ...manualForm, vehiclePlate: e.target.value.toUpperCase() })}
                required
              />

              <Select
                label="Vehicle Category *"
                value={manualForm.vehicleType}
                onChange={e => setManualForm({ ...manualForm, vehicleType: e.target.value })}
                options={[
                  { value: 'Car', label: 'Car (Sedan/Hatchback)' },
                  { value: 'SUV', label: 'SUV / Premium' },
                  { value: 'Two Wheeler', label: 'Two Wheeler / Bike' },
                  { value: 'EV', label: 'Electric Vehicle (EV)' },
                ]}
                required
              />

              <Select
                label="Parking Bay *"
                value={manualForm.slotNumber}
                onChange={e => setManualForm({ ...manualForm, slotNumber: e.target.value })}
                options={slots.map(s => ({ value: s.slotNumber, label: `Slot ${s.slotNumber}` }))}
                required
              />

              <Select
                label="Payment Method *"
                value={manualForm.paymentMethod}
                onChange={e => setManualForm({ ...manualForm, paymentMethod: e.target.value as any })}
                options={[
                  { value: 'UPI', label: 'UPI / QR Code' },
                  { value: 'CASH', label: 'Cash at Counter' },
                  { value: 'FASTAG', label: 'FASTag RFID' },
                  { value: 'CARD', label: 'Debit / Credit Card' },
                ]}
                required
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
              <Input
                label="Driver / Owner Name *"
                value={manualForm.driverName}
                onChange={e => setManualForm({ ...manualForm, driverName: e.target.value })}
                required
              />

              <Input
                label="Mobile Phone *"
                value={manualForm.driverPhone}
                onChange={e => setManualForm({ ...manualForm, driverPhone: e.target.value.replace(/\D/g, '') })}
                maxLength={10}
                required
              />

              <Input
                label="Parking Duration (Mins) *"
                type="number"
                min="15"
                step="15"
                value={manualForm.durationMinutes}
                onChange={e => setManualForm({ ...manualForm, durationMinutes: Number(e.target.value) })}
                required
              />

              <Input
                label="Tariff Rate (₹/hr) *"
                type="number"
                value={manualForm.ratePerHour}
                onChange={e => setManualForm({ ...manualForm, ratePerHour: Number(e.target.value) })}
                required
              />
            </div>

            <div className="flex items-center justify-between pt-2 border-t border-slate-100">
              <div className="text-xs text-slate-600">
                Estimated Total (with 18% GST):{' '}
                <strong className="text-teal-900 text-sm">
                  ₹{(Math.max(20, Math.ceil(manualForm.durationMinutes / 60) * manualForm.ratePerHour) * 1.18).toFixed(2)}
                </strong>
              </div>

              <div className="flex items-center gap-2">
                <Button type="button" variant="outline" size="sm" onClick={() => setIsCreatingManual(false)}>
                  Cancel
                </Button>
                <Button type="submit" variant="primary" size="sm" leftIcon={<Printer className="w-3.5 h-3.5" />}>
                  Generate & Print Receipt
                </Button>
              </div>
            </div>
          </form>
        </Card>
      )}

      {/* Receipts History Table */}
      <div className="bg-white border border-slate-200/80 rounded-2xl shadow-xs overflow-hidden">
        {/* Table Filter Controls */}
        <div className="p-4 sm:p-5 border-b border-slate-100 flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-slate-50/50">
          <div>
            <h2 className="text-sm font-bold text-slate-900 flex items-center gap-2">
              <Receipt className="w-4 h-4 text-teal-700" /> Issued Receipts & Billing Logs
            </h2>
            <p className="text-xs text-slate-500 mt-0.5">
              Comprehensive registry of all customer parking receipts, GST invoices, and transaction slips
            </p>
          </div>

          <div className="flex items-center gap-2.5">
            <div className="relative w-full sm:w-64">
              <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
              <input
                type="text"
                placeholder="Search plate, receipt #, driver..."
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
                className="w-full pl-8 pr-3 py-1.5 text-xs bg-white border border-slate-200 rounded-lg placeholder:text-slate-400 focus:outline-none focus:ring-1 focus:ring-teal-500"
              />
            </div>

            <select
              value={methodFilter}
              onChange={e => setMethodFilter(e.target.value)}
              className="py-1.5 px-2.5 text-xs bg-white border border-slate-200 rounded-lg text-slate-700 font-medium focus:outline-none focus:ring-1 focus:ring-teal-500"
            >
              <option value="ALL">All Payment Modes</option>
              <option value="UPI">UPI</option>
              <option value="CASH">Cash</option>
              <option value="FASTAG">FASTag</option>
              <option value="CARD">Card</option>
            </select>
          </div>
        </div>

        {/* Table Content */}
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-slate-100 bg-slate-50/30 text-[11px] font-bold text-slate-400 uppercase tracking-wider">
                <th className="py-3 px-4">Receipt No</th>
                <th className="py-3 px-4">Vehicle Plate</th>
                <th className="py-3 px-4">Bay</th>
                <th className="py-3 px-4">Duration</th>
                <th className="py-3 px-4">Amount & Tax</th>
                <th className="py-3 px-4">Payment</th>
                <th className="py-3 px-4">Issued Date</th>
                <th className="py-3 px-4 text-right">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-xs text-slate-700">
              {filteredReceipts.length === 0 ? (
                <tr>
                  <td colSpan={8} className="py-12 text-center text-slate-400">
                    <Receipt className="w-8 h-8 text-slate-300 mx-auto mb-2" />
                    <p className="font-semibold text-slate-600">No receipts found.</p>
                  </td>
                </tr>
              ) : (
                filteredReceipts.map(rec => (
                  <tr key={rec.receiptNo} className="hover:bg-slate-50/50 transition-colors">
                    <td className="py-3 px-4 font-mono font-bold text-slate-900">
                      {rec.receiptNo}
                    </td>
                    <td className="py-3 px-4 font-mono font-bold text-slate-800">
                      {rec.vehiclePlate}
                      <span className="block text-[10px] text-slate-400 font-sans font-normal">
                        {rec.driverName}
                      </span>
                    </td>
                    <td className="py-3 px-4">
                      <span className="font-black text-slate-900 px-2 py-0.5 rounded bg-slate-100 border border-slate-200">
                        {rec.slotNumber}
                      </span>
                    </td>
                    <td className="py-3 px-4 font-medium text-slate-800">
                      {rec.durationMinutes} mins
                    </td>
                    <td className="py-3 px-4 font-mono font-bold text-emerald-700">
                      ₹{rec.totalAmount.toFixed(2)}
                      <span className="block text-[10px] text-slate-400 font-sans font-normal">
                        (Incl. 18% GST)
                      </span>
                    </td>
                    <td className="py-3 px-4">
                      <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-teal-50 text-teal-800 border border-teal-200">
                        {rec.paymentMethod}
                      </span>
                    </td>
                    <td className="py-3 px-4 text-slate-500">
                      {new Date(rec.issuedAt).toLocaleDateString()}
                    </td>
                    <td className="py-3 px-4 text-right">
                      <button
                        onClick={() => handleOpenReceipt(rec)}
                        className="text-xs font-bold text-teal-700 hover:text-teal-800 bg-teal-50 hover:bg-teal-100 px-3 py-1.5 rounded-lg border border-teal-200 transition-colors inline-flex items-center gap-1.5"
                      >
                        <Printer className="w-3.5 h-3.5" /> Print Receipt
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Printable Receipt Modal */}
      <ReceiptModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        receipt={selectedReceipt}
      />
    </div>
  );
}
