const cron = require("node-cron");
const Booking = require("../models/booking");
const sendMessage = require("../functions/sendMessage");
const Property = require("../models/accommodation");
const User = require("../models/user");
const Client = require("../models/client");
const {verifyPayment} = require("../services/chapa");
const chapaStore = require("../models/chapaStore");
const Transaction = require("../models/transaction");
const Profit = require("../models/profit");

// Run every minute
module.exports = () => {
  cron.schedule("* * * * *", async () => {
    const now = new Date();
    // const fiveMinutesAgo = new Date(now.getTime() - 5 * 60 * 1000);

    try {
      const result = await Booking.find({
        status: "pending",
        currency_type: "ETB",
        // created_at: {$lte: fiveMinutesAgo},
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

      if (result.length > 0) {
        for (const booking of result) {
          // check from chapa verify the tx_ref
          const verify = await verifyPayment(booking.tx_ref);

          if (verify.data.status === "success") {
            // update chapaStore
            const updateChapa = await chapaStore.findOneAndUpdate(
              {tx_ref: booking.tx_ref},
              {
                reason: "booking a room",
                status: verify.data.data.status,
                chapa_ref: verify.data.data.reference,
                updated_at: new Date(),
              },
              {new: true},
            );
            if (verify.data.data.status === "success") {
              // create a transaction and a profit entry
              let createTransaction = new Transaction({
                amount: verify.data.data.amount + verify.data.data.charge,
                user_information: booking.created_by.has_account
                  ? {
                      user_type: "user",
                      user: booking.created_by.client.id,
                    }
                  : {},
                transaction_status: "payment",
                reason: "room book",
                currency_type: "ETB",
                action_type: "deducted",
              });
              const savedTransaction = await createTransaction.save();

              // profit wallet entry if any
              let createProfit = new Profit({
                amount: verify.data.data.amount + verify.data.data.charge,
                currency_type: "ETB",
                user_information: booking.created_by.has_account
                  ? {
                      user_type: ["user"],
                      user: booking.created_by.client.id,
                    }
                  : {},
                transaction: savedTransaction.id,
                reason: "Booking a room",
                status: "available",
                uniqueId: booking.tx_ref,
              });
              await createProfit.save();
              // update the booking status to success
              booking.status = "reserved";
              booking.is_paid = true;
              booking.transaction = savedTransaction.id;
              booking.updated_at = new Date();
              await booking.save();
            } else {
              // update the booking status to failed
              booking.status = "failed";
              booking.updated_at = new Date();
              await booking.save();
            }
          } else {
            console.log("No booking to verify or already processed.");
          }

          // console.log(booking);
          // if (booking.is_paid_via_wallet === true) {
          //   const updateHeldPayment = await HeldPayment.findOneAndUpdate(
          //     {
          //       tx_ref: booking.tx_ref,
          //     },
          //     {
          //       transaction_status: "reversedBack",
          //       updated_at: new Date(),
          //     },
          //     {
          //       new: true,
          //     },
          //   );
          //   if (updateHeldPayment) {
          //     const getBalance = await Wallet.findOne({
          //       uniqueId: booking.tx_ref,
          //     });
          //     const heldPay = await HeldPayment.findOne({
          //       tx_ref: booking.tx_ref,
          //     });
          //     // const getTransaction = await Transaction.findOne({
          //     //   uniqueId: booking.tx_ref,
          //     // });

          //     // it is time to createTransaction
          //     let createTransaction = new Transaction({
          //       amount: heldPay.money.totalPayment,
          //       user_information: {
          //         user_type: "user",
          //         user: getBalance.user_information.user,
          //       },
          //       transaction_status: "returnedBack",
          //       reason: "Fund returned back due to hotel unresponsive",
          //       currency_type: getBalance.currency_type,
          //       action_type: "added",
          //     });
          //     createTransaction.save();
          //     // save balance
          //     let saveBalance = new Wallet({
          //       balance: getBalance.balance + heldPay.money.totalPayment,
          //       currency_type: getBalance.currency_type,
          //       user_information: getBalance.user_information,
          //       transaction: createTransaction.id,
          //     });
          //     saveBalance.save();
          //   }
          // }
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
              title: `Booking ${verify.data.data.status === "success" ? "Confirmed" : "Cancelled"}`,
              body: `Booking have been ${verify.data.data.status === "success" ? "Confirmed for the guest" : "Cancelled"}.`,
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
              title: `Booking ${verify.data.data.status === "success" ? "Confirmed" : "Cancelled"}`,
              body: `Your booking at ${accomInfo.name.en} has been ${verify.data.data.status === "success" ? "Confirmed" : "Cancelled"}.`,
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
