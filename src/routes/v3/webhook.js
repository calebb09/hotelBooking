const express = require("express");
const WebhookController = require("../../controllers/webhook");
const verifySignature = require("../../lib/chapa");
const router = express.Router();
router.post("/webhook", verifySignature, WebhookController.recieveWebhook);
module.exports = router;
