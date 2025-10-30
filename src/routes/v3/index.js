"use strict";
const express = require("express");
const router = express();
const PaymentRouter = require("./payment");
const WebhookRouter = require("./webhook");

router.use("/api/payment", PaymentRouter);
router.use("/api/chapa", WebhookRouter);

module.exports = router;
