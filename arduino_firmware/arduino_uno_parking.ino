/*
 * ==============================================================================
 * Smart Parking Management System - Arduino Uno Firmware
 * ==============================================================================
 * 
 * 🚦 Traffic Light LED Status Logic:
 *   1. 🟢 GREEN LED  -> Slot is EMPTY / AVAILABLE (Ready for Parking)
 *   2. 🟡 YELLOW LED -> Slot is RESERVED (Booked from Web Dashboard)
 *   3. 🔴 RED LED    -> Slot is OCCUPIED (Car Arrived & Parked)
 * 
 * 📌 Hardware Pin Connections:
 *   - IR Obstacle Sensor:
 *       OUT  -> Arduino Digital Pin 2 (D2)
 *       VCC  -> Arduino 5V
 *       GND  -> Arduino GND
 *
 *   - Traffic Light LED Module:
 *       R (Red)    -> Arduino Digital Pin 8 (D8)   [OCCUPIED]
 *       Y (Yellow) -> Arduino Digital Pin 9 (D9)   [RESERVED]
 *       G (Green)  -> Arduino Digital Pin 10 (D10) [AVAILABLE]
 *       GND        -> Arduino GND
 * ==============================================================================
 */

// Pin Definitions
const int IR_PIN     = 2;   // IR Sensor OUT pin
const int LED_RED    = 8;   // Red LED (Occupied)
const int LED_YELLOW = 9;   // Yellow LED (Reserved)
const int LED_GREEN  = 10;  // Green LED (Available)

// Sensor and Slot Identifiers
const char* SENSOR_ID = "SENSOR-001";
const char* SLOT_ID   = "A-01";

// Timing Configuration
const unsigned long DEBOUNCE_DELAY_MS  = 5000; // 5-second continuous hold to confirm parking arrival/departure
const unsigned long HEARTBEAT_INTERVAL = 3000; // Send heartbeat reading every 3 seconds

// State Variables
bool isOccupied        = false;
bool isReserved        = false;
bool pendingOccupied   = false;
bool isVerifying       = false;
unsigned long verifyStartTime = 0;
unsigned long lastHeartbeatTime = 0;

// Helper to set LED states cleanly
void updateLeds() {
  if (isOccupied) {
    // 🔴 OCCUPIED: Red ON, Yellow & Green OFF
    digitalWrite(LED_RED, HIGH);
    digitalWrite(LED_YELLOW, LOW);
    digitalWrite(LED_GREEN, LOW);
  } else if (isReserved) {
    // 🟡 RESERVED: Yellow ON, Red & Green OFF
    digitalWrite(LED_RED, LOW);
    digitalWrite(LED_YELLOW, HIGH);
    digitalWrite(LED_GREEN, LOW);
  } else {
    // 🟢 AVAILABLE: Green ON, Red & Yellow OFF
    digitalWrite(LED_RED, LOW);
    digitalWrite(LED_YELLOW, LOW);
    digitalWrite(LED_GREEN, HIGH);
  }
}

// Send JSON telemetry to PC / Web Dashboard
void sendTelemetry(const char* statusStr, float distanceVal) {
  Serial.print("{\"sensorId\":\"");
  Serial.print(SENSOR_ID);
  Serial.print("\",\"slotId\":\"");
  Serial.print(SLOT_ID);
  Serial.print("\",\"distance\":");
  Serial.print(distanceVal);
  Serial.print(",\"status\":\"");
  Serial.print(statusStr);
  Serial.println("\"}");
}

void setup() {
  // Initialize Serial at 9600 baud
  Serial.begin(9600);
  Serial.setTimeout(50); // Fast non-blocking serial read

  pinMode(IR_PIN, INPUT);
  pinMode(LED_RED, OUTPUT);
  pinMode(LED_YELLOW, OUTPUT);
  pinMode(LED_GREEN, OUTPUT);

  // Initial LED Startup Self-Test
  digitalWrite(LED_RED, HIGH);
  digitalWrite(LED_YELLOW, HIGH);
  digitalWrite(LED_GREEN, HIGH);
  delay(800);
  
  // Set default state: GREEN (Available)
  isOccupied = false;
  isReserved = false;
  updateLeds();

  // Send startup state to server
  sendTelemetry("available", 150.0);
}

// Check for 2-Way Commands from Web Dashboard (Reserve / Free)
void checkIncomingCommands() {
  while (Serial.available() > 0) {
    String cmd = Serial.readStringUntil('\n');
    cmd.trim();
    cmd.toUpperCase();

    if (cmd.length() == 0) continue;

    if (cmd.indexOf("RESERVE") >= 0) {
      // 🟡 Web Dashboard booked the slot -> Turn YELLOW LED ON
      isReserved = true;
      isOccupied = false;
      updateLeds();
      Serial.println(F("{\"status\":\"reserved\",\"ack\":\"CMD_RESERVE_APPLIED\"}"));
    } 
    else if (cmd.indexOf("AVAILABLE") >= 0) {
      // 🟢 Web Dashboard cancelled booking -> Turn GREEN LED ON
      isReserved = false;
      isOccupied = false;
      updateLeds();
      Serial.println(F("{\"status\":\"available\",\"ack\":\"CMD_AVAILABLE_APPLIED\"}"));
    }
  }
}

void loop() {
  // 1. Process 2-way commands from Web Dashboard
  checkIncomingCommands();

  // 2. Read IR Sensor (HIGH = Object/Car Detected, LOW = Empty/Clear)
  int rawRead = digitalRead(IR_PIN);
  bool rawOccupied = (rawRead == HIGH);

  unsigned long now = millis();

  // 3. Debounce / Stability Detection Logic
  if (rawOccupied != isOccupied) {
    if (!isVerifying || rawOccupied != pendingOccupied) {
      // New state change detected -> Start 3-second verification timer
      isVerifying = true;
      pendingOccupied = rawOccupied;
      verifyStartTime = now;
    } else {
      // Check if state remained constant for full debounce delay
      if (now - verifyStartTime >= DEBOUNCE_DELAY_MS) {
        isOccupied = pendingOccupied;
        isVerifying = false;

        if (isOccupied) {
          // 🚗 CAR ARRIVED & PARKED -> Red LED ON
          isReserved = false; // Clear reservation once parked
          updateLeds();
          sendTelemetry("occupied", 15.0);
        } else {
          // 🟢 CAR DEPARTED -> Green LED ON (Reservation Completed & Bay Free)
          isReserved = false;
          updateLeds();
          sendTelemetry("available", 150.0);
        }
        lastHeartbeatTime = now;
      }
    }
  } else {
    // If brief glitch occurred, cancel verification
    if (isVerifying) {
      isVerifying = false;
    }

    // Heartbeat every 3 seconds to keep Web Dashboard alive
    if (now - lastHeartbeatTime >= HEARTBEAT_INTERVAL) {
      lastHeartbeatTime = now;
      const char* currentStatus = isOccupied ? "occupied" : (isReserved ? "reserved" : "available");
      float currentDist = isOccupied ? 15.0 : 150.0;
      sendTelemetry(currentStatus, currentDist);
    }
  }

  delay(40);
}
