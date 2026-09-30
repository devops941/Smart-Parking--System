# ESP32 / Arduino Smart Parking IoT Node Guide

This directory contains the firmware sketch for the Smart Parking IoT hardware node.

## Hardware Components Required
1. **ESP32 DevKit V1** (or ESP8266 / NodeMCU / Arduino with WiFi Shield)
2. **HC-SR04 Ultrasonic Distance Sensor** (or IR Obstacle / Laser ToF VL53L0X sensor)
3. **LED Indicators**:
   - 🟢 Green LED (Slot Available)
   - 🔴 Red LED (Slot Occupied)
   - 🔵 Blue LED (WiFi Connected Status)
4. **220Ω / 330Ω Resistors** for LEDs
5. **Voltage Divider / Level Shifter** (HC-SR04 Echo 5V -> ESP32 3.3V GPIO 18 using 1kΩ + 2kΩ resistors)
6. **Breadboard & Jumper Wires**

---

## Pin Connections (ESP32)

| Component | Pin | ESP32 GPIO | Notes |
| :--- | :--- | :--- | :--- |
| **HC-SR04 VCC** | VCC | 5V / VIN | Power ultrasonic sensor |
| **HC-SR04 GND** | GND | GND | Ground |
| **HC-SR04 Trig** | TRIG | GPIO 5 | Trigger pulse output |
| **HC-SR04 Echo** | ECHO | GPIO 18 | Via voltage divider to protect 3.3V pin |
| **Green LED** | Anode (+) | GPIO 21 | Via 220Ω resistor (Available) |
| **Red LED** | Anode (+) | GPIO 22 | Via 220Ω resistor (Occupied) |
| **Status LED** | Anode (+) | GPIO 2 | Onboard / External Blue LED |

---

## Arduino IDE Setup
1. Open Arduino IDE.
2. Go to **File > Preferences** and add ESP32 Board URL:
   `https://raw.githubusercontent.com/espressif/arduino-esp32/gh-pages/package_esp32_index.json`
3. Go to **Tools > Board > Boards Manager**, search `esp32` and click **Install**.
4. Install Required Libraries via **Tools > Manage Libraries**:
   - `PubSubClient` by Nick O'Leary
   - `ArduinoJson` by Benoit Blanchon (v6 or v7)
5. Select your Board (e.g. `DOIT ESP32 DEVKIT V1`) and COM Port.
6. Edit WiFi credentials in `smart_parking_esp32.ino`:
   ```cpp
   const char* WIFI_SSID = "Your_WiFi_Name";
   const char* WIFI_PASS = "Your_WiFi_Password";
   const char* SERVER_REST_URL = "http://YOUR_COMPUTER_IP:5000/api/sensors/data";
   ```
7. Click **Upload**.

---

## Real-Time Testing without Hardware
You can test the system even without physical hardware:
1. Use the built-in **Live IoT Simulator** directly in the web dashboard.
2. Run `npm run simulate` in the terminal to simulate automated sensor telemetry.
3. Use `cURL` or Postman to send telemetry:
   ```bash
   curl -X POST http://localhost:5000/api/sensors/data \
     -H "Content-Type: application/json" \
     -d '{"sensorId":"SENSOR-001","slotId":"A-01","distance":12.5,"status":"occupied"}'
   ```
