
let sensorRecords = [];

function saveSensorRecord(data) {
    sensorRecords.push({
        timestamp: new Date().toLocaleString(),
        distance_cm: data.distance_cm ?? "",
        dht_temperature: data.dht_temperature ?? "",
        dht_humidity: data.dht_humidity ?? "",
        sht20_temperature: data.sht20_temperature ?? "",
        sht20_humidity: data.sht20_humidity ?? "",
        rfid_uid: data.rfid_uid ?? ""
    });

    const count = document.getElementById("recordCount");

    if (count) {
        count.textContent = sensorRecords.length;
    }

    const exportButton = document.getElementById("exportBtn");

    if (exportButton) {
        exportButton.disabled = sensorRecords.length === 0;
    }
}

function exportCSV() {
    if (sensorRecords.length === 0) {
        alert("No sensor readings available.");
        return;
    }

    const headers = [
        "Timestamp",
        "Distance (cm)",
        "DHT11 Temperature (C)",
        "DHT11 Humidity (%)",
        "SHT20 Temperature (C)",
        "SHT20 Humidity (%)",
        "RFID UID"
    ];

    const rows = sensorRecords.map(record => [
        record.timestamp,
        record.distance_cm,
        record.dht_temperature,
        record.dht_humidity,
        record.sht20_temperature,
        record.sht20_humidity,
        record.rfid_uid
    ]);

    const csv = [headers, ...rows]
        .map(row =>
            row.map(value =>
                `"${String(value).replace(/"/g, '""')}"`
            ).join(",")
        )
        .join("\n");

    const blob = new Blob(
        [csv],
        { type: "text/csv;charset=utf-8;" }
    );

    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");

    link.href = url;
    link.download = "ESP32_Sensor_Readings.csv";

    document.body.appendChild(link);
    link.click();
    link.remove();

    URL.revokeObjectURL(url);
}
