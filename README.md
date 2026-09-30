# IoT Smart Parking Management System

A modern, enterprise-grade IoT-based Smart Parking Management Web Application built with **Next.js 15+ (App Router, TypeScript, Tailwind CSS)**, **Node.js + Express backend**, **PostgreSQL + Prisma ORM**, and **Real-time WebSocket & MQTT communication**.

Designed for monitoring physical parking slots connected to **ESP32 / Arduino** ultrasonic and infrared sensors.

---

## 🚀 Key Highlights & Features

1. **Industrial IoT Dashboard**:
   - Real-time slot occupancy statistics (Total, Available, Occupied, Reserved, Offline Sensors).
   - Live occupancy percentage and turnover analytics.
   - Interactive Live IoT Control Hub for instant simulator pulses and custom ESP32 payload transmissions.

2. **Live Visual Parking Grid**:
   - Color-coded slots: 🟢 Green (Available), 🔴 Red (Occupied), 🟡 Amber (Reserved), ⚪ Gray (Sensor Offline).
   - Displays live distance readings (e.g. `12.4 cm`), vehicle license plates, and sensor statuses.
   - Filter by Area/Deck, Status, and search by plate or slot ID.

3. **Slot Inspector Modal**:
   - Click any slot to view live sensor telemetry, distance readings, vehicle details, entry timestamps, elapsed duration, and manual override controls.

4. **Multi-Deck Parking Area Management**:
   - Add, edit, and organize parking areas by floor level, capacity, and custom tariff rates (e.g., INR 20/hr).

5. **IoT Sensor Hardware Monitoring**:
   - Track sensor identifiers (`SENSOR-001`), communication protocols (Wi-Fi, MQTT, HTTP), distance thresholds, battery percentages, and last-seen heartbeats.
   - Automatic sensor heartbeat watcher detects offline hardware nodes after inactivity.

6. **Automated Parking Sessions & History**:
   - Automated check-in and checkout triggered when sensor detects vehicle arrival or departure.
   - Complete audit trail with timestamps, durations, and fee calculations.

7. **Visual Analytics**:
   - 24-hour daily occupancy trajectory charts.
   - Weekly utilization and duration distribution charts.
   - Real-time slot allocation donut charts using **Recharts**.

8. **Executive Reports & Export**:
   - Daily, Weekly, Monthly, and Sensor Diagnostic reports.
   - One-click **Export to CSV** and **Export to PDF** with automated tabular layouts.

9. **ESP32 Arduino Firmware & Dual-Protocol Ingestion**:
   - Ready-to-flash Arduino C++ firmware in `/esp32_firmware` supporting both HTTP POST and MQTT.

---

## 🏗️ System Architecture

```
┌─────────────────┐       Wi-Fi / LAN       ┌────────────────────────┐
│  ESP32 Node     ├────────────────────────►│  Node.js + Express API   │
│  HC-SR04 Sensor │  HTTP REST / MQTT Topic │  (Port 5000)           │
└─────────────────┘                         └───────────┬────────────┘
                                                        │
                         ┌──────────────────────────────┼────────────────────────────┐
                         │                              │                            │
                         ▼                              ▼                            ▼
               ┌───────────────────┐          ┌───────────────────┐        ┌───────────────────┐
               │ PostgreSQL DB     │          │ WebSocket         │        │ MQTT Broker       │
               │ (Prisma ORM)      │          │ (Socket.IO)       │        │ (HiveMQ / Custom) │
               └───────────────────┘          └─────────┬─────────┘        └───────────────────┘
                                                        │
                                                        ▼ Real-time Push
                                              ┌───────────────────┐
                                              │ Next.js 15 Client │
                                              │ (Port 3000)       │
                                              └───────────────────┘
```

---

## 📁 Repository Structure

```
smart-parking-system/
├── client/                     # Next.js 15+ Frontend Web Application
│   ├── src/
│   │   ├── app/                # Next.js App Router (Dashboard, Live Map, Areas, Slots, Sensors, etc.)
│   │   ├── components/         # Reusable Component Library (Cards, Modals, Tables, StatCards, Badges)
│   │   ├── context/            # Global React State & WebSocket Provider (ParkingContext.tsx)
│   │   ├── services/           # Typed REST API Client & Socket.IO Connector
│   │   └── types/              # TypeScript Types and Interfaces
│   └── package.json
│
├── server/                     # Node.js + Express + Prisma + WebSocket/MQTT Backend
│   ├── prisma/
│   │   └── schema.prisma       # PostgreSQL Prisma Schema
│   ├── src/
│   │   ├── config/             # DB initialization & Seed Store
│   │   ├── routes/             # REST API Routes (Dashboard, Parking, Sensors, Sessions, Reports, etc.)
│   │   ├── services/           # Business Logic & IoT Ingestion State Machine
│   │   ├── simulator/          # Live ESP32 Telemetry Generator
│   │   └── index.ts            # Server Entry Point
│   └── package.json
│
├── esp32_firmware/             # ESP32 / Arduino C++ Hardware Firmware
│   ├── smart_parking_esp32.ino # Dual HTTP/MQTT ultrasonic node firmware
│   └── README.md               # Hardware wiring diagram and pinouts
│
└── package.json                # Root package with 1-click startup scripts
```

---

## ⚡ Quick Start & Run Guide

### 1. Prerequisites
- **Node.js** v18+ (Node v20+ or v24 recommended)
- **npm** or yarn

### 2. Start Both Backend & Frontend Concurrently

From the root directory:
```bash
# Start backend on http://localhost:5000 and frontend on http://localhost:3000
npm run dev:all
```

Or start separately:
```bash
# Terminal 1 (Backend IoT Server)
npm run dev:server

# Terminal 2 (Next.js Dashboard)
npm run dev:client
```

Open **`http://localhost:3000`** in your browser.

---

## 📡 ESP32 IoT Ingestion API Reference

### HTTP REST Ingestion
**Endpoint**: `POST http://localhost:5000/api/sensors/data`  
**Headers**: `Content-Type: application/json`  
**Payload**:
```json
{
  "sensorId": "SENSOR-001",
  "slotId": "A-01",
  "distance": 12.5,
  "status": "occupied",
  "battery": 98,
  "rssi": -62
}
```

### MQTT Ingestion
- **Broker**: `broker.hivemq.com:1883` (or configured in `server/.env`)
- **Topic**: `smartparking/sensors/data`
- **Payload Format**: JSON string matching the HTTP payload above.

---

## 🧪 Testing with the Built-In IoT Simulator
1. **From Web UI**: Use the **ESP32 IoT Telemetry Control Hub** on the Dashboard or top navigation bar. Click **"Live IoT Stream"** to automatically emit live distance pulses across slots, or click **"1-Click Event"** for single triggers.
2. **From Terminal**:
   ```bash
   npm run simulate
   ```
3. **Using cURL**:
   ```bash
   # Simulate vehicle parking in Slot A-01:
   curl -X POST http://localhost:5000/api/sensors/data \
     -H "Content-Type: application/json" \
     -d "{\"sensorId\":\"SENSOR-001\",\"slotId\":\"A-01\",\"distance\":12.5,\"status\":\"occupied\"}"
   ```
