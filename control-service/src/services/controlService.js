const WebSocket = require("ws");
const mqtt = require("mqtt");
const jwt = require("jsonwebtoken");

exports.initControlService = (server) => {
  //instalasi konfigurasi
  const SECRET_KEY = process.env.JWT_SECRET;
  const MQTT_BROKER = process.env.MQTT_BROKER;
  const mqttClient = mqtt.connect(MQTT_BROKER);
  //membuat jalur webscket untuk kontrol
  const wss = new WebSocket.Server({ server, path: "/ws/control" });
  //menyimpan status relay
  let currentRelayStatus = "OFF";
  let timerEndTime = null;
  //menampilkan status relay
  function broadcastStatus() {
    const statusPayload = {
      status_relay: currentRelayStatus,
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
  //logika mqtt
  mqttClient.on("connect", () => {
    console.log("Control Service terhubung ke Broker MQTT");
    mqttClient.subscribe("esp/data"); //mengambil data
  });

  mqttClient.on("message", (topic, message) => {
    try {
      const data = JSON.parse(message.toString());
      if (data.status_relay) {
        currentRelayStatus = data.status_relay;
        if (currentRelayStatus === "OFF") timerEndTime = null;
      }
    } catch (err) {}
  });
  //logika timer
  setInterval(() => {
    if (timerEndTime && Date.now() >= timerEndTime.getTime()) {
      console.log("Waktu timer habis. Mengirim perintah OFF ke ESP.");
      mqttClient.publish("esp/relay/kontrol", "OFF");
      timerEndTime = null;
      currentRelayStatus = "OFF";
      broadcastStatus();
    }
  }, 1000);
  //logika websocket
  wss.on("connection", (ws) => {
    console.log("Klien terhubung ke Control Service");

    ws.send(
      JSON.stringify({
        status_relay: currentRelayStatus,
        timer_end_time: timerEndTime ? timerEndTime.toISOString() : null,
        type: "initial_status",
      }),
    );

    ws.on("message", (message) => {
      try {
        const command = JSON.parse(message);
        //proteksi keamanan
        //1. tolak jika tidak ada token jwt
        if (!command.token) {
          ws.send(
            JSON.stringify({ type: "error", message: "Token JWT tidak ada." }),
          );
          return;
        }
        //2. verifikasi keaslian token jwt
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
        //3. pastika peran teknisi
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
        //jika lolos jalankan perintah
        if (command.aksi === "kontrol") {
          if (command.perintah === "OFF") {
            timerEndTime = null;
            currentRelayStatus = "OFF";
          } else if (command.perintah === "ON") {
            timerEndTime = null;
            currentRelayStatus = "ON";
          }
          mqttClient.publish("esp/relay/kontrol", command.perintah);
          broadcastStatus();
        } else if (command.aksi === "timer") {
          const durationMinutes = command.durasi;
          timerEndTime = new Date(Date.now() + durationMinutes * 60 * 1000);
          currentRelayStatus = "ON";
          mqttClient.publish("esp/relay/set_timer", String(durationMinutes));
          broadcastStatus();
        }
      } catch (err) {
        console.error("Format pesan dari klien tidak valid");
      }
    });

    ws.on("close", () => console.log("Klien Control terputus"));
  });
};
