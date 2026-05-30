CREATE TABLE IF NOT EXISTS users (
    id SERIAL PRIMARY KEY,
    username VARCHAR(50) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    nama_lengkap VARCHAR(100) NOT NULL,
    peran VARCHAR(50) CHECK (peran IN ('teknisi', 'admin')) NOT NULL,
    dibuat_pada TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Seeder Akun Default (Sandi: hvas123)
INSERT INTO users (username, password_hash, nama_lengkap, peran) 
VALUES (
    'teknisi_bspji', 
    '$2a$10$wE99k28M.E4W2yO3H/p1oO7Mv8P3z.V6v1e8z7M1O0eZu24R3qT0.', 
    'Teknisi Lab BSPJI', 
    'teknisi_lapangan'
) ON CONFLICT (username) DO NOTHING;