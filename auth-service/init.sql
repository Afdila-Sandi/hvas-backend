CREATE TABLE IF NOT EXISTS users (
    id SERIAL PRIMARY KEY,
    username VARCHAR(50) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    nama VARCHAR(100) NOT NULL,
    peran VARCHAR(50) CHECK (peran IN ('teknisi', 'admin')) NOT NULL,
    dibuat_pada TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Seeder Akun Default (Username: teknisi_bspji | Sandi: hvas123)
INSERT INTO users (username, password_hash, nama, peran) 
VALUES (
    'teknisi_bspji', 
    '$2b$10$03jCx2qCGy973Cg05O02cOAu/wenm1LIG1AZ3vM/DZlufXEw77Xo2', 
    'Teknisi Lab BSPJI', 
    'teknisi'
) ON CONFLICT (username) DO NOTHING;