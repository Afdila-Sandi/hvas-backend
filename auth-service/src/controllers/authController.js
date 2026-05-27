const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const pool = require('../config/database');

exports.login = async (req, res) => {
    const { username, password } = req.body;

    try {
        // 1. Cari pengguna di tabel database
        const dbQuery = 'SELECT * FROM pengguna WHERE username = $1';
        const result = await pool.query(dbQuery, [username]);

        // Jika username tidak ditemukan di database
        if (result.rows.length === 0) {
            return res.status(401).json({ 
                success: false, 
                message: 'Username tidak terdaftar' 
            });
        }

        const user = result.rows[0];

        // 2. Bandingkan password teks dengan password_hash di database
        const isMatch = await bcrypt.compare(password, user.password_hash);

        // Jika password salah
        if (!isMatch) {
            return res.status(401).json({ 
                success: false, 
                message: 'Password salah' 
            });
        }

        // 3. Jika berhasil login, buat Token JWT
        const SECRET_KEY = process.env.JWT_SECRET || 'bspji_rahasia_super_kuat';
        const token = jwt.sign(
            { 
                id: user.id_pengguna, 
                username: user.username, 
                role: user.peran // Akan berisi 'teknisi_lapangan' atau 'admin_pemantau'
            },
            SECRET_KEY,
            { expiresIn: '24h' }
        );

        // Kirim respon sukses beserta token ke Vue.js
        return res.status(200).json({ 
            success: true, 
            message: 'Otentikasi berhasil',
            token: token,
            role: user.peran
        });

    } catch (error) {
        console.error('❌ Error pada proses login:', error.message);
        return res.status(500).json({ 
            success: false, 
            message: 'Terjadi kesalahan pada peladen' 
        });
    }
};