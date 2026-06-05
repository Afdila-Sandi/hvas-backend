const express = require("express");
const { createProxyMiddleware } = require("http-proxy-middleware");
const cors = require("cors");

const app = express();

app.use(cors());

console.log("api gateway mengarahkan ke service..");
//rute auth-service 5001
app.use(
  "/api/auth",
  createProxyMiddleware({
    target: "http://auth-service:5001",
    changeOrigin: true,
  }),
);
//rute monitoring-service 5002
app.use(
  "/api/monitor",
  createProxyMiddleware({
    target: "http://monitoring-service:5002",
    changeOrigin: true,
  }),
);
//rute websocket monitoring 5002
app.use(
  "/ws/monitor",
  createProxyMiddleware({
    target: "http://monitoring-service:5002",
    changeOrigin: true,
    ws: true,
  }),
);
//rute websocket control 5003
app.use(
  "/ws/control",
  createProxyMiddleware({
    target: "http://control-service:5003",
    changeOrigin: true,
    ws: true,
  }),
);

const PORT = 5000;
app.listen(PORT, () => {
  console.log(`api gateway berjalan di internal port ${PORT}`);
});
