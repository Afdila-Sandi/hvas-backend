const { Pool } = require('pg');

// Membuat *connection pool* ke PostgreSQL
const pool = new Pool({
    user: process.env.DB_USER,
    host: process.env.DB_HOST,
    database: process.env.DB_NAME,
    password: process.env.DB_PASSWORD,
    port: 5432,
});

// Verifikasi koneksi saat peladen baru menyala
pool.connect((err, client, release) => {
    if (err) {
        console.error('❌ Gagal terhubung ke database PostgreSQL:', err.message);
    } else {
        console.log('✅ Auth Service berhasil terhubung ke PostgreSQL');
        release();
    }
});

module.exports = pool;