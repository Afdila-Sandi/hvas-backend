// 1. Panggil Environment Variables
require("dotenv").config();

const http = require("http");
const express = require("express");
const cors = require("cors");

// 2. Panggil logika Control Service
const { initControlService } = require("./src/services/controlService");

const app = express();
const PORT = process.env.PORT || 5002;

app.use(cors());
app.use(express.json());

// 3. Buat Peladen HTTP (Dibutuhkan untuk menempelkan WebSocket)
const server = http.createServer(app);

// 4. Jalankan Service Kendali di latar belakang
initControlService(server);

// 5. Nyalakan Peladen
server.listen(PORT, () => {
  console.log(`⚙️ Control Service berjalan aman di port internal ${PORT}`);
});
