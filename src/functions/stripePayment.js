const config = require("../../config");
const Stripe = require("stripe")(config.STR_SEC);
const BalanceDal = require("../models/wallet");
const ProfitMdl = require("../models/profit");
const TransactionDal = require("../models/transaction");
let user_info = {};
let user_query = {};
let transaction_status = "";
let recharge_boolean = false;

exports = module.exports.directPay = async function (
  userType,
  userId,
  stripeToken,
  amounts,
  payment_amount,
  full_name,
  email,
  phone,
  actionType,
  reason,
  roomInfo,
  discount,
  bookingDetail,
) {
  try {
    let output = [];
    let {commissionPayment, hotelShare, totalPayment, amount} = 0;
    if (reason === "recharge") {
      amount = amounts;
      // hotelShare = payment_amount;
      totalPayment = payment_amount;
      recharge_boolean = true;
      transaction_status = "recharge";
    } else {
      // the game is here
      //how many nights to stay
      const msPerDay = 1000 * 60 * 60 * 24;
      const diffDays = Math.round(
        (new Date(bookingDetail.checkOut) - new Date(bookingDetail.checkIn)) /
          msPerDay,
      );

      // Total extra charges
      //////////////////////////////////////////////////////||||||||||||||||||
      recharge_boolean = false;
      transaction_status = "payment";
      // hotelShare = totalRoomPrice(roomInfo, bookingDetail) * diffDays;
      commissionPayment = totalCommission(roomInfo, discount) * diffDays;
      console.log("discount " + discount);
      totalPayment = commissionPayment;
      // if (discount === "20%") {
      //   totalPayment =
      //     ifonlydiscountdirectPay(roomInfo, bookingDetail) * diffDays;
      // } else {
      //   totalPayment =
      //     calculateTotalPriceifdiscountLevelhaveValuedirectPay(
      //       roomInfo,
      //       discount
      //     ) * diffDays;
      // }
      amount = Math.round(totalPayment * 100);
    }

    //Math.round(payment_amount * 100);

    // let amount = Math.round(payment_amount * 100);

    if (userType === "user") {
      user_query = {
        "user_information.user": userId,
      };
      user_info = {
        user_information: {
          user_type: userType,
          user: userId,
        },
      };
    } else {
      user_query = {
        "user_information.client": userId,
      };
      user_info = {
        user_information: {
          user_type: userType,
          client: userId,
        },
      };
    }
    console.log("show me amount " + amount);
    await Stripe.customers
      .create({
        name: full_name,
        email: email,
        source: stripeToken,
      })
      .then(
        async (customer) =>
          await Stripe.charges.create({
            amount,
            currency: "usd",
            customer: customer.id,
            description: "Booking a room",
            metadata: {
              from: "Triplaye",
              customer_name: full_name,
              customer_email: email,
              customer_phone: phone,
            },
            receipt_email: "info@triplaye.com",
          }),
      )
      .then(
        async (charge) =>
          charge.status === "succeeded"
            ? await TransactionDal.create({
                user_information: {
                  user_type: userType,
                  user: userId,
                },
                amount: commissionPayment,
                transaction_status,
                reason,
                currency_type: "USD",
                action_type: "deducted",
              })
                .then(async (transaction_data) => {
                  await ProfitMdl.create({
                    user_information: {
                      user_type: userType,
                      user: userId,
                    },
                    amount: commissionPayment,
                    transaction: transaction_data.id,
                    reason: "Booking a room",
                    status: "available",
                  }).then(async (profit_data) => {
                    if (profit_data) {
                      output.push("ok", profit_data, 201);
                    } else {
                      output.push("bad", "profit not saved", 400);
                    }
                  });
                })
                .catch((error) => {
                  output.push("bad", error.message, 500);
                })
            : output.push("bad", "payment failed", 400),

        // ((stripe_response = charge))
      )

      .catch((err) => {
        console.log("you");
        // console.log(err);
        output.push("bad", err, 500);
        //   res.status(err.raw.statusCode).json({
        //     error: true,
        //     type: err.raw.type,
        //     msg: err.raw.message,
        //     status: err.raw.statusCode,
        //   });
      });
    return output;
  } catch (error) {
    console.log(error);
    return ["bad", error.message, 500];
  }
};

