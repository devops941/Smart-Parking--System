import { prisma } from '../config/db.js';

export class AnalyticsService {
  async getAnalyticsData() {
    try {
      const [slots, sensors, areas, sessions, readings] = await Promise.all([
        prisma.parkingSlot.findMany(),
        prisma.sensor.findMany(),
        prisma.parkingArea.findMany({ include: { slots: true } }),
        prisma.parkingSession.findMany({ orderBy: { entryTime: 'desc' } }),
        prisma.sensorReading.findMany({
          orderBy: { timestamp: 'desc' },
          take: 500,
        }),
      ]);

      const totalSlots = Math.max(slots.length, 1);
      const occupiedSlots = slots.filter(s => s.status === 'OCCUPIED').length;
      const availableSlots = slots.filter(s => s.status === 'AVAILABLE').length;
      const reservedSlots = slots.filter(s => s.status === 'RESERVED').length;
      const offlineSlots = slots.filter(s => s.status === 'OFFLINE').length;
      const currentOccupancyRate = Math.round((occupiedSlots / totalSlots) * 100);

      // Area utilization breakdown
      const areaUtilization = areas.map(area => {
        const areaSlots = area.slots;
        const occupied = areaSlots.filter(s => s.status === 'OCCUPIED').length;
        const total = Math.max(areaSlots.length, 1);
        const rate = Math.round((occupied / total) * 100);
        return {
          areaName: area.name,
          code: area.code,
          total: areaSlots.length,
          occupied,
          available: areaSlots.length - occupied,
          utilizationRate: rate,
        };
      });

      const totalSessions = sessions.length;
      const completedSessions = sessions.filter(s => s.status === 'COMPLETED');
      const activeSessions = sessions.filter(s => s.status === 'ACTIVE');

      // Calculate average parking duration from completed & active sessions
      let totalDurationMins = 0;
      let durationCount = 0;
      completedSessions.forEach(s => {
        if (s.durationMin && s.durationMin > 0) {
          totalDurationMins += s.durationMin;
          durationCount++;
        }
      });
      activeSessions.forEach(s => {
        const elapsed = Math.max(1, Math.round((Date.now() - new Date(s.entryTime).getTime()) / (60 * 1000)));
        totalDurationMins += elapsed;
        durationCount++;
      });
      const avgDuration = durationCount > 0 ? Math.round(totalDurationMins / durationCount) : (currentOccupancyRate > 0 ? 15 : 0);

      // --- 1. Real 24-Hour Occupancy Trajectory ---
      // Bucket into 2-hour intervals [00:00, 02:00, ... 22:00]
      const hourBuckets = ['00:00', '02:00', '04:00', '06:00', '08:00', '10:00', '12:00', '14:00', '16:00', '18:00', '20:00', '22:00'];
      const now = new Date();
      const currentHour = now.getHours();

      // Count sessions / readings falling into each bucket for past 24 hours
      const dailyOccupancy = hourBuckets.map((bucketLabel) => {
        const [hStr] = bucketLabel.split(':');
        const bucketHour = parseInt(hStr, 10);
        
        // Find sessions active during this 2-hour window
        const sessionsInWindow = sessions.filter(s => {
          const entryH = new Date(s.entryTime).getHours();
          const exitH = s.exitTime ? new Date(s.exitTime).getHours() : currentHour;
          return (entryH <= bucketHour && exitH >= bucketHour);
        });

        // Find sensor readings in this hour window
        const readingsInWindow = readings.filter(r => {
          const rHour = new Date(r.timestamp).getHours();
          return rHour >= bucketHour && rHour < bucketHour + 2;
        });

        const occupiedReadings = readingsInWindow.filter(r => r.isOccupied).length;
        const totalReadings = readingsInWindow.length;
        
        let calculatedOccupancy = 0;
        let vehicleCount = sessionsInWindow.length;

        if (totalReadings > 0) {
          calculatedOccupancy = Math.min(100, Math.round((occupiedReadings / totalReadings) * 100));
        } else if (sessionsInWindow.length > 0) {
          calculatedOccupancy = Math.min(100, Math.round((sessionsInWindow.length / totalSlots) * 100));
        }

        // If this is the current hour block, reflect current live occupancy
        if (Math.abs(currentHour - bucketHour) < 2) {
          calculatedOccupancy = Math.max(calculatedOccupancy, currentOccupancyRate);
          vehicleCount = Math.max(vehicleCount, occupiedSlots);
        }

        return {
          hour: bucketLabel,
          occupancy: calculatedOccupancy,
          vehicles: vehicleCount,
        };
      });

      // Find peak hour
      let maxBucket = dailyOccupancy[0];
      dailyOccupancy.forEach(b => {
        if (b.occupancy > maxBucket.occupancy) {
          maxBucket = b;
        }
      });
      const peakHourFormatted = maxBucket && maxBucket.occupancy > 0 
        ? `${maxBucket.hour} (Peak ${maxBucket.occupancy}%)`
        : `${String(currentHour).padStart(2, '0')}:00`;

      // --- 2. Real Weekly Utilization (Mon - Sun) ---
      const dayNames = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
      const currentDayIdx = now.getDay();
      
      const weeklyOccupancy = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'].map(dayName => {
        const dayIdx = dayNames.indexOf(dayName);
        const daySessions = sessions.filter(s => new Date(s.entryTime).getDay() === dayIdx);
        const dayReadings = readings.filter(r => new Date(r.timestamp).getDay() === dayIdx);
        
        const occupiedCount = dayReadings.filter(r => r.isOccupied).length;
        let rate = 0;
        if (dayReadings.length > 0) {
          rate = Math.min(100, Math.round((occupiedCount / dayReadings.length) * 100));
        } else if (daySessions.length > 0) {
          rate = Math.min(100, Math.round((daySessions.length / totalSlots) * 100));
        }

        // If today is this day, ensure it includes live occupancy
        if (dayIdx === currentDayIdx) {
          rate = Math.max(rate, currentOccupancyRate);
        }

        const totalVehicles = Math.max(daySessions.length, (dayIdx === currentDayIdx ? occupiedSlots : 0));
        const dayRevenue = daySessions.reduce((acc, s) => acc + (s.feeAmount || 20), 0);

        return {
          day: dayName,
          rate,
          totalVehicles,
          revenue: dayRevenue,
        };
      });

