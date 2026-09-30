'use client';

import React, { useState, useEffect, ReactNode } from 'react';
import { Sidebar } from './Sidebar';
import { Header } from './Header';
import { ToastContainer } from '../common/Toast';
import { usePathname, useRouter } from 'next/navigation';
import { useParking } from '../../context/ParkingContext';

export const AppLayout = ({ children }: { children: ReactNode }) => {
  const [mobileSidebarOpen, setMobileSidebarOpen] = useState(false);
  const pathname = usePathname();
  const router = useRouter();
  const { currentUser, isLoading } = useParking();

  // Route protection: If visiting console routes without being logged in, redirect to /login
  useEffect(() => {
    if (!isLoading && !currentUser && pathname !== '/' && pathname !== '/home' && pathname !== '/login') {
      router.push('/login');
    }
  }, [currentUser, isLoading, pathname, router]);

  // If on login page, render standalone full-screen layout
  if (pathname === '/login') {
    return (
      <main className="min-h-screen bg-slate-950 flex items-center justify-center p-3 sm:p-6 lg:p-10 relative overflow-hidden selection:bg-teal-500 selection:text-white">
        {children}
        <ToastContainer />
      </main>
    );
  }

  // If on Home landing / overview page, render full-width immersive landing page layout
  if (pathname === '/' || pathname === '/home') {
    return (
      <div className="min-h-screen bg-slate-900 text-slate-100 antialiased selection:bg-teal-500 selection:text-white">
        {children}
        <ToastContainer />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 flex text-slate-900 antialiased selection:bg-teal-600 selection:text-white">
      {/* Sidebar */}
      <Sidebar
        mobileOpen={mobileSidebarOpen}
        onCloseMobile={() => setMobileSidebarOpen(false)}
      />

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col min-w-0 lg:pl-64 transition-all duration-200">
        <Header onToggleMobileSidebar={() => setMobileSidebarOpen(!mobileSidebarOpen)} />

        <main className="flex-1 p-4 sm:p-6 lg:p-8 max-w-[1600px] w-full mx-auto">
          {children}
        </main>

        <footer className="py-4 px-6 border-t border-slate-200 text-center text-xs text-slate-500 bg-white">
          <p>© 2026 Smart Parking Management System • IoT ESP32 Telemetry Platform</p>
        </footer>
      </div>

      {/* Global Toast Alerts */}
      <ToastContainer />
    </div>
  );
};