exports = module.exports.walletPay = async function (
  userInformation,
  payment_amount,
  roomInfo,
  reason,
  discount,
  currency,
  exchangeRate,
) {
  // Function to modify the original_price property
  const modifyPriceInfo = (obj) => {
    obj.subRoomType.price_info.original_price *= 0.15; // Multiply by 0.2
  };

  // Modify each object in the data array
  roomInfo.forEach(modifyPriceInfo);

  let output = [];
  let {totalAmount, commission, roomPrice} = 0;
  if (currency === "USD") {
    totalAmount = calculateTotalCost4Wallet(roomInfo, discount);
    commission = calculateTotalCommission4Wallet(roomInfo, discount);
    roomPrice = calculateTotalRoomPrice4Wallet(roomInfo);
  } else {
    totalAmount = calculateTotalCost4Wallet(roomInfo, discount) * exchangeRate;
    commission =
      calculateTotalCommission4Wallet(roomInfo, discount) * exchangeRate;
    roomPrice = calculateTotalRoomPrice4Wallet(roomInfo) * exchangeRate;
  }
  await BalanceDal.find({
    $and: [
      {"user_information.user": userInformation.id},
      {status: "available"},
      {currency_type: currency},
    ],
  })
    .sort({_id: -1})
    .then(async (data) => {
      data.length > 0
        ? data[0].balance === 0
          ? output.push("bad", "balance insufficient", 400)
          : data[0].balance < payment_amount
            ? output.push("bad", "balance insufficient", 400)
            : await TransactionDal.create({
                user_information: {
                  user_type: "user",
                  user: userInformation.id,
                  client: roomInfo[0].subRoomType.accommodation,
                },
                transaction_status: "payment",
                amount: totalAmount,
                action_type: "deducted",
                uniqueId: generateUniqueAlphanumericString(10),
                reason: reason,
                currency_type: currency,
              })
                .then(async (tran_data) => {
                  let current_balance_1 = data[0].balance - totalAmount;
                  await BalanceDal.create({
                    user_information: {
                      user_type: "user",
                      user: userInformation.id,
                    },
                    balance: current_balance_1,
                    transaction: tran_data.id,
                    uniqueId: tran_data.uniqueId,
                    currency_type: currency,
                    status: "available",
                  })
                    .then(async (balance_data) => {
                      /** transfer to accommodation or hotel */
                      if (balance_data) {
                        await TransactionDal.create({
                          user_information: {
                            user_type: "client",
                            client: roomInfo[0].subRoomType.accommodation,
                            user: userInformation.id,
                          },
                          transaction_status: "transfer",
                          amount: roomPrice,
                          currency_type: currency,
                          uniqueId: balance_data.uniqueId,
                          action_type: "added",
                          reason:
                            "room booking payment from " +
                            userInformation.full_name,
                        })
                          .then(async (transaction_data) => {
                            await BalanceDal.find({
                              "user_information.client":
                                roomInfo[0].subRoomType.accommodation,
                              currency_type: currency,
                            })
                              .sort({_id: -1})
                              .then(async (balance_data) => {
                                let current_balance_2 = 0;
                                if (balance_data.length === 0) {
                                  current_balance_2 = roomPrice;
                                } else {
                                  current_balance_2 =
                                    balance_data[0].balance + roomPrice;
                                }
                                await BalanceDal.create({
                                  user_information: {
                                    user_type: "client",
                                    client:
                                      roomInfo[0].subRoomType.accommodation,
                                  },
                                  balance: current_balance_2,
                                  transaction: transaction_data.id,
                                  uniqueId: transaction_data.uniqueId,
                                  currency_type: currency,
                                  status: "available",
                                })
                                  .then(async (balance_document) => {
                                    /** transfer the rest as a profit */
                                    await ProfitMdl.create({
                                      user_information: {
                                        user_type: "user",
                                        user: userInformation.id,
                                      },
                                      amount: commission,
                                      uniqueId: balance_document.uniqueId,
                                      transaction: transaction_data.id,
                                      currency_type: currency,
                                      reason: "Booking a room",
                                      status: "available",
                                    })
                                      .then((profit_data) => {
                                        if (profit_data) {
                                          output.push(
                                            "ok",
                                            profit_data,
                                            201,
                                            tran_data,
                                          );
                                        } else {
                                          output.push(
                                            "bad",
                                            "profit not saved",
                                            400,
                                          );
                                        }
                                      })
                                      .catch((err) => {
                                        output.push("bad", err, 500);
                                      });
                                  })
                                  .catch((err) => {
                                    output.push("bad", err, 500);
                                  });
                              })
                              .catch((error) => output.push("bad", error, 500));
                          })
                          .catch((err) => output.push("bad", err, 500));
                      } else {
                        output.push("bad", "balance not saved", 400);
                      }
                    })
                    .catch((err) => {
                      output.push("bad", err, 500);
                    });
                })
                .catch((err) => output.push("bad", err, 500))
        : output.push("bad", "Balance insufficient", 404);
    })
    .catch((error) => output.push("bad", error, 500));
  return output;
};

