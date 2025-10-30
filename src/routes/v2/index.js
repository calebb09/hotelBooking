"use strict";
const express = require("express");
const router = express();
const BookingRouter = require("./booking");
const ProfitRouter = require("./profit");
const WalletRouter = require("./wallet");
router.use("/api/booking", BookingRouter);
router.use("/api/profits", ProfitRouter);
router.use("/api/wallet", WalletRouter);

module.exports = router;
