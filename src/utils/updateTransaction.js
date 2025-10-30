const ChapaStore = require("../models/chapaStore");
const Booking = require("../models/booking");
const Room = require("../models/rooms");
const {currencyConvert} = require("../services/chapa");
const sendMessage = require("../functions/sendMessage");
const Profit = require("../models/profit");
const {
  ifonlydiscountLocaldirectPay,
  totalRoomPrice,
  totalCommission,
} = require("../functions/calculation");
const Transaction = require("../models/transaction");
const Wallet = require("../models/wallet");
const hotelTransaction = require("../utils/hotelTransaction");
const Client = require("../models/client");
const Services = require("../models/service");
//build output response
function buildResponse(status, statusCode, message, error = null) {
  const response = {status, statusCode, message};
  if (error) response.error = error;
  return response;
}
//gojo reference starting with gojo-recharge
function isGojoRechargeRef(txt_ref) {
  return txt_ref.startsWith("gojo-recharge-");
}
//update Transaction function
async function updateTransaction(
  txtRef,
  reference,
  chapaStatus,
  amount,
  charge
) {
  try {
    // define first
    let name = "",
      email = "";
    let uuid = null;
    let gojodiscoint = "20%";
    let userInfo = null;
    let saveTransaction = null;
    let totalCharge = amount - charge;
    const isRecharge = isGojoRechargeRef(txtRef);
    const isSuccess = chapaStatus === "success";
    const action = isRecharge ? "Wallet Recharge" : "Booking";
    const refNote = `Transaction reference ID: ${reference}`;

    // Step 1: Get conversion rate
    const conversionResult = await currencyConvert();
    const rate = conversionResult.data[0].rate;

    // Step 2: Find Chapa store record
    const store = await ChapaStore.findOne({tx_ref: txtRef});
    if (!store) {
      console.log("txn_ref not found");
      return buildResponse("failed", 404, "txn_ref not found");
    }

    // Step 3: Return early if already updated
    if (store.status !== "pending") {
      return buildResponse(
        "failed",
        404,
        `Already updated with the status ${store.status}`
      );
    }

    // Step 4: Find pending booking
    const booking = await Booking.findOne({
      tx_ref: txtRef,
      is_paid: false,
      status: "pending",
    }).populate({path: "room", model: Room});

    if (!isRecharge) {
      if (!booking) {
        return buildResponse("failed", 404, `Already booked`);
      }

      // Step 5: Get client or guest information
      const isGuest = booking.created_by.has_account === false;
      if (isGuest) {
        gojodiscoint = "20%";
        name = booking.created_by.guest.name;
        email = booking.created_by.guest.email;
      } else {
        const client = await Client.findOne({uuid: store.uuid});
        let totalBooking = await Booking.find({
          "created_by.client": client.id,
        });
        price_query = {
          number_of_booking: {
            $gte: totalBooking.length,
            $lte: totalBooking.length,
          },
        };
        let discountPrice = await Services.find(price_query);
        if (discountPrice.length > 0) {
          gojodiscoint = discountPrice[0].amount;
        } else {
          gojodiscoint = "20%";
        }
        uuid = client.uuid;
        name = client.full_name;
        email = client.email;
        userInfo = {
          user_type: "user",
          user: client.id,
        };
      }
    }

    // Step 6: Create transaction
    // starting from here all the way to the profit based on the chapa status === "success"
    if (isSuccess) {
      const transactionPayload = {
        user_information: userInfo,
        transaction_status: "payment",
        reason: isRecharge ? "Wallet recharge" : "room book",
        uniqueId: reference,
        amount: isRecharge
          ? amount
          : await ifonlydiscountLocaldirectPay(booking.room, booking),
        currency_type: "ETB",
        action_type: isRecharge ? "added" : "deducted",
        ...(isRecharge && {
          wallet_recharge: {
            is_recharge: true,
            fee: charge, // Set actual fee if available
            amount,
            status: "succeeded", // Assuming chapaStatus is "success"
          },
        }),
      };

      saveTransaction = await new Transaction(transactionPayload).save();
      if (!saveTransaction) {
        return buildResponse("failed", 404, `Transaction not saved`);
      }

      // if it was recharge
      if (isRecharge) {
        const client = await Client.findOne({uuid: store.uuid});
        const Balance = await Wallet.findOne({
          status: "available",
          "user_information.user": client.id,
        }).sort({
          _id: -1,
        });
        // create balance
        let createBalance = {
          user_information: {
            user: client.id,
            user_type: ["user"],
          },
          balance: Balance ? Balance.balance + totalCharge : totalCharge,
          currency_type: "ETB",
          transaction: saveTransaction.id,
        };

        // save balance
        const saveBalance = new Balance(createBalance);
        const storeBalance = await saveBalance.save();
        if (!storeBalance) {
          return buildResponse("failed", 404, `wallet balance did not save`);
        }
      }
      // Step 7: Transfer to hotel
      if (isRecharge === false) {
        const hotelTransfer = await hotelTransaction(
          totalRoomPrice(booking.room, booking) * rate,
          "added",
          booking.accommodation,
          "transfer",
          reference,
          `${name} booked a room`
        );

        if (hotelTransfer.status !== "success") {
          return buildResponse(
            "failed",
            hotelTransfer.statusCode,
            hotelTransfer.message
          );
        }
        // Step 8: Save profit
        const profitPayload = {
          amount: totalCommission(booking.room, gojodiscoint) * rate,
          user_information: userInfo,
          currency_type: "ETB",
          transaction: saveTransaction.id,
          reason: "Booking a room",
          status: "available",
          uniqueId: reference,
        };

        const profit = await new Profit(profitPayload).save();
        if (!profit) {
          return buildResponse(
            "failed",
            400,
            "Transaction profit was not saved"
          );
        }
      }
    }
    if (isRecharge === false) {
      // Step 9: Update booking
      const updatedBooking = await Booking.findByIdAndUpdate(
        booking.id,
        {
          status: "booked",
          transaction: isSuccess ? saveTransaction.id : null,
          is_paid: isSuccess ? true : false,
          tx_ref: reference,
          updated_at: new Date(),
        },
        {new: true}
      );

      if (!updatedBooking) {
        return buildResponse(
          "bad",
          400,
          "Error: your booking record was not saved"
        );
      }
    }

    // Step 10: Update Chapa store
    const updatedChapa = await ChapaStore.findByIdAndUpdate(
      store.id,
      {
        transaction: saveTransaction !== null ? saveTransaction.id : null,
        chapa_ref: reference,
        reason: isSuccess ? "booking" : null,
        status: isSuccess ? "success" : chapaStatus,
        chargeInfo: {
          actual_price: amount,
          fee: charge,
          total: amount - charge,
        },
        updated_at: new Date(),
      },
      {new: true}
    );

    if (!updatedChapa) {
      return buildResponse("bad", 400, "Chapa local storage update failed");
    }
    // send message
    if (email) {
      let message = {
        notification: {
          title: isSuccess ? "Transaction successful" : "Transaction Failed",
          body: isSuccess
            ? `Your ${action} has been confirmed. We have received your payment. ${refNote}.`
            : `Your ${action} has failed! ${refNote}. Please try again later.`,
        },
      };
      const accommodationId = isRecharge ? null : booking?.accommodation;
      sendMessage(message, uuid, accommodationId, "to", email);
    }
    return buildResponse("success", 201, "Successfully updated");
  } catch (error) {
    console.error(error);
    return buildResponse(
      "bad",
      500,
      error.response?.data || error.message,
      error
    );
  }
}

module.exports = updateTransaction;
