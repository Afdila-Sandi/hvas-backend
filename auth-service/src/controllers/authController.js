const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const pool = require("../config/database");

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
