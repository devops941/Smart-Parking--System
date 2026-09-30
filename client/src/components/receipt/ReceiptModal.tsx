'use client';

import React, { useRef, useState } from 'react';
import { Modal } from '../common/Modal';
import { Button } from '../common/Button';
import {
  Printer,
  Download,
  Share2,
  CheckCircle2,
  QrCode,
  IndianRupee,
  Car,
  Clock,
  MapPin,
  FileText,
  Copy,
  Check,
  Zap,
} from 'lucide-react';

export interface ReceiptData {
  receiptNo: string;
  transactionId?: string;
  vehiclePlate: string;
  vehicleType?: string;
  slotNumber: string;
  areaName?: string;
  driverName?: string;
  driverPhone?: string;
  entryTime: string;
  exitTime?: string;
  durationMinutes: number;
  ratePerHour: number;
  baseAmount: number;
  taxAmount: number;
  totalAmount: number;
  paymentMethod: 'CASH' | 'UPI' | 'CARD' | 'FASTAG';
  paymentStatus: 'PAID' | 'PENDING';
  issuedAt: string;
  operatorName?: string;
}

interface ReceiptModalProps {
  isOpen: boolean;
  onClose: () => void;
  receipt: ReceiptData | null;
}

export const ReceiptModal = ({ isOpen, onClose, receipt }: ReceiptModalProps) => {
  const [printMode, setPrintMode] = useState<'thermal' | 'a4'>('thermal');
  const [copied, setCopied] = useState(false);
  const printRef = useRef<HTMLDivElement>(null);

  if (!receipt) return null;

  const handlePrint = () => {
    const el = document.getElementById('printable-receipt');
    if (!el) {
      window.print();
      return;
    }

    let iframe = document.getElementById('receipt-print-frame') as HTMLIFrameElement;
    if (!iframe) {
      iframe = document.createElement('iframe');
      iframe.id = 'receipt-print-frame';
      iframe.style.position = 'fixed';
      iframe.style.right = '0';
      iframe.style.bottom = '0';
      iframe.style.width = '0';
      iframe.style.height = '0';
      iframe.style.border = '0';
      document.body.appendChild(iframe);
    }

    const doc = iframe.contentWindow?.document;
    if (!doc) {
      window.print();
      return;
    }

    doc.open();
    doc.write(`
      <!DOCTYPE html>
      <html>
        <head>
          <title>Parking Receipt - ${receipt.receiptNo}</title>
          <style>
            @page {
              size: ${printMode === 'thermal' ? '80mm auto' : 'A4 portrait'};
              margin: ${printMode === 'thermal' ? '2mm 4mm' : '15mm'};
            }
            * {
              box-sizing: border-box;
              margin: 0;
              padding: 0;
            }
            body {
              font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Courier New', monospace;
              background: #fff;
              color: #0f172a;
              display: flex;
              justify-content: ${printMode === 'thermal' ? 'center' : 'flex-start'};
              padding: 0;
            }
            .receipt-container {
              width: 100%;
              max-width: ${printMode === 'thermal' ? '320px' : '100%'};
              margin: 0 auto;
            }
            .w-80 { width: 320px; }
            .w-full { width: 100%; }
            .bg-white { background-color: #ffffff; }
            .p-6 { padding: 1rem; }
            .p-8 { padding: 1.5rem; }
            .font-mono { font-family: 'Courier New', Courier, monospace; }
            .font-sans { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; }
            .text-xs { font-size: 11px; line-height: 1.4; }
            .text-sm { font-size: 13px; line-height: 1.4; }
            .text-base { font-size: 15px; }
            .text-xl { font-size: 18px; }
            .text-center { text-align: center; }
            .text-right { text-align: right; }
            .font-bold { font-weight: 700; }
            .font-black { font-weight: 900; }
            .font-extrabold { font-weight: 800; }
            .font-semibold { font-weight: 600; }
            .space-y-4 > * + * { margin-top: 10px; }
            .space-y-3 > * + * { margin-top: 8px; }
            .space-y-1\\.5 > * + * { margin-top: 5px; }
            .space-y-1 > * + * { margin-top: 3px; }
            .space-y-2 > * + * { margin-top: 6px; }
            .space-y-6 > * + * { margin-top: 16px; }
            .border-b { border-bottom: 1px solid #cbd5e1; }
            .border-t { border-top: 1px solid #cbd5e1; }
            .border-dashed { border-style: dashed; }
            .pb-3 { padding-bottom: 8px; }
            .pb-5 { padding-bottom: 12px; }
            .pt-1 { padding-top: 4px; }
            .pt-2 { padding-top: 6px; }
            .flex { display: flex; }
            .items-center { align-items: center; }
            .items-start { align-items: flex-start; }
            .justify-between { justify-content: space-between; }
            .justify-center { justify-content: center; }
            .gap-1\\.5 { gap: 6px; }
            .gap-2 { gap: 8px; }
            .gap-6 { gap: 16px; }
            .grid { display: grid; }
            .grid-cols-2 { grid-template-columns: repeat(2, minmax(0, 1fr)); }
            .rounded-xl { border-radius: 8px; }
            .rounded-lg { border-radius: 6px; }
            .rounded { border-radius: 4px; }
            .rounded-full { border-radius: 9999px; }
            .border { border: 1px solid #cbd5e1; }
            .bg-slate-50 { background-color: #f8fafc; }
            .bg-slate-100 { background-color: #f1f5f9; }
            .bg-emerald-50 { background-color: #ecfdf5; }
            .bg-teal-50 { background-color: #f0fdfa; }
            .text-slate-400 { color: #94a3b8; }
            .text-slate-500 { color: #64748b; }
            .text-slate-600 { color: #475569; }
            .text-slate-700 { color: #334155; }
            .text-slate-800 { color: #1e293b; }
            .text-slate-900 { color: #0f172a; }
            .text-teal-600 { color: #0d9488; }
            .text-teal-700 { color: #0f766e; }
            .text-teal-800 { color: #115e59; }
            .text-teal-900 { color: #134e4a; }
            .text-emerald-600 { color: #059669; }
            .tracking-tight { letter-spacing: -0.02em; }
            .tracking-wider { letter-spacing: 0.05em; }
            .tracking-widest { letter-spacing: 0.1em; }
            .uppercase { text-transform: uppercase; }
            table { width: 100%; border-collapse: collapse; margin-top: 10px; margin-bottom: 10px; }
            th, td { padding: 6px 8px; text-align: left; font-size: 11px; }
            th { border-bottom: 1px solid #cbd5e1; background: #f8fafc; }
            td { border-bottom: 1px solid #f1f5f9; }
            svg { display: inline-block; vertical-align: middle; }
            .w-4 { width: 16px; height: 16px; }
            .w-5 { width: 20px; height: 20px; }
            .w-20 { width: 70px; height: 70px; }
            .w-24 { width: 80px; height: 80px; }
            .h-24 { height: 80px; }
          </style>
        </head>
        <body>
          <div class="receipt-container">
            ${el.outerHTML}
          </div>
        </body>
      </html>
    `);
    doc.close();

    setTimeout(() => {
      iframe.contentWindow?.focus();
      iframe.contentWindow?.print();
    }, 250);
  };

  const handleCopyReceipt = () => {
    const text = `PARKPULSE RECEIPT\nReceipt No: ${receipt.receiptNo}\nVehicle: ${receipt.vehiclePlate}\nSlot: ${receipt.slotNumber}\nDuration: ${receipt.durationMinutes} mins\nTotal: ₹${receipt.totalAmount}\nStatus: ${receipt.paymentStatus}`;
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <>
      <Modal
        isOpen={isOpen}
        onClose={onClose}
        title="Parking Invoice & Payment Receipt"
        subtitle={`Receipt #${receipt.receiptNo} • Issued on ${new Date(receipt.issuedAt).toLocaleString()}`}
        maxWidth="2xl"
        footer={
          <div className="flex items-center justify-between w-full">
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => setPrintMode('thermal')}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all border ${
                  printMode === 'thermal'
                    ? 'bg-teal-700 text-white border-teal-800'
                    : 'bg-white text-slate-700 border-slate-200 hover:bg-slate-50'
                }`}
              >
                Thermal Slip (POS)
              </button>
              <button
                type="button"
                onClick={() => setPrintMode('a4')}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all border ${
                  printMode === 'a4'
                    ? 'bg-teal-700 text-white border-teal-800'
                    : 'bg-white text-slate-700 border-slate-200 hover:bg-slate-50'
                }`}
              >
                Standard Invoice (A4)
              </button>
            </div>

            <div className="flex items-center gap-2">
              <Button variant="outline" size="sm" onClick={handleCopyReceipt} leftIcon={copied ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}>
                {copied ? 'Copied!' : 'Copy Summary'}
              </Button>
              <Button variant="primary" size="sm" onClick={handlePrint} leftIcon={<Printer className="w-3.5 h-3.5" />}>
                Print Receipt
              </Button>
            </div>
          </div>
        }
      >
        <div className="flex justify-center p-2 bg-slate-100 rounded-2xl border border-slate-200">
          {printMode === 'thermal' ? (
            /* --- POS Thermal Slip 80mm Format --- */
            <div
              ref={printRef}
              id="printable-receipt"
              className="w-80 bg-white p-6 rounded-xl shadow-md border border-slate-200 font-mono text-slate-900 text-xs space-y-4"
            >
              {/* Header */}
              <div className="text-center space-y-1 border-b border-dashed border-slate-300 pb-3">
                <div className="flex items-center justify-center gap-1.5 text-teal-800 font-black text-base tracking-tight font-sans">
                  <Zap className="w-4 h-4 text-teal-600 fill-teal-600" />
                  <span>PARKPULSE SMART PARKING</span>
                </div>
                <p className="text-[10px] text-slate-500 font-sans">IoT Multi-Level Facility • Gate 01</p>
                <p className="text-[10px] text-slate-500 font-sans">GSTIN: 33AAAAA0000A1Z5</p>
                <div className="inline-block mt-1 px-2 py-0.5 bg-slate-100 rounded text-[10px] font-bold text-slate-700">
                  OFFICIAL TAX INVOICE / RECEIPT
                </div>
              </div>

              {/* Receipt Info */}
              <div className="space-y-1.5 border-b border-dashed border-slate-300 pb-3 text-[11px]">
                <div className="flex justify-between">
                  <span className="text-slate-500">Receipt No:</span>
                  <span className="font-bold">{receipt.receiptNo}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">Date & Time:</span>
                  <span>{new Date(receipt.issuedAt).toLocaleDateString()} {new Date(receipt.issuedAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">Operator:</span>
                  <span>{receipt.operatorName || 'System Admin'}</span>
                </div>
              </div>

              {/* Vehicle & Parking Details */}
              <div className="space-y-1.5 border-b border-dashed border-slate-300 pb-3 text-[11px]">
                <div className="flex justify-between items-center">
                  <span className="text-slate-500">Vehicle Plate:</span>
                  <span className="font-black text-sm px-1.5 py-0.5 bg-slate-100 rounded border border-slate-300 tracking-wider">
                    {receipt.vehiclePlate}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">Vehicle Type:</span>
                  <span>{receipt.vehicleType || 'Car'}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">Parking Bay:</span>
                  <span className="font-bold text-teal-700">Slot {receipt.slotNumber} ({receipt.areaName || 'Zone A'})</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">Entry Time:</span>
                  <span>{receipt.entryTime}</span>
                </div>
                {receipt.exitTime && (
                  <div className="flex justify-between">
                    <span className="text-slate-500">Exit Time:</span>
                    <span>{receipt.exitTime}</span>
                  </div>
                )}
                <div className="flex justify-between">
                  <span className="text-slate-500">Duration:</span>
                  <span className="font-bold">{receipt.durationMinutes} Minutes</span>
                </div>
              </div>

              {/* Bill Amount Breakdown */}
              <div className="space-y-1.5 border-b border-dashed border-slate-300 pb-3 text-[11px]">
                <div className="flex justify-between">
                  <span className="text-slate-500">Base Tariff (@₹{receipt.ratePerHour}/hr):</span>
                  <span>₹{receipt.baseAmount.toFixed(2)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">GST (18%):</span>
                  <span>₹{receipt.taxAmount.toFixed(2)}</span>
                </div>
                <div className="flex justify-between text-sm font-black pt-1 border-t border-slate-200">
                  <span>TOTAL PAID:</span>
                  <span className="text-teal-900">₹{receipt.totalAmount.toFixed(2)}</span>
                </div>
              </div>

              {/* Payment & Barcode QR */}
              <div className="text-center space-y-2 pt-1">
                <div className="flex items-center justify-between text-[11px]">
                  <span className="text-slate-500">Payment Mode:</span>
                  <span className="font-bold text-teal-700">{receipt.paymentMethod}</span>
                </div>
                <div className="flex items-center justify-between text-[11px]">
                  <span className="text-slate-500">Status:</span>
                  <span className="font-bold text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200">
                    PAID / VERIFIED
                  </span>
                </div>

                {/* Verification Barcode / QR Simulation */}
                <div className="pt-2 flex flex-col items-center">
                  <div className="w-24 h-24 p-1 border border-slate-300 rounded-lg flex items-center justify-center bg-slate-50">
                    <QrCode className="w-20 h-20 text-slate-800" />
                  </div>
                  <span className="text-[9px] text-slate-400 mt-1 font-mono tracking-widest uppercase">
                    SCAN AT EXIT BARRIER
                  </span>
                </div>

                <div className="text-[10px] text-slate-400 pt-2 border-t border-dashed border-slate-200">
                  Thank you for parking with ParkPulse!
                  <br />
                  For 24/7 Helpline: 1800-425-PARK
                </div>
              </div>
            </div>
          ) : (
            /* --- Standard A4 Tax Invoice Format --- */
            <div
              ref={printRef}
              id="printable-receipt"
              className="w-full bg-white p-8 rounded-xl shadow-md border border-slate-200 text-slate-900 text-xs space-y-6"
            >
              <div className="flex items-start justify-between border-b border-slate-200 pb-5">
                <div>
                  <div className="flex items-center gap-2 text-teal-800 font-black text-xl tracking-tight">
                    <Zap className="w-5 h-5 text-teal-600 fill-teal-600" />
                    <span>PARKPULSE IOT PARKING</span>
                  </div>
                  <p className="text-xs text-slate-500 mt-1">Smart Urban Mobility & Multi-Level Facility Solutions</p>
                  <p className="text-xs text-slate-500">GSTIN: 33AAAAA0000A1Z5 • State Code: 33</p>
                </div>

                <div className="text-right">
                  <span className="inline-block px-3 py-1 bg-teal-50 text-teal-800 font-extrabold text-xs rounded-full border border-teal-200">
                    TAX INVOICE
                  </span>
                  <p className="text-xs font-mono font-bold text-slate-800 mt-2">Invoice #: {receipt.receiptNo}</p>
                  <p className="text-[11px] text-slate-500">Date: {new Date(receipt.issuedAt).toLocaleDateString()}</p>
                </div>
              </div>

              {/* Customer & Vehicle Info Grid */}
              <div className="grid grid-cols-2 gap-6 bg-slate-50 p-4 rounded-xl border border-slate-100">
                <div className="space-y-1">
                  <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Customer / Driver</p>
                  <p className="font-bold text-slate-900 text-sm">{receipt.driverName || 'Guest User'}</p>
                  <p className="text-slate-500">{receipt.driverPhone || 'N/A'}</p>
                </div>

                <div className="space-y-1 text-right">
                  <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Vehicle & Location</p>
                  <p className="font-mono font-black text-slate-900 text-sm">{receipt.vehiclePlate}</p>
                  <p className="text-slate-600 font-semibold">Bay: Slot {receipt.slotNumber} ({receipt.areaName || 'Zone A'})</p>
                </div>
              </div>

              {/* Line Items Table */}
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="border-b border-slate-200 bg-slate-50 text-[11px] font-bold text-slate-500 uppercase">
                    <th className="py-2 px-3">Description</th>
                    <th className="py-2 px-3">Time Window</th>
                    <th className="py-2 px-3 text-center">Duration</th>
                    <th className="py-2 px-3 text-right">Rate</th>
                    <th className="py-2 px-3 text-right">Amount</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  <tr>
                    <td className="py-3 px-3 font-semibold text-slate-900">
                      Standard Parking Bay Access ({receipt.vehicleType || 'Car'})
                    </td>
                    <td className="py-3 px-3 text-slate-600">
                      {receipt.entryTime} {receipt.exitTime ? `— ${receipt.exitTime}` : ''}
                    </td>
                    <td className="py-3 px-3 text-center font-bold text-slate-800">
                      {receipt.durationMinutes} mins
                    </td>
                    <td className="py-3 px-3 text-right text-slate-600">
                      ₹{receipt.ratePerHour}/hr
                    </td>
                    <td className="py-3 px-3 text-right font-bold text-slate-900">
                      ₹{receipt.baseAmount.toFixed(2)}
                    </td>
                  </tr>
                </tbody>
              </table>

              {/* Total & Summary */}
              <div className="flex justify-between items-start pt-2 border-t border-slate-200">
                <div className="space-y-1">
                  <p className="text-xs font-semibold text-slate-700">Payment Details:</p>
                  <p className="text-xs text-slate-500">Method: <strong className="text-slate-800">{receipt.paymentMethod}</strong></p>
                  <p className="text-xs text-emerald-600 font-bold">Status: PAID / COMPLETED</p>
                </div>

                <div className="w-64 space-y-1.5 text-xs text-right">
                  <div className="flex justify-between text-slate-600">
                    <span>Subtotal:</span>
                    <span>₹{receipt.baseAmount.toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between text-slate-600">
                    <span>GST (18%):</span>
                    <span>₹{receipt.taxAmount.toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between text-base font-black text-slate-900 pt-2 border-t border-slate-200">
                    <span>Total Amount:</span>
                    <span className="text-teal-800">₹{receipt.totalAmount.toFixed(2)}</span>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </Modal>

      {/* Print Specific CSS */}
      <style jsx global>{`
        @media print {
          body * {
            visibility: hidden;
          }
          #printable-receipt,
          #printable-receipt * {
            visibility: visible;
          }
          #printable-receipt {
            position: absolute;
            left: 0;
            top: 0;
            width: 100% !important;
            margin: 0;
            padding: 10px;
            box-shadow: none !important;
            border: none !important;
          }
        }
      `}</style>
    </>
  );
};
