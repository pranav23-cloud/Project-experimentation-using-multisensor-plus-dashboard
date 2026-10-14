#include <SPI.h>
#include <Wire.h>
#include <MFRC522.h>
#include <DHT.h>
#include <DFRobot_SHT20.h>
#include <math.h>

// ==========================================
// 1. RFID RC522 - SPI
// ==========================================
#define RFID_SS_PIN  5
#define RFID_RST_PIN 27

#define RFID_SCK  18
#define RFID_MISO 19
#define RFID_MOSI 23

MFRC522 rfid(RFID_SS_PIN, RFID_RST_PIN);

// ==========================================
// 2. HC-SR04 - DIGITAL GPIO
// ==========================================
#define TRIG_PIN 25
#define ECHO_PIN 26

// ==========================================
// 3. DHT11 - SINGLE WIRE
// ==========================================
#define DHT_PIN 4
#define DHT_TYPE DHT11

DHT dht(DHT_PIN, DHT_TYPE);

// ==========================================
// 4. SHT20 - I2C
// ==========================================
#define SDA_PIN 21
#define SCL_PIN 22

DFRobot_SHT20 sht20;

// ==========================================
// SYSTEM SETTINGS
// ==========================================
const unsigned long RFID_SCAN_INTERVAL = 50;

unsigned long reportingInterval = 2500;
unsigned long previousReportTime = 0;
unsigned long previousRFIDTime = 0;

bool monitoringEnabled = true;
bool rfidEnabled = true;

bool rfidAvailable = false;
bool sht20Available = false;

String lastRFIDUID = "";
String lastRFIDCardType = "";

byte lastRFIDUIDLength = 0;
bool newRFIDCard = false;

// ==========================================
// SENSOR VALUES
// ==========================================
float distanceCM = NAN;

float dhtTemperature = NAN;
float dhtHumidity = NAN;

float sht20Temperature = NAN;
float sht20Humidity = NAN;

// ==========================================
// SERIAL COMMAND BUFFER
// ==========================================
String commandBuffer = "";

// ==========================================
// JSON STATUS RESPONSE
// ==========================================
void sendStatus(String message) {

  Serial.print("{\"type\":\"status\",\"message\":\"");
  Serial.print(message);
  Serial.println("\"}");
}

// ==========================================
// READ RFID CARD
// ==========================================
void readRFID() {

  if (!rfidEnabled || !rfidAvailable) {
    return;
  }

  if (millis() - previousRFIDTime < RFID_SCAN_INTERVAL) {
    return;
  }

  previousRFIDTime = millis();

  if (!rfid.PICC_IsNewCardPresent()) {
    return;
  }

  if (!rfid.PICC_ReadCardSerial()) {
    return;
  }

  lastRFIDUID = "";

  for (byte i = 0; i < rfid.uid.size; i++) {

    if (rfid.uid.uidByte[i] < 0x10) {
      lastRFIDUID += "0";
    }

    lastRFIDUID += String(rfid.uid.uidByte[i], HEX);

    if (i < rfid.uid.size - 1) {
      lastRFIDUID += " ";
    }
  }

  lastRFIDUID.toUpperCase();

  lastRFIDUIDLength = rfid.uid.size;

  lastRFIDCardType = String(
    rfid.PICC_GetTypeName(
      rfid.PICC_GetType(rfid.uid.sak)
    )
  );

  newRFIDCard = true;

  rfid.PICC_HaltA();
  rfid.PCD_StopCrypto1();
}

// ==========================================
// READ HC-SR04
// ==========================================
void readUltrasonic() {

  digitalWrite(TRIG_PIN, LOW);
  delayMicroseconds(2);

  digitalWrite(TRIG_PIN, HIGH);
  delayMicroseconds(10);

  digitalWrite(TRIG_PIN, LOW);

  unsigned long duration = pulseIn(ECHO_PIN, HIGH, 30000);

  if (duration == 0) {
    distanceCM = NAN;
    return;
  }

  float value = duration * 0.0343 / 2.0;

  if (value < 2.0 || value > 400.0) {
    distanceCM = NAN;
    return;
  }

  distanceCM = value;
}

// ==========================================
// READ DHT11
// ==========================================
void readDHT11() {

  float humidity = dht.readHumidity();
  float temperature = dht.readTemperature();

  if (isnan(humidity) || isnan(temperature)) {
    dhtTemperature = NAN;
    dhtHumidity = NAN;
    return;
  }

  if (temperature < 0 || temperature > 50 ||
      humidity < 0 || humidity > 100) {

    dhtTemperature = NAN;
    dhtHumidity = NAN;
    return;
  }

  dhtTemperature = temperature;
  dhtHumidity = humidity;
}

// ==========================================
// READ SHT20
// ==========================================
void readSHT20() {

  if (!sht20Available) {
    sht20Temperature = NAN;
    sht20Humidity = NAN;
    return;
  }

  float temperature = sht20.readTemperature();
  float humidity = sht20.readHumidity();

  if (!isfinite(temperature) || !isfinite(humidity)) {
    sht20Temperature = NAN;
    sht20Humidity = NAN;
    return;
  }

  if (temperature < -40 || temperature > 125 ||
      humidity < 0 || humidity > 100) {

    sht20Temperature = NAN;
    sht20Humidity = NAN;
    return;
  }

  sht20Temperature = temperature;
  sht20Humidity = humidity;
}

// ==========================================
// PRINT FLOAT OR JSON NULL
// ==========================================
void printJSONFloat(float value, byte decimals) {

  if (isfinite(value)) {
    Serial.print(value, decimals);
  } else {
    Serial.print("null");
  }
}

