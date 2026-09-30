import type { Metadata } from 'next';
import './globals.css';
import { ParkingProvider } from '../context/ParkingContext';
import { AppLayout } from '../components/layout/AppLayout';

export const metadata: Metadata = {
  title: 'Smart Parking IoT Management Platform',
  description:
    'Real-time IoT-based parking slot monitoring, ESP32 sensor telemetry, occupancy analytics, and automated session management.',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <meta name="viewport" content="width=device-width, initial-scale=1, maximum-scale=5" />
      </head>
      <body suppressHydrationWarning>
        <ParkingProvider>
          <AppLayout>{children}</AppLayout>
        </ParkingProvider>
      </body>
    </html>
  );
}
