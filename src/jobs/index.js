// const cronBookCheck = require("./cronBookCheck");
// const cronCheckBooking = require("./cronCheckBooking");
// const cronCheckacceptedBooking = require("./cronCheckacceptedBooking");
// const turnToCheckIn = require("./turnToCheckin");
const changeNPrice = require("./changeNightlyPrice");
const changeDPrice = require("./changeDailyPrice");
const startCronJobs = () => {
  // cronBookCheck(); // 9:00 everyday
  // cronCheckBooking(); // every minute
  // cronCheckacceptedBooking(); //every minute
  // turnToCheckIn(); // every 30 minutes
  changeNPrice(); //every day at 6 PM
  changeDPrice(); // every day in the morning
  console.log("✅ Cron jobs initialized.");
};
module.exports = {startCronJobs};
