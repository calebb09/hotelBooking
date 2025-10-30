// Run every minute
const Booking = require("../models/booking");
const cron = require("node-cron");
module.exports = () => {
  cron.schedule("*/30 * * * *", async () => {
    try {
      const today = new Date();

      // Get today's start and end time
      const startOfDay = new Date(today.setHours(0, 0, 0, 0));
      const endOfDay = new Date(today.setHours(23, 59, 59, 999));

      const result = await Booking.updateMany(
        {
          status: "reserved", // Only reserved
          checkIn: {$gte: startOfDay, $lte: endOfDay}, // Today's date
        },
        {
          $set: {status: "checkedIn", updated_at: new Date()},
        }
      );

      console.log(
        `[CRON] Updated ${result.modifiedCount} reserved bookings to checkedIn`
      );
    } catch (err) {
      console.error("[CRON ERROR] Booking status update failed:", err);
    }
  });
};
