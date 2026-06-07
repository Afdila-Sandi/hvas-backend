const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const pool = require("../config/database");

// login
exports.login = async (req, res) => {
  const { username, password } = req.body;

  try {
    // Cari pengguna
    const dbQuery = "SELECT * FROM users WHERE username = $1";
    const result = await pool.query(dbQuery, [username]);

    if (result.rows.length === 0) {
      return res.status(401).json({
        success: false,
        message: "Username tidak terdaftar",
      });
    }

    const user = result.rows[0];

    // Verifikasi kata sandi
    const isMatch = await bcrypt.compare(password, user.password_hash);

    if (!isMatch) {
      return res.status(401).json({
        success: false,
        message: "Password salah",
      });
    }

    // Buat JWT
    const SECRET_KEY = process.env.JWT_SECRET;
    const token = jwt.sign(
      {
        id: user.id,
        username: user.username,
        role: user.peran,
      },
      SECRET_KEY,
      { expiresIn: "24h" },
    );

    // Kirim respon
    return res.status(200).json({
      success: true,
      message: "Otentikasi berhasil",
      token: token,
      role: user.peran,
    });
  } catch (error) {
    console.error("Error login:", error.message);
    return res.status(500).json({
      success: false,
      message: "Terjadi kesalahan pada peladen",
    });
  }
};

// register
exports.register = async (req, res) => {
  const { username, password, nama, peran } = req.body;

  // validasi peran
  if (!["teknisi", "admin"].includes(peran)) {
    return res.status(400).json({
      success: false,
      message: "Peran harus 'teknisi' atau 'admin'",
    });
  }

  try {
    // Cek apakah username sudah ada
    const checkUser = await pool.query(
      "SELECT * FROM users WHERE username = $1",
      [username],
    );
    if (checkUser.rows.length > 0) {
      return res
        .status(400)
        .json({ success: false, message: "Username sudah digunakan" });
    }

    // Hash kata sandi baru
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);

    // Simpan ke database
    const insertQuery = `
      INSERT INTO users (username, password_hash, nama, peran) 
      VALUES ($1, $2, $3, $4) RETURNING id, username, peran
    `;
    const result = await pool.query(insertQuery, [
      username,
      hashedPassword,
      nama,
      peran,
    ]);

    return res.status(201).json({
      success: true,
      message: "Pengguna baru berhasil ditambahkan",
      user: result.rows[0],
    });
  } catch (error) {
    console.error("Error register:", error.message);
    return res.status(500).json({
      success: false,
      message: "Terjadi kesalahan pada peladen saat membuat pengguna",
    });
  }
};
