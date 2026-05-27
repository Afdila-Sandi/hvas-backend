const express = require('express');
const router = express.Router();
const historyController = require('../controllers/historyController');

// Rute untuk menerima permintaan GET dari Halaman Dasbor Vue.js
router.get('/history', historyController.getHistory);

module.exports = router;