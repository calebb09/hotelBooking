const Transaction = require("../models/transaction");
const Wallet = require("../models/wallet");
const Profit = require("../models/profit");
const refund_response = [];
exports = module.exports = async function (a, b, c, d, e, f) {
  await Transaction.create({
    user_information: {
      user_type: "user",
      user: a.user_information.user,
      client: f,
    },
    transaction_status: "refunded",
    reason: "hotel cancellation",
    amount: a.amount,
    currency_type: a.currency_type,
    action_type: "added",
  })
    .then(async (clinet_transaction_data) => {
      clinet_transaction_data
        ? await Wallet.create({
            user_information: {
              user_type: "user",
              user: a.user_information.user,
            },
            balance: b,
            transaction: clinet_transaction_data._id,
            currency_type: a.currency_type,
          })
            .then(async (user_wallet) => {
              user_wallet
                ? await Transaction.create({
                    user_information: {
                      user_type: "client",
                      client: f,
                    },
                    transaction_status: "refunded",
                    reason: "user cancelled booking",
                    amount: e.amount,
                    currency_type: a.currency_type,
                    action_type: "deducted",
                  })
                    .then(async (hotel_trans) => {
                      hotel_trans
                        ? await Wallet.create({
                            user_information: {
                              user_type: "client",
                              client: f,
                            },
                            balance: c,
                            transaction: hotel_trans.id,
                            currency_type: a.currency_type,
                          })
                            .then(async (hotel_balance) => {
                              if (hotel_balance) {
                                await Profit.create({
                                  user_information: {
                                    user_type: d.user_information.user_type,
                                    user: d.user_information.user,
                                  },
                                  currency_type: d.currency_type,
                                  amount: d.amount,
                                  reason: "refund to client",
                                  status: "refunded",
                                })
                                  .then((profit_data) => {
                                    if (profit_data) {
                                      refund_response.push(
                                        201,
                                        "cancellation successful"
                                      );
                                    } else {
                                      refund_response.push(
                                        400,
                                        "gojo balance not restored"
                                      );
                                    }
                                  })
                                  .catch((err) => {
                                    refund_response.push(500, err);
                                  });
                              } else {
                                refund_response.push(
                                  400,
                                  "hotel balance not restored"
                                );
                              }
                            })
                            .catch((err) => {
                              refund_response.push(500, err);
                            })
                        : refund_response.push(
                            400,
                            "client transaction not restored"
                          );
                    })
                    .catch((err) => {
                      refund_response.push(500, err);
                    })
                : refund_response.push(400, "user balance not restored");
            })
            .catch((err) => refund_response.push(500, err))
        : refund_response.push(500, "user transaction not restored");
    })
    .catch((err) => refund_response.push(500, err));
  return refund_response;
};
