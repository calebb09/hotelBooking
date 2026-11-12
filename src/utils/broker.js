const HeldPayment = require("../models/pendingPayment");
const Property = require("../models/accommodation");
const Profit = require("../models/profit");
const Transaction = require("../models/transaction");
const sendEmail = require("../functions/bookEmailNotif");
const hotelTransaction = require("./hotelTransaction");
const Booking = require("../models/booking");

const Broker = async (
  status,
  txRef,
  currency,
  accommodation,
  user,
  bookingDetail,
  userId
) => {
  try {
    //get transaction
    const getTransaction = await Transaction.findOne({uniqueId: txRef});
    if (!getTransaction) {
      return {
        status: "bad",
        statusCode: 404,
        message: "transaction not found",
      };
    }
    //first check if heldPaymentExists
    const propetryInfo = await Property.findById(accommodation);
    if (!propetryInfo) {
      return {
        status: "bad",
        statusCode: 400,
        message: "property not found",
      };
    }
    const heldPayment = await HeldPayment.findOne({tx_ref: txRef});
    if (!heldPayment) {
      return {
        status: "bad",
        statusCode: 404,
        message: "there is no payment",
      };
    }

    let broker_status = "";
    isTransfer = false;
    if (status === "accepted") {
      broker_status = "transfered";
      isTransfer = true;
    } else {
      broker_status = reversedBack;
      isTransfer = false;
    }
    if (isTransfer === true) {
      //update helPayament
      const update = await HeldPayment.findByIdAndUpdate(
        heldPayment.id,
        {
          updated_at: new Date(),
          transaction_status: "transfered",
          reason: `money transfer to ${propetryInfo.name}`,
        },
        {new: true}
      );
      if (update) {
        const transferToHotel = await hotelTransaction(
          heldPayment.money.hotelPayment,
          "added",
          accommodation,
          "transfer",
          txRef,
          `${user.full_name} booked a room`,
          currency
        );
        if (transferToHotel.status === "success") {
          const updateTransaction = await Transaction.findOneAndUpdate(
            {uniqueId: heldPayment.tx_ref},
            {
              updated_at: new Date(),
              transaction_status: "transfered",
            },
            {new: true}
          );
          const createProfit = new Profit({
            amount: heldPayment.money.gojoPayment,
            transaction: updateTransaction.id,
            user_information: {
              user_type: ["user"],
              user: updateTransaction.user_information.user,
            },
            currency_type: currency,
            reason: "Booking a room",
            status: "available",
            uniqueId: updateTransaction.uniqueId,
          });
          await createProfit.save();
          if (createProfit) {
            // send message
            if (user.email) {
              sendEmail(
                user.full_name,
                bookingDetail.accommodation,
                bookingDetail,
                user.email
              );
            }

            //update booking status as well
            const updateBooking = await Booking.findOneAndUpdate(
              {tx_ref: txRef},
              {
                status: "reserved",
                is_paid_via_wallet: true,
                transaction: getTransaction.id,
                is_paid: true,
                updated_at: new Date(),
                booking_checked_by: userId,
              },
              {new: true}
            );

            return {
              status: "ok",
              statusCode: 200,
              message: "Transfer Successful",
            };
          } else {
            return {
              status: "bad",
              statusCode: 400,
              message: "not saved in the profit",
            };
          }
        } else {
          return {
            status: "bad",
            statusCode: transferToHotel.statusCode,
            message: transferToHotel.message,
            error: transferToHotel.error,
          };
        }
      } else {
        return {
          status: "bad",
          statusCode: 400,
          message: "pending payment not updated",
        };
      }
    }
  } catch (error) {
    return {
      status: "bad",
      statusCode: 500,
      message: error,
    };
  }
};
module.exports = Broker;
