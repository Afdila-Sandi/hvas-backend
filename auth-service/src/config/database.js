const { Pool } = require("pg");

// Konfigurasi pool PostgreSQL
const pool = new Pool({
  user: process.env.DB_USER,
  host: process.env.DB_HOST,
  database: process.env.DB_NAME,
  password: process.env.DB_PASSWORD,
  port: 5432,
});

// Verifikasi koneksi
pool.connect((err, client, release) => {
  if (err) {
    console.error("Gagal terhubung ke database:", err.message);
  } else {
    console.log("Terhubung ke database PostgreSQL");
    release();
  }
});

module.exports = pool;
