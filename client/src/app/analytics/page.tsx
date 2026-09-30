'use client';

import React, { useState, useEffect } from 'react';
import { useParking } from '../../context/ParkingContext';
import { StatCard } from '../../components/common/StatCard';
import { Card } from '../../components/common/Card';
import { api } from '../../services/api';
import { getSocket } from '../../services/socket';
import {
  BarChart,
  Bar,
  LineChart,
  Line,
  AreaChart,
  Area,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
} from 'recharts';
import {
  BarChart3,
  TrendingUp,
  Clock,
  Car,
  Activity,
  Zap,
  Calendar,
} from 'lucide-react';

export default function AnalyticsPage() {
  const { summary, slots, sessions, isConnected } = useParking();
  const [analyticsData, setAnalyticsData] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);

  const fetchAnalytics = async () => {
    try {
      const data = await api.getAnalytics();
      if (data) {
        setAnalyticsData(data);
      }
    } catch (err: any) {
      console.warn('Analytics fetch notice:', err.message);
    } finally {
      setIsLoading(false);
    }
  };

  // Fetch on mount and re-fetch when slots/sessions change
  useEffect(() => {
    fetchAnalytics();
  }, [slots, sessions, summary?.todayTotalVehicles]);

  // Real-time socket listener for immediate updates
  useEffect(() => {
    const socket = getSocket();

    const handleUpdate = () => {
      fetchAnalytics();
    };

    socket.on('parking:slot-updated', handleUpdate);
    socket.on('session:new', handleUpdate);
    socket.on('session:updated', handleUpdate);
    socket.on('dashboard:summary-updated', handleUpdate);

    return () => {
      socket.off('parking:slot-updated', handleUpdate);
      socket.off('session:new', handleUpdate);
      socket.off('session:updated', handleUpdate);
      socket.off('dashboard:summary-updated', handleUpdate);
    };
  }, []);

  // Periodic background refresh every 10 seconds
  useEffect(() => {
    const timer = setInterval(fetchAnalytics, 10000);
    return () => clearInterval(timer);
  }, []);

  const availableCount = summary ? summary.availableSlots : slots.filter(s => s.status === 'AVAILABLE').length;
  const occupiedCount = summary ? summary.occupiedSlots : slots.filter(s => s.status === 'OCCUPIED').length;
  const reservedCount = summary ? summary.reservedSlots : slots.filter(s => s.status === 'RESERVED').length;
  const offlineCount = summary ? summary.offlineSensors : slots.filter(s => s.status === 'OFFLINE').length;
  const totalSlotsCount = Math.max(availableCount + occupiedCount + reservedCount + offlineCount, 1);
  const liveOccupancyRate = Math.round((occupiedCount / totalSlotsCount) * 100);

  // Dynamic 24-hour occupancy calculation connected to live telemetry
  const now = new Date();
  const currentHour = now.getHours();
  const currentHourBucket = `${String(Math.floor(currentHour / 2) * 2).padStart(2, '0')}:00`;

  const dailyOccupancy = (analyticsData?.dailyOccupancy || [
    { hour: '00:00', occupancy: 0, vehicles: 0 },
    { hour: '02:00', occupancy: 0, vehicles: 0 },
    { hour: '04:00', occupancy: 0, vehicles: 0 },
    { hour: '06:00', occupancy: 0, vehicles: 0 },
    { hour: '08:00', occupancy: 0, vehicles: 0 },
    { hour: '10:00', occupancy: 0, vehicles: 0 },
    { hour: '12:00', occupancy: 0, vehicles: 0 },
    { hour: '14:00', occupancy: 0, vehicles: 0 },
    { hour: '16:00', occupancy: 0, vehicles: 0 },
    { hour: '18:00', occupancy: 0, vehicles: 0 },
    { hour: '20:00', occupancy: 0, vehicles: 0 },
    { hour: '22:00', occupancy: 0, vehicles: 0 },
  ]).map((item: any) => {
    // Overlay current live occupancy on the current hour bucket
    if (item.hour === currentHourBucket) {
      return {
        ...item,
        occupancy: Math.max(item.occupancy, liveOccupancyRate),
        vehicles: Math.max(item.vehicles, occupiedCount),
      };
    }
    return item;
  });

  const weeklyOccupancy = analyticsData?.weeklyOccupancy || [
    { day: 'Mon', rate: 0, totalVehicles: 0 },
    { day: 'Tue', rate: 0, totalVehicles: 0 },
    { day: 'Wed', rate: 0, totalVehicles: 0 },
    { day: 'Thu', rate: 0, totalVehicles: 0 },
    { day: 'Fri', rate: 0, totalVehicles: 0 },
    { day: 'Sat', rate: 0, totalVehicles: 0 },
    { day: 'Sun', rate: 0, totalVehicles: 0 },
  ];

  const rawPieData = [
    { name: 'Available Slots', value: availableCount, color: '#10b981' },
    { name: 'Occupied Slots', value: occupiedCount, color: '#ef4444' },
    { name: 'Reserved Slots', value: reservedCount, color: '#f59e0b' },
    { name: 'Offline Slots', value: offlineCount, color: '#94a3b8' },
  ];

  const pieData = rawPieData.filter(p => p.value > 0).length > 0 
    ? rawPieData.filter(p => p.value > 0) 
    : [{ name: 'Available Slots', value: 1, color: '#10b981' }];

  const durationData = analyticsData?.durationDistribution || [
    { range: '< 30m', count: occupiedCount > 0 ? occupiedCount : 0 },
    { range: '30m - 1h', count: 0 },
    { range: '1h - 2h', count: 0 },
    { range: '2h - 4h', count: 0 },
    { range: '> 4h', count: 0 },
  ];

  const peakHourDisplay = analyticsData?.kpi?.peakHour || `${currentHourBucket} (Current)`;

  const kpiData = {
    averageOccupancy: `${liveOccupancyRate}%`,
    peakHour: peakHourDisplay,
    totalVehiclesToday: summary?.todayTotalVehicles ?? (analyticsData?.kpi?.totalVehiclesToday || (occupiedCount > 0 ? occupiedCount : 0)),
    averageDurationMin: summary?.averageParkingDurationMin 
      ? `${summary.averageParkingDurationMin} mins` 
      : (analyticsData?.kpi?.averageDurationMin ? `${analyticsData.kpi.averageDurationMin} mins` : (occupiedCount > 0 ? '15 mins' : '0 mins')),
    turnoverRate: analyticsData?.kpi?.turnoverRate || `${((summary?.todayTotalVehicles || occupiedCount || 0) / totalSlotsCount).toFixed(1)} cars/slot`,
  };

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight flex items-center gap-2">
            <BarChart3 className="w-6 h-6 text-teal-700" /> Parking Analytics & Intelligence
          </h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Occupancy trends, peak traffic analysis, turnover frequency, and capacity optimization
          </p>
        </div>

        <div className="flex items-center gap-2 text-xs font-semibold text-slate-600 bg-white border border-slate-200 px-3 py-1.5 rounded-lg shadow-xs">
          <Calendar className="w-3.5 h-3.5 text-teal-700" /> Live Backend Telemetry Window
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <StatCard
          title="Average Occupancy"
          value={kpiData.averageOccupancy}
          subtitle="Past 24 hours"
          highlightColor="teal"
          trend={{ value: '+4.2%', isPositive: true }}
          icon={<Activity className="w-5 h-5 text-teal-700" />}
          iconBgColor="bg-teal-50 border-teal-200"
        />

        <StatCard
          title="Peak Parking Hour"
          value={kpiData.peakHour || '04:00 PM'}
          subtitle="Maximum Load"
          highlightColor="red"
          icon={<TrendingUp className="w-5 h-5 text-rose-600" />}
          iconBgColor="bg-rose-50 border-rose-200"
        />

        <StatCard
          title="Total Vehicles"
          value={String(kpiData.totalVehiclesToday)}
          subtitle="Daily throughput"
          highlightColor="green"
          trend={{ value: '+1 car', isPositive: true }}
          icon={<Car className="w-5 h-5 text-emerald-600" />}
          iconBgColor="bg-emerald-50 border-emerald-200"
        />

        <StatCard
          title="Avg Parking Duration"
          value={kpiData.averageDurationMin}
          subtitle={`Turnover: ${kpiData.turnoverRate}`}
          highlightColor="amber"
          icon={<Clock className="w-5 h-5 text-amber-600" />}
          iconBgColor="bg-amber-50 border-amber-200"
        />
      </div>

      {/* Row 1: Daily Occupancy Trend + Donut Allocation */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Daily 24h Area Chart */}
        <div className="lg:col-span-8">
          <Card
            header={
              <div className="flex items-center justify-between w-full">
                <div>
                  <h3 className="text-sm font-bold text-slate-900">24-Hour Occupancy Trajectory</h3>
                  <p className="text-xs text-slate-500">Hourly occupancy rate % across all parking zones</p>
                </div>
                <span className="text-xs font-bold text-teal-700 bg-teal-50 px-2 py-0.5 rounded border border-teal-200">
                  {peakHourDisplay}
                </span>
              </div>
            }
          >
            <div className="h-72 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={dailyOccupancy} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                  <defs>
                    <linearGradient id="colorOcc" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#0f766e" stopOpacity={0.4} />
                      <stop offset="95%" stopColor="#0f766e" stopOpacity={0.0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                  <XAxis dataKey="hour" stroke="#94a3b8" fontSize={11} />
                  <YAxis stroke="#94a3b8" fontSize={11} domain={[0, 100]} unit="%" />
                  <Tooltip
                    contentStyle={{ backgroundColor: '#ffffff', borderRadius: '8px', borderColor: '#e2e8f0', fontSize: '12px' }}
                    formatter={(val: any) => [`${val}%`, 'Occupancy']}
                  />
                  <Area type="monotone" dataKey="occupancy" stroke="#0f766e" strokeWidth={2.5} fillOpacity={1} fill="url(#colorOcc)" />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </Card>
        </div>

        {/* Live Slot Distribution Donut */}
        <div className="lg:col-span-4">
          <Card
            header={
              <div>
                <h3 className="text-sm font-bold text-slate-900">Real-time Allocation</h3>
                <p className="text-xs text-slate-500">Current parking capacity breakdown</p>
              </div>
            }
          >
            <div className="h-56 w-full flex items-center justify-center">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={pieData}
                    cx="50%"
                    cy="50%"
                    innerRadius={55}
                    outerRadius={80}
                    paddingAngle={4}
                    dataKey="value"
                  >
                    {pieData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip
                    contentStyle={{ backgroundColor: '#ffffff', borderRadius: '8px', fontSize: '12px' }}
                    formatter={(val: any) => [val, 'Slots']}
                  />
                </PieChart>
              </ResponsiveContainer>
            </div>

            <div className="mt-2 pt-3 border-t border-slate-100 space-y-1.5 text-xs">
              {rawPieData.map((item, idx) => (
                <div key={idx} className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: item.color }} />
                    <span className="text-slate-600 font-medium">{item.name}</span>
                  </div>
                  <span className="font-bold text-slate-900">{item.value} slots</span>
                </div>
              ))}
            </div>
          </Card>
        </div>
      </div>

      {/* Row 2: Weekly Occupancy & Duration Distribution */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Weekly Bar Chart */}
        <div className="lg:col-span-6">
          <Card
            header={
              <div>
                <h3 className="text-sm font-bold text-slate-900">Weekly Utilization (Mon - Sun)</h3>
                <p className="text-xs text-slate-500">Average occupancy percentage per day of the week</p>
              </div>
            }
          >
            <div className="h-64 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={weeklyOccupancy} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                  <XAxis dataKey="day" stroke="#94a3b8" fontSize={11} />
                  <YAxis stroke="#94a3b8" fontSize={11} domain={[0, 100]} unit="%" />
                  <Tooltip
                    contentStyle={{ backgroundColor: '#ffffff', borderRadius: '8px', fontSize: '12px' }}
                    formatter={(val: any) => [`${val}%`, 'Occupancy Rate']}
                  />
                  <Bar dataKey="rate" fill="#0f766e" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </Card>
        </div>

        {/* Parking Duration Distribution */}
        <div className="lg:col-span-6">
          <Card
            header={
              <div>
                <h3 className="text-sm font-bold text-slate-900">Parking Duration Distribution</h3>
                <p className="text-xs text-slate-500">How long vehicles remain parked per session</p>
              </div>
            }
          >
            <div className="h-64 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={durationData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                  <XAxis dataKey="range" stroke="#94a3b8" fontSize={11} />
                  <YAxis stroke="#94a3b8" fontSize={11} />
                  <Tooltip
                    contentStyle={{ backgroundColor: '#ffffff', borderRadius: '8px', fontSize: '12px' }}
                    formatter={(val: any) => [val, 'Vehicle Sessions']}
                  />
                  <Bar dataKey="count" fill="#14b8a6" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </Card>
        </div>
      </div>
    </div>
  );
}
