// 1. Inisialisasi variabel lingkungan (.env) paling awal
require('dotenv').config();

const express = require('express');
const cors = require('cors');

// 2. Panggil peta rute (router) yang sudah dibuat
const authRoutes = require('./src/routes/authRoutes');

const app = express();
const PORT = process.env.PORT || 5000;

// 3. Middleware Dasar
app.use(cors());
app.use(express.json());

// 4. Daftarkan Rute Utama
// Semua yang mengarah ke '/api/auth' akan dilempar ke fail authRoutes.js
app.use('/api/auth', authRoutes);

// 5. Nyalakan Peladen
app.listen(PORT, () => {
    console.log(`🔒 Auth Service berjalan aman di port internal ${PORT}`);
});