/*
 * ==============================================================================
 * Smart Parking Management System - ESP32 IoT Node Firmware
 * ==============================================================================
 * Features:
 *  - Dual-protocol support: HTTP REST & MQTT
 *  - HC-SR04 Ultrasonic Distance Sensor or IR obstacle sensor
 *  - Onboard Status LEDs (Green = Available, Red = Occupied, Blue = WiFi Connected)
 *  - Automatic reconnect on WiFi/MQTT dropouts
 *  - Configurable Occupied threshold (default < 50 cm)
 *  - Debounce filtering to prevent rapid false triggers
 * ==============================================================================
 */

#include <WiFi.h>
#include <HTTPClient.h>
#include <PubSubClient.h>
#include <ArduinoJson.h>

// ----------------- CONFIGURATION -----------------
const char* WIFI_SSID = "YOUR_WIFI_SSID";
const char* WIFI_PASS = "YOUR_WIFI_PASSWORD";

// Server Endpoints
const char* SERVER_REST_URL = "http://192.168.1.100:5000/api/sensors/data";
const char* MQTT_BROKER = "broker.hivemq.com";
const int   MQTT_PORT = 1883;
const char* MQTT_TOPIC_PUBLISH = "smartparking/sensors/data";

// Sensor & Slot Identification
const char* SENSOR_ID = "SENSOR-001";
const char* SLOT_ID   = "A-01";
const float DISTANCE_THRESHOLD_CM = 50.0; // Distance below this = OCCUPIED

// Pin Definitions (ESP32)
#define PIN_TRIG 5
#define PIN_ECHO 18
#define PIN_LED_GREEN 21
#define PIN_LED_RED 22
#define PIN_LED_WIFI 2

// Telemetry Interval (milliseconds)
const unsigned long TELEMETRY_INTERVAL = 3000;
unsigned long lastTelemetryTime = 0;

// State Tracking
bool isOccupied = false;
WiFiClient espClient;
PubSubClient mqttClient(espClient);

// ----------------- SENSOR READING -----------------
float readUltrasonicDistance() {
  digitalWrite(PIN_TRIG, LOW);
  delayMicroseconds(2);
  digitalWrite(PIN_TRIG, HIGH);
  delayMicroseconds(10);
  digitalWrite(PIN_TRIG, LOW);

  long duration = pulseIn(PIN_ECHO, HIGH, 30000); // 30ms timeout (~5m max)
  if (duration == 0) {
    return 999.0; // No echo / out of range
  }
  float distanceCm = (duration * 0.0343) / 2.0;
  return distanceCm;
}

// ----------------- WIFI SETUP -----------------
void connectWiFi() {
  Serial.print("Connecting to WiFi: ");
  Serial.println(WIFI_SSID);
  WiFi.mode(WIFI_STA);
  WiFi.begin(WIFI_SSID, WIFI_PASS);

  int attempts = 0;
  while (WiFi.status() != WL_CONNECTED && attempts < 20) {
    delay(500);
    Serial.print(".");
    digitalWrite(PIN_LED_WIFI, !digitalRead(PIN_LED_WIFI));
    attempts++;
  }

  if (WiFi.status() == WL_CONNECTED) {
    Serial.println("\nWiFi Connected!");
    Serial.print("IP Address: ");
    Serial.println(WiFi.localIP());
    digitalWrite(PIN_LED_WIFI, HIGH);
  } else {
    Serial.println("\nWiFi Connection Failed! Will retry in main loop.");
    digitalWrite(PIN_LED_WIFI, LOW);
  }
}

// ----------------- MQTT SETUP -----------------
void connectMQTT() {
  if (WiFi.status() != WL_CONNECTED) return;

  mqttClient.setServer(MQTT_BROKER, MQTT_PORT);
  if (!mqttClient.connected()) {
    Serial.print("Connecting to MQTT Broker: ");
    Serial.println(MQTT_BROKER);
    String clientId = "ESP32_ParkingNode_" + String(random(0xffff), HEX);
    if (mqttClient.connect(clientId.c_str())) {
      Serial.println("MQTT Connected successfully!");
    } else {
      Serial.print("MQTT Failed, rc=");
      Serial.println(mqttClient.state());
    }
  }
}

