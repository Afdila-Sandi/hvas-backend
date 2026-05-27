const express = require('express');
const router = express.Router();
const authController = require('../controllers/authController');

// Rute untuk menerima permintaan POST dari Halaman Login Vue.js
router.post('/login', authController.login);

module.exports = router;