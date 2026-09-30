'use client';

import React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  LayoutDashboard,
  Car,
  MapPin,
  Grid,
  Radio,
  Clock,
  BarChart3,
  FileText,
  Settings,
  Layers,
  Zap,
  LogOut,
  ChevronRight,
  ExternalLink,
  CalendarCheck,
  Receipt,
} from 'lucide-react';
import { clsx } from 'clsx';
import { useParking } from '../../context/ParkingContext';

interface SidebarProps {
  mobileOpen?: boolean;
  onCloseMobile?: () => void;
}

export const Sidebar = ({ mobileOpen, onCloseMobile }: SidebarProps) => {
  const pathname = usePathname();
  const { summary, logout, currentUser } = useParking();

  const navGroups = [
    {
      groupTitle: 'OPERATIONS',
      items: [
        {
          label: 'Dashboard',
          href: '/dashboard',
          icon: <LayoutDashboard className="w-4 h-4 shrink-0" />,
        },
        {
          label: 'Live Bay Map',
          href: '/parking/live',
          icon: <MapPin className="w-4 h-4 shrink-0" />,
        },
        {
          label: 'Slot Reservations',
          href: '/parking/booking',
          icon: <CalendarCheck className="w-4 h-4 shrink-0" />,
        },
        {
          label: 'Parking Receipts',
          href: '/receipts',
          icon: <Receipt className="w-4 h-4 shrink-0" />,
        },
        {
          label: 'Active Sessions',
          href: '/sessions',
          icon: <Clock className="w-4 h-4 shrink-0" />,
        },
      ],
    },
    {
      groupTitle: 'FACILITY & IOT',
      items: [
        {
          label: 'Parking Areas',
          href: '/parking/areas',
          icon: <Layers className="w-4 h-4 shrink-0" />,
        },
        {
          label: 'Slot Registry',
          href: '/parking/slots',
          icon: <Grid className="w-4 h-4 shrink-0" />,
        },
        {
          label: 'Vehicles',
          href: '/vehicles',
          icon: <Car className="w-4 h-4 shrink-0" />,
        },
        {
          label: 'IoT Sensors',
          href: '/sensors',
          icon: <Radio className="w-4 h-4 shrink-0" />,
        },
      ],
    },
    {
      groupTitle: 'SYSTEM & INSIGHTS',
      items: [
        {
          label: 'Parking History',
          href: '/history',
          icon: <Clock className="w-4 h-4 shrink-0" />,
        },
        {
          label: 'Analytics',
          href: '/analytics',
          icon: <BarChart3 className="w-4 h-4 shrink-0" />,
        },
        {
          label: 'Reports',
          href: '/reports',
          icon: <FileText className="w-4 h-4 shrink-0" />,
        },
        // {
        //   label: 'Settings',
        //   href: '/settings',
        //   icon: <Settings className="w-4 h-4 shrink-0" />,
        // },
      ],
    },
  ];

  return (
    <>
      {/* Mobile Backdrop */}
      {mobileOpen && (
        <div
          className="fixed inset-0 z-40 bg-slate-950/70 backdrop-blur-xs lg:hidden"
          onClick={onCloseMobile}
        />
      )}

      {/* Sidebar Container */}
      <aside
        className={clsx(
          'fixed top-0 bottom-0 left-0 z-40 w-64 bg-slate-950 text-slate-300 flex flex-col border-r border-slate-800/80 transition-transform duration-200 ease-in-out lg:translate-x-0',
          mobileOpen ? 'translate-x-0' : '-translate-x-full'
        )}
      >
        {/* Brand Header */}
        <div className="h-16 px-5 flex items-center justify-between border-b border-slate-800/80 bg-slate-950">
          <Link href="/dashboard" className="flex items-center gap-2.5 group">
            <div className="w-8 h-8 rounded-lg bg-teal-500/10 border border-teal-500/30 flex items-center justify-center text-teal-400 group-hover:bg-teal-500 group-hover:text-slate-950 transition-all">
              <Zap className="w-4 h-4" />
            </div>
            <div className="flex flex-col">
              <span className="font-extrabold text-sm tracking-tight text-white">
                PARK<span className="text-teal-400">PULSE</span>
              </span>
              <span className="text-[10px] text-slate-500 font-medium">IoT Operations</span>
            </div>
          </Link>

          <span className="text-[10px] font-semibold px-1.5 py-0.5 rounded bg-slate-900 border border-slate-800 text-slate-400">
            v2.4
          </span>
        </div>

        {/* Navigation Groups */}
        <div className="flex-1 overflow-y-auto px-3 py-4 space-y-6">
          {navGroups.map((group, gIdx) => (
            <div key={gIdx} className="space-y-1">
              <p className="px-3 text-[10px] font-bold text-slate-500 tracking-wider uppercase">
                {group.groupTitle}
              </p>
              <div className="space-y-0.5 mt-1">
                {group.items.map((item, index) => {
                  const isActive = pathname === item.href;
                  return (
                    <Link
                      key={index}
                      href={item.href}
                      onClick={onCloseMobile}
                      className={clsx(
                        'flex items-center justify-between px-3 py-2 rounded-xl text-xs font-medium transition-all',
                        isActive
                          ? 'bg-teal-500/15 text-teal-300 font-semibold border border-teal-500/30 shadow-xs'
                          : 'text-slate-400 hover:text-slate-100 hover:bg-slate-900 border border-transparent'
                      )}
                    >
                      <div className="flex items-center gap-2.5 truncate">
                        <span className={isActive ? 'text-teal-400' : 'text-slate-400'}>
                          {item.icon}
                        </span>
                        <span className="truncate">{item.label}</span>
                      </div>
                    </Link>
                  );
                })}
              </div>
            </div>
          ))}
        </div>

        {/* Minimal User Profile & Sign Out Bar */}
        <div className="p-3 border-t border-slate-800/80 bg-slate-950">
          <div className="flex items-center justify-between p-2 rounded-xl bg-slate-900/80 border border-slate-800">
            <div className="flex items-center gap-2.5 truncate min-w-0">
              <div className="w-7 h-7 rounded-lg bg-teal-600 text-white font-bold text-xs flex items-center justify-center shrink-0">
                {currentUser?.name?.charAt(0) || 'A'}
              </div>
              <div className="truncate text-left">
                <p className="text-xs font-semibold text-slate-200 truncate leading-tight">
                  {currentUser?.name || 'Operator'}
                </p>
                <p className="text-[10px] text-slate-500 truncate leading-none">
                  {currentUser?.role || 'ADMIN'}
                </p>
              </div>
            </div>

            <button
              onClick={logout}
              title="Sign Out to Home"
              className="p-1.5 rounded-lg text-slate-400 hover:text-rose-400 hover:bg-rose-500/10 transition-colors shrink-0"
              aria-label="Sign Out"
            >
              <LogOut className="w-4 h-4" />
            </button>
          </div>
        </div>
      </aside>
    </>
  );
};