      // --- 3. Real Parking Duration Distribution ---
      let bucketUnder30m = 0;
      let bucket30mTo1h = 0;
      let bucket1hTo2h = 0;
      let bucket2hTo4h = 0;
      let bucketOver4h = 0;

      [...completedSessions, ...activeSessions].forEach(s => {
        const dur = s.durationMin && s.durationMin > 0
          ? s.durationMin
          : Math.max(1, Math.round((Date.now() - new Date(s.entryTime).getTime()) / (60 * 1000)));

        if (dur < 30) bucketUnder30m++;
        else if (dur <= 60) bucket30mTo1h++;
        else if (dur <= 120) bucket1hTo2h++;
        else if (dur <= 240) bucket2hTo4h++;
        else bucketOver4h++;
      });

      // If no sessions exist yet, reflect active slot status
      if (totalSessions === 0 && occupiedSlots > 0) {
        bucketUnder30m = occupiedSlots;
      }

      const totalDistCount = bucketUnder30m + bucket30mTo1h + bucket1hTo2h + bucket2hTo4h + bucketOver4h || 1;
      const durationDistribution = [
        { range: '< 30m', count: bucketUnder30m, percentage: Math.round((bucketUnder30m / totalDistCount) * 100) },
        { range: '30m - 1h', count: bucket30mTo1h, percentage: Math.round((bucket30mTo1h / totalDistCount) * 100) },
        { range: '1h - 2h', count: bucket1hTo2h, percentage: Math.round((bucket1hTo2h / totalDistCount) * 100) },
        { range: '2h - 4h', count: bucket2hTo4h, percentage: Math.round((bucket2hTo4h / totalDistCount) * 100) },
        { range: '> 4h', count: bucketOver4h, percentage: Math.round((bucketOver4h / totalDistCount) * 100) },
      ];

      // --- 4. Monthly Trend (Past 6 Months) ---
      const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
      const monthlyOccupancy = [];
      for (let i = 5; i >= 0; i--) {
        const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
        const mIdx = d.getMonth();
        const mSessions = sessions.filter(s => {
          const sDate = new Date(s.entryTime);
          return sDate.getMonth() === mIdx && sDate.getFullYear() === d.getFullYear();
        });
        monthlyOccupancy.push({
          month: monthNames[mIdx],
          averageRate: mSessions.length > 0 ? Math.min(100, Math.round((mSessions.length / (totalSlots * 30)) * 100)) : (i === 0 ? currentOccupancyRate : 0),
          sessions: mSessions.length,
        });
      }

      // Count today's vehicles
      const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate());
      const todaySessions = sessions.filter(s => new Date(s.entryTime) >= startOfToday);
      const totalVehiclesToday = Math.max(todaySessions.length, occupiedSlots);

      return {
        kpi: {
          averageOccupancy: currentOccupancyRate,
          peakHour: peakHourFormatted,
          totalVehiclesToday,
          averageDurationMin: avgDuration,
          turnoverRate: `${(totalSessions / totalSlots).toFixed(1)} cars/slot`,
          activeSensors: sensors.filter(s => s.status === 'ONLINE').length,
        },
        currentBreakdown: {
          available: availableSlots,
          occupied: occupiedSlots,
          reserved: reservedSlots,
          offline: offlineSlots,
        },
        dailyOccupancy,
        weeklyOccupancy,
        monthlyOccupancy,
        areaUtilization,
        durationDistribution,
      };
    } catch (err: any) {
      console.error('Error getting analytics from DB:', err.message);
      return null;
    }
  }
}

export class NotificationService {
  async getNotifications(unreadOnly = false) {
    try {
      const where: any = {};
      if (unreadOnly) where.isRead = false;
      return await prisma.notification.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        take: 50,
      });
    } catch {
      return [];
    }
  }

  async markAsRead(id: string) {
    try {
      return await prisma.notification.update({
        where: { id },
        data: { isRead: true },
      });
    } catch {
      return null;
    }
  }

  async markAllAsRead() {
    try {
      await prisma.notification.updateMany({
        where: { isRead: false },
        data: { isRead: true },
      });
      return { success: true };
    } catch {
      return { success: false };
    }
  }

  async clearAll() {
    try {
      await prisma.notification.deleteMany();
      return { success: true };
    } catch {
      return { success: false };
    }
  }
}

export const analyticsService = new AnalyticsService();
export const notificationService = new NotificationService();
