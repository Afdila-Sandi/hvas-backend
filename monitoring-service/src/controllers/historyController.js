const pool = require('../config/database');

exports.getHistory = async (req, res) => {
    let client;
    try {
        client = await pool.connect();
        const dbQuery = `
            SELECT
                (waktu AT TIME ZONE 'Asia/Jakarta') AT TIME ZONE 'UTC' AS waktu,
                suhu_bme, kelembaban_bme, tekanan, status_pompa AS status_relay,
                suhu_dht, kelembaban_dht, kebisingan
            FROM log_sensor
            ORDER BY waktu DESC
            LIMIT 500
        `;
        const result = await client.query(dbQuery);
        res.status(200).json({ data: result.rows });
    } catch (error) {
        console.error('❌ Gagal mengambil data history dari DB:', error.message);
        res.status(500).json({ error: 'Internal Server Error' });
    } finally {
        if (client) client.release();
    }
};