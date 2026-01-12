const chapaStore = require("../models/chapaStore");
const {verifyPayment} = require("../services/chapa");

const createTransaction = require("../utils/wallet");
const Transaction = require("../models/transaction");
const Accommodation = require("../models/accommodation");
const Client = require("../models/client");
const sendEmail = require("./bookEmailNotif");
const sendMessage = require("./sendMessage");
const Booking = require("../models/booking");
const Rooms = require("../models/rooms");
const Profit = require("../models/profit");

const PAYMENT_CHECK_INTERVAL = 120000; // 2 minutes 300000

async function processRecharge(item, paymentData) {
  const totalAmount = paymentData.data.amount;
  let emailId = "";
  const user = await Client.findOne({uuid: item.uuid});
  if (!user) {
    emailId = paymentData.data.email;
  } else {
    emailId = user.email;
  }

  const transaction = await createTransaction(
    totalAmount,
    "added",
    item.uuid,
    "available",
    "recharge",
    paymentData.data.charge,
    "directPay"
  );

  if (transaction.status === "success") {
    console.log("Recharge Transaction:", transaction);
    //ypdate chapastore first
    const updatedChapaStore = await chapaStore.findByIdAndUpdate(
      item.id,
      {
        status: "success",
        transaction: transaction.transaction.id,
        chapa_ref: paymentData.data.reference,
        chargeInfo: {
          actual_price: paymentData.data.amount,
          fee: paymentData.data.charge,
          total: paymentData.data.amount - paymentData.data.charge,
        },
        updated_at: new Date(),
      },
      {new: true}
    );
    if (updatedChapaStore) {
      const message = {
        notification: {
          title: "Wallet Recharged",
          body: `Your Triplaye Wallet has been successfully recharged. Please log in to your account to view your updated balance.`,
        },
      };
      sendMessage(
        message,
        item.uuid === undefined ? null : item.uuid,
        null,
        "to",
        emailId
      );
    }
  }
}
async function processBooking(item, paymentData) {
  const totalAmount = paymentData.data.amount;

  const booking = await Booking.findOne({
    tx_ref: item.tx_ref,
    status: "accepted",
  }).populate({path: "room", model: Rooms});

  if (!booking)
    return console.warn(`Booking not found for tx_ref: ${item.tx_ref}`);

  // const transaction = await createTransaction(
  //   totalAmount,
  //   "deducted",
  //   item.uuid,
  //   "transfer",
  //   "payment",
  //   paymentData.data.charge,
  //   "directPay"
  // );
  // console.log(transaction);
  // if (transaction.status !== "success")
  //   return console.error("Failed to create deduction transaction");

  // // Calculate financials

  // const hotelTrans = await hotelTransaction(
  //   item.chargeInfo.hotelShare,
  //   "added",
  //   booking.accommodation,
  //   "transfer",
  //   transaction.transaction.uniqueId,
  //   "client booked room",
  //   "ETB"
  // );

  // if (hotelTrans.status !== "success")
  //   return console.error("Failed to create hotel transaction");

  const updatedBooking = await Booking.findByIdAndUpdate(
    booking.id,
    {
      is_paid: true,
      tx_ref: paymentData.data.reference,
      status: "reserved",
      // transaction: transaction.transaction.id,
      updated_at: new Date(),
    },
    {new: true}
  );
  for (let i = 0; i < updatedBooking.room.length; i++) {
    await Rooms.findOneAndUpdate(
      {_id: updatedBooking.room[i]},
      {
        $addToSet: {booking_calendar: updatedBooking.id},
        // status: "reserved",
        updated_at: new Date(),
      },
      (err, room_doc) => {
        if (err) {
          return next(err);
        }
      }
    );
  }

  if (!updatedBooking) return console.error("Failed to update booking status");

  const updatedChapaStore = await chapaStore.findByIdAndUpdate(
    item.id,
    {
      status: "success",
      // transaction: transaction.transaction.id,
      chapa_ref: paymentData.data.reference,
      updated_at: new Date(),
      chargeInfo: {
        actual_price: paymentData.data.amount,
        fee: paymentData.data.charge,
        total: paymentData.data.amount - paymentData.data.charge,
      },
    },
    {new: true}
  );

  if (!updatedChapaStore)
    return console.error("Failed to update chapa store record");

  const fullBookingDetail = await Booking.findById(updatedBooking.id).populate([
    {path: "accommodation", model: Accommodation},
    {path: "transaction", model: Transaction},
  ]);

  //add a profilt
  let createQry = {
    currency_type: "ETB",
    amount: item.chargeInfo.gojoShare,
    // transaction: transaction.transaction.id,
    reason: "Booking a room",
    uniqueId: transaction.transaction.uniqueId,
    status: "available",
    ...(transaction.transaction.user_information && {
      user_information: {
        ...transaction.transaction.user_information,
        user_type: ["user"], // Force user_type to be an array
      },
    }),
  };

  const createProfit = new Profit(createQry);
  await createProfit.save();
  let email = "";
  if (item.uuid) {
    const clientInfo = await Client.findOne({uuid: item.uuid});
    email = clientInfo.email;
  } else {
    email = paymentData.data.email;
  }
  if (email) {
    sendEmail(
      `${paymentData.data.first_name} ${paymentData.data.last_name}`,
      fullBookingDetail.accommodation,
      fullBookingDetail,
      email
    );
  }
}
async function failTransaction(
  user,
  paymentInfo,
  reference,
  chapaStoreId,
  amount
) {
  if (paymentInfo.status !== "pending") {
    //gojo reference starting with gojo-recharge
    function isGojoRechargeRef(reference) {
      return reference.startsWith("triplaye-recharge-");
    }
    const isRecharge = isGojoRechargeRef(reference);
    let input = {
      user_information: {
        user_type: "user",
        user: user.id,
      },
      amount: amount.toFixed(2),
      transaction_status:
        paymentInfo.status === "pending" ? "pending" : paymentInfo.status,
      reason: isRecharge
        ? "recharge wallet failure"
        : "room booking payment failure",
      currency_type: "ETB",
      uniqueId: reference,
      action_type: "deducted",
    };
    const newTranaction = new Transaction(input);
    await newTranaction.save();

    //change booking status
    const getBooking = await Booking.findOne({tx_ref: reference});
    //chenge chapaSore

    const update = await chapaStore.findByIdAndUpdate(
      chapaStoreId,
      {
        status: paymentInfo.status,
        updated_at: new Date(),
      },
      {new: true}
    );
    if (!isRecharge) {
      const updateBooking = await Booking.findByIdAndUpdate(
        getBooking.id,
        {status: paymentInfo.status, updated_at: new Date()},
        {new: true}
      );
    }
    if (update) {
      let message = {
        notification: {
          title: isRecharge ? "Recharge Failed" : "Booking Failed",
          body: `We regret to inform you that your GojoBooking Transaction reference ${paymentInfo.reference} has failed.`,
        },
      };

      sendMessage(
        message,
        user.uid === undefined ? null : user.uid,
        null,
        "to",
        user.email === undefined ? paymentInfo.email : user.email
      );
    }
  }
}
async function checkLocalPayment() {
  try {
    const pendingPayments = await chapaStore.find({
      status: "pending",
      payment_method: "chapaPay" || undefined,
      transaction: {$exists: false},
    });

    for (const item of pendingPayments) {
      const paymentResult = await verifyPayment(item.tx_ref);
      const paymentData = paymentResult.data;

      if (paymentData.data.status !== "success") {
        // const total = paymentData.data.amount + paymentData.data.charge;
        if (paymentData.data.status === "failed/cancelled") {
          const user = await Client.findOne({uuid: item.uuid});
          if (user) {
            await failTransaction(
              user,
              paymentData.data,
              item.tx_ref,
              item.id,
              paymentData.data.amount
            );
          }
        }
      } else {
        if (item.reason === "recharge") {
          await processRecharge(item, paymentData);
        } else if (item.reason === "booking") {
          await processBooking(item, paymentData);
        }
      }
    }
  } catch (error) {
    console.error("Error checking local payments:", error);
  }
}

// Run every 10 seconds
setInterval(checkLocalPayment, PAYMENT_CHECK_INTERVAL);
