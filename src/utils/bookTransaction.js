const RoomMdl = require("../models/rooms");
const Wallet = require("../models/wallet");
const Client = require("../models/client");
const BookingMdl = require("../models/booking");
const ServiceModel = require("../models/service");
const Chapa = require("../models/chapaStore");
const Profit = require("../models/profit");
const {currencyConvert, reverseChapaPayment} = require("../services/chapa");
const {totalRoomPrice, totalCommission} = require("../functions/calculation");
const createTransaction = require("./wallet");
const hotelTransaction = require("./hotelTransaction");
const sendMessage = require("../functions/sendMessage");

// Constants for better maintainability
const DEFAULT_CURRENCY = "ETB";
const DEFAULT_SERVICE_CHARGE = "20%";
const TRANSACTION_REASON = "room booked";
const PROFIT_REASON = "Booking a room";

// Utility function to calculate service charge
const calculateServiceCharge = async (uuid, booking) => {
  if (!uuid) return DEFAULT_SERVICE_CHARGE;

  const client = await Client.findOne({uuid});
  if (!client) return DEFAULT_SERVICE_CHARGE;

  const totalBookings = await BookingMdl.countDocuments({
    "created_by.client": client.id,
  });
  const discount = await ServiceModel.findOne({
    number_of_booking: {$gte: totalBookings, $lte: totalBookings},
  });

  return discount?.amount || DEFAULT_SERVICE_CHARGE;
};

// Main transaction function
const user2HotelTransfer = async (checkChapa, reference) => {
  try {
    // Start user transaction
    const transaction = await createTransaction(
      checkChapa.chargeInfo.actual_price,
      "deducted",
      checkChapa.uuid,
      "available",
      TRANSACTION_REASON,
      checkChapa.chargeInfo.fee
    );

    if (transaction.status !== "success") {
      return {
        status: "failed",
        statusCode: transaction.statusCode,
        message: transaction.message,
      };
    }

    // Find pending booking
    const booking = await BookingMdl.findOne({
      tx_ref: checkChapa.tx_ref,
      status: "pending",
    }).populate({path: "room", model: RoomMdl});

    if (!booking) {
      const refund = await reverseChapaPayment(
        reference,
        "Refund due to system error while booking on Gojo app"
      );

      return refund.status === "success"
        ? {
            status: "refund",
            statusCode: 200,
            message: "Refund on the way",
            error: "Booking history not found",
          }
        : {
            status: "failed",
            statusCode: refund.status,
            message: "Please contact customer support ASAP",
            error: refund.error,
          };
    }

    // Calculate financials
    const rateConverter = await currencyConvert();
    const conversionRate = rateConverter.data[0].rate;
    const hotelShare = totalRoomPrice(booking.room) * conversionRate;
    const serviceCharge = await calculateServiceCharge(
      checkChapa.uuid,
      booking
    );
    const gojoCommission =
      totalCommission(booking.room, serviceCharge) * conversionRate;

    // Update hotel wallet
    const hotelWallet = await Wallet.findOne({
      currency_type: DEFAULT_CURRENCY,
      "user_information.client": booking.accommodation,
    }).sort({_id: -1});

    const newBalance = hotelWallet
      ? hotelWallet.balance + hotelShare
      : hotelShare;

    // Create hotel transaction
    await hotelTransaction(
      hotelShare,
      "added",
      booking.accommodation,
      "available",
      transaction.transaction.uniqueId,
      "customer booked hotel"
    );

    // Update booking
    await BookingMdl.findByIdAndUpdate(
      booking._id,
      {
        status: "booked",
        is_paid: true,
        transaction: transaction.transaction._id,
        update_at: new Date(),
      },
      {new: true}
    );

    // Update Chapa store
    await Chapa.findByIdAndUpdate(
      checkChapa._id,
      {
        status: "success",
        transaction: transaction.transaction._id,
        updated_at: new Date(),
      },
      {new: true}
    );

    // Create profit record
    const client = await Client.findOne({uuid: checkChapa.uuid});
    const profitData = {
      currency_type: DEFAULT_CURRENCY,
      amount: gojoCommission,
      transaction: transaction.transaction._id,
      reason: PROFIT_REASON,
      status: "available",
      uniqueId: transaction.transaction.uniqueId,
      ...(client && {
        user_information: {
          user_type: ["user"],
          user: client._id,
        },
      }),
    };

    await Profit.create(profitData);

    return {
      status: "success",
      statusCode: 201,
      message: "Transaction to book hotel successful",
    };
  } catch (error) {
    return {
      status: "failed",
      statusCode: 500,
      message: "Internal server error",
      error: error.message,
    };
  }
};

module.exports = user2HotelTransfer;
