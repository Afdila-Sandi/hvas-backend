const express = require('express');
const { createProxyMiddleware } = require('http-proxy-middleware');
const cors = require('cors');

const app = express();

// Izinkan akses dari Vue.js nanti
app.use(cors());

console.log('🚀 API Gateway Node.js bersiap mengarahkan lalu lintas...');

// 1. Rute untuk Auth Service (Port Internal 5001)
app.use('/api/auth', createProxyMiddleware({ 
    target: 'http://auth-service:5001', 
    changeOrigin: true 
}));

// 2. Rute untuk Monitoring Service (Port Internal 5002)
app.use('/api/monitor', createProxyMiddleware({ 
    target: 'http://monitoring-service:5002', 
    changeOrigin: true 
}));

// 3. Rute WebSocket untuk Monitor (Port Internal 5002)
// Parameter ws: true sangat krusial agar jalur IoT tidak putus
app.use('/ws/monitor', createProxyMiddleware({ 
    target: 'http://monitoring-service:5002', 
    changeOrigin: true,
    ws: true 
}));

// 4. Rute WebSocket untuk Control (Port Internal 5003)
app.use('/ws/control', createProxyMiddleware({ 
    target: 'http://control-service:5003', 
    changeOrigin: true,
    ws: true 
}));

// Gateway mendengarkan di Port 80 (Di dalam kontainer)
const PORT = 80;
app.listen(PORT, () => {
    console.log(`✅ API Gateway berjalan di internal port ${PORT}`);
});