// ==========================================
// SEND SENSOR DATA AS JSON
// ==========================================
void sendSensorData() {

  Serial.print("{");

  Serial.print("\"type\":\"sensor\",");

  Serial.print("\"rfid_enabled\":");
  Serial.print(rfidEnabled ? "true" : "false");
  Serial.print(",");

  Serial.print("\"rfid_uid\":");

  if (rfidEnabled && rfidAvailable && lastRFIDUID.length() > 0) {
    Serial.print("\"");
    Serial.print(lastRFIDUID);
    Serial.print("\"");
  } else {
    Serial.print("null");
  }

  Serial.print(",");

  Serial.print("\"rfid_new\":");
  Serial.print(newRFIDCard ? "true" : "false");
  Serial.print(",");

  Serial.print("\"rfid_card_type\":");

  if (rfidEnabled && lastRFIDCardType.length() > 0) {
    Serial.print("\"");
    Serial.print(lastRFIDCardType);
    Serial.print("\"");
  } else {
    Serial.print("null");
  }

  Serial.print(",");

  Serial.print("\"rfid_uid_length\":");
  Serial.print(lastRFIDUIDLength);
  Serial.print(",");

  Serial.print("\"distance_cm\":");
  printJSONFloat(distanceCM, 2);
  Serial.print(",");

  Serial.print("\"dht_temperature\":");
  printJSONFloat(dhtTemperature, 1);
  Serial.print(",");

  Serial.print("\"dht_humidity\":");
  printJSONFloat(dhtHumidity, 1);
  Serial.print(",");

  Serial.print("\"sht20_temperature\":");
  printJSONFloat(sht20Temperature, 2);
  Serial.print(",");

  Serial.print("\"sht20_humidity\":");
  printJSONFloat(sht20Humidity, 2);
  Serial.print(",");

  Serial.print("\"interval_ms\":");
  Serial.print(reportingInterval);

  Serial.println("}");

  newRFIDCard = false;
}

// ==========================================
// PROCESS WEBPAGE COMMANDS
// ==========================================
void processCommand(String command) {

  command.trim();
  command.toUpperCase();

  if (command == "START") {

    monitoringEnabled = true;
    previousReportTime = millis();

    sendStatus("MONITORING_STARTED");
  }

  else if (command == "STOP") {

    monitoringEnabled = false;

    sendStatus("MONITORING_STOPPED");
  }

  else if (command == "RFID:ON") {

    rfidEnabled = true;

    sendStatus("RFID_ENABLED");
  }

  else if (command == "RFID:OFF") {

    rfidEnabled = false;
    newRFIDCard = false;

    sendStatus("RFID_DISABLED");
  }

  else if (command.startsWith("INTERVAL:")) {

    String value = command.substring(9);

    unsigned long requestedInterval = value.toInt();

    if (requestedInterval >= 2000 &&
        requestedInterval <= 60000) {

      reportingInterval = requestedInterval;

      sendStatus("INTERVAL_UPDATED");
    }

    else {
      sendStatus("INVALID_INTERVAL_USE_2000_TO_60000");
    }
  }

  else {
    sendStatus("UNKNOWN_COMMAND");
  }
}

// ==========================================
// RECEIVE USB SERIAL COMMANDS
// ==========================================
void receiveCommands() {

  while (Serial.available() > 0) {

    char incomingChar = Serial.read();

    if (incomingChar == '\n') {

      if (commandBuffer.length() > 0) {
        processCommand(commandBuffer);
        commandBuffer = "";
      }
    }

    else if (incomingChar != '\r') {

      if (commandBuffer.length() < 80) {
        commandBuffer += incomingChar;
      } else {
        commandBuffer = "";
        sendStatus("COMMAND_TOO_LONG");
      }
    }
  }
}

// ==========================================
// SETUP
// ==========================================
void setup() {

  Serial.begin(115200);
  delay(1000);

  // HC-SR04
  pinMode(TRIG_PIN, OUTPUT);
  pinMode(ECHO_PIN, INPUT);
  digitalWrite(TRIG_PIN, LOW);

  // DHT11
  dht.begin();

  // SHT20 I2C
  Wire.begin(SDA_PIN, SCL_PIN);
  Wire.setClock(100000);

  sht20.initSHT20();
  delay(100);

  Wire.beginTransmission(0x40);
  sht20Available = (Wire.endTransmission() == 0);

  // RFID SPI
  SPI.begin(
    RFID_SCK,
    RFID_MISO,
    RFID_MOSI,
    RFID_SS_PIN
  );

  rfid.PCD_Init();
  delay(50);

  byte version = rfid.PCD_ReadRegister(
    MFRC522::VersionReg
  );

  rfidAvailable = (version != 0x00 && version != 0xFF);

  if (rfidAvailable) {
    rfid.PCD_AntennaOn();
    rfid.PCD_SetAntennaGain(MFRC522::RxGain_max);
  }

  // Initial status
  sendStatus("ESP32_CONNECTED");

  sendStatus(
    rfidAvailable ? "RFID_READY" : "RFID_NOT_AVAILABLE"
  );

  sendStatus(
    sht20Available ? "SHT20_READY" : "SHT20_NOT_AVAILABLE"
  );

  sendStatus("DHT11_INITIALIZED");
  sendStatus("HC_SR04_INITIALIZED");
  sendStatus("SYSTEM_READY");
}

// ==========================================
// MAIN LOOP
// ==========================================
void loop() {

  // Always receive commands, even when monitoring stops
  receiveCommands();

  // RFID scanning is independent of report interval
  readRFID();

  // Send sensor data only when monitoring is enabled
  if (monitoringEnabled &&
      millis() - previousReportTime >= reportingInterval) {

    previousReportTime = millis();

    // Read all sensors
    readUltrasonic();
    readDHT11();
    readSHT20();

    // Send one complete JSON line
    sendSensorData();
  }
}
