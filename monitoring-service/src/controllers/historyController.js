const pool = require("../config/database");

exports.getHistory = async (req, res) => {
  let client;
  try {
    client = await pool.connect();

    // Mengambil 500 data
    const dbQuery = `
    SELECT * FROM logs
    ORDER BY waktu DESC
    LIMIT 500
`;

    const result = await client.query(dbQuery);
    res.status(200).json({ data: result.rows });
  } catch (error) {
    console.error("Gagal mengambil data history:", error.message);
    res.status(500).json({ error: "Terjadi kesalahan pada peladen" });
  } finally {
    if (client) client.release();
  }
};
