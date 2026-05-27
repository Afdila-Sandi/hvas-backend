const mqtt = require('mqtt');
const WebSocket = require('ws');
const pool = require('../config/database');

exports.initSensorService = (wss) => {
    const MQTT_BROKER = process.env.MQTT_BROKER;
    const mqttClient = mqtt.connect(MQTT_BROKER);

    let latestSensorData = null;

    // 1. Logika MQTT
    mqttClient.on('connect', () => {
        console.log('✅ Monitor Service terhubung ke Broker MQTT');
        mqttClient.subscribe('esp/data');
    });

    mqttClient.on('message', (topic, message) => {
        try {
            const data = JSON.parse(message.toString());
            
            // Simpan ke Buffer
            latestSensorData = {
                waktu: data.waktu || new Date().toISOString(),
                suhu_bme: data.suhu_bme || 0.0,
                kelembaban_bme: data.kelembaban_bme || 0.0,
                tekanan: data.tekanan || 0.0,
                status_pompa: data.status_relay || 'OFF',
                suhu_dht: data.suhu_dht || 0.0,
                kelembaban_dht: data.kelembaban_dht || 0.0,
                kebisingan: data.kebisingan || 0.0
            };

            // Broadcast Real-time ke Client Vue.js
            const realtimeData = { ...latestSensorData, type: 'realtime_data' };
            const payload = JSON.stringify(realtimeData);
            
            wss.clients.forEach(wsClient => {
                if (wsClient.readyState === WebSocket.OPEN) {
                    wsClient.send(payload);
                }
            });
        } catch (err) {
            console.error('❌ Gagal memproses data MQTT:', err.message);
        }
    });

    // 2. Penjadwalan Simpan ke DB (Interval 1 Menit)
    setInterval(async () => {
        if (!latestSensorData) return;
        
        let client;
        try {
            client = await pool.connect();
            const query = `
                INSERT INTO log_sensor (waktu, suhu_bme, kelembaban_bme, tekanan, status_pompa, suhu_dht, kelembaban_dht, kebisingan)
                VALUES ($1,$2,$3,$4,$5,$6,$7,$8)
            `;
            const values = [
                latestSensorData.waktu, latestSensorData.suhu_bme, latestSensorData.kelembaban_bme,
                latestSensorData.tekanan, latestSensorData.status_pompa, latestSensorData.suhu_dht,
                latestSensorData.kelembaban_dht, latestSensorData.kebisingan
            ];
            await client.query(query, values);
            console.log('💾 Data (sampling) berhasil disimpan ke DB (Interval 1 Menit)');
        } catch (err) {
            console.error('❌ Gagal menyimpan data periodik ke DB:', err.message);
        } finally {
            if (client) client.release();
        }
    }, 60000);
};