function calculateStripe(a) {
  const calculate_it = a * config.STRiPE.percentage_charge_fee,
    inPercent = calculate_it / 100,
    finalCalculate = inPercent + config.STRiPE.extra_charge_in_cent,
    formatNum = Math.round(finalCalculate * 100) / 100;
  return formatNum;
}

async function checkPending(req, res, next) {
  const data = await BalanceDal.find({status: "pending", currency_type: "USD"});
  if (data.length > 0) {
    for (const item of data) {
      if (item?.transaction?.wallet_recharge?.stripeId) {
        await Stripe.charges
          .retrieve(item.transaction.wallet_recharge.stripeId)
          .then(async (stripe_data) => {
            stripe_data.status === "succeeded"
              ? await BalanceDal.updateOne(
                  {_id: item.id},
                  {status: stripe_data.status},
                )
                  .then(async (wallet_balance) => {
                    await TransactionDal.updateOne(
                      {_id: wallet_balance.transaction.id},
                      {
                        wallet_recharge: {
                          status: stripe_data.status,
                        },
                      },
                    );
                  })
                  .catch((err) => {
                    console.log("error updating" + err);
                  })
              : await BalanceDal.updateOne(
                  {_id: item.id},
                  {status: stripe_data.status},
                )
                  .then(async (wallet_balance) => {
                    await TransactionDal.updateOne(
                      {_id: wallet_balance.transaction.id},
                      {
                        wallet_recharge: {
                          status: stripe_data.status,
                        },
                      },
                    );
                  })
                  .catch((err) => {
                    console.log("error updating" + err);
                  });
          })
          .catch((err) => console.log(err));
      }
    }
  }
}
setInterval(checkPending, 7200000); //6hrs

function calculateTotalCost4Wallet(data, level) {
  let totalPrice = 0;

  // Make a deep copy of the data to avoid modifying the original input
  const dataCopy = JSON.parse(JSON.stringify(data));

  dataCopy.forEach((item) => {
    const priceInfo = item.subRoomType.price_info;
    let price;

    if (priceInfo.hasOwnProperty("discount")) {
      if (priceInfo.discount !== "") {
        const discountPercent = parseFloat(priceInfo.discount) / 100;
        price = priceInfo.room_price * (1 - discountPercent);
      } else {
        price = priceInfo.room_price;
      }
    } else {
      price = priceInfo.room_price;
    }

    if (level !== "20%") {
      const levelPercent = parseFloat(level) / 100;
      const adjustedCommission =
        priceInfo.commissionAmount - priceInfo.commissionAmount * levelPercent;
      price += adjustedCommission;
    } else {
      price += priceInfo.commissionAmount;
    }

    totalPrice += price;
  });

  return totalPrice;
}

function calculateTotalRoomPrice4Wallet(data) {
  let totalPrice = 0;
  data.forEach((item) => {
    const priceInfo = item.subRoomType.price_info;
    let price = priceInfo.room_price;
    if (priceInfo.hasOwnProperty("discount")) {
      if (priceInfo.discount !== "") {
        const discountPercent = parseFloat(priceInfo.discount) / 100;
        price = priceInfo.room_price - priceInfo.room_price * discountPercent;
      } else {
        price = priceInfo.room_price;
      }
    }
    totalPrice += price;
  });
  return totalPrice;
}

function calculateTotalCommission4Wallet(data, level) {
  let totalPrice = 0;
  data.forEach((item) => {
    const priceInfo = item.subRoomType.price_info;
    let price = priceInfo.commissionAmount;

    if (level !== "20%") {
      const discountPercent = parseFloat(level) / 100;
      price =
        priceInfo.commissionAmount -
        priceInfo.commissionAmount * discountPercent;
    }
    totalPrice += price;
  });

  return totalPrice;
}

