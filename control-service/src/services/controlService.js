const WebSocket = require('ws');
const mqtt = require('mqtt');
const jwt = require('jsonwebtoken');

exports.initControlService = (server) => {
    // Membaca konfigurasi dari .env
    const SECRET_KEY = process.env.JWT_SECRET;
    const MQTT_BROKER = process.env.MQTT_BROKER;
    const mqttClient = mqtt.connect(MQTT_BROKER);

    // Mengaitkan WebSocket ke peladen HTTP Express
    const wss = new WebSocket.Server({ server, path: '/ws/control' });

    // Variabel Status (State)
    let currentRelayStatus = 'OFF';
    let timerEndTime = null;

    // Fungsi untuk menyiarkan status ke semua klien Vue.js
    function broadcastStatus() {
        const statusPayload = {
            status_relay: currentRelayStatus,
            timer_end_time: timerEndTime ? timerEndTime.toISOString() : null,
            type: 'status_update'
        };
        const payloadString = JSON.stringify(statusPayload);
        wss.clients.forEach(client => {
            if (client.readyState === WebSocket.OPEN) {
                client.send(payloadString);
            }
        });
    }

    // 1. Logika MQTT (Berkomunikasi dengan ESP8266)
    mqttClient.on('connect', () => {
        console.log('✅ Control Service terhubung ke Broker MQTT');
        mqttClient.subscribe('esp/data');
    });

    mqttClient.on('message', (topic, message) => {
        try {
            const data = JSON.parse(message.toString());
            // Sinkronisasi status jika alat ditekan manual di lapangan
            if (data.status_relay) {
                currentRelayStatus = data.status_relay;
                if (currentRelayStatus === 'OFF') timerEndTime = null;
            }
        } catch (err) {}
    });

    // 2. Logika Timer Otomatis (Cek setiap 1 detik)
    setInterval(() => {
        if (timerEndTime && Date.now() >= timerEndTime.getTime()) {
            console.log('⏰ Waktu timer habis! Mengirim OFF ke ESP.');
            mqttClient.publish('esp/relay/kontrol', 'OFF');
            timerEndTime = null;
            currentRelayStatus = 'OFF';
            broadcastStatus();
        }
    }, 1000);

    // 3. Logika WebSocket (Menerima perintah dari Vue.js)
    wss.on('connection', (ws) => {
        console.log('💻 Client Vue.js terhubung ke Control Service');
        
        // Kirim status awal saat baru masuk halaman
        ws.send(JSON.stringify({
            status_relay: currentRelayStatus,
            timer_end_time: timerEndTime ? timerEndTime.toISOString() : null,
            type: 'initial_status'
        }));

        ws.on('message', (message) => {
            try {
                const command = JSON.parse(message);

                // --- PROTEKSI KEAMANAN LAPIS GANDA ---
                if (!command.token) {
                    ws.send(JSON.stringify({ type: 'error', message: 'Ditolak: Token JWT tidak ada.' }));
                    return;
                }

                let decoded;
                try {
                    decoded = jwt.verify(command.token, SECRET_KEY);
                } catch (jwtErr) {
                    ws.send(JSON.stringify({ type: 'error', message: 'Ditolak: Token JWT kedaluwarsa atau tidak valid.' }));
                    return;
                }

                // Proteksi Peran: Tolak jika yang mencoba mengontrol bukan teknisi lapangan
                if (decoded.role !== 'teknisi_lapangan') {
                    ws.send(JSON.stringify({ type: 'error', message: 'Ditolak: Akses ilegal. Hanya Teknisi Lapangan yang dapat mengontrol alat.' }));
                    return;
                }
                // ---------------------------------------

                // Eksekusi Perintah jika lolos proteksi
                if (command.aksi === 'kontrol') {
                    if (command.perintah === 'OFF') {
                        timerEndTime = null;
                        currentRelayStatus = 'OFF';
                    } else if (command.perintah === 'ON') {
                        timerEndTime = null;
                        currentRelayStatus = 'ON';
                    }
                    mqttClient.publish('esp/relay/kontrol', command.perintah);
                    broadcastStatus();
                } else if (command.aksi === 'timer') {
                    const durationMinutes = command.durasi;
                    timerEndTime = new Date(Date.now() + durationMinutes * 60 * 1000);
                    currentRelayStatus = 'ON';
                    mqttClient.publish('esp/relay/set_timer', String(durationMinutes));
                    broadcastStatus();
                }
            } catch (err) {
                console.error('Format pesan dari klien bukan JSON');
            }
        });

        ws.on('close', () => console.log('❌ Client Control terputus'));
    });
};