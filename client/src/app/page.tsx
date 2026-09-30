'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import {
  Zap,
  Car,
  CheckCircle2,
  AlertCircle,
  Clock,
  ArrowRight,
  TrendingUp,
  Layers,
  Activity,
  Shield,
  ShieldCheck,
  Cpu,
  Wifi,
  Server,
  Lock,
  LogIn,
  Sparkles,
  ChevronRight,
  HelpCircle,
  Check,
  BarChart3,
  MapPin,
  Building2,
  FileCheck,
  Fuel,
  Radio,
  Sliders,
  Receipt,
  Eye,
  Monitor,
  HardDrive,
  RefreshCw,
  Terminal,
  Play,
  Award,
  Menu,
  X,
} from 'lucide-react';

export default function HomePage() {
  const [activeFaq, setActiveFaq] = useState<number | null>(0);
  const [activeTab, setActiveTab] = useState<'video' | 'cctv' | 'bays'>('video');
  const [heroWidgetTab, setHeroWidgetTab] = useState<'interactive' | 'camera'>('interactive');
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [scrollY, setScrollY] = useState(0);
  const [scrollProgress, setScrollProgress] = useState(0);

  // Interactive sample parking bays in Hero Widget
  const heroSlots = [
    { id: '1', code: 'A-01', type: 'STANDARD', status: 'AVAILABLE', rate: 20, distance: '192 cm', floor: 'Deck 1' },
    { id: '2', code: 'A-02', type: 'STANDARD', status: 'OCCUPIED', rate: 20, distance: '38 cm', vehicle: 'TN-37-8899', duration: '42m', floor: 'Deck 1' },
    { id: '3', code: 'A-03', type: 'EV FAST CHARGE', status: 'AVAILABLE', rate: 40, distance: '185 cm', floor: 'Deck 1' },
    { id: '4', code: 'A-04', type: 'STANDARD', status: 'AVAILABLE', rate: 20, distance: '190 cm', floor: 'Deck 1' },
    { id: '5', code: 'A-05', type: 'STANDARD', status: 'OCCUPIED', rate: 20, distance: '41 cm', vehicle: 'KA-01-4421', duration: '1h 15m', floor: 'Deck 1' },
    { id: '6', code: 'A-06', type: 'VIP RESERVED', status: 'RESERVED', rate: 50, distance: '188 cm', vehicle: 'DL-04-9002', duration: '2h 00m', floor: 'Deck 1' },
  ];

  const [selectedSlot, setSelectedSlot] = useState(heroSlots[0]);

  // Parallax and scroll listener
  useEffect(() => {
    let ticking = false;
    const handleScroll = () => {
      if (!ticking) {
        window.requestAnimationFrame(() => {
          const currentScrollY = window.scrollY;
          setScrollY(currentScrollY);
          const totalHeight = document.documentElement.scrollHeight - window.innerHeight;
          setScrollProgress(totalHeight > 0 ? (currentScrollY / totalHeight) * 100 : 0);
          ticking = false;
        });
        ticking = true;
      }
    };

    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  // Intersection Observer for scroll-reveal animations
  useEffect(() => {
    const observerCallback: IntersectionObserverCallback = (entries, observer) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          entry.target.classList.add('opacity-100', 'translate-y-0');
          entry.target.classList.remove('opacity-0', 'translate-y-8');
          observer.unobserve(entry.target);
        }
      });
    };

    const observer = new IntersectionObserver(observerCallback, {
      threshold: 0.15,
      rootMargin: '0px 0px -50px 0px',
    });

    const revealElements = document.querySelectorAll('.scroll-reveal');
    revealElements.forEach((el) => observer.observe(el));

    return () => observer.disconnect();
  }, []);

  const faqs = [
    {
      q: 'What makes ParkPulse IoT different from traditional parking systems?',
      a: 'ParkPulse bridges physical IoT hardware with cloud intelligence. Unlike manual paper tokens or simple barrier gates, ParkPulse integrates directly with ESP32 edge microcontrollers and HC-SR04 ultrasonic sensors above every bay. Vehicle detection happens in under 150ms, driving overhead LED guidance, real-time 2D UI updates via WebSockets, and state-transition-only database logging.',
    },
    {
      q: 'How does the hardware sensor mesh communicate with the platform?',
      a: 'Overhead HC-SR04 ultrasonic sensors measure distance to determine vehicle presence. An ESP32 edge controller processes pulse timings, switches green/red status LEDs, and relays telemetry payloads to our Node.js backend bridge with automatic port recovery.',
    },
    {
      q: 'What operational capabilities are provided for parking facility operators?',
      a: 'Facility operators enjoy an end-to-end Command Center including live multi-deck 2D bay occupancy maps, vehicle check-in/check-out timers, automated tariff calculation, instant thermal receipt generation with print formatting, hourly occupancy trajectory charts, and sensor heartbeat diagnostics.',
    },
    {
      q: 'Can the platform support multi-level facilities with specialized bay types?',
      a: 'Yes. ParkPulse supports multi-deck configurations (Basements, Ground, Multi-Floor Decks), zone categorization, and specialized bay designations like EV Fast Charging, Handicap Accessible, and VIP Reserved spaces with customized pricing rules.',
    },
    {
      q: 'What is the underlying technology stack of the ParkPulse platform?',
      a: 'The frontend is engineered with Next.js 15, React 19, TypeScript, and TailwindCSS for sub-second UI responsiveness. The backend utilizes Node.js, Express.js, Socket.IO WebSockets, Prisma ORM, and a PostgreSQL database with automated state-transition tracking.',
    },
  ];

  return (
    <div className="min-h-screen bg-slate-50 text-slate-800 selection:bg-blue-600 selection:text-white font-sans antialiased overflow-x-clip relative">
      {/* Top Scroll Reading Progress Bar */}
      <div
        className="fixed top-0 left-0 h-1 bg-gradient-to-r from-blue-600 via-indigo-600 to-blue-500 z-[100] transition-all duration-150 ease-out"
        style={{ width: `${scrollProgress}%` }}
      />

      {/* ========================================================================= */}
      {/* 1. PERMANENT STICKY FLOATING CAPSULE NAVBAR WITH MOBILE OVERLAY DRAWER */}
      {/* ========================================================================= */}
      <div className="sticky top-0 z-50 w-full pt-3 pb-2 transition-all duration-300 pointer-events-none">
        <header className="max-w-6xl mx-auto px-3 sm:px-6 pointer-events-auto relative">
          <div className="backdrop-blur-2xl bg-white/95 border border-slate-200/90 shadow-[0_8px_30px_rgba(0,0,0,0.06)] rounded-full px-4 sm:px-5 py-2 sm:py-2.5 flex items-center justify-between gap-3 transition-all duration-300">
            
            {/* Brand Logo */}
            <Link href="/" className="flex items-center gap-2.5 shrink-0 group">
              <div className="w-8 h-8 sm:w-9 sm:h-9 rounded-full bg-gradient-to-tr from-blue-600 via-indigo-600 to-cyan-500 flex items-center justify-center text-white shadow-md shadow-blue-500/25 group-hover:scale-105 transition-all duration-300">
                <Zap className="w-3.5 h-3.5 sm:w-4 sm:h-4 fill-current" />
              </div>
              <div className="flex items-center gap-1.5 sm:gap-2">
                <span className="font-extrabold text-sm sm:text-base tracking-tight text-slate-900">
                  PARK<span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-600 to-indigo-600">PULSE</span>
                </span>
                <span className="text-[8px] sm:text-[9px] font-bold px-1.5 sm:px-2 py-0.5 rounded-full bg-blue-50 text-blue-700 border border-blue-200/80 tracking-wide uppercase">
                  IoT 2.0
                </span>
              </div>
            </Link>

            {/* Desktop Navigation Links */}
            <nav className="hidden lg:flex items-center gap-1 bg-slate-100/80 p-1 rounded-full border border-slate-200/60">
              <a href="#telemetry" className="px-3.5 py-1.5 rounded-full text-xs font-semibold text-slate-600 hover:text-blue-600 hover:bg-white hover:shadow-xs transition-all duration-200">
                Live Telemetry
              </a>
              <a href="#about" className="px-3.5 py-1.5 rounded-full text-xs font-semibold text-slate-600 hover:text-blue-600 hover:bg-white hover:shadow-xs transition-all duration-200">
                Overview
              </a>
              <a href="#capabilities" className="px-3.5 py-1.5 rounded-full text-xs font-semibold text-slate-600 hover:text-blue-600 hover:bg-white hover:shadow-xs transition-all duration-200">
                Capabilities
              </a>
              <a href="#workflow" className="px-3.5 py-1.5 rounded-full text-xs font-semibold text-slate-600 hover:text-blue-600 hover:bg-white hover:shadow-xs transition-all duration-200">
                Workflow
              </a>
              <a href="#architecture" className="px-3.5 py-1.5 rounded-full text-xs font-semibold text-slate-600 hover:text-blue-600 hover:bg-white hover:shadow-xs transition-all duration-200">
                Architecture
              </a>
              <a href="#verticals" className="px-3.5 py-1.5 rounded-full text-xs font-semibold text-slate-600 hover:text-blue-600 hover:bg-white hover:shadow-xs transition-all duration-200">
                Industries
              </a>
              <a href="#faq" className="px-3.5 py-1.5 rounded-full text-xs font-semibold text-slate-600 hover:text-blue-600 hover:bg-white hover:shadow-xs transition-all duration-200">
                FAQ
              </a>
            </nav>

            {/* Action Area: Login Button & Mobile Menu Toggle */}
            <div className="flex items-center gap-2 sm:gap-3 shrink-0">
              <Link
                href="/login"
                className="inline-flex items-center gap-1.5 sm:gap-2 px-3.5 sm:px-4 py-1.5 sm:py-2 rounded-full text-xs font-bold text-white bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 shadow-md shadow-blue-500/25 transition-all duration-200 active:scale-95 hover:scale-105"
              >
                <LogIn className="w-3 h-3 sm:w-3.5 sm:h-3.5" />
                <span>Login</span>
              </Link>

              {/* Mobile Hamburger Button */}
              <button
                onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
                className="lg:hidden p-2 rounded-full bg-slate-100 text-slate-700 hover:text-blue-600 hover:bg-slate-200 transition-colors focus:outline-hidden"
                aria-label="Toggle navigation menu"
              >
                {mobileMenuOpen ? <X className="w-4 h-4" /> : <Menu className="w-4 h-4" />}
              </button>
            </div>
          </div>

          {/* Floating Absolute Mobile Drawer (Overlay on top of content) */}
          {mobileMenuOpen && (
            <div className="lg:hidden absolute top-full left-3 right-3 sm:left-6 sm:right-6 mt-2 p-3 sm:p-4 rounded-3xl bg-white/98 backdrop-blur-2xl border border-slate-200/90 shadow-[0_20px_60px_rgba(0,0,0,0.18)] z-50 space-y-1 animate-fadeIn">
              <nav className="flex flex-col gap-1">
                <a
                  href="#telemetry"
                  onClick={() => setMobileMenuOpen(false)}
                  className="px-4 py-2.5 rounded-2xl text-xs font-bold text-slate-700 hover:bg-blue-50 hover:text-blue-600 transition-colors flex items-center justify-between"
                >
                  <span>Live Telemetry</span>
                  <ChevronRight className="w-3.5 h-3.5 text-slate-400" />
                </a>
                <a
                  href="#about"
                  onClick={() => setMobileMenuOpen(false)}
                  className="px-4 py-2.5 rounded-2xl text-xs font-bold text-slate-700 hover:bg-blue-50 hover:text-blue-600 transition-colors flex items-center justify-between"
                >
                  <span>Overview</span>
                  <ChevronRight className="w-3.5 h-3.5 text-slate-400" />
                </a>
                <a
                  href="#capabilities"
                  onClick={() => setMobileMenuOpen(false)}
                  className="px-4 py-2.5 rounded-2xl text-xs font-bold text-slate-700 hover:bg-blue-50 hover:text-blue-600 transition-colors flex items-center justify-between"
                >
                  <span>Capabilities</span>
                  <ChevronRight className="w-3.5 h-3.5 text-slate-400" />
                </a>
                <a
                  href="#workflow"
                  onClick={() => setMobileMenuOpen(false)}
                  className="px-4 py-2.5 rounded-2xl text-xs font-bold text-slate-700 hover:bg-blue-50 hover:text-blue-600 transition-colors flex items-center justify-between"
                >
                  <span>Workflow</span>
                  <ChevronRight className="w-3.5 h-3.5 text-slate-400" />
                </a>
                <a
                  href="#architecture"
                  onClick={() => setMobileMenuOpen(false)}
                  className="px-4 py-2.5 rounded-2xl text-xs font-bold text-slate-700 hover:bg-blue-50 hover:text-blue-600 transition-colors flex items-center justify-between"
                >
                  <span>Architecture</span>
                  <ChevronRight className="w-3.5 h-3.5 text-slate-400" />
                </a>
                <a
                  href="#verticals"
                  onClick={() => setMobileMenuOpen(false)}
                  className="px-4 py-2.5 rounded-2xl text-xs font-bold text-slate-700 hover:bg-blue-50 hover:text-blue-600 transition-colors flex items-center justify-between"
                >
                  <span>Industries</span>
                  <ChevronRight className="w-3.5 h-3.5 text-slate-400" />
                </a>
                <a
                  href="#faq"
                  onClick={() => setMobileMenuOpen(false)}
                  className="px-4 py-2.5 rounded-2xl text-xs font-bold text-slate-700 hover:bg-blue-50 hover:text-blue-600 transition-colors flex items-center justify-between"
                >
                  <span>FAQ</span>
                  <ChevronRight className="w-3.5 h-3.5 text-slate-400" />
                </a>
              </nav>
            </div>
          )}
        </header>
      </div>

      {/* ========================================================================= */}
      {/* 2. FULLY RESPONSIVE WHITE THEME SAAS HERO BANNER */}
      {/* ========================================================================= */}
      <section className="relative pt-6 sm:pt-12 pb-14 sm:pb-20 bg-gradient-to-b from-white via-slate-50 to-slate-100/70 border-b border-slate-200 overflow-hidden">
        {/* Soft Ambient Light Glow Spheres */}
        <div
          className="absolute top-0 left-1/3 -translate-x-1/2 w-[350px] sm:w-[850px] h-[300px] sm:h-[450px] bg-gradient-to-b from-blue-100/70 via-indigo-100/40 to-transparent blur-[100px] sm:blur-[140px] pointer-events-none rounded-full"
          style={{ transform: `translate(-50%, ${scrollY * 0.15}px)` }}
        />

        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-10 items-center">
            
            {/* Left Column: Heading, Value Props & Actions */}
            <div className="lg:col-span-6 space-y-4 sm:space-y-6 text-left">
              {/* Main Heading */}
              <h1 className="text-2xl sm:text-4xl lg:text-[3.25rem] font-extrabold tracking-tight text-slate-900 leading-[1.18] sm:leading-[1.14]">
                Intelligent Parking Automation for{' '}
                <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-600 via-indigo-600 to-blue-500">
                  Modern Facilities
                </span>
              </h1>

              {/* Subtitle */}
              <p className="text-xs sm:text-sm md:text-base text-slate-600 leading-relaxed font-normal max-w-xl">
                Autonomous vehicle detection, live 2D bay occupancy tracking, and automated tariff duration billing with ESP32 edge intelligence.
              </p>

              {/* Single Action Button */}
              <div className="pt-1 sm:pt-2 flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
                <Link
                  href="/login"
                  className="inline-flex items-center justify-center gap-2.5 px-6 sm:px-7 py-3 sm:py-3.5 rounded-xl font-bold text-xs sm:text-sm text-white bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 shadow-md shadow-blue-500/25 transition-all duration-200 active:scale-95 hover:translate-y-[-2px] hover:shadow-lg hover:shadow-blue-500/30 text-center"
                >
                  <Monitor className="w-4 h-4 shrink-0" />
                  <span>Launch Operations Console</span>
                  <ChevronRight className="w-4 h-4 shrink-0" />
                </Link>
              </div>
            </div>

            {/* Right Column: Interactive Live Parking Slot Selector Widget */}
            <div className="lg:col-span-6">
              <div className="relative rounded-3xl p-4 sm:p-6 bg-white border border-slate-200/90 shadow-[0_15px_40px_rgba(0,0,0,0.06)] transition-all duration-300">
                
                {/* Widget Header & Switcher */}
                <div className="flex flex-wrap items-center justify-between gap-2 pb-3.5 border-b border-slate-100">
                  <div className="flex items-center gap-2">
                    <span className="relative flex h-2.5 w-2.5">
                      <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                      <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-emerald-500"></span>
                    </span>
                    <div>
                      <h3 className="text-xs sm:text-sm font-extrabold text-slate-900">
                        Live Bay Occupancy Matrix
                      </h3>
                      <p className="text-[10px] text-slate-400 font-medium">Deck 1 • 4 Vacant / 2 Occupied</p>
                    </div>
                  </div>

                  {/* Toggle Mode Button */}
                  <div className="flex p-0.5 sm:p-1 rounded-xl bg-slate-100 border border-slate-200 text-[10px] sm:text-[11px] font-bold shrink-0">
                    <button
                      onClick={() => setHeroWidgetTab('interactive')}
                      className={`px-2.5 sm:px-3 py-1 rounded-lg transition-all ${
                        heroWidgetTab === 'interactive'
                          ? 'bg-blue-600 text-white shadow-xs'
                          : 'text-slate-600 hover:text-slate-900'
                      }`}
                    >
                      Bay Grid
                    </button>
                    <button
                      onClick={() => setHeroWidgetTab('camera')}
                      className={`px-2.5 sm:px-3 py-1 rounded-lg transition-all ${
                        heroWidgetTab === 'camera'
                          ? 'bg-blue-600 text-white shadow-xs'
                          : 'text-slate-600 hover:text-slate-900'
                      }`}
                    >
                      Camera View
                    </button>
                  </div>
                </div>

                {/* Tab 1: Interactive Slot Grid */}
                {heroWidgetTab === 'interactive' ? (
                  <div className="space-y-3.5 pt-3.5">
                    {/* Responsive Slot Matrix (2 cols on small mobile, 3 cols on tablet/desktop) */}
                    <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 sm:gap-2.5">
                      {heroSlots.map((slot) => {
                        const isSelected = selectedSlot.id === slot.id;
                        const isOccupied = slot.status === 'OCCUPIED';
                        const isReserved = slot.status === 'RESERVED';

                        return (
                          <button
                            key={slot.id}
                            onClick={() => setSelectedSlot(slot)}
                            className={`p-2.5 sm:p-3 rounded-xl sm:rounded-2xl border text-left transition-all duration-200 cursor-pointer relative ${
                              isSelected
                                ? 'bg-blue-50/90 border-blue-500 ring-2 ring-blue-500/20 shadow-sm scale-[1.02]'
                                : isOccupied
                                ? 'bg-rose-50/60 border-rose-200/80 hover:border-rose-300'
                                : isReserved
                                ? 'bg-amber-50/60 border-amber-200/80 hover:border-amber-300'
                                : 'bg-emerald-50/60 border-emerald-200/80 hover:border-emerald-300'
                            }`}
                          >
                            <div className="flex items-center justify-between mb-1">
                              <span className="text-xs font-black text-slate-900 font-mono">{slot.code}</span>
                              <span
                                className={`w-2 h-2 rounded-full ${
                                  isOccupied
                                    ? 'bg-rose-500'
                                    : isReserved
                                    ? 'bg-amber-500'
                                    : 'bg-emerald-500 animate-pulse'
                                }`}
                              />
                            </div>

                            <p
                              className={`text-[9px] sm:text-[10px] font-bold ${
                                isOccupied
                                  ? 'text-rose-700'
                                  : isReserved
                                  ? 'text-amber-700'
                                  : 'text-emerald-700'
                              }`}
                            >
                              {slot.status}
                            </p>

                            <p className="text-[8px] sm:text-[9px] text-slate-500 font-mono mt-0.5 truncate">
                              {isOccupied ? slot.vehicle : slot.distance}
                            </p>
                          </button>
                        );
                      })}
                    </div>

                    {/* Live Inspector Box for Selected Slot */}
                    <div className="p-3 sm:p-4 rounded-xl sm:rounded-2xl bg-slate-900 text-white space-y-2.5 sm:space-y-3 shadow-md">
                      <div className="flex items-center justify-between text-xs gap-2">
                        <div className="flex items-center gap-1.5 sm:gap-2">
                          <span className="font-mono font-bold text-teal-400 text-xs sm:text-sm">{selectedSlot.code}</span>
                          <span className="px-1.5 sm:px-2 py-0.5 rounded-full bg-slate-800 border border-slate-700 text-[9px] sm:text-[10px] text-slate-300">
                            {selectedSlot.type}
                          </span>
                        </div>
                        <span className="text-[10px] sm:text-[11px] font-mono text-emerald-400 font-bold shrink-0">Rate: ₹{selectedSlot.rate}/hr</span>
                      </div>

                      <div className="grid grid-cols-2 gap-2 text-[10px] sm:text-[11px] font-mono border-t border-slate-800 pt-2 text-slate-300">
                        <div>
                          <p className="text-[8px] sm:text-[9px] text-slate-400 uppercase">Distance Pulse</p>
                          <p className="font-bold text-white mt-0.5">{selectedSlot.distance}</p>
                        </div>
                        <div>
                          <p className="text-[8px] sm:text-[9px] text-slate-400 uppercase">Live State</p>
                          <p
                            className={`font-bold mt-0.5 truncate ${
                              selectedSlot.status === 'OCCUPIED'
                                ? 'text-rose-400'
                                : selectedSlot.status === 'RESERVED'
                                ? 'text-amber-400'
                                : 'text-emerald-400'
                            }`}
                          >
                            {selectedSlot.status === 'OCCUPIED'
                              ? `Occupied (${selectedSlot.vehicle})`
                              : selectedSlot.status === 'RESERVED'
                              ? 'Reserved (VIP)'
                              : 'Clear (Available)'}
                          </p>
                        </div>
                      </div>

                      <div className="pt-1 flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-2">
                        <span className="text-[9px] sm:text-[10px] text-slate-400 font-mono flex items-center gap-1.5">
                          <Cpu className="w-3 h-3 text-blue-400 shrink-0" />
                          ESP32 Sensor: Online
                        </span>
                        <Link
                          href="/login"
                          className="px-3 py-1.5 rounded-lg bg-blue-600 hover:bg-blue-500 text-white text-[10px] sm:text-[11px] font-bold transition-all flex items-center justify-center gap-1 shadow-xs text-center"
                        >
                          <span>Manage Bay</span>
                          <ChevronRight className="w-3 h-3" />
                        </Link>
                      </div>
                    </div>
                  </div>
                ) : (
                  /* Tab 2: Facility Camera View */
                  <div className="pt-3.5 space-y-3">
                    <div className="relative rounded-2xl overflow-hidden aspect-video bg-slate-950 border border-slate-200">
                      <img
                        src="/images/banner-img.png"
                        alt="Facility Bay Guidance"
                        className="w-full h-full object-cover"
                      />
                      <div className="absolute inset-0 bg-gradient-to-t from-slate-950/80 via-transparent to-transparent flex items-end p-2.5 sm:p-3">
                        <div className="text-white text-[10px] sm:text-xs font-mono flex items-center justify-between w-full">
                          <span>Overhead Array: Active</span>
                          <span className="text-emerald-400 font-bold">&lt;150ms Latency</span>
                        </div>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </div>

          </div>
        </div>
      </section>

      {/* ========================================================================= */}
      {/* 3. HARDWARE & VISION COMMAND CENTER */}
      {/* ========================================================================= */}
      <section id="telemetry" className="py-14 sm:py-20 bg-white border-b border-slate-200 relative">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-3xl mx-auto mb-8 sm:mb-12 scroll-reveal opacity-0 translate-y-8 transition-all duration-700 ease-out">
            <span className="text-xs font-bold text-blue-700 tracking-widest uppercase bg-blue-50 px-3.5 py-1.5 rounded-full border border-blue-200">
              Live Hardware Demonstration
            </span>
            <h2 className="text-xl sm:text-3xl lg:text-4xl font-extrabold text-slate-900 mt-3">
              Unified Physical & Digital Telemetry
            </h2>
            <p className="text-xs sm:text-sm text-slate-600 mt-2.5">
              Real-time synchronization between multi-deck parking bays, overhead green/red guidance LEDs, and CCTV surveillance intelligence.
            </p>
          </div>

          {/* Interactive Switch Tabs */}
          <div className="flex justify-center mb-6 sm:mb-8 scroll-reveal opacity-0 translate-y-8 transition-all duration-700 ease-out delay-100">
            <div className="inline-flex flex-wrap justify-center p-1 rounded-2xl bg-slate-100 border border-slate-200 gap-1">
              <button
                onClick={() => setActiveTab('video')}
                className={`px-3 sm:px-4 py-1.5 sm:py-2 rounded-xl text-xs font-bold transition-all duration-200 flex items-center gap-1.5 ${
                  activeTab === 'video'
                    ? 'bg-blue-600 text-white shadow-sm scale-105'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                <Play className="w-3.5 h-3.5 shrink-0" />
                <span>Camera Feed</span>
              </button>
              <button
                onClick={() => setActiveTab('bays')}
                className={`px-3 sm:px-4 py-1.5 sm:py-2 rounded-xl text-xs font-bold transition-all duration-200 flex items-center gap-1.5 ${
                  activeTab === 'bays'
                    ? 'bg-blue-600 text-white shadow-sm scale-105'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                <Layers className="w-3.5 h-3.5 shrink-0" />
                <span>Bay Guidance</span>
              </button>
              <button
                onClick={() => setActiveTab('cctv')}
                className={`px-3 sm:px-4 py-1.5 sm:py-2 rounded-xl text-xs font-bold transition-all duration-200 flex items-center gap-1.5 ${
                  activeTab === 'cctv'
                    ? 'bg-blue-600 text-white shadow-sm scale-105'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                <Monitor className="w-3.5 h-3.5 shrink-0" />
                <span>Surveillance Wall</span>
              </button>
            </div>
          </div>

          {/* Tab Content Display */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 sm:gap-8 items-center">
            {/* Visual Container */}
            <div className="lg:col-span-8 scroll-reveal opacity-0 translate-y-8 transition-all duration-700 ease-out delay-150">
              <div className="relative rounded-2xl sm:rounded-3xl overflow-hidden border border-slate-200 bg-slate-950 shadow-xl group">
                {activeTab === 'video' && (
                  <div className="relative aspect-video w-full bg-black">
                    <video
                      autoPlay
                      loop
                      muted
                      playsInline
                      className="w-full h-full object-cover"
                    >
                      <source src="/images/video-1.mp4" type="video/mp4" />
                    </video>
                    <div className="absolute top-3 left-3 sm:top-4 sm:left-4 px-2.5 py-1 rounded-lg bg-black/75 backdrop-blur-md border border-slate-700 text-[10px] sm:text-xs font-mono text-blue-300">
                      LIVE SENSOR STREAM: ACTIVE
                    </div>
                  </div>
                )}

                {activeTab === 'bays' && (
                  <div className="relative aspect-video w-full bg-slate-950 flex items-center justify-center overflow-hidden">
                    <img
                      src="/images/banner-img.png"
                      alt="Multi-Deck Smart Parking Facility with Overhead LED Guidance"
                      className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-slate-950/80 via-transparent to-transparent pointer-events-none" />
                    <div className="absolute bottom-3 left-3 right-3 sm:bottom-4 sm:left-4 sm:right-4 flex justify-between items-center text-[10px] sm:text-xs font-mono text-slate-200">
                      <span className="px-2 py-0.5 rounded bg-black/70 backdrop-blur-md border border-slate-700">
                        DECK 1: LED BUS
                      </span>
                      <span className="px-2 py-0.5 rounded bg-blue-500/20 text-blue-300 border border-blue-500/30">
                        12 VACANT / 4 OCCUPIED
                      </span>
                    </div>
                  </div>
                )}

                {activeTab === 'cctv' && (
                  <div className="relative aspect-video w-full bg-slate-950 flex items-center justify-center overflow-hidden">
                    <img
                      src="/images/support image.png"
                      alt="Multi-Channel Security & Surveillance Operations Wall"
                      className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-slate-950/80 via-transparent to-transparent pointer-events-none" />
                    <div className="absolute bottom-3 left-3 right-3 sm:bottom-4 sm:left-4 sm:right-4 flex justify-between items-center text-[10px] sm:text-xs font-mono text-slate-200">
                      <span className="px-2 py-0.5 rounded bg-black/70 backdrop-blur-md border border-slate-700">
                        8 CAM CHANNELS
                      </span>
                      <span className="px-2 py-0.5 rounded bg-blue-500/20 text-blue-300 border border-blue-500/30">
                        ANPR RECOGNITION
                      </span>
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* Feature Highlights */}
            <div className="lg:col-span-4 space-y-3 sm:space-y-4">
              <div className="p-4 sm:p-5 rounded-2xl bg-slate-50 border border-slate-200 hover:border-blue-400 hover:bg-white hover:shadow-md transition-all duration-300 space-y-1.5 scroll-reveal opacity-0 translate-y-8 delay-200">
                <div className="flex items-center gap-2 text-blue-700 font-bold text-xs sm:text-sm">
                  <div className="p-1.5 sm:p-2 rounded-xl bg-blue-100 text-blue-700 shrink-0">
                    <Radio className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
                  </div>
                  <span>Instant Dual-Color Bay LEDs</span>
                </div>
                <p className="text-xs text-slate-600 leading-relaxed">
                  Drivers see green and red indicator lights from over 100 meters away, guiding them directly to vacant spots and preventing parking aisle bottlenecks.
                </p>
              </div>

              <div className="p-4 sm:p-5 rounded-2xl bg-slate-50 border border-slate-200 hover:border-blue-400 hover:bg-white hover:shadow-md transition-all duration-300 space-y-1.5 scroll-reveal opacity-0 translate-y-8 delay-300">
                <div className="flex items-center gap-2 text-blue-700 font-bold text-xs sm:text-sm">
                  <div className="p-1.5 sm:p-2 rounded-xl bg-blue-100 text-blue-700 shrink-0">
                    <Zap className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
                  </div>
                  <span>Sub-Second Cloud Sync</span>
                </div>
                <p className="text-xs text-slate-600 leading-relaxed">
                  ESP32 triggers state-transition-only PostgreSQL recording, keeping database overhead low while pushing live changes to operators via WebSockets.
                </p>
              </div>

              <div className="p-4 sm:p-5 rounded-2xl bg-slate-50 border border-slate-200 hover:border-blue-400 hover:bg-white hover:shadow-md transition-all duration-300 space-y-1.5 scroll-reveal opacity-0 translate-y-8 delay-400">
                <div className="flex items-center gap-2 text-blue-700 font-bold text-xs sm:text-sm">
                  <div className="p-1.5 sm:p-2 rounded-xl bg-blue-100 text-blue-700 shrink-0">
                    <Receipt className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
                  </div>
                  <span>Automated Tariff & Invoicing</span>
                </div>
                <p className="text-xs text-slate-600 leading-relaxed">
                  Accurately calculates parking dwell duration down to the minute, generates printable thermal receipts, and archives records for audits.
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ========================================================================= */}
      {/* 4. ABOUT THE ENTERPRISE SYSTEM */}
      {/* ========================================================================= */}
      <section id="about" className="py-14 sm:py-20 bg-slate-50 border-b border-slate-200 relative">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-12 items-center">
            {/* Left Col: Hardware Architecture Visual */}
            <div className="lg:col-span-5 order-2 lg:order-1 scroll-reveal opacity-0 translate-y-8 transition-all duration-700 ease-out">
              <div className="relative rounded-2xl sm:rounded-3xl overflow-hidden border border-slate-200 shadow-md bg-slate-900 group">
                <img
                  src="/images/login-hero.jpg"
                  alt="ParkPulse High Performance IoT System Framework"
                  className="w-full h-64 sm:h-80 lg:h-[400px] object-cover transition-transform duration-700 group-hover:scale-105"
                />
              </div>
            </div>

            {/* Right Col: About Text */}
            <div className="lg:col-span-7 space-y-4 sm:space-y-6 order-1 lg:order-2 scroll-reveal opacity-0 translate-y-8 transition-all duration-700 ease-out delay-150">
              <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-white text-blue-700 border border-blue-200 text-xs font-semibold shadow-xs">
                <Building2 className="w-3.5 h-3.5 text-blue-600" />
                <span>Enterprise Platform Overview</span>
              </div>

              <h2 className="text-xl sm:text-3xl lg:text-4xl font-extrabold text-slate-900 leading-tight">
                An Integrated Management Platform Bridging IoT Edge Hardware with Facility Operations
              </h2>

              <p className="text-xs sm:text-sm text-slate-600 leading-relaxed">
                The <strong className="text-slate-900">ParkPulse Smart Parking Management Platform</strong> is engineered as a modern, production-grade web application to bridge the gap between physical parking infrastructure and digital operations.
              </p>

              <p className="text-xs sm:text-sm text-slate-600 leading-relaxed">
                Instead of relying on manual paper slips and guessing which floors have open bays, the system embeds microcontrollers at each parking bay, continuously streams telemetry, tracks vehicle session durations, automates rate billing, and generates rich analytical heatmaps for operators.
              </p>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4 pt-2">
                <div className="p-4 sm:p-5 rounded-2xl bg-white border border-slate-200 shadow-xs space-y-2 hover:shadow-md transition-shadow">
                  <div className="w-8 h-8 sm:w-9 sm:h-9 rounded-xl bg-blue-50 border border-blue-100 flex items-center justify-center text-blue-600">
                    <Fuel className="w-4 h-4" />
                  </div>
                  <h4 className="text-xs font-bold text-slate-900">Fuel & Emission Reduction</h4>
                  <p className="text-[11px] text-slate-500 leading-relaxed">
                    Eliminates mindless circling in multi-level parking lots, cutting vehicle idle emissions by up to 30%.
                  </p>
                </div>

                <div className="p-4 sm:p-5 rounded-2xl bg-white border border-slate-200 shadow-xs space-y-2 hover:shadow-md transition-shadow">
                  <div className="w-8 h-8 sm:w-9 sm:h-9 rounded-xl bg-blue-50 border border-blue-100 flex items-center justify-center text-blue-600">
                    <FileCheck className="w-4 h-4" />
                  </div>
                  <h4 className="text-xs font-bold text-slate-900">Automated Accurate Billing</h4>
                  <p className="text-[11px] text-slate-500 leading-relaxed">
                    Timestamp-based duration tracking calculates exact parking fees with zero human error and instant receipt printing.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ========================================================================= */}
      {/* 5. PROBLEM STATEMENT VS INTELLIGENT SOLUTION */}
      {/* ========================================================================= */}
      <section id="problem-solution" className="py-14 sm:py-20 bg-white border-b border-slate-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-3xl mx-auto mb-8 sm:mb-14 scroll-reveal opacity-0 translate-y-8 transition-all duration-700 ease-out">
            <span className="text-xs font-bold text-blue-700 tracking-widest uppercase bg-blue-50 px-3.5 py-1.5 rounded-full border border-blue-200">
              Operational Challenges
            </span>
            <h2 className="text-xl sm:text-3xl lg:text-4xl font-extrabold text-slate-900 mt-3">
              Transforming Bottlenecks into Streamlined Efficiency
            </h2>
            <p className="text-xs sm:text-sm text-slate-600 mt-2.5">
              Comparison between traditional manual parking lots and the automated ParkPulse IoT solution.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 sm:gap-8 items-stretch">
            {/* The Problem Card */}
            <div className="p-5 sm:p-8 rounded-3xl bg-slate-50 border border-slate-200 shadow-xs space-y-4 sm:space-y-5 scroll-reveal opacity-0 translate-y-8 transition-all duration-700 ease-out delay-100 hover:shadow-md">
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-slate-200 text-slate-800 border border-slate-300 text-xs font-bold">
                <AlertCircle className="w-3.5 h-3.5 text-slate-600 shrink-0" />
                <span>Traditional Parking Problems</span>
              </div>
              <h3 className="text-base sm:text-xl font-bold text-slate-900">
                Slow, Congested & Prone to Revenue Leakage
              </h3>
              <ul className="space-y-3 text-xs sm:text-sm text-slate-700">
                <li className="flex items-start gap-2.5">
                  <span className="w-5 h-5 rounded-full bg-slate-200 text-slate-700 flex items-center justify-center shrink-0 text-xs font-bold">✕</span>
                  <span><strong>15–20 Mins Delay:</strong> Drivers blindly circle multiple floors with no indication of vacant bays.</span>
                </li>
                <li className="flex items-start gap-2.5">
                  <span className="w-5 h-5 rounded-full bg-slate-200 text-slate-700 flex items-center justify-center shrink-0 text-xs font-bold">✕</span>
                  <span><strong>Traffic Bottlenecks:</strong> 30% of inner-city urban congestion is caused by cars looking for parking.</span>
                </li>
                <li className="flex items-start gap-2.5">
                  <span className="w-5 h-5 rounded-full bg-slate-200 text-slate-700 flex items-center justify-center shrink-0 text-xs font-bold">✕</span>
                  <span><strong>Billing Disputes:</strong> Paper tokens get lost, causing cashier arguments and revenue leakage.</span>
                </li>
                <li className="flex items-start gap-2.5">
                  <span className="w-5 h-5 rounded-full bg-slate-200 text-slate-700 flex items-center justify-center shrink-0 text-xs font-bold">✕</span>
                  <span><strong>Zero Analytics:</strong> Facility managers have no data on peak hours or deck utilization.</span>
                </li>
              </ul>
            </div>

            {/* The Solution Card */}
            <div className="p-5 sm:p-8 rounded-3xl bg-blue-50/50 border border-blue-200 shadow-xs space-y-4 sm:space-y-5 scroll-reveal opacity-0 translate-y-8 transition-all duration-700 ease-out delay-200 hover:shadow-md">
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-blue-100 text-blue-800 border border-blue-200 text-xs font-bold">
                <CheckCircle2 className="w-3.5 h-3.5 text-blue-600 shrink-0" />
                <span>The ParkPulse IoT Solution</span>
              </div>
              <h3 className="text-base sm:text-xl font-bold text-slate-900">
                Frictionless, Real-Time & 100% Automated
              </h3>
              <ul className="space-y-3 text-xs sm:text-sm text-slate-700">
                <li className="flex items-start gap-2.5">
                  <span className="w-5 h-5 rounded-full bg-blue-200 text-blue-800 flex items-center justify-center shrink-0 text-xs font-bold">✓</span>
                  <span><strong>Precision Sensing:</strong> Ultrasonic sensors detect vehicle presence in &lt;150ms.</span>
                </li>
                <li className="flex items-start gap-2.5">
                  <span className="w-5 h-5 rounded-full bg-blue-200 text-blue-800 flex items-center justify-center shrink-0 text-xs font-bold">✓</span>
                  <span><strong>LED Guidance:</strong> Bright Green/Red indicators direct drivers instantly to open bays.</span>
                </li>
                <li className="flex items-start gap-2.5">
                  <span className="w-5 h-5 rounded-full bg-blue-200 text-blue-800 flex items-center justify-center shrink-0 text-xs font-bold">✓</span>
                  <span><strong>Automated Invoicing:</strong> Exact entry/exit timestamps compute fees with thermal receipts.</span>
                </li>
                <li className="flex items-start gap-2.5">
                  <span className="w-5 h-5 rounded-full bg-blue-200 text-blue-800 flex items-center justify-center shrink-0 text-xs font-bold">✓</span>
                  <span><strong>Real-Time Analytics:</strong> 24-hour occupancy trajectories and financial export reports.</span>
                </li>
              </ul>
            </div>
          </div>
        </div>
      </section>

      {/* ========================================================================= */}
      {/* 6. CORE PLATFORM CAPABILITIES MATRIX */}
      {/* ========================================================================= */}
      <section id="capabilities" className="py-14 sm:py-20 bg-slate-50 border-b border-slate-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-3xl mx-auto mb-8 sm:mb-14 scroll-reveal opacity-0 translate-y-8 transition-all duration-700 ease-out">
            <span className="text-xs font-bold text-blue-700 tracking-widest uppercase bg-blue-50 px-3.5 py-1.5 rounded-full border border-blue-200">
              System Modules
            </span>
            <h2 className="text-xl sm:text-3xl lg:text-4xl font-extrabold text-slate-900 mt-3">
              Comprehensive Platform Capabilities
            </h2>
            <p className="text-xs sm:text-sm text-slate-600 mt-2.5">
              Engineered with dedicated micro-modules for facility operators, finance teams, and system administrators.
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
            {/* Card 1 */}
            <div className="rounded-3xl bg-white border border-slate-200 p-5 sm:p-6 space-y-3 sm:space-y-4 hover:border-blue-500 hover:shadow-xl hover:shadow-blue-500/5 hover:-translate-y-1 transition-all duration-300 group scroll-reveal opacity-0 translate-y-8 delay-100">
              <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-2xl bg-blue-50 border border-blue-100 flex items-center justify-center text-blue-600 group-hover:scale-110 group-hover:bg-blue-600 group-hover:text-white transition-all duration-300">
                <Layers className="w-5 h-5 sm:w-6 sm:h-6" />
              </div>
              <h3 className="text-sm sm:text-base font-bold text-slate-900">Interactive 2D Bay Map</h3>
              <p className="text-xs text-slate-600 leading-relaxed">
                Color-coded graphical slot map across all levels showing vacant, occupied, and reserved bays with current vehicle details and elapsed timers.
              </p>
            </div>

            {/* Card 2 */}
            <div className="rounded-3xl bg-white border border-slate-200 p-5 sm:p-6 space-y-3 sm:space-y-4 hover:border-blue-500 hover:shadow-xl hover:shadow-blue-500/5 hover:-translate-y-1 transition-all duration-300 group scroll-reveal opacity-0 translate-y-8 delay-150">
              <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-2xl bg-blue-50 border border-blue-100 flex items-center justify-center text-blue-600 group-hover:scale-110 group-hover:bg-blue-600 group-hover:text-white transition-all duration-300">
                <Car className="w-5 h-5 sm:w-6 sm:h-6" />
              </div>
              <h3 className="text-sm sm:text-base font-bold text-slate-900">Vehicle Registry & Booking</h3>
              <p className="text-xs text-slate-600 leading-relaxed">
                Automated check-in timestamps, license plate registry, custom start/end booking intervals, and instant slot reservation.
              </p>
            </div>

            {/* Card 3 */}
            <div className="rounded-3xl bg-white border border-slate-200 p-5 sm:p-6 space-y-3 sm:space-y-4 hover:border-blue-500 hover:shadow-xl hover:shadow-blue-500/5 hover:-translate-y-1 transition-all duration-300 group scroll-reveal opacity-0 translate-y-8 delay-200">
              <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-2xl bg-blue-50 border border-blue-100 flex items-center justify-center text-blue-600 group-hover:scale-110 group-hover:bg-blue-600 group-hover:text-white transition-all duration-300">
                <Receipt className="w-5 h-5 sm:w-6 sm:h-6" />
              </div>
              <h3 className="text-sm sm:text-base font-bold text-slate-900">Thermal Receipt Generator</h3>
              <p className="text-xs text-slate-600 leading-relaxed">
                Dedicated billing module with automated tariff calculation, unique receipt numbering, and one-click single-page print formatting.
              </p>
            </div>

            {/* Card 4 */}
            <div className="rounded-3xl bg-white border border-slate-200 p-5 sm:p-6 space-y-3 sm:space-y-4 hover:border-blue-500 hover:shadow-xl hover:shadow-blue-500/5 hover:-translate-y-1 transition-all duration-300 group scroll-reveal opacity-0 translate-y-8 delay-250">
              <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-2xl bg-blue-50 border border-blue-100 flex items-center justify-center text-blue-600 group-hover:scale-110 group-hover:bg-blue-600 group-hover:text-white transition-all duration-300">
                <Cpu className="w-5 h-5 sm:w-6 sm:h-6" />
              </div>
              <h3 className="text-sm sm:text-base font-bold text-slate-900">Sensor Mesh Diagnostics</h3>
              <p className="text-xs text-slate-600 leading-relaxed">
                Monitor all deployed ESP32 nodes with battery percentages, firmware versions, heartbeat signals, and continuous COM port auto-recovery.
              </p>
            </div>

            {/* Card 5 */}
            <div className="rounded-3xl bg-white border border-slate-200 p-5 sm:p-6 space-y-3 sm:space-y-4 hover:border-blue-500 hover:shadow-xl hover:shadow-blue-500/5 hover:-translate-y-1 transition-all duration-300 group scroll-reveal opacity-0 translate-y-8 delay-300">
              <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-2xl bg-blue-50 border border-blue-100 flex items-center justify-center text-blue-600 group-hover:scale-110 group-hover:bg-blue-600 group-hover:text-white transition-all duration-300">
                <TrendingUp className="w-5 h-5 sm:w-6 sm:h-6" />
              </div>
              <h3 className="text-sm sm:text-base font-bold text-slate-900">Real-Time Analytics</h3>
              <p className="text-xs text-slate-600 leading-relaxed">
                Dynamic 24-hour occupancy trajectories, live allocation donuts, weekly utilization, and parking duration histograms backed by PostgreSQL.
              </p>
            </div>

            {/* Card 6 */}
            <div className="rounded-3xl bg-white border border-slate-200 p-5 sm:p-6 space-y-3 sm:space-y-4 hover:border-blue-500 hover:shadow-xl hover:shadow-blue-500/5 hover:-translate-y-1 transition-all duration-300 group scroll-reveal opacity-0 translate-y-8 delay-350">
              <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-2xl bg-blue-50 border border-blue-100 flex items-center justify-center text-blue-600 group-hover:scale-110 group-hover:bg-blue-600 group-hover:text-white transition-all duration-300">
                <Building2 className="w-5 h-5 sm:w-6 sm:h-6" />
              </div>
              <h3 className="text-sm sm:text-base font-bold text-slate-900">Multi-Deck & Zone Config</h3>
              <p className="text-xs text-slate-600 leading-relaxed">
                Configure unlimited parking floors, EV charging stalls, handicap bays, and VIP reserved slots with distinct tariff multipliers.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* ========================================================================= */}
      {/* 7. OPERATIONAL WORKFLOW */}
      {/* ========================================================================= */}
      <section id="workflow" className="py-14 sm:py-20 bg-white border-b border-slate-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-3xl mx-auto mb-8 sm:mb-14 scroll-reveal opacity-0 translate-y-8 transition-all duration-700 ease-out">
            <span className="text-xs font-bold text-blue-700 tracking-widest uppercase bg-blue-50 px-3.5 py-1.5 rounded-full border border-blue-200">
              Operational Workflow
            </span>
            <h2 className="text-xl sm:text-3xl lg:text-4xl font-extrabold text-slate-900 mt-3">
              How the System Operates End-to-End
            </h2>
            <p className="text-xs sm:text-sm text-slate-600 mt-2.5">
              From the moment a vehicle enters the facility until departure and receipt generation.
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
            {/* Step 1 */}
            <div className="p-5 sm:p-6 rounded-3xl bg-slate-50 border border-slate-200 space-y-2.5 sm:space-y-3 relative group hover:border-blue-400 hover:bg-white hover:shadow-lg hover:-translate-y-1 transition-all duration-300 scroll-reveal opacity-0 translate-y-8 delay-100">
              <div className="w-9 h-9 sm:w-10 sm:h-10 rounded-xl bg-blue-100 text-blue-700 font-bold text-sm sm:text-base flex items-center justify-center border border-blue-200 group-hover:bg-blue-600 group-hover:text-white transition-colors">
                01
              </div>
              <h4 className="text-xs sm:text-sm font-bold text-slate-900">Vehicle Ingress</h4>
              <p className="text-xs text-slate-600 leading-relaxed">
                Vehicle pulls into an open bay. The overhead HC-SR04 ultrasonic sensor measures distance &lt;50cm.
              </p>
            </div>

            {/* Step 2 */}
            <div className="p-5 sm:p-6 rounded-3xl bg-slate-50 border border-slate-200 space-y-2.5 sm:space-y-3 relative group hover:border-blue-400 hover:bg-white hover:shadow-lg hover:-translate-y-1 transition-all duration-300 scroll-reveal opacity-0 translate-y-8 delay-200">
              <div className="w-9 h-9 sm:w-10 sm:h-10 rounded-xl bg-blue-100 text-blue-700 font-bold text-sm sm:text-base flex items-center justify-center border border-blue-200 group-hover:bg-blue-600 group-hover:text-white transition-colors">
                02
              </div>
              <h4 className="text-xs sm:text-sm font-bold text-slate-900">Edge LED Switch</h4>
              <p className="text-xs text-slate-600 leading-relaxed">
                ESP32 microcontroller triggers overhead indicator LED from Green to Red in under 150ms.
              </p>
            </div>

            {/* Step 3 */}
            <div className="p-5 sm:p-6 rounded-3xl bg-slate-50 border border-slate-200 space-y-2.5 sm:space-y-3 relative group hover:border-blue-400 hover:bg-white hover:shadow-lg hover:-translate-y-1 transition-all duration-300 scroll-reveal opacity-0 translate-y-8 delay-300">
              <div className="w-9 h-9 sm:w-10 sm:h-10 rounded-xl bg-blue-100 text-blue-700 font-bold text-sm sm:text-base flex items-center justify-center border border-blue-200 group-hover:bg-blue-600 group-hover:text-white transition-colors">
                03
              </div>
              <h4 className="text-xs sm:text-sm font-bold text-slate-900">State Ingest</h4>
              <p className="text-xs text-slate-600 leading-relaxed">
                Node.js records the occupancy transition into PostgreSQL and broadcasts instant updates via WebSockets.
              </p>
            </div>

            {/* Step 4 */}
            <div className="p-5 sm:p-6 rounded-3xl bg-slate-50 border border-slate-200 space-y-2.5 sm:space-y-3 relative group hover:border-blue-400 hover:bg-white hover:shadow-lg hover:-translate-y-1 transition-all duration-300 scroll-reveal opacity-0 translate-y-8 delay-400">
              <div className="w-9 h-9 sm:w-10 sm:h-10 rounded-xl bg-blue-100 text-blue-700 font-bold text-sm sm:text-base flex items-center justify-center border border-blue-200 group-hover:bg-blue-600 group-hover:text-white transition-colors">
                04
              </div>
              <h4 className="text-xs sm:text-sm font-bold text-slate-900">Departure & Receipt</h4>
              <p className="text-xs text-slate-600 leading-relaxed">
                Upon vehicle exit, the bay resets to Green, session dwell time is computed, and printable receipts are generated.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* ========================================================================= */}
      {/* 8. HARDWARE & IOT ARCHITECTURE */}
      {/* ========================================================================= */}
      <section id="architecture" className="py-14 sm:py-20 bg-slate-50 border-b border-slate-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-12 items-center">
            {/* Left: Circuit & Hardware Representation */}
            <div className="lg:col-span-5 scroll-reveal opacity-0 translate-y-8 transition-all duration-700 ease-out">
              <div className="rounded-2xl sm:rounded-3xl overflow-hidden border border-slate-200 shadow-md bg-white group hover:shadow-xl transition-shadow">
                <img
                  src="https://images.unsplash.com/photo-1518770660439-4636190af475?auto=format&fit=crop&w=1000&q=80"
                  alt="Microcontroller Hardware Architecture"
                  className="w-full h-64 sm:h-80 lg:h-[400px] object-cover transition-transform duration-700 group-hover:scale-105"
                />
              </div>
            </div>

            {/* Right: Architecture Highlights */}
            <div className="lg:col-span-7 space-y-4 sm:space-y-6 scroll-reveal opacity-0 translate-y-8 transition-all duration-700 ease-out delay-150">
              <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-white text-blue-700 border border-blue-200 text-xs font-semibold shadow-xs">
                <Server className="w-3.5 h-3.5 text-blue-600" />
                <span>Multi-Tier Architecture</span>
              </div>

              <h2 className="text-xl sm:text-3xl lg:text-4xl font-extrabold text-slate-900">
                Engineered for High Reliability & Zero-Latency Performance
              </h2>

              <p className="text-xs sm:text-sm text-slate-600 leading-relaxed">
                The platform is cleanly decoupled into three resilient layers: Hardware Edge Sensing, Cloud Telemetry Processing, and Real-Time Web Presentation.
              </p>

              <div className="space-y-3 sm:space-y-3.5">
                <div className="p-3.5 sm:p-4 rounded-2xl bg-white border border-slate-200 shadow-xs hover:shadow-md transition-shadow flex items-start gap-3 sm:gap-4">
                  <div className="p-2 sm:p-2.5 rounded-xl bg-blue-50 border border-blue-100 text-blue-600 shrink-0">
                    <Cpu className="w-4 h-4 sm:w-5 sm:h-5" />
                  </div>
                  <div>
                    <h4 className="text-xs font-bold text-slate-900">Edge Hardware Layer (ESP32 & Sensors)</h4>
                    <p className="text-[11px] text-slate-500 mt-0.5 leading-relaxed">
                      Reads ultrasonic pulses, drives dual LED indicators, formats JSON serial telemetry payloads, and maintains hardware resilience.
                    </p>
                  </div>
                </div>

                <div className="p-3.5 sm:p-4 rounded-2xl bg-white border border-slate-200 shadow-xs hover:shadow-md transition-shadow flex items-start gap-3 sm:gap-4">
                  <div className="p-2 sm:p-2.5 rounded-xl bg-blue-50 border border-blue-100 text-blue-600 shrink-0">
                    <Server className="w-4 h-4 sm:w-5 sm:h-5" />
                  </div>
                  <div>
                    <h4 className="text-xs font-bold text-slate-900">Backend Ingestion Layer (Node.js & Prisma ORM)</h4>
                    <p className="text-[11px] text-slate-500 mt-0.5 leading-relaxed">
                      Express.js REST APIs and MQTT bridge process incoming signals, execute state-transition database writes, and emit WebSocket events.
                    </p>
                  </div>
                </div>

                <div className="p-3.5 sm:p-4 rounded-2xl bg-white border border-slate-200 shadow-xs hover:shadow-md transition-shadow flex items-start gap-3 sm:gap-4">
                  <div className="p-2 sm:p-2.5 rounded-xl bg-blue-50 border border-blue-100 text-blue-600 shrink-0">
                    <Wifi className="w-4 h-4 sm:w-5 sm:h-5" />
                  </div>
                  <div>
                    <h4 className="text-xs font-bold text-slate-900">Real-Time Web Application (Next.js 15 & React 19)</h4>
                    <p className="text-[11px] text-slate-500 mt-0.5 leading-relaxed">
                      High performance operations console with instant UI updates, thermal receipt printing, and rich analytical charts.
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ========================================================================= */}
      {/* 9. TARGET VERTICALS */}
      {/* ========================================================================= */}
      <section id="verticals" className="py-14 sm:py-20 bg-white border-b border-slate-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-3xl mx-auto mb-8 sm:mb-14 scroll-reveal opacity-0 translate-y-8 transition-all duration-700 ease-out">
            <span className="text-xs font-bold text-blue-700 tracking-widest uppercase bg-blue-50 px-3.5 py-1.5 rounded-full border border-blue-200">
              Industry Verticals
            </span>
            <h2 className="text-xl sm:text-3xl lg:text-4xl font-extrabold text-slate-900 mt-3">
              Deployable Across Diverse Commercial Facilities
            </h2>
            <p className="text-xs sm:text-sm text-slate-600 mt-2.5">
              Custom-tailored for high-traffic infrastructure and enterprise parking operations.
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
            <div className="p-5 sm:p-6 rounded-3xl bg-slate-50 border border-slate-200 space-y-2.5 sm:space-y-3 hover:border-blue-400 hover:bg-white hover:shadow-xl hover:-translate-y-1 transition-all duration-300 group scroll-reveal opacity-0 translate-y-8 delay-100">
              <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-2xl bg-blue-100 border border-blue-200 flex items-center justify-center text-blue-700 text-lg sm:text-xl group-hover:scale-110 transition-transform">
                🏢
              </div>
              <h4 className="text-xs sm:text-sm font-bold text-slate-900">Shopping Malls & Retail</h4>
              <p className="text-xs text-slate-600 leading-relaxed">
                Streamlines peak weekend traffic, eliminates basement congestion, and enhances customer satisfaction.
              </p>
            </div>

            <div className="p-5 sm:p-6 rounded-3xl bg-slate-50 border border-slate-200 space-y-2.5 sm:space-y-3 hover:border-blue-400 hover:bg-white hover:shadow-xl hover:-translate-y-1 transition-all duration-300 group scroll-reveal opacity-0 translate-y-8 delay-200">
              <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-2xl bg-blue-100 border border-blue-200 flex items-center justify-center text-blue-700 text-lg sm:text-xl group-hover:scale-110 transition-transform">
                ✈️
              </div>
              <h4 className="text-xs sm:text-sm font-bold text-slate-900">Airports & Transit Hubs</h4>
              <p className="text-xs text-slate-600 leading-relaxed">
                Manages thousands of multi-level terminal bays with automated long-term duration billing and receipt archiving.
              </p>
            </div>

            <div className="p-5 sm:p-6 rounded-3xl bg-slate-50 border border-slate-200 space-y-2.5 sm:space-y-3 hover:border-blue-400 hover:bg-white hover:shadow-xl hover:-translate-y-1 transition-all duration-300 group scroll-reveal opacity-0 translate-y-8 delay-300">
              <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-2xl bg-blue-100 border border-blue-200 flex items-center justify-center text-blue-700 text-lg sm:text-xl group-hover:scale-110 transition-transform">
                💻
              </div>
              <h4 className="text-xs sm:text-sm font-bold text-slate-900">IT Parks & Corporate</h4>
              <p className="text-xs text-slate-600 leading-relaxed">
                Allocates reserved parking for employees, manages EV charging stalls, and tracks authorized vehicle sessions.
              </p>
            </div>

            <div className="p-5 sm:p-6 rounded-3xl bg-slate-50 border border-slate-200 space-y-2.5 sm:space-y-3 hover:border-blue-400 hover:bg-white hover:shadow-xl hover:-translate-y-1 transition-all duration-300 group scroll-reveal opacity-0 translate-y-8 delay-400">
              <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-2xl bg-blue-100 border border-blue-200 flex items-center justify-center text-blue-700 text-lg sm:text-xl group-hover:scale-110 transition-transform">
                🏥
              </div>
              <h4 className="text-xs sm:text-sm font-bold text-slate-900">Hospitals & Medical</h4>
              <p className="text-xs text-slate-600 leading-relaxed">
                Prioritizes emergency vehicle zones, manages visitor vehicle turnover, and prevents unauthorized bay blocking.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* ========================================================================= */}
      {/* 10. PROJECT FAQ ACCORDION */}
      {/* ========================================================================= */}
      <section id="faq" className="py-14 sm:py-20 bg-slate-50 border-b border-slate-200">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-8 sm:mb-14 scroll-reveal opacity-0 translate-y-8 transition-all duration-700 ease-out">
            <span className="text-xs font-bold text-blue-700 tracking-widest uppercase bg-blue-50 px-3.5 py-1.5 rounded-full border border-blue-200">
              Technical FAQ
            </span>
            <h2 className="text-xl sm:text-3xl lg:text-4xl font-extrabold text-slate-900 mt-3">
              Frequently Asked Questions
            </h2>
            <p className="text-xs sm:text-sm text-slate-600 mt-2.5">
              Key technical details regarding the ParkPulse platform and hardware integration.
            </p>
          </div>

          <div className="space-y-3 sm:space-y-4">
            {faqs.map((faq, idx) => (
              <div
                key={idx}
                className="rounded-2xl bg-white border border-slate-200 overflow-hidden transition-all duration-300 shadow-xs hover:border-blue-300 scroll-reveal opacity-0 translate-y-8"
              >
                <button
                  onClick={() => setActiveFaq(activeFaq === idx ? null : idx)}
                  className="w-full p-4 sm:p-5 text-left flex items-center justify-between gap-3 text-xs sm:text-sm font-bold text-slate-900 hover:text-blue-600 transition-colors"
                >
                  <span className="flex items-center gap-2.5 sm:gap-3">
                    <HelpCircle className="w-4 h-4 text-blue-600 shrink-0" />
                    <span>{faq.q}</span>
                  </span>
                  <span className="text-blue-600 text-base sm:text-lg font-mono shrink-0">{activeFaq === idx ? '−' : '+'}</span>
                </button>
                {activeFaq === idx && (
                  <div className="px-4 sm:px-5 pb-4 sm:pb-5 text-xs sm:text-sm text-slate-600 leading-relaxed border-t border-slate-100 pt-3">
                    {faq.a}
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ========================================================================= */}
      {/* 11. ENTERPRISE FOOTER */}
      {/* ========================================================================= */}
      <footer className="bg-white border-t border-slate-200 text-slate-500 text-xs py-10 sm:py-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-6 sm:space-y-8">
          {/* Top Row */}
          <div className="flex flex-col md:flex-row items-center justify-between gap-4 sm:gap-6 pb-6 border-b border-slate-100 text-center md:text-left">
            {/* Brand */}
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 sm:w-9 sm:h-9 rounded-xl bg-blue-600 flex items-center justify-center text-white shadow-xs">
                <Zap className="w-4 h-4 sm:w-5 sm:h-5 fill-current" />
              </div>
              <div>
                <span className="font-extrabold text-sm tracking-tight text-slate-900">
                  PARK<span className="text-blue-600">PULSE</span> <span className="text-xs text-slate-500 font-normal">IoT Enterprise</span>
                </span>
                <p className="text-[10px] sm:text-[11px] text-slate-400">Autonomous Parking Management System</p>
              </div>
            </div>

            {/* Links */}
            <nav className="flex flex-wrap items-center justify-center gap-4 sm:gap-6 text-xs text-slate-600 font-medium">
              <a href="#telemetry" className="hover:text-blue-600 transition-colors">Live Telemetry</a>
              <a href="#about" className="hover:text-blue-600 transition-colors">Overview</a>
              <a href="#capabilities" className="hover:text-blue-600 transition-colors">Capabilities</a>
              <a href="#workflow" className="hover:text-blue-600 transition-colors">Workflow</a>
              <a href="#architecture" className="hover:text-blue-600 transition-colors">Architecture</a>
              <a href="#faq" className="hover:text-blue-600 transition-colors">FAQ</a>
              <Link href="/login" className="text-blue-600 font-bold hover:text-blue-700 transition-colors flex items-center gap-1">
                <span>Login</span>
                <ChevronRight className="w-3.5 h-3.5" />
              </Link>
            </nav>
          </div>

          {/* Bottom Row */}
          <div className="flex flex-col sm:flex-row items-center justify-between gap-3 sm:gap-4 text-[10px] sm:text-[11px] text-slate-400 text-center sm:text-left">
            <p>© 2026 ParkPulse Enterprise IoT Platform. All rights reserved.</p>

            <div className="flex items-center gap-3 sm:gap-4">
              <div className="flex items-center gap-2 text-slate-500 font-medium">
                <span className="relative flex h-2 w-2">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-blue-500 opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-2 w-2 bg-blue-600"></span>
                </span>
                <span>ESP32 Active</span>
              </div>
              <span className="text-slate-300">•</span>
              <button
                onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
                className="hover:text-blue-600 transition-colors cursor-pointer"
              >
                Back to Top ↑
              </button>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}
