const express = require('express');
const router = express.Router();
const historyController = require('../controllers/historyController');

// Titik akhir untuk meminta riwayat data dari Vue.js
router.get('/history', historyController.getHistory);

module.exports = router;