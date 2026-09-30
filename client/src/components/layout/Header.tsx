'use client';

import React, { useState, useRef, useEffect } from 'react';
import { useParking } from '../../context/ParkingContext';
import Link from 'next/link';
import {
  Bell,
  Search,
  Volume2,
  VolumeX,
  Play,
  Pause,
  Zap,
  Radio,
  Clock,
  LogOut,
  User,
  CheckCheck,
  Menu,
  Home,
  ExternalLink,
  ChevronDown,
  Shield,
  Activity,
} from 'lucide-react';
import { usePathname } from 'next/navigation';

interface HeaderProps {
  onToggleMobileSidebar: () => void;
}

export const Header = ({ onToggleMobileSidebar }: HeaderProps) => {
  const {
    currentUser,
    unreadCount,
    notifications,
    isConnected,
    sensors,
    simulatorActive,
    toggleSimulator,
    markAllNotificationsRead,
    dismissNotification,
    clearAllNotifications,
    logout,
  } = useParking();

  const isOnline = isConnected && sensors.length > 0 && sensors.some(s => s.status === 'ONLINE');

  const pathname = usePathname();
  const [showNotifs, setShowNotifs] = useState(false);
  const [showUserMenu, setShowUserMenu] = useState(false);

  const notifRef = useRef<HTMLDivElement>(null);
  const userMenuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (notifRef.current && !notifRef.current.contains(event.target as Node)) {
        setShowNotifs(false);
      }
      if (userMenuRef.current && !userMenuRef.current.contains(event.target as Node)) {
        setShowUserMenu(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  // Derive human-readable page title
  const getPageTitle = () => {
    if (pathname === '/dashboard') return 'Operations Dashboard';
    if (pathname === '/parking/live') return 'Live 2D Bay Map';
    if (pathname === '/parking/areas') return 'Parking Areas & Zones';
    if (pathname === '/parking/slots') return 'Slot Configuration';
    if (pathname === '/vehicles') return 'Vehicle Registry';
    if (pathname === '/sessions') return 'Active Parking Sessions';
    if (pathname === '/sensors') return 'IoT Sensors Network';
    if (pathname === '/history') return 'Parking History Logs';
    if (pathname === '/receipts') return 'Parking Receipts & Invoicing';
    if (pathname === '/analytics') return 'Occupancy Analytics';
    if (pathname === '/reports') return 'Revenue & Audit Reports';
    if (pathname === '/settings') return 'System Settings';
    return 'Console';
  };

  return (
    <header className="sticky top-0 z-30 bg-white border-b border-slate-200/80 h-16 flex items-center justify-between px-4 lg:px-8">
      {/* Left: Mobile Trigger & Clean Title Breadcrumb */}
      <div className="flex items-center gap-3">
        <button
          onClick={onToggleMobileSidebar}
          className="lg:hidden p-2 rounded-lg text-slate-500 hover:bg-slate-100 hover:text-slate-800 transition-colors"
          aria-label="Toggle menu"
        >
          <Menu className="w-5 h-5" />
        </button>

        <div className="flex items-center gap-2.5">
          <h1 className="text-base sm:text-lg font-bold text-slate-900 tracking-tight">
            {getPageTitle()}
          </h1>
          <span className="hidden sm:inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-slate-100 text-slate-700 border border-slate-200">
            <span
              className={`w-1.5 h-1.5 rounded-full ${
                isOnline ? 'bg-emerald-500 animate-pulse' : 'bg-rose-500'
              }`}
            />
            <span>{isOnline ? 'Online' : 'Offline'}</span>
          </span>
        </div>
      </div>

      {/* Right Actions: Minimal & Modern */}
      <div className="flex items-center gap-2 sm:gap-3">
        {/* Notifications Dropdown - Only Slot Reservations */}
        <div className="relative" ref={notifRef}>
          <button
            onClick={() => {
              if (!showNotifs && unreadCount > 0) {
                markAllNotificationsRead();
              }
              setShowNotifs(!showNotifs);
            }}
            className="p-2 rounded-lg text-slate-600 hover:text-slate-900 hover:bg-slate-100 relative transition-colors"
            aria-label="Reservation Notifications"
            title={unreadCount > 0 ? `${unreadCount} new reservation notification(s)` : 'Reservation Notifications'}
          >
            <Bell className="w-4 h-4" />
            {unreadCount > 0 && (
              <span className="absolute top-1.5 right-1.5 flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
                <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500 ring-1 ring-white" />
              </span>
            )}
          </button>

          {showNotifs && (
            <div className="absolute right-0 mt-2 w-80 sm:w-96 rounded-2xl bg-white shadow-xl border border-slate-200 py-3 z-50 animate-in fade-in zoom-in-95">
              <div className="px-4 pb-2.5 border-b border-slate-100 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className="text-xs font-bold text-slate-900">Slot Reservation Alerts</span>
                  {unreadCount > 0 && (
                    <span className="px-1.5 py-0.2 bg-emerald-100 text-emerald-700 text-[10px] font-bold rounded-full border border-emerald-200">
                      {unreadCount} new
                    </span>
                  )}
                </div>
                <div className="flex items-center gap-2">
                  {notifications.length > 0 && (
                    <button
                      onClick={() => clearAllNotifications()}
                      className="text-[11px] text-teal-600 hover:text-teal-700 font-semibold"
                    >
                      Clear all
                    </button>
                  )}
                  <button
                    onClick={() => setShowNotifs(false)}
                    className="text-[11px] text-slate-400 hover:text-slate-600 font-medium"
                  >
                    Close
                  </button>
                </div>
              </div>
              <div className="max-h-80 overflow-y-auto divide-y divide-slate-100 text-xs">
                {notifications.length === 0 ? (
                  <div className="p-6 text-center">
                    <div className="w-10 h-10 mx-auto rounded-full bg-slate-100 flex items-center justify-center text-slate-400 mb-2">
                      <Bell className="w-5 h-5 text-slate-300" />
                    </div>
                    <p className="text-xs font-semibold text-slate-600">No slot reservations</p>
                    <p className="text-[11px] text-slate-400 mt-0.5">
                      New slot reservations will trigger real-time alerts here.
                    </p>
                  </div>
                ) : (
                  notifications.map(n => (
                    <div
                      key={n.id}
                      onClick={() => dismissNotification(n.id)}
                      className={`p-3.5 hover:bg-slate-50 cursor-pointer transition-colors group flex items-start justify-between gap-3 ${
                        !n.isRead ? 'bg-emerald-50/40' : ''
                      }`}
                      title="Click to dismiss"
                    >
                      <div className="flex items-start gap-2.5">
                        <span className="w-2 h-2 rounded-full bg-emerald-500 shadow-[0_0_6px_#10b981] mt-1.5 shrink-0" />
                        <div>
                          <div className="flex items-center gap-1.5">
                            <p className="font-bold text-slate-900 group-hover:text-emerald-700 transition-colors">
                              {n.title}
                            </p>
                            {!n.isRead && (
                              <span className="px-1.5 py-0.2 rounded bg-emerald-100 text-emerald-800 text-[9px] font-bold">
                                NEW
                              </span>
                            )}
                          </div>
                          <p className="text-slate-600 text-[11px] mt-0.5 leading-relaxed">{n.message}</p>
                          <p className="text-[10px] text-slate-400 mt-1 font-medium">
                            {new Date(n.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                          </p>
                        </div>
                      </div>
                      <span className="text-[10px] text-slate-300 group-hover:text-slate-600 font-bold shrink-0 mt-0.5 p-1 hover:bg-slate-200 rounded">
                        ✕
                      </span>
                    </div>
                  ))
                )}
              </div>
            </div>
          )}
        </div>

        {/* Clean Divider */}
        <div className="h-5 w-px bg-slate-200 mx-1 hidden sm:block" />

        {/* User Profile Pill */}
        <div className="relative" ref={userMenuRef}>
          <button
            onClick={() => setShowUserMenu(!showUserMenu)}
            className="flex items-center gap-2.5 p-1.5 pl-2 sm:pr-3 rounded-xl hover:bg-slate-100 transition-colors border border-transparent hover:border-slate-200"
          >
            <div className="w-8 h-8 rounded-lg bg-teal-600 text-white font-bold text-xs flex items-center justify-center shadow-xs">
              {currentUser?.name?.charAt(0) || 'A'}
            </div>
            <div className="hidden sm:flex flex-col text-left">
              <span className="text-xs font-bold text-slate-800 leading-tight">
                {currentUser?.name || 'Admin'}
              </span>
              <span className="text-[10px] text-slate-500 font-medium leading-none">
                {currentUser?.role || 'OPERATOR'}
              </span>
            </div>
            <ChevronDown className="w-3.5 h-3.5 text-slate-400 hidden sm:block" />
          </button>

          {showUserMenu && (
            <div className="absolute right-0 mt-2 w-56 rounded-2xl bg-white shadow-xl border border-slate-200 py-1.5 z-50 text-xs text-slate-700 animate-in fade-in zoom-in-95">
              <div className="px-4 py-2.5 border-b border-slate-100">
                <p className="font-bold text-slate-900">{currentUser?.name}</p>
                <p className="text-slate-400 text-[11px] truncate">{currentUser?.email}</p>
              </div>
              {/* <div className="py-1">
                <Link
                  href="/settings"
                  onClick={() => setShowUserMenu(false)}
                  className="flex items-center gap-2 px-4 py-2 hover:bg-slate-50 text-slate-700"
                >
                  <User className="w-3.5 h-3.5 text-slate-400" />
                  <span>Account Settings</span>
                </Link>
              </div> */}
              <div className="border-t border-slate-100 pt-1">
                <button
                  onClick={() => {
                    setShowUserMenu(false);
                    logout();
                  }}
                  className="w-full flex items-center gap-2 px-4 py-2 hover:bg-rose-50 text-rose-600 font-semibold"
                >
                  <LogOut className="w-3.5 h-3.5" />
                  <span>Sign Out</span>
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </header>
  );
};
