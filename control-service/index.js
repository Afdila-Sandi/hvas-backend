//memanggil variabel dari .env
require('dotenv').config();

const http = require('http');
const express = require('express');
const cors = require('cors');
const { initControlService } = require('./src/services/controlService');

const app = express();
const PORT = process.env.PORT || 5003;

app.use(cors());
app.use(express.json());
//membuat jalur WebSocket
const server = http.createServer(app);
//menjalankan logika MQTT dan WebSocket
initControlService(server, app);
//menjalankan jalur websocket
server.listen(PORT, () => {
    console.log(`Control Service berjalan di port ${PORT}`);
});