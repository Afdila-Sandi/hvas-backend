require('dotenv').config();
const http = require('http');
const express = require('express');
const cors = require('cors');
const WebSocket = require('ws');

const historyRoutes = require('./src/routes/historyRoutes');
const { initSensorService } = require('./src/services/sensorService');

const app = express();
const PORT = process.env.PORT || 5001;

app.use(cors());
app.use(express.json());

// 1. Panggil Rute API HTTP
app.use('/api/monitor', historyRoutes);

const server = http.createServer(app);

// 2. Setup Endpoint WebSocket
const wss = new WebSocket.Server({ server, path: '/ws/monitor' });

// 3. Jalankan service MQTT & WebSocket di background
initSensorService(wss);

server.listen(PORT, () => {
    console.log(`📊 Monitoring Service berjalan di port internal ${PORT}`);
});