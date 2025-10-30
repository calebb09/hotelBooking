//load modules
const async = require("async");
const PackageDal = require("../dal/package");
const AccommodationDal = require("../dal/accommodation");
const BalanceDal = require("../dal/wallet");
const TransactionDal = require("../dal/transaction");
const ProfitDal = require("../dal/profit");
const now = new Date();
function calculateFutureDate(duration, unit) {
  // Input validation (optional)
  if (isNaN(duration) || !unit) {
    return "Invalid input. Please provide a number for duration and a valid unit.";
  }

  const today = new Date();

  // Handle unit-specific calculations
  switch (unit.toLowerCase()) {
    case "daily":
      return new Date(today.getTime() + duration * 24 * 60 * 60 * 1000);
    case "weekly":
      return new Date(today.getTime() + duration * 7 * 24 * 60 * 60 * 1000);
    case "monthly":
      return new Date(today.setMonth(today.getMonth() + duration));
    case "annual":
      return new Date(today.setFullYear(today.getFullYear() + duration));
    default:
      return 'Invalid unit. Please use "days", "weeks", "months", or "years".';
  }
}

exports.validatePackage = function validatePackage(req, res, next, id) {
  //Validate the id is mongoid or not
  req.checkParams("id", "Invalid param").isMongoId(id);
  var validationErrors = req.validationErrors();
  if (validationErrors) {
    res.status(404).json({
      error: true,
      message: "Not Found",
      status: 404,
    });
  } else {
    PackageDal.get(
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
            msg: "Package _id " + id + " not found",
          });
        }
      }
    );
  }
};

exports.fetchAll = (req, res, next) => {
  PackageDal.getCollection({}, {}, (err, doc) => {
    if (err) {
      return next(err);
    }
    res.status(200).json(doc);
  });
};

