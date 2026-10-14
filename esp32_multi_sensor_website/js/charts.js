
let sensorChart;

function initializeChart() {
    const canvas = document.getElementById("trendChart");

    if (!canvas) return;

    sensorChart = new Chart(canvas, {
        type: "line",

        data: {
            labels: [],

            datasets: [
                {
                    label: "DHT11 Temperature",
                    data: [],
                    borderColor: "#ff9b55",
                    tension: 0.3,
                    yAxisID: "temperature"
                },
                {
                    label: "SHT20 Temperature",
                    data: [],
                    borderColor: "#a78bfa",
                    tension: 0.3,
                    yAxisID: "temperature"
                },
                {
                    label: "DHT11 Humidity",
                    data: [],
                    borderColor: "#36c5e8",
                    tension: 0.3,
                    yAxisID: "humidity"
                },
                {
                    label: "SHT20 Humidity",
                    data: [],
                    borderColor: "#36c98f",
                    tension: 0.3,
                    yAxisID: "humidity"
                }
            ]
        },

        options: {
            responsive: true,
            maintainAspectRatio: false,

            interaction: {
                intersect: false,
                mode: "index"
            },

            scales: {
                x: {
                    title: {
                        display: true,
                        text: "Time"
                    }
                },

                temperature: {
                    type: "linear",
                    position: "left",
                    title: {
                        display: true,
                        text: "Temperature (°C)"
                    }
                },

                humidity: {
                    type: "linear",
                    position: "right",
                    min: 0,
                    max: 100,
                    title: {
                        display: true,
                        text: "Humidity (%)"
                    },
                    grid: {
                        drawOnChartArea: false
                    }
                }
            }
        }
    });

    document.getElementById("chartWindow")
        ?.addEventListener("change", (event) => {
            const limit = Number(event.target.value);

            sensorChart.data.labels =
                sensorChart.data.labels.slice(-limit);

            sensorChart.data.datasets.forEach(dataset => {
                dataset.data = dataset.data.slice(-limit);
            });

            sensorChart.update();
        });
}

function updateChart(data) {
    if (!sensorChart) return;

    sensorChart.data.labels.push(
        new Date().toLocaleTimeString()
    );

    sensorChart.data.datasets[0].data.push(
        data.dht_temperature ?? null
    );

    sensorChart.data.datasets[1].data.push(
        data.sht20_temperature ?? null
    );

    sensorChart.data.datasets[2].data.push(
        data.dht_humidity ?? null
    );

    sensorChart.data.datasets[3].data.push(
        data.sht20_humidity ?? null
    );

    const limit = Number(
        document.getElementById("chartWindow")?.value || 50
    );

    while (sensorChart.data.labels.length > limit) {
        sensorChart.data.labels.shift();

        sensorChart.data.datasets.forEach(dataset => {
            dataset.data.shift();
        });
    }

    sensorChart.update("none");
}
