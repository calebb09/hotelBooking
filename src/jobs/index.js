const cronBookCheck = require("./cronBookCheck");
const checkPaymentChapa = require("./checkChapaPayments");
const cronCheckBooking = require("./cronCheckBooking");
const cronCheckacceptedBooking = require("./cronCheckacceptedBooking");
const turnToCheckIn = require("./turnToCheckin");
const startCronJobs = () => {
  cronBookCheck(); // 9:00 everyday
  checkPaymentChapa(); //9:05 everyday
  cronCheckBooking(); // every minute
  cronCheckacceptedBooking(); //every minute
  turnToCheckIn(); // every 30 minutes
  console.log("✅ Cron jobs initialized.");
};
module.exports = {startCronJobs};