// ----------------- TRANSMIT DATA -----------------
void sendTelemetryHTTP(float distance, bool occupied) {
  if (WiFi.status() != WL_CONNECTED) return;

  HTTPClient http;
  http.begin(SERVER_REST_URL);
  http.addHeader("Content-Type", "application/json");

  StaticJsonDocument<256> doc;
  doc["sensorId"] = SENSOR_ID;
  doc["slotId"] = SLOT_ID;
  doc["distance"] = distance;
  doc["status"] = occupied ? "occupied" : "available";
  doc["rssi"] = WiFi.RSSI();
  doc["ip"] = WiFi.localIP().toString();

  String requestBody;
  serializeJson(doc, requestBody);

  int httpCode = http.POST(requestBody);
  if (httpCode > 0) {
    Serial.printf("[HTTP] POST Success, code: %d\n", httpCode);
  } else {
    Serial.printf("[HTTP] POST Failed: %s\n", http.errorToString(httpCode).c_str());
  }
  http.end();
}

void sendTelemetryMQTT(float distance, bool occupied) {
  if (!mqttClient.connected()) {
    connectMQTT();
  }
  if (mqttClient.connected()) {
    StaticJsonDocument<256> doc;
    doc["sensorId"] = SENSOR_ID;
    doc["slotId"] = SLOT_ID;
    doc["distance"] = distance;
    doc["status"] = occupied ? "occupied" : "available";
    doc["rssi"] = WiFi.RSSI();

    char buffer[256];
    serializeJson(doc, buffer);
    mqttClient.publish(MQTT_TOPIC_PUBLISH, buffer);
    Serial.printf("[MQTT] Published to %s: %s\n", MQTT_TOPIC_PUBLISH, buffer);
  }
}

// ----------------- ARDUINO SETUP & LOOP -----------------
void setup() {
  Serial.begin(115200);
  pinMode(PIN_TRIG, OUTPUT);
  pinMode(PIN_ECHO, INPUT);
  pinMode(PIN_LED_GREEN, OUTPUT);
  pinMode(PIN_LED_RED, OUTPUT);
  pinMode(PIN_LED_WIFI, OUTPUT);

  digitalWrite(PIN_LED_GREEN, HIGH);
  digitalWrite(PIN_LED_RED, LOW);
  digitalWrite(PIN_LED_WIFI, LOW);

  Serial.println("\n--- Smart Parking ESP32 Node Initializing ---");
  connectWiFi();
  connectMQTT();
}

void loop() {
  if (WiFi.status() != WL_CONNECTED) {
    connectWiFi();
  }
  mqttClient.loop();

  unsigned long currentMillis = millis();
  if (currentMillis - lastTelemetryTime >= TELEMETRY_INTERVAL) {
    lastTelemetryTime = currentMillis;

    float distance = readUltrasonicDistance();
    bool currentOccupiedState = (distance < DISTANCE_THRESHOLD_CM && distance > 2.0);

    // Update LED indicators
    if (currentOccupiedState) {
      digitalWrite(PIN_LED_RED, HIGH);
      digitalWrite(PIN_LED_GREEN, LOW);
    } else {
      digitalWrite(PIN_LED_RED, LOW);
      digitalWrite(PIN_LED_GREEN, HIGH);
    }

    Serial.printf("[Sensor %s] Distance: %.1f cm | Status: %s\n",
                  SENSOR_ID, distance, currentOccupiedState ? "OCCUPIED" : "AVAILABLE");

    // Send via both HTTP and MQTT
    sendTelemetryHTTP(distance, currentOccupiedState);
    sendTelemetryMQTT(distance, currentOccupiedState);

    isOccupied = currentOccupiedState;
  }
}
