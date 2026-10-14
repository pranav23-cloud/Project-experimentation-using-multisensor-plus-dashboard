# ESP32 Multi-Sensor Dashboard

## Project Overview
SENSORHUB is a real-time multi-sensor monitoring dashboard developed using ESP32 and web technologies. It displays environmental and proximity sensor readings through USB serial communication.

## Hardware Components
- ESP32 Development Board
- RC522 RFID Reader
- HC-SR04 Ultrasonic Sensor
- DHT11 Temperature and Humidity Sensor
- SHT20 Temperature and Humidity Sensor

## Software Technologies
- HTML
- CSS
- JavaScript
- Web Serial API
- Chart.js
- Arduino IDE

## Features
- Real-time sensor monitoring
- RFID card detection
- Ultrasonic distance measurement
- Temperature and humidity monitoring
- Live sensor trend charts
- Minimum, maximum and average analytics
- CSV data export
- Dark and light dashboard themes
- USB serial communication

## Communication Architecture

ESP32 → USB Serial Communication → Web Serial API → JavaScript → Dashboard

## Connection Details
- Communication: USB Serial
- Baud Rate: 115200
- Browser: Google Chrome / Microsoft Edge
- Data Format: JSON

## How to Run
1. Connect the ESP32 to your computer using USB.
2. Upload the compatible firmware to the ESP32.
3. Open the project in Visual Studio Code.
4. Launch `index.html` using Live Server.
5. Click Connect ESP32.
6. Select the ESP32 COM port.
7. View the sensor readings on the dashboard.

## Important
The ESP32 firmware must send JSON-formatted sensor readings compatible with the JavaScript dashboard.

## Project Purpose
To develop a centralized monitoring interface for multiple sensors using embedded systems and web technologies.