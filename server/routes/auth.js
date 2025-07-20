const express = require("express");
const router = express.Router();
const authController = require("../controllers/authController");

router.post("/login", authController.login);
router.post("/logout", authController.logout);
router.get("/validate", authController.validateSession);
router.post("/heartbeat", authController.heartbeat);

module.exports = router;
