const cron = require("node-cron");
const Booking = require("../models/booking");
const sendMessage = require("../functions/sendMessage");
const Property = require("../models/accommodation");
const User = require("../models/user");
const Client = require("../models/client");
const Transaction = require("../models/transaction");
const Wallet = require("../models/wallet");
const HeldPayment = require("../models/pendingPayment");
// Run every minute
module.exports = () => {
  cron.schedule("* * * * *", async () => {
    const now = new Date();
    const fiveMinutesAgo = new Date(now.getTime() - 5 * 60 * 1000);

    try {
      const result = await Booking.find({
        status: "pending",
        created_at: {$lte: fiveMinutesAgo},
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
          if (booking.is_paid_via_wallet === true) {
            const updateHeldPayment = await HeldPayment.findOneAndUpdate(
              {
                tx_ref: booking.tx_ref,
              },
              {
                transaction_status: "reversedBack",
                updated_at: new Date(),
              },
              {
                new: true,
              },
            );
            if (updateHeldPayment) {
              const getBalance = await Wallet.findOne({
                uniqueId: booking.tx_ref,
              });
              const heldPay = await HeldPayment.findOne({
                tx_ref: booking.tx_ref,
              });
              // const getTransaction = await Transaction.findOne({
              //   uniqueId: booking.tx_ref,
              // });

              // it is time to createTransaction
              let createTransaction = new Transaction({
                amount: heldPay.money.totalPayment,
                user_information: {
                  user_type: "user",
                  user: getBalance.user_information.user,
                },
                transaction_status: "returnedBack",
                reason: "Fund returned back due to hotel unresponsive",
                currency_type: getBalance.currency_type,
                action_type: "added",
              });
              createTransaction.save();
              // save balance
              let saveBalance = new Wallet({
                balance: getBalance.balance + heldPay.money.totalPayment,
                currency_type: getBalance.currency_type,
                user_information: getBalance.user_information,
                transaction: createTransaction.id,
              });
              saveBalance.save();
            }
          }
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
          let messageBody = "";
          if (booking.is_paid_via_wallet === false) {
            messageBody = "non-payment within 5 minutes";
          } else {
            messageBody = "unresponsive from the Hotel";
          }
          const userMessage = {
            notification: {
              title: "Booking Cancelled",
              body: `Your booking at ${accomInfo.name.en} has been auto-cancelled due to ${messageBody}.`,
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