exports.subscribe = (req, res, next) => {
  try {
    let response = [];
    let output = [];

    AccommodationDal.get(
      {_id: req._user.assigned_accommodation},
      (err, acc_document) => {
        if (err) {
          return next(err);
        }
        if (acc_document.packageInfo === undefined) {
          response.push("ok");
        } else {
          if (acc_document.packageInfo.hasExpired === true) {
            response.push("ok");
          } else if (acc_document.packageInfo.hasExpired === false) {
            if (acc_document.packageInfo.expiresOn > new Date()) {
              response.push("bad");
            } else {
              AccommodationDal.update(
                {_id: req._user.assigned_accommodation},
                {
                  $set: {
                    "packageInfo.hasExpired": true,
                    "packageInfo.package_level": 0,
                  },
                },
                (err, update_doc) => {
                  if (err) {
                    return next(err);
                  }
                  if (update_doc.packageInfo.hasExpired === true) {
                    response.push("good");
                  } else {
                    response.push("bad");
                  }
                }
              );
            }
          }
        }
        if (response.length === 0) {
          res.status(500).json({msg: "code error empty response"});
        } else {
          if (response[0] === "bad") {
            res.status(400).json({
              msg: "please wait until your current subscription expires",
            });
          } else {
            BalanceDal.get(
              {"user_information.client": req._user.assigned_accommodation},
              (err, balance_doc) => {
                if (err) {
                  return next(err);
                }
                if (balance_doc === null) {
                  output.push("no balance");
                } else {
                  if (Object.keys(balance_doc).length === 0) {
                    output.push("no balance");
                  } else {
                    if (balance_doc.balance < req.doc.price) {
                      output.push("insufficient balance");
                    } else {
                      output.push("ok", balance_doc.balance);
                    }
                  }
                  if (output.length === 0) {
                    res.status(500).json({msg: "error! response is empty"});
                  } else {
                    if (output[0] !== "ok") {
                      res.status(400).json({msg: output[0]});
                    } else {
                      TransactionDal.create(
                        {
                          user_information: {
                            user_type: "client",
                            client: req._user.assigned_accommodation,
                          },
                          transaction_status: "transfer",
                          reason: "package subscription",
                          amount: req.doc.price,
                          action_type: "deducted",
                        },
                        (err, transaction_doc) => {
                          if (err) {
                            return next(err);
                          }
                          let current_balance = output[1] - req.doc.price;
                          BalanceDal.create(
                            {
                              user_information: {
                                user_type: "client",
                                client: req._user.assigned_accommodation,
                              },
                              balance: current_balance,
                              transaction: transaction_doc.id,
                            },
                            (err, create_balance_doc) => {
                              if (err) {
                                return next(err);
                              }
                              if (create_balance_doc) {
                                ProfitDal.create(
                                  {
                                    user_information: {
                                      user_type: "client",
                                      client: req._user.assigned_accommodation,
                                    },
                                    amount: req.doc.price,
                                    transaction: transaction_doc.id,
                                    reason: "Package subscription",
                                    status: create_balance_doc.status,
                                  },
                                  (err, profit_doc) => {
                                    if (err) {
                                      return next(err);
                                    }
                                    if (profit_doc) {
                                      let level = [
                                        "",
                                        "daily",
                                        "weekly",
                                        "monthly",
                                        "annual",
                                      ];
                                      let searchString = req.doc.period;
                                      // Example usage: User selects a 2 months and 1 week package
                                      const packageDuration = [1]; // Months and weeks as an array
                                      const packageUnit = [req.doc.period]; // Units as an array

                                      // Loop through durations and units, calculating and displaying each date
                                      for (
                                        let i = 0;
                                        i < packageDuration.length;
                                        i++
                                      ) {
                                        const futureDate = calculateFutureDate(
                                          packageDuration[i],
                                          packageUnit[i]
                                        );
                                        // console.log(
                                        //   `Start date after adding ${packageDuration[i]} ${packageUnit[i]}: ${futureDate}`
                                        // );
                                        AccommodationDal.update(
                                          {
                                            _id: req._user
                                              .assigned_accommodation,
                                          },
                                          {
                                            packageInfo: {
                                              package_subscription: req.doc.id,
                                              expiresOn: futureDate,
                                              hasExpired: false,
                                              package_level:
                                                level.indexOf(searchString),
                                            },
                                          },
                                          (err, package_document) => {
                                            if (err) {
                                              return next(err);
                                            }
                                            res.status(200).json({
                                              msg: "subscription successful",
                                            });
                                          }
                                        );
                                      }
                                    }
                                  }
                                );
                              }
                            }
                          );
                        }
                      );
                    }
                  }
                }
              }
            );
          }
        }
      }
    );
  } catch (err) {
    console.log(err);
    res.status(500).json(err);
  }
};

exports.fetchOne = (req, res, next) => {
  res.status(200).json(req.doc);
};

exports.create = (req, res, next) => {
  var body = req.body;
  PackageDal.create(body, (err, doc) => {
    if (err) {
      return next(err);
    }
    res.status(200).json(doc);
  });
};

exports.update = (req, res, next) => {
  var body = req.body;
  PackageDal.update({_id: req.doc._id}, body, (err, doc) => {
    if (err) {
      return next(err);
    }
    res.status(200).json(doc);
  });
};

exports.deletepackage = (req, res, next) => {
  PackageDal.delete({_id: req.doc._id}, (err, doc) => {
    if (err) {
      return next(err);
    }
    res.status(200).json(doc);
  });
};

function checkExpiredSubscriptions(req, res, next) {
  AccommodationDal.getCollection(
    {"packageInfo.hasExpired": false},
    {},
    (err, document) => {
      if (err) {
        return next(err);
      }
      async.eachSeries(
        document,
        function (data, callback) {
          if (data.packageInfo.expiresOn > now) {
            AccommodationDal.update(
              {_id: data.id},
              {
                packageInfo: {
                  package_subscription: data.packageInfo.package_subscription,
                  expiresOn: data.packageInfo.expiresOn,
                  hasExpired: true,
                  package_level: 0,
                },
              },
              (err, hotel_doc) => {
                if (err) {
                  return next(err);
                }
              }
            );
          } else {
            console.log("nothing to expire");
          }
          callback(null);
        },
        function done(err) {
          if (err) {
            return next(err);
          } else {
            //res.json(cats);
          }
        }
      );
    }
  );
}
setInterval(checkExpiredSubscriptions, 21600000); //6hrs
