
document.addEventListener("DOMContentLoaded", () => {

    initializeChart();

    const connectBtn = document.getElementById("connectBtn");
    const disconnectBtn = document.getElementById("disconnectBtn");

    const startBtn = document.getElementById("startBtn");
    const stopBtn = document.getElementById("stopBtn");

    const rfidToggle = document.getElementById("rfidToggle");
    const intervalSelect = document.getElementById("intervalSelect");
    const applyIntervalBtn = document.getElementById("applyIntervalBtn");

    const exportBtn = document.getElementById("exportBtn");
    const themeToggle = document.getElementById("themeToggle");

    // Connect ESP32
    connectBtn.addEventListener("click", async () => {
        try {
            await esp32.connect();

            connectBtn.classList.add("hidden");
            disconnectBtn.classList.remove("hidden");

            setConnectionStatus(true);

            enableControls(true);

        } catch (error) {
            alert("Connection failed: " + error.message);
        }
    });

    // Disconnect ESP32
    disconnectBtn.addEventListener("click", async () => {
        await esp32.disconnect();
    });

    // Start monitoring
    startBtn.addEventListener("click", () => {
        esp32.sendCommand("START");
        setText("monitorState", "RUNNING");
    });

    // Stop monitoring
    stopBtn.addEventListener("click", () => {
        esp32.sendCommand("STOP");
        setText("monitorState", "STOPPED");
    });

    // RFID toggle
    rfidToggle.addEventListener("change", () => {
        esp32.sendCommand(
            rfidToggle.checked ? "RFID:ON" : "RFID:OFF"
        );
    });

    // Apply interval
    applyIntervalBtn.addEventListener("click", () => {
        esp32.sendCommand(
            "INTERVAL:" + intervalSelect.value
        );

        showToast("Reading interval updated");
    });

    // Export CSV
    exportBtn.addEventListener("click", exportCSV);

    // Theme toggle
    themeToggle.addEventListener("click", () => {
        const currentTheme = document.body.dataset.theme;

        const newTheme =
            currentTheme === "dark" ? "light" : "dark";

        document.body.dataset.theme = newTheme;

        themeToggle.textContent =
            newTheme === "dark" ? "☼" : "☾";
    });

    // Receive ESP32 readings
    esp32.onData = (data) => {

        if (data.type === "sensor") {
            updateSensorCards(data);
            updateChart(data);
            saveSensorRecord(data);

            updateAnalytics();
            setText("lastUpdated", new Date().toLocaleTimeString());
        }

        if (data.type === "status") {
            console.log("ESP32:", data.message);

            if (data.message === "ESP32_CONNECTED") {
                setConnectionStatus(true);
            }

            if (data.message === "ESP32_DISCONNECTED") {
                setConnectionStatus(false);
                enableControls(false);
            }
        }
    };

    esp32.onStatus = (status) => {
        if (status === "ESP32_DISCONNECTED") {
            setConnectionStatus(false);

            connectBtn.classList.remove("hidden");
            disconnectBtn.classList.add("hidden");

            enableControls(false);
        }
    };
});


// Connection status
function setConnectionStatus(connected) {
    setText(
        "connectionText",
        connected ? "Connected" : "Disconnected"
    );

    setText(
        "sidebarConnection",
        connected ? "Connected" : "Disconnected"
    );

    setText(
        "sidebarPort",
        connected ? "USB serial active · 115200" : "USB serial not connected"
    );

    const pill = document.getElementById("connectionPill");

    if (pill) {
        pill.classList.toggle("connected", connected);
    }

    if (!connected) {
        setText("lastUpdated", "Waiting for data");
    }
}


// Enable or disable controls
function enableControls(enabled) {
    [
        "startBtn",
        "stopBtn",
        "rfidToggle",
        "intervalSelect",
        "applyIntervalBtn"
    ].forEach(id => {
        const element = document.getElementById(id);

        if (element) {
            element.disabled = !enabled;
        }
    });

    setText(
        "controlHint",
        enabled
            ? "ESP32 connected. Device controls are active."
            : "Connect your ESP32 to activate controls."
    );
}


// Sensor display
function updateSensorCards(data) {

    setText("distanceValue", formatValue(data.distance_cm));
    setText("dhtTempValue", formatValue(data.dht_temperature));
    setText("dhtHumidityValue", formatValue(data.dht_humidity));
    setText("shtTempValue", formatValue(data.sht20_temperature));
    setText("shtHumidityValue", formatValue(data.sht20_humidity));

    setText("rfidUid", data.rfid_uid || "No card detected");

    setText(
        "rfidState",
        data.rfid_new ? "New card detected" : "Waiting for card"
    );

    setText(
        "distanceState",
        data.distance_cm == null ? "No reading" : "Reading received"
    );

    setText("dhtTempState", "Reading received");
    setText("dhtHumidityState", "Reading received");
    setText("shtTempState", "Reading received");
    setText("shtHumidityState", "Reading received");
}


// Format values
function formatValue(value) {
    if (value === null || value === undefined || value === "") {
        return "--";
    }

    const number = Number(value);

    return Number.isFinite(number) ? number.toFixed(2) : "--";
}


// Update analytics table
function updateAnalytics() {

    const records = sensorRecords;

    const parameters = [
        ["Distance (cm)", "distance_cm"],
        ["DHT11 Temperature (°C)", "dht_temperature"],
        ["DHT11 Humidity (%)", "dht_humidity"],
        ["SHT20 Temperature (°C)", "sht20_temperature"],
        ["SHT20 Humidity (%)", "sht20_humidity"]
    ];

    const tbody = document.getElementById("analyticsBody");

    if (!tbody || records.length === 0) return;

    tbody.innerHTML = "";

    parameters.forEach(([name, key]) => {

        const values = records
            .map(record => Number(record[key]))
            .filter(value => Number.isFinite(value));

        if (values.length === 0) return;

        const min = Math.min(...values);
        const max = Math.max(...values);

        const avg = values.reduce((sum, value) => sum + value, 0)
            / values.length;

        const row = document.createElement("tr");

        [name, min.toFixed(2), max.toFixed(2), avg.toFixed(2)]
            .forEach(value => {
                const cell = document.createElement("td");
                cell.textContent = value;
                row.appendChild(cell);
            });

        tbody.appendChild(row);
    });
}


// Update text safely
function setText(id, value) {
    const element = document.getElementById(id);

    if (element) {
        element.textContent = value;
    }
}


// Show notification
function showToast(message) {
    const toast = document.getElementById("toast");

    if (!toast) return;

    toast.textContent = message;
    toast.classList.add("show");

    setTimeout(() => {
        toast.classList.remove("show");
    }, 2500);
}
