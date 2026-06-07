const express = require("express");
const router = express.Router();
const authController = require("../controllers/authController");

// login
router.post("/login", authController.login);
// register
router.post("/register", authController.register);

module.exports = router;
