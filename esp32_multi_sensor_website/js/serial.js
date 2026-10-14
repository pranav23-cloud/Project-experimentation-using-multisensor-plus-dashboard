
class ESP32Serial {
    constructor() {
        this.port = null;
        this.reader = null;
        this.writer = null;
        this.keepReading = false;
        this.onData = null;
        this.onStatus = null;
        this.decoder = new TextDecoder();
        this.encoder = new TextEncoder();
        this.buffer = "";
    }

    async connect() {
        if (!("serial" in navigator)) {
            throw new Error("Use Chrome or Edge to connect through USB.");
        }

        this.port = await navigator.serial.requestPort();

        await this.port.open({ baudRate: 115200 });

        this.writer = this.port.writable.getWriter();
        this.keepReading = true;

        this.onStatus?.("ESP32_CONNECTED");

        this.readLoop();

        return true;
    }

    async readLoop() {
        while (this.port && this.port.readable && this.keepReading) {
            this.reader = this.port.readable.getReader();

            try {
                while (this.keepReading) {
                    const { value, done } = await this.reader.read();

                    if (done) break;

                    if (value) {
                        this.buffer += this.decoder.decode(value, {
                            stream: true
                        });

                        const lines = this.buffer.split("\n");
                        this.buffer = lines.pop();

                        for (let line of lines) {
                            line = line.trim();

                            if (!line) continue;

                            try {
                                const data = JSON.parse(line);
                                this.onData?.(data);
                            } catch {
                                console.warn("Non-JSON serial line:", line);
                            }
                        }
                    }
                }
            } catch (error) {
                console.error("Serial reading error:", error);
            } finally {
                this.reader.releaseLock();
            }
        }
    }

    async sendCommand(command) {
        if (!this.writer) {
            console.warn("ESP32 is not connected.");
            return;
        }

        await this.writer.write(
            this.encoder.encode(command + "\n")
        );
    }

    async disconnect() {
        this.keepReading = false;

        try {
            if (this.reader) {
                await this.reader.cancel();
                this.reader = null;
            }

            if (this.writer) {
                this.writer.releaseLock();
                this.writer = null;
            }

            if (this.port) {
                await this.port.close();
                this.port = null;
            }

            this.onStatus?.("ESP32_DISCONNECTED");

        } catch (error) {
            console.error("Disconnect error:", error);
        }
    }
}

const esp32 = new ESP32Serial();
