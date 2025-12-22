const config = require("../../config");
const {
  createPayment,
  reverseChapaPayment,
  currencyConvert,
} = require("../services/chapa");
const convertPhoneNumber = require("./convertPhone");
const ChapaStore = require("../models/chapaStore");
const {
  ifonlydiscountLocaldirectPay,
  totalCommission,
  totalRoomPrice,
} = require("./calculation");

const chapaDirectPay = async (
  paymentType,
  phone,
  rooms,
  uid,
  discount,
  txRef,
  email,
  firstName,
  lastName,
  booking
) => {
  try {
    let convertedMobile = convertPhoneNumber(phone);
    //get the amount and convert it
    // the game is here
    const getConversionRate = await currencyConvert();
    const rate = getConversionRate.data[0].rate;
    //how many nights to stay
    const msPerDay = 1000 * 60 * 60 * 24;
    const diffDays = Math.round(
      (new Date(booking.checkOut) - new Date(booking.checkIn)) / msPerDay
    );

    // get total price
    // let totalPayment = await ifonlydiscountLocaldirectPay(rooms, booking);
    // if (discount === "20%") {
    //   totalPayment = await ifonlydiscountLocaldirectPay(rooms);
    // } else {
    //   totalPayment = await discountAndLevelLocalDirectPay(
    //     rooms,
    //     discount,
    //     "ETB"
    //   );
    // }

    //new updated totalPayment
    // let updatedPayment = totalPayment * diffDays;
    // let getTotalPaymentBirr = updatedPayment * rate;
    // let finalPayment = getTotalPaymentBirr + getTotalPaymentBirr * 0.025;

    //newGojoShare

    let gojoShare = totalCommission(rooms, discount) * diffDays;
    console.log("gojoShare", gojoShare);
    let gojoShareBirr = gojoShare * rate;

    //getHotelShare
    let hotelShare = totalRoomPrice(rooms, booking) * diffDays;
    let hotelShareBirr = hotelShare * rate;

    const saveCharge = await createPayment(
      gojoShareBirr, // used to be finalpayment but not the logic is about the commission payment not the room price payment
      "ETB",
      email,
      firstName,
      lastName,
      convertedMobile,
      txRef,
      "GOJO BOOKING",
      `${firstName} booking room via GojoBooking`,
      "https://gojobooking.com/assets/icons/gojo_logo.png"
    );

    if (saveCharge.status === 200) {
      // save on chapa store
      const storeChapa = new ChapaStore({
        uuid: uid,
        reason: "booking",
        payment_method: paymentType,
        tx_ref: txRef,
        // chapa_ref: saveCharge.data.meta.ref_id,
        status: saveCharge.data.payment_status,
        chargeInfo: {
          // actual_price: getTotalPaymentBirr,
          // fee: getTotalPaymentBirr * config.Chapa.fee,
          // total: getTotalPaymentBirr - getTotalPaymentBirr * config.Chapa.fee,
          // hotelShare: hotelShareBirr,
          gojoShare: gojoShareBirr,
        },
      });
      //
      const saveStore = await storeChapa.save();
      if (!saveStore) {
        // error occured in the database that means it has to be refunded
        const refundtoCustomer = await reverseChapaPayment(
          saveCharge.data.meta.ref_id,
          "Refund due to system error while booking on Gojo app"
        );
        if (refundtoCustomer.status === "success") {
          return {
            status: "bad",
            statusCode: 500,
            message: `Error on the database occured ${refundtoCustomer.message}`,
          };
        } else {
          return {
            status: "failed",
            statusCode: refundtoCustomer.status,
            message: "Please contact customer support ASAP",
            error: refundtoCustomer.error,
          };
        }
      } else {
        return {
          status: "success",
          statusCode: 201,
          storedId: saveStore.id,
          message: saveCharge.data.message,
          checkOut: saveCharge.data.data.checkout_url,
        };
      }
    } else {
      return saveCharge;
    }
  } catch (error) {
    return {
      status: "failed",
      statusCode: 500,
      error: error.response ? error.response.data : error.message,
      log: error,
    };
  }
};

module.exports = chapaDirectPay;