/** if both level and discount exists */
function calculateTotalPriceifdiscountLevelhaveValuedirectPay(data, level) {
  let totalPrice = 0;

  data.forEach((item) => {
    const priceInfo = item.subRoomType.price_info;
    let price = priceInfo.actual_price;

    let levelAdjustedPrice = price;
    let discountAdjustedPrice = price;

    if (level !== "20%") {
      const levelPercent = parseFloat(level) / 100;
      const adjustedCommission = priceInfo.commissionAmount * levelPercent;
      levelAdjustedPrice = priceInfo.commissionAmount - adjustedCommission;
    }

    if (priceInfo.has_discount === true) {
      if (priceInfo.discount !== "") {
        const discountPercent = parseFloat(priceInfo.discount) / 100;
        discountAdjustedPrice =
          priceInfo.room_price - priceInfo.room_price * discountPercent;
      } else {
        discountAdjustedPrice = price;
      }
    }

    if (level !== "20%" && priceInfo.hasOwnProperty("discount")) {
      // If both level and discount exist, add the additional fee after calculating the adjusted price
      if (priceInfo.discount !== "") {
        price = discountAdjustedPrice + levelAdjustedPrice;
      } else {
        price = priceInfo.actual_price;
      }
    } else if (level !== "20%") {
      price = levelAdjustedPrice;
    } else if (priceInfo.hasOwnProperty("discount")) {
      if (priceInfo.discount !== "") {
        price = discountAdjustedPrice;
      } else {
        price = priceInfo.actual_price;
      }
    }

    if (level !== "20%" || priceInfo.hasOwnProperty("discount")) {
      const additionalFee = price * 0.029 + 0.3;
      price += additionalFee;
    }

    totalPrice += price;
  });

  return totalPrice;
}
/** if only discount appears but not level */
function ifonlydiscountdirectPay(data, booking) {
  let totalPrice = 0;

  data.forEach((item) => {
    const priceInfo = item.subRoomType.price_info;
    let price = priceInfo.actual_price;

    // Check if discount exists
    if (priceInfo.has_discount === true) {
      price = priceInfo.discountInfo.actual_price;
    }

    // Check if item.id matches any ID in withBreakFast
    if (booking.withBreakFast && booking.withBreakFast.length > 0) {
      const hasBreakfast = booking.withBreakFast.some(
        (roomId) => roomId.toString() === item.id.toString(),
      );
      if (hasBreakfast && priceInfo.breakfast_price) {
        price += priceInfo.breakfast_price;
      }
    }

    // Check if item.id matches any ID in withRefundable
    if (booking.withRefundable && booking.withRefundable.length > 0) {
      const isRefundable = booking.withRefundable.some(
        (roomId) => roomId.toString() === item.id.toString(),
      );
      if (isRefundable && priceInfo.refundable_price) {
        price += priceInfo.refundable_price;
      }
    }

    totalPrice += price;
  });

  return totalPrice;
}

/** display the total room price for the accommodation */
function totalRoomPrice(data, booking) {
  let totalPrice = 0;
  data.forEach((item) => {
    const priceInfo = item.subRoomType.price_info;
    let price = priceInfo.room_price;

    // Check if discount exists
    if (priceInfo.has_discount === true) {
      price = priceInfo.discountInfo.room_price;
    }

    // Check if item.id matches any ID in withBreakFast
    if (booking?.withBreakFast?.length > 0) {
      const hasBreakfast = booking.withBreakFast.some(
        (roomId) => roomId.toString() === item.id.toString(),
      );
      if (hasBreakfast && priceInfo.breakfast_price) {
        price += priceInfo.breakfast_price;
      }
    }

    // Check if item.id matches any ID in withRefundable
    if (booking?.withRefundable?.length > 0) {
      const isRefundable = booking.withRefundable.some(
        (roomId) => roomId.toString() === item.id.toString(),
      );
      if (isRefundable && priceInfo.refundable_price) {
        price += priceInfo.refundable_price;
      }
    }

    totalPrice += price;
  });

  return totalPrice;
}
/** display the total Commission */
function totalCommission(data, level) {
  let totalPrice = 0;

  data.forEach((item) => {
    const priceInfo = item.subRoomType.price_info;
    let price = priceInfo.commissionAmount;
    if (level !== "20%") {
      const levelPercent = parseFloat(level) / 100;
      const adjustedCommission =
        priceInfo.commissionAmount - priceInfo.commissionAmount * levelPercent;
      price = adjustedCommission;
    }
    totalPrice += price;
  });

  return totalPrice;
}
// Function to generate a unique alphanumeric string
function generateUniqueAlphanumericString(length) {
  const characters =
    "abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789";
  const uniqueStrings = new Set();

  while (true) {
    let string = "";
    for (let i = 0; i < length; i++) {
      string += characters.charAt(
        Math.floor(Math.random() * characters.length),
      );
    }

    if (!uniqueStrings.has(string)) {
      uniqueStrings.add(string);
      return string;
    }
  }
}
