const cron = require("node-cron");
const chapaStore = require("../models/chapaStore");
const {verifyPayment} = require("../services/chapa");
const {totalRoomPrice} = require("../functions/calculation");
const createTransaction = require("../utils/wallet");
const hotelTransaction = require("../utils/hotelTransaction");
const sendEmail = require("../functions/bookEmailNotif");
const sendMessage = require("../functions/sendMessage");
const Booking = require("../models/booking");
const Rooms = require("../models/rooms");
module.exports = () => {
  cron.schedule("0 0 22 * * *", async function () {
    // check chapa store first
    const chapaPending = await chapaStore.find({status: "pending"});
    // for (const item of chapaPending) {
    //   const showData = await verifyPayment(item.tx_ref);
    //   if (showData.data.status === "success") {
    //     const overAllAmount = showData.data.amount;
    //     if (item.reason === "recharge") {
    //       const transaction = await createTransaction(
    //         overAllAmount,
    //         "added",
    //         item.uuid,
    //         "available",
    //         "recharge",
    //         showData.data.charge
    //       );
    //       if (transaction.status === "success") {
    //         console.log(transaction);
    //       }
    //     } else if (item.reason === "booking") {
    //       const bookedInfo = await Booking.findOne({
    //         tx_ref: item.tx_ref,
    //         status: "pending",
    //       }).populate({path: "room", model: Rooms});
    //       if (bookedInfo) {
    //         //write transaction
    //         const beginTransaction = await createTransaction(
    //           overAllAmount,
    //           "deducted",
    //           item.uuid,
    //           "transfer",
    //           "payment",
    //           showData.data.charge
    //         );
    //         if (beginTransaction.status === "success") {
    //           // make the hotel transaction
    //           const totalCharge = totalRoomPrice(bookedInfo.room);
    //           const createHotelTransfer = await hotelTransaction(
    //             totalCharge,
    //             "added",
    //             bookedInfo.accommodation,
    //             "transfer",
    //             beginTransaction.transaction.uniqueId,
    //             "client booked room"
    //           );
    //           if (createHotelTransfer.status === "success") {
    //             const updateBookInfo = await Booking.findByIdAndUpdate(
    //               bookedInfo.id,
    //               {
    //                 is_paid: true,
    //                 tx_ref: showData.data.reference,
    //                 status: "booked",
    //                 transaction: beginTransaction.transaction.id,
    //                 updated_at: new Date(),
    //               },
    //               {
    //                 new: true,
    //               }
    //             );
    //             if (updateBookInfo) {
    //               const changeChapaStore = await chapaStore.findByIdAndUpdate(
    //                 item.id,
    //                 {
    //                   status: "success",
    //                   chapa_ref: showData.data.reference,
    //                   updated_at: new Date(),
    //                 },
    //                 {
    //                   new: true,
    //                 }
    //               );
    //             }
    //           }
    //         }
    //       }
    //     }
    //   }
    // }
  });
};
