// load modules
const BankDal = require("../dal/bank");
const BankMdel = require("../models/bank");
const Wallet = require("../models/wallet");
const Client = require("../models/client");
const transferWise = require("../functions/wiseWithdraw");
const {generateUniqueAlphanumericString} = require("../functions/calculation");
const {transferChapa, bankLists} = require("../services/chapa");
const hotelTransaction = require("../utils/hotelTransaction");
const createTransaction = require("../utils/wallet");
const today = new Date();
const formatted = today.toISOString().split("T")[0];
const mongoose = require("mongoose");

exports.validateBank = function validateBank(req, res, next, id) {
  if (!mongoose.Types.ObjectId.isValid(id)) {
    return res.status(400).json({
      error: true,
      message: "Invalid param: ID must be a valid MongoDB ObjectId",
      status: 400,
    });
  }
  BankDal.get(
    {
      _id: id,
    },
    function (err, doc) {
      if (doc._id) {
        req.doc = doc;
        next();
      } else {
        res.status(404).json({
          error: true,
          status: 404,
          msg: "Bank _id " + id + " not found",
        });
      }
    }
  );
};
exports.fetchAll = async (req, res, next) => {
  let query = {};
  let page = req.query.page * 1 || 1;
  let limit = req.query.limit * 1 || 20;
  let queryOpts = {
    page: page,
    limit: limit,
    sort: {created_at: -1},
  };
  try {
    BankDal.getCollectionByPagination(query, queryOpts, (err, doc) => {
      if (err) {
        return next(err);
      }
      res.status(200).json({
        data: doc.docs.docs,
        limit: limit,
        skip: page,
        total: doc.docs.total,
      });
    });
  } catch (e) {
    res.status(500).json({
      msg: "Error Occured" + e,
      status: 500,
    });
  }
};
exports.myBank = (req, res, next) => {
  BankDal.getCollection(
    {created_by: req._user.assigned_accommodation},
    {},
    (err, bank_document) => {
      if (err) {
        return next(err);
      }
      res.status(200).json(bank_document);
    }
  );
};
exports.myBanks = (req, res, next) => {
  BankDal.getCollection({uuid: req.user.uuid}, {}, (err, bank_document) => {
    if (err) {
      return next(err);
    }
    res.status(200).json(bank_document);
  });
};
exports.fetchOne = function fetchOne(req, res) {
  res.json(req.doc);
};
exports.create = (req, res, next) => {
  var body = req.body;
  BankDal.getCollection(
    {
      $and: [
        {created_by: req._user.assgined_accommodation},
        {bank_name: req.body.bank_name},
        {bank_holder_name: req.body.accountHolderName},
        {bank_acct: req.body.details.accountNumber},
      ],
    },
    {},
    async (err, bank_document) => {
      if (err) {
        return next(err);
      }
      bank_document.length > 0
        ? res.status(200).json({msg: "already exist"})
        : await transferWise
            .saveRecepient(
              null,
              req.body.type,
              req.body.country,
              req.body.bank_name,
              req.body.details.accountNumber,
              req.body.accountHolderName,
              req.body.details.BIC,
              req.body.details.abartn,
              req._user.assigned_accommodation,
              body
            )
            .then((data) => {
              res.status(data[1]).json({msg: data[0]});
            })
            .catch((error) => res.json(error));
    }
  );
};
exports.createBanks = (req, res, next) => {
  var body = req.body;
  BankDal.getCollection(
    {
      $and: [
        {uuid: req.user.uuid},
        {bank_name: req.body.bank_name},
        {bank_holder_name: req.body.accountHolderName},
        {bank_acct: req.body.details.accountNumber},
      ],
    },
    {},
    async (err, bank_document) => {
      if (err) {
        return next(err);
      }
      bank_document.length > 0
        ? res.status(200).json({msg: "already exist"})
        : await transferWise
            .saveRecepient(
              req.user.uuid,
              req.body.type,
              req.body.country,
              req.body.bank_name,
              req.body.details.accountNumber,
              req.body.accountHolderName,
              req.body.details.BIC,
              req.body.details.abartn,
              null,
              body
            )
            .then((data) => {
              res.status(data[1]).json({msg: data[0]});
            })
            .catch((error) => res.json(error));
    }
  );
};
exports.withdrawMoney = async (req, res) => {
  /** first check if the balance is available from the client side */
  try {
    req
      .checkBody("sourceAmount")
      .notEmpty()
      .withMessage("Amount should not be empty")
      .len(2, 3)
      .withMessage("2 to 3 digit")
      .isNumeric()
      .withMessage("Only number allowed");
    req.checkBody("bankId").notEmpty().withMessage("Bank should not be empty");
    var validationErrors = req.validationErrors();
    if (validationErrors) {
      res.status(400);
      res.json(validationErrors);
      return;
    }
    await Wallet.findOne({
      $and: [
        {"user_information.user_type": "client"},
        {"user_information.client": req._user.assigned_accommodation},
        {currency_type: req.body.currency},
      ],
    })
      .sort({_id: -1})
      .then(async (data) => {
        if (data === null) {
          res.status(403).json({msg: "data not found"});
        } else {
          let userInfo = {
            user_information: {
              user_type: "client",
              client: req._user.assigned_accommodation,
            },
          };
          if (Object.keys(data).length > 0) {
            if (data.balance < 30) {
              res
                .status(400)
                .json({msg: "your balance is insufficient to withdraw"});
            }
            if (req.body.sourceAmount > data.balance) {
              res
                .status(400)
                .json({msg: "amount is greater than your balance"});
            } else {
              await BankMdel.find({
                $and: [
                  {_id: req.body.bankId},
                  {created_by: req._user.assigned_accommodation},
                ],
              }).then(async (bank_data) => {
                if (bank_data.length > 0) {
                  if (
                    bank_data[0].wiseAccount_id === undefined ||
                    bank_data[0].wiseAccount_id === null ||
                    bank_data[0].wiseAccount_id === ""
                  ) {
                    res.status(400).json({msg: "wise account missing"});
                  } else {
                    if (req.body.currency === "USD") {
                      await transferWise
                        .withdraw(
                          req.body.sourceAmount,
                          bank_data[0],
                          data.balance,
                          // req._user.assigned_accommodation,
                          userInfo
                        )
                        .then((data) => {
                          if (data[1] === 200 || data[1] === 400) {
                            return res.status(data[1]).json({msg: data[0]});
                          } else {
                            return res
                              .status(data[1])
                              .json({msg: data[0], error: data[2]});
                          }
                        })
                        .catch((err) => res.json(err));
                    } else {
                      const showLists = await bankLists();
                      if (showLists.status === 200) {
                        const bank = showLists.data.data.filter(
                          (b) => b.swift === bank_data[0].bank_swift_code
                        );
                        if (bank.length > 0) {
                          let bankId;
                          if (bank_data[0].bank_swift_code === "CBETETAA") {
                            bankId = bank[1];
                          } else {
                            bankId = bank[0];
                          }
                          await transferChapa(
                            bank_data[0].bank_holder_name,
                            bank_data[0].bank_acct,
                            req.body.sourceAmount,
                            bankId.currency,
                            bankId.id,
                            `${formatted}-${generateUniqueAlphanumericString(
                              10
                            )}`
                            // `withdraw to bank referenceId ${formatted}-${generateUniqueAlphanumericString}`
                          )
                            .then(async (response) => {
                              let output = JSON.parse(response);
                              console.log(response);
                              if (output.status === "success") {
                                const saveTransaction = await hotelTransaction(
                                  req.body.sourceAmount,
                                  "deducted",
                                  req._user.assigned_accommodation,
                                  "withdraw",
                                  response.data,
                                  "fund sent to localbank"
                                );
                                saveTransaction.status === "success"
                                  ? console.log("local transactions saved")
                                  : console.log(saveTransaction.message);
                                return res.status(200).json(output);
                              } else {
                                return res.status(400).json(output);
                              }
                              // console.log("Transfer Response:", response);
                            })
                            .catch((error) => {
                              return res.status(500).json({msg: error.message});
                            });
                        } else {
                          return res.status(400).json({
                            msg: "This bank is not in the list for withdrawal",
                          });
                        }
                      } else {
                        res.status(showLists.status).json(showLists.error);
                      }
                    }
                  }
                } else {
                  res.status(400).json({msg: "bank not found"});
                }
              });
            }
          } else {
            res.status(403).json({msg: "You don't have a transaction history"});
          }
        }
      })
      .catch((err) => res.status(500).json(err));
  } catch (err) {
    res.status(500).json(err);
  }
};
exports.withDrawNow = async (req, res) => {
  /** first check if the balance is available from the client side */
  try {
    req
      .checkBody("sourceAmount")
      .notEmpty()
      .withMessage("Amount should not be empty")
      .len(2, 3)
      .withMessage("2 to 3 digit")
      .isNumeric()
      .withMessage("Only number allowed");
    req.checkBody("bankId").notEmpty().withMessage("Bank should not be empty");
    var validationErrors = req.validationErrors();
    if (validationErrors) {
      res.status(400);
      res.json(validationErrors);
      return;
    }
    const customerInfo = await Client.findOne({uuid: req.user.uuid});

    if (customerInfo) {
      let userInfo = {
        user_information: {
          user_type: "user",
          user: customerInfo.id,
        },
      };
      await Wallet.findOne({
        $and: [
          {"user_information.user_type": "user"},
          {"user_information.user": customerInfo.id},
          {currency_type: req.body.currency},
        ],
      })
        .sort({_id: -1})
        .then(async (data) => {
          if (data === null) {
            return res.status(403).json({msg: "data not found"});
          } else {
            if (Object.keys(data).length > 0) {
              if (data.balance < 30) {
                return res
                  .status(400)
                  .json({msg: "your balance is insufficient to withdraw"});
              }
              if (req.body.sourceAmount > data.balance) {
                return res
                  .status(400)
                  .json({msg: "amount is greater than your balance"});
              } else {
                await BankMdel.find({
                  $and: [{_id: req.body.bankId}, {uuid: req.user.uuid}],
                }).then(async (bank_data) => {
                  if (bank_data.length > 0) {
                    if (
                      bank_data[0].wiseAccount_id === undefined ||
                      bank_data[0].wiseAccount_id === null ||
                      bank_data[0].wiseAccount_id === ""
                    ) {
                      return res
                        .status(400)
                        .json({msg: "wise account missing"});
                    } else {
                      if (req.body.currency === "USD") {
                        await transferWise
                          .withdraw(
                            req.body.sourceAmount,
                            bank_data[0],
                            data.balance,
                            // req._user.assigned_accommodation,
                            userInfo
                          )
                          .then((data) =>
                            res.status(data[1]).json({msg: data[2]})
                          )
                          .catch((err) => res.json(err));
                      } else {
                        const showLists = await bankLists();
                        if (showLists.status === 200) {
                          const bank = showLists.data.data.filter(
                            (b) => b.swift === bank_data[0].bank_swift_code
                          );
                          if (bank.length > 0) {
                            let bankId;
                            if (bank_data[0].bank_swift_code === "CBETETAA") {
                              bankId = bank[1];
                            } else {
                              bankId = bank[0];
                            }
                            await transferChapa(
                              bank_data[0].bank_holder_name,
                              bank_data[0].bank_acct,
                              req.body.sourceAmount,
                              bankId.currency,
                              bankId.id,
                              `${formatted}-${generateUniqueAlphanumericString(
                                10
                              )}`
                              // `withdraw to bank referenceId ${formatted}-${generateUniqueAlphanumericString}`
                            )
                              .then(async (response) => {
                                let output = JSON.parse(response);
                                console.log(response);
                                if (output.status === "success") {
                                  const saveTransaction =
                                    await createTransaction(
                                      req.body.sourceAmount,
                                      "deducted",
                                      req.user.uuid,
                                      "available",
                                      "money withdraw",
                                      0,
                                      "withdraw"
                                    );
                                  saveTransaction.status === "success"
                                    ? console.log("local transactions saved")
                                    : console.log(saveTransaction.message);
                                  return res.status(200).json(output);
                                } else {
                                  return res.status(400).json(output);
                                }
                                // console.log("Transfer Response:", response);
                              })
                              .catch((error) => {
                                return res
                                  .status(500)
                                  .json({msg: error.message});
                              });
                          } else {
                            return res.status(400).json({
                              msg: "This bank is not in the list for withdrawal",
                            });
                          }
                        } else {
                          res.status(showLists.status).json(showLists.error);
                        }
                      }
                    }
                  } else {
                    res.status(400).json({msg: "bank not found"});
                  }
                });
              }
            } else {
              res
                .status(403)
                .json({msg: "You don't have a transaction history"});
            }
          }
        })
        .catch((err) => res.status(500).json(err));
    } else {
      return res.status(400).json({msg: "unknown user"});
    }
  } catch (err) {
    res.status(500).json(err);
  }
};
exports.update = function update(req, res, next) {
  var body = req.body;
  body.updated_at = new Date();
  BankDal.update(
    {
      _id: req.doc._id,
    },
    body,
    function updateBank(err, doc) {
      if (err) {
        return next(err);
      }
      res.json(doc);
    }
  );
};
exports.deleteBanks = (req, res, next) => {
  if (req.user.uuid === req.doc.uuid) {
    BankDal.delete(
      {
        _id: req.doc._id,
      },
      async (err, doc) => {
        if (err) {
          return next(err);
        }
        if (doc) {
          // next remove from wise
          const removefromWise = await transferWise.remove(
            req.doc.wiseAccount_id
          );
          if (removefromWise[0] === 200) {
            return res.status(200).json({msg: removefromWise[1]});
          } else {
            return res.status(removefromWise[0]).json({msg: removefromWise[1]});
          }
        }
        return res.status(400).json({msg: "error bank did not remove"});
      }
    );
  } else {
    return res.status(400).json({msg: "unauthorized to remove"});
  }
};
exports.deleteBank = (req, res, next) => {
  BankDal.delete(
    {
      _id: req.doc._id,
    },
    async (err, doc) => {
      if (err) {
        return next(err);
      }
      if (doc) {
        // next remove from wise
        const removefromWise = await transferWise.remove(
          req.doc.wiseAccount_id
        );
        if (removefromWise[0] === 200) {
          return res.status(200).json({msg: removefromWise[1]});
        } else {
          return res.status(removefromWise[0]).json({msg: removefromWise[1]});
        }
      }
      return res.status(400).json({msg: "error bank did not remove"});
    }
  );
};
