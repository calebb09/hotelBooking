const async = require("async"),
  config = require("../../config"),
  Stripe = require("stripe")(config.STR_SEC),
  Client = require("../models/client"),
  Property = require("../models/accommodation"),
  TransactionDal = require("../dal/transaction"),
  WalletBalance = require("../models/wallet"),
  Transaction = require("../models/transaction");
const mongoose = require("mongoose");
exports.validateWallet = function validateWallet(req, res, next, id) {
  if (!mongoose.Types.ObjectId.isValid(id)) {
    return res.status(400).json({
      error: true,
      message: "Invalid param: ID must be a valid MongoDB ObjectId",
      status: 400,
    });
  }
  TransactionDal.get(
    {
      _id: id,
    },
    function (err, doc) {
      if (err) {
        return next(err);
      }
      if (doc._id) {
        req.doc = doc;
        next();
      } else {
        res.status(404).json({
          error: true,
          status: 404,
          msg: "Wallet _id " + id + " not found",
        });
      }
    }
  );
};
exports.showWallets = async (req, res, next) => {
  let yourId = await Client.findOne({uuid: req.user.uuid});
  if (yourId !== null) {
    let page = req.query.page * 1 || 1;
    let limit = req.query.limit * 1 || 20;
    let query = {
      $and: [
        {"user_information.user": yourId.id},
        {"user_information.user_type": "user"},
        {currency_type: req.params.currency},
      ],
    };
    let queryOpts = {
      page: page,
      limit: limit,
      sort: {_id: -1},
    };
    if (Object.keys(yourId).length > 0) {
      TransactionDal.getCollectionByPagination(
        query,
        queryOpts,
        async (err, doc) => {
          if (err) {
            return next(err);
          }

          // === Fetch latest balances for ETB and USD ===
          const balances = await WalletBalance.aggregate([
            {
              $match: {
                "user_information.user": yourId._id, // match your user
                status: "available",
                currency_type: {$in: ["ETB", "USD"]},
              },
            },
            {
              $sort: {_id: -1}, // newest first
            },
            {
              $group: {
                _id: "$currency_type",
                latestBalance: {$first: "$balance"},
              },
            },
          ]);

          // convert array result to object { ETB: ..., USD: ... }
          const balanceObj = {ETB: 0, USD: 0};
          balances.forEach((b) => {
            balanceObj[b._id] = b.latestBalance;
          });

          // === Send Response ===
          res.status(200).json({
            data: doc.docs.docs,
            limit: limit,
            skip: page,
            balance: balanceObj,
            total: doc.docs.total,
          });
        }
      );
    }
  } else {
    res.status(401).json({
      msg: "unknown user",
    });
  }
};
exports.viewWallet = async (req, res, next) => {
  let page = req.query.page * 1 || 1;
  let limit = req.query.limit * 1 || 20;
  let query = {
    "user_information.client": req._user.assigned_accommodation,
    "user_information.user_type": "client",
    currency_type: req.params.currency,
  };

  let queryOpts = {
    page: page,
    limit: limit,
    sort: {_id: -1},
  };

  TransactionDal.getCollectionByPagination(query, queryOpts, (err, doc) => {
    if (err) {
      return next(err);
    }
    res.status(200).json({
      data: doc.docs.docs,
      limit: limit,
      skip: page,
      // wallet: current_balance,
      balance: {
        USD: getTotalAmountinUsd(doc.docs.docs),
        ETB: getTotalAmountinETB(doc.docs.docs),
      },
      total: doc.docs.total,
    });
  });
};
exports.allBalance = async (req, res, next) => {
  const page = parseInt(req.query.page);
  const limit = parseInt(req.query.limit) || 30;
  /** this is for the employee side */
  const start = page * limit - limit;
  const end = start + limit;
  const arryPush = [];
  /** this is for the employee side ended */
  try {
    if (req.query.role == 1) {
      const clients_list = await Client.find()
        .sort({full_name: 1})
        // .limit(limit)
        // .skip(skipIndex)
        .exec();

      async.eachSeries(
        clients_list,
        function (data, callback) {
          TransactionDal.getCollection(
            {
              "user_information.user": data.id,
              "user_information.user_type": "user",
            },
            {},
            (err, doc) => {
              if (err) {
                return callback(err);
              }
              // Add balance directly into the user object
              data = data.toObject(); // if data is a Mongoose document, convert to plain object
              data.balance = {
                USD: getTotalAmountinUsd(doc),
                ETB: getTotalAmountinETB(doc),
              };

              arryPush.push({
                user: data,
              });

              callback(null);
            }
          );
        },
        function done(err) {
          if (err) {
            return next(err);
          } else {
            let totalSum = arryPush.length;
            const sortedData = arryPush.sort(compareCreatedAt);

            res.json({
              data: sortedData.splice(start, end),
              limit: limit,
              skip: page,
              total: totalSum,
            });
          }
        }
      );
    } else if (req.query.role == 2) {
      /** employee */
      await Property.find()
        .sort({name: 1})
        // .limit(limit)
        // .skip(skipIndex)
        .then(function (data) {
          async.eachSeries(
            data,
            function (element, callback) {
              TransactionDal.getCollection(
                {
                  "user_information.client": element.id,
                  "user_information.user_type": "client",
                },
                {},
                (err, document) => {
                  if (err) {
                    return callback(err);
                  }
                  // Add balance directly into the user object
                  data = element.toObject(); // if data is a Mongoose document, convert to plain object
                  data.balance = {
                    USD: getTotalAmountinUsd(document),
                    ETB: getTotalAmountinETB(document),
                  };

                  arryPush.push({
                    user: data,
                  });

                  callback(null);
                }
              );
            },
            function done(err) {
              if (err) {
                return next(err);
              } else {
                const sortedData = arryPush.sort(compareCreatedAt);
                let totalSum = arryPush.length;
                res.json({
                  data: sortedData.splice(start, end),
                  limit: limit,
                  skip: page,
                  total: totalSum,
                });
                // console.log(arryPush.splice(start, end));
              }
            }
          );
        })
        .catch(function (err) {
          res.status(500).json({
            msg: err,
            status: 500,
          });
        });
    } else {
      res.status(400).json({
        msg: "bad request",
        status: 400,
      });
    }
  } catch (e) {
    res.status(500).json({
      msg: "error occured " + e,
      status: 500,
    });
  }
};
exports.showHistory = async function showHistory(req, res, next) {
  const page = parseInt(req.query.page);
  const limit = parseInt(req.query.limit) || 20;
  const skipIndex = (page - 1) * limit;
  try {
    let query = {};
    let totalAmount = 0;
    var pushDOC = [];
    if (req.query.userType === "user") {
      query = {
        "user_information.user": req.query.userId,
        "user_information.user_type": "user",
        currency_type: req.params.currency,
      };
    } else {
      query = {
        "user_information.client": req.query.userId,
        "user_information.user_type": "client",
        currency_type: req.params.currency,
      };
    }
    const total_transaction = await Transaction.find(query);

    total_transaction.forEach((element) => {
      if (element.action_type === "deducted") {
        totalAmount -= element.amount; // Subtract if action type is deducted
      } else {
        totalAmount += element.amount; // Add otherwise
      }
    });
    totalAmount = Math.round(totalAmount * 100) / 100; // Ensure proper decimal rounding
    await Transaction.find(query)
      .limit(limit)
      .skip(skipIndex)
      .then(function (doc) {
        doc.forEach((data) => {
          pushDOC.push(data);
        });
        res.status(200).json({
          data: {
            transactions: pushDOC,
            total_transaction: totalAmount,
          },
          limit: limit,
          skip: page,
          total: total_transaction.length,
        });
      })
      .catch(function (err) {
        res.status(500).json({
          msg: "error " + err,
          status: 500,
        });
      });
  } catch (e) {
    res.status(500).json({
      msg: "error thrown " + e,
      status: 500,
    });
  }
};
exports.fetchOne = (req, res, next) => {
  TransactionDal.get({_id: req.doc._id}, (err, doc) => {
    if (err) {
      return next(err);
    }
    if (doc.wallet_recharge.is_recharge === true) {
      Stripe.charges
        .retrieve(doc.wallet_recharge.stripeId)
        .then((data) => {
          res.status(200).json({
            user_information: doc.user_information,
            transaction_status: doc.transaction_status,
            wallet_recharge: {
              is_recharge: doc.wallet_recharge.is_recharge,
              amount: doc.wallet_recharge.amount,
              stripe: data,
              reason: doc.reason,
              currency_type: doc.currency_type,
              action_type: doc.action_type,
              created_at: doc.created_at,
            },
          });
        })
        .catch((err) => res.status(err.statusCode).json(err));
    } else {
      res.status(200).json(doc);
    }
  });
};

function compareCreatedAt(a, b) {
  const dateA = new Date(a.created_at);
  const dateB = new Date(b.created_at);
  // Return 1 if a is older (smaller timestamp), -1 if newer (larger timestamp)
  return dateB - dateA;
}
// Function to calculate total amount
function getTotalAmountinUsd(data) {
  let total = 0;
  for (const item of data) {
    if (item.currency_type === "USD") {
      if (item.action_type === "added") {
        total += item.amount;
      } else if (item.action_type === "deducted") {
        total -= item.amount;
      }
    }
  }
  return total;
}
function getTotalAmountinETB(data) {
  let total = 0;
  for (const item of data) {
    if (item.currency_type === "ETB") {
      if (item.action_type === "added") {
        total += item.amount;
      } else if (item.action_type === "deducted") {
        total -= item.amount;
      }
    }
  }
  return total;
}
