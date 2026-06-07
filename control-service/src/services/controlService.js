const WebSocket = require("ws");
const mqtt = require("mqtt");
const jwt = require("jsonwebtoken");

// Menambahkan parameter 'app' untuk mendengarkan rute HTTP POST
exports.initControlService = (server, app) => {
  // instalasi konfigurasi
  const SECRET_KEY = process.env.JWT_SECRET;
  const MQTT_BROKER = process.env.MQTT_BROKER;
  const mqttClient = mqtt.connect(MQTT_BROKER);

  // membuat jalur websocket untuk kontrol
  const wss = new WebSocket.Server({ server, path: "/ws/control" });

  // menyimpan status relay
  let currentRelayStatus = "OFF";
  let timerEndTime = null;

  // menampilkan status relay (broadcast ke semua klien)
  function broadcastStatus() {
    const statusPayload = {
      status_pompa: currentRelayStatus,
      timer_end_time: timerEndTime ? timerEndTime.toISOString() : null,
      type: "status_update",
    };
    const payloadString = JSON.stringify(statusPayload);
    wss.clients.forEach((client) => {
      if (client.readyState === WebSocket.OPEN) {
        client.send(payloadString);
      }
    });
  }

  // logika mqtt
  mqttClient.on("connect", () => {
    console.log("Control Service terhubung ke Broker MQTT");
    mqttClient.subscribe("esp/data"); // mengambil data
  });

  mqttClient.on("message", (topic, message) => {
    try {
      const data = JSON.parse(message.toString());
      if (data.status_pompa) {
        currentRelayStatus = data.status_pompa;
        if (currentRelayStatus === "OFF") timerEndTime = null;
      }
    } catch (err) {}
  });

  // logika timer otomatis
  setInterval(() => {
    if (timerEndTime && Date.now() >= timerEndTime.getTime()) {
      console.log("Waktu timer habis. Mengirim perintah OFF ke ESP.");
      mqttClient.publish("esp/pompa/kontrol", "OFF");
      timerEndTime = null;
      currentRelayStatus = "OFF";
      broadcastStatus();
    }
  }, 1000);

  // logika http post (Jalur baru untuk tombol di frontend web)
  if (app) {
    app.post("/", (req, res) => {
      // 1. proteksi keamanan: periksa header otorisasi
      const authHeader = req.headers.authorization;
      if (!authHeader || !authHeader.startsWith("Bearer ")) {
        return res
          .status(401)
          .json({ success: false, message: "Token JWT tidak ada." });
      }

      const token = authHeader.split(" ")[1];
      let decoded;

      // 2. verifikasi keaslian token jwt
      try {
        decoded = jwt.verify(token, SECRET_KEY);
      } catch (jwtErr) {
        return res
          .status(401)
          .json({
            success: false,
            message: "Token JWT tidak valid atau kedaluwarsa.",
          });
      }

      // 3. pastikan peran teknisi
      if (decoded.role !== "teknisi") {
        return res
          .status(403)
          .json({
            success: false,
            message: "Akses ditolak. Hanya teknisi yang dapat mengontrol alat.",
          });
      }

      // 4. jika lolos, jalankan perintah HTTP
      const { action, durasi } = req.body;
      if (action === "ON" || action === "OFF") {
        timerEndTime = null;
        currentRelayStatus = action;
        mqttClient.publish("esp/pompa/kontrol", action);
        broadcastStatus();
        return res
          .status(200)
          .json({
            success: true,
            message: `Perintah ${action} berhasil dikirim`,
          });
      } else if (action === "TIMER" && durasi) {
        timerEndTime = new Date(Date.now() + durasi * 60 * 1000);
        currentRelayStatus = "ON";
        mqttClient.publish("esp/pompa/set_timer", String(durasi));
        broadcastStatus();
        return res
          .status(200)
          .json({ success: true, message: `Timer aktif ${durasi} menit` });
      } else {
        return res
          .status(400)
          .json({ success: false, message: "Aksi tidak valid." });
      }
    });
  }

  // logika websocket (Jalur lama untuk klien murni websocket)
  wss.on("connection", (ws) => {
    console.log("Klien terhubung ke Control Service via WebSocket");

    // kirim status saat pertama kali terhubung
    ws.send(
      JSON.stringify({
        status_pompa: currentRelayStatus,
        timer_end_time: timerEndTime ? timerEndTime.toISOString() : null,
        type: "initial_status",
      }),
    );

    // tangani pesan masuk via websocket
    ws.on("message", (message) => {
      try {
        const command = JSON.parse(message);

        // proteksi keamanan
        // 1. tolak jika tidak ada token jwt
        if (!command.token) {
          ws.send(
            JSON.stringify({ type: "error", message: "Token JWT tidak ada." }),
          );
          return;
        }

        // 2. verifikasi keaslian token jwt
        let decoded;
        try {
          decoded = jwt.verify(command.token, SECRET_KEY);
        } catch (jwtErr) {
          ws.send(
            JSON.stringify({
              type: "error",
              message: "Token JWT tidak valid atau kedaluwarsa.",
            }),
          );
          return;
        }

        // 3. pastikan peran teknisi
        if (decoded.role !== "teknisi") {
          ws.send(
            JSON.stringify({
              type: "error",
              message:
                "Akses ditolak. Hanya teknisi yang dapat mengontrol alat.",
            }),
          );
          return;
        }

        // jika lolos, jalankan perintah WS
        if (command.aksi === "kontrol") {
          if (command.perintah === "OFF") {
            timerEndTime = null;
            currentRelayStatus = "OFF";
          } else if (command.perintah === "ON") {
            timerEndTime = null;
            currentRelayStatus = "ON";
          }
          mqttClient.publish("esp/pompa/kontrol", command.perintah);
          broadcastStatus();
        } else if (command.aksi === "timer") {
          const durationMinutes = command.durasi;
          timerEndTime = new Date(Date.now() + durationMinutes * 60 * 1000);
          currentRelayStatus = "ON";
          mqttClient.publish("esp/pompa/set_timer", String(durationMinutes));
          broadcastStatus();
        }
      } catch (err) {
        console.error("Format pesan dari klien tidak valid");
      }
    });

    ws.on("close", () => console.log("Klien Control terputus"));
  });
};
