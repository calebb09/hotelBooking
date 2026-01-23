const cron = require("node-cron");
const Booking = require("../models/booking");
const sendMessage = require("../functions/sendMessage");
const Property = require("../models/accommodation");
const User = require("../models/user");
const Client = require("../models/client");

module.exports = () => {
  cron.schedule("* * * * *", async () => {
    const now = new Date();
    const fiveMinutesAgo = new Date(now.getTime() - 5 * 60 * 1000);

    try {
      const result = await Booking.find({
        status: "accepted",
        updated_at: {$lte: fiveMinutesAgo},
        is_paid_via_wallet: false,
      }).populate([
        {
          path: "created_by",
          populate: [
            {
              path: "client",
              model: Client,
            },
          ],
        },
      ]);

      if (result) {
        for (const booking of result) {
          booking.status = "cancelled";
          booking.updated_at = new Date();
          await booking.save();
          // console.log(booking);

          // Notify accommodation managers about the cancellations
          const accomInfo = await Property.findOne({
            _id: booking.accommodation,
          });
          const emailAddresses = accomInfo.address.emailAddress || [];
          //sendmessage to user
          const hotelManagers = await User.find({
            assigned_accommodation: accomInfo.accommodation,
          });
          let managerEmails = hotelManagers.map((manager) => manager.username);
          const allEmails = [...emailAddresses, ...managerEmails];
          const message = {
            notification: {
              title: "Booking Cancellations",
              body: `bookings have been auto-cancelled due to non-payment within 5 minutes.`,
            },
          };
          sendMessage(message, null, accomInfo.id, "bcc", allEmails);

          //notify the user too
          let userEmail = "";
          if (booking.created_by.has_account === false) {
            userEmail = booking.created_by.guest.email;
          } else {
            userEmail = booking.created_by.client.email;
          }

          const userMessage = {
            notification: {
              title: "Booking Cancelled",
              body: `Your booking request at ${accomInfo.name} has been auto-cancelled due to payment period expired.`,
            },
          };
          sendMessage(userMessage, null, accomInfo.id, "to", userEmail);
        }
      }
    } catch (err) {
      console.error("Error in auto-cancel job:", err);
    }
  });
};
