CREATE TABLE IF NOT EXISTS logs (
    id SERIAL PRIMARY KEY,
    waktu TIMESTAMP WITH TIME ZONE NOT NULL,
    suhu_bme NUMERIC(5,2),
    kelembaban_bme NUMERIC(5,2),
    tekanan NUMERIC(6,2),
    status_pompa VARCHAR(10),
    suhu_dht NUMERIC(5,2),
    kelembaban_dht NUMERIC(5,2),
    kebisingan NUMERIC(5,2)
);