// Load Module Dependencies
const {jwtDecode} = require("jwt-decode");
const Accommodation = require("../models/accommodation");
const config = require("../../config");
const StripePayment = require("../functions/stripePayment");
const RoomMdl = require("../models/rooms");
const BookingDal = require("../dal/booking");
const BookingMdl = require("../models/booking");
const ServiceModel = require("../models/service");
const UserModel = require("../models/user");
const SendMessage = require("../functions/sendMessage");
const SendEmail = require("../functions/bookEmailNotif");
const Client = require("../models/client");
const TransactionDal = require("../dal/transaction");
const Transaction = require("../models/transaction");
const Wallet = require("../models/wallet");
const SubRoom = require("../models/subRoomType");
const Chapa = require("../models/chapaStore");
const user2HotelTransfer = require("../utils/bookTransaction");
const {v4: uuidv4} = require("uuid");
const chapaDirectPay = require("../functions/chapaPayment");
const {
  createPayment,
  verifyPayment,
  createCharge,
  transferChapa,
  bankLists,
  currencyConvert,
} = require("../services/chapa");
const {model} = require("mongoose");
let message = {};
let email_lists = [];
let output_response = [];
const mogoose = require("mongoose");
// let account_status = false;
/** service charge based on the number of booking plus in the profit section find a way to handle the room price error */
exports.validateTransaction = function validateTransaction(req, res, next, id) {
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
          msg: "Transaction _id " + id + " not found",
        });
      }
    }
  );
};
exports.verifyPayment = async (req, res) => {
  const checkChapa = await Chapa.findById(req.params.chapaId).populate({
    path: "transaction",
    model: Transaction,
    select: "id",
  });

  let message = {};
  let {transaction_status, uid, balance_status} = "";

  if (checkChapa) {
    if (checkChapa.status === "pending") {
      // this is to check if payment is settled
      const arr = ["failed/cancelled", "success"];
      const chapaTransaction = await verifyPayment(checkChapa.tx_ref);
      if (checkChapa.reason === "recharge") {
        if (chapaTransaction.data.data.status === "success") {
          transaction_status = "recharge";
        } else {
          transaction_status = chapaTransaction.data.data.status;
        }
      } else if (checkChapa.reason === "booking") {
        if (chapaTransaction.data.data.status === "success") {
          transaction_status = "payment";
        } else {
          transaction_status = chapaTransaction.data.data.status;
        }
      }
      if (chapaTransaction.data.data.status === "pending") {
        return res.status(400).json({msg: "pending payment"});
      } else if (chapaTransaction.data.data.status === "failed/cancelled") {
        message = {
          notification: {
            title: "Transaction Failed",
            message: `Dear ${chapaTransaction.data.data.first_name}!
            
                      We regret to inform you that the transaction to ${checkChapa.reason} has failed`,
          },
        };
        balance_status = "failed";
      } else if (chapaTransaction.data.data.status === "success") {
        message = {
          notification: {
            title: "Transaction Successful",
            message: `Dear ${chapaTransaction.data.data.first_name}!
                    
                      Your Transaction for ${checkChapa.reason} is completed`,
          },
        };
        balance_status = "available";
      }
      // make an update on the wallet
      if (arr.includes(chapaTransaction.data.data.status)) {
        TransactionDal.update(
          {_id: checkChapa.transaction.id},
          {transaction_status: transaction_status, updated_at: new Date()},
          async (err, transaction) => {
            if (err) {
              return next(err);
            }
            //next is update the wallet
            const checkWallet = await Wallet.findOne({
              transaction: checkChapa.transaction.id,
            });
            if (checkWallet) {
              const getBalance =
                checkWallet.balance - chapaTransaction.data.data.charge;
              const updateWallet = await Wallet.findByIdAndUpdate(
                checkWallet.id,
                {
                  balance: getBalance,
                  update_at: new Date(),
                  status: balance_status,
                },
                {new: true}
              );
              // update the chapaStore
              const updateChapaStore = await Chapa.findByIdAndUpdate(
                req.params.chapaId,
                {
                  chargeInfo: {
                    actual_price: chapaTransaction.data.data.amount,
                    fee: chapaTransaction.data.data.charge,
                    total:
                      chapaTransaction.data.data.amount -
                      chapaTransaction.data.data.charge,
                  },
                  status: validatePayment.data.data.status,
                  update_at: new Date(),
                },
                {
                  new: true,
                }
              );
            }
          }
        );

        // check if reason is booking

        if (checkChapa.reason === "booking") {
          const getBooking = await BookingMdl.findOne({
            tx_ref: checkChapa.tx_ref,
          });
          // now make an update
          let statusValue = chapaTransaction.data.data.status;

          const updateBooking = await BookingMdl.findByIdAndUpdate(
            getBooking.id,
            {
              transaction: checkChapa.transaction.id,

              status:
                statusValue === "failed/cancelled"
                  ? "cancelled"
                  : statusValue === "success"
                  ? "booked"
                  : statusValue,
              updated_at: new Date(),
            },
            {
              new: true,
            }
          );

          // transfer money to hotel

          if (statusValue === "success") {
            const paytoBook = await user2HotelTransfer(
              checkChapa,
              chapaTransaction.data.data.reference
            );
          }
        }
        // send message
        if (checkChapa.transaction.user_information === undefined) {
          uid = null;
        } else {
          const getClientUid = await Client.findById(
            checkChapa.transaction.user_information.user
          );
          uid = getClientUid;
        }
        SendMessage(message, uid, null, "to", chapaTransaction.data.data.email);
      } else {
        res.json({msg: "status still pending"});
      }
    } else {
      return res.status(400).json({msg: "payment already settled"});
    }
  } else {
    return res.status(404).json({msg: "id not found"});
  }
};
exports.chapaVerify = async (req, res) => {
  const txtID = req.params.txtnID;
  const showData = await verifyPayment(txtID);
  showData.status === 200
    ? res.status(200).json(showData.data)
    : res.status(showData.status).json(showData.error);
};
exports.chapaBankLists = async (req, res) => {
  try {
    const showLists = await bankLists();
    if (showLists.status === 200) {
      res.status(200).json(showLists.data.data);
    } else {
      res.status(showLists.status).json(showLists.error);
    }
  } catch (err) {
    res.status(500).json({msg: `error ocurred: ${err}`});
  }
};
exports.directPay = async (req, res, next) => {
  try {
    let body = req.body;
    let create_query = {};
    let errors = [];
    let entry = {};
    let price_query = {};
    let userId = null;
    let full_name = "";
    let phone = "";
    let email = "";
    let serviceCharge = 0;
    //training_date

    if (req.body.room.length === 0) {
      errors.push("at least select 1 room to proceed with your booking");
    } else {
      errors.push();
    }
    if (Date.parse(new Date()) > Date.parse(new Date(req.body.checkIn))) {
      // console.log("checkIn less than today error here...");
      errors.push("Invalid checkIn date", 400);
    } else {
      errors.push();
    }
    /**check the children age that is entered in the array is equivalent to number of children */
    if (req.body.children_age.length === req.body.children) {
      errors.push();
    } else {
      // console.log("children error here...");
      errors.push("number of children does not match your description", 400);
    }
    let getAccommodation = await RoomMdl.findOne({
      _id: req.body.room[0],
    }).populate({path: "subRoomType", model: SubRoom});

    let query = {
      description: req.body.descrption,
      room: req.body.room,
      checkIn: req.body.checkIn,
      checkOut: req.body.checkOut,
      accommodation: getAccommodation.subRoomType.accommodation.toString(),
      guests: {
        adult: req.body.adult,
        children: req.body.children,
        children_age: req.body.children_age,
      },
    };

    let children_age_limit = 18;
    let exceedingNumbers = req.body.children_age.filter(
      (num) => num > children_age_limit
    );
    if (exceedingNumbers.length === 0) {
      errors.push();
    } else {
      // console.log("child age error here...");
      errors.push("child age limit exceeds", 400);
    }

    if (
      Date.parse(new Date(req.body.checkIn)) >
      Date.parse(new Date(req.body.checkOut))
    ) {
      errors.push("checkIn exceeds checkout", 400);
    } else {
      errors.push();
    }
    // console.log(req.headers.authorization);
    if (req.headers.authorization === undefined) {
      price_query = {};
      account_status = false;
      userId = null;
      full_name = body.name;
      phone = body.phone_number;

      email = body.email;
      entry = {
        created_by: {
          has_account: false,
          guest: {
            name: full_name,
            phone: phone,
            email: email,
          },
        },
      };
      create_query = Object.assign(query, entry);
    } else {
      let decode = jwtDecode(req.headers.authorization.split(" ")[1]);
      let clientInfo = await Client.find({uuid: decode.user_id});

      userId = clientInfo[0].id;
      full_name = clientInfo[0].full_name;
      phone = clientInfo[0].phone;
      if (clientInfo[0].email === null || clientInfo[0].email === undefined) {
        req
          .checkBody("email")
          .notEmpty()
          .withMessage("Email is required")
          .isEmail()
          .withMessage("Should be valid email");
        email = body.email;
      } else {
        email = clientInfo[0].email;
      }
      // email = clientInfo[0].email;
      if (clientInfo.length > 0) {
        create_query = Object.assign(query, {
          created_by: {
            has_account: true,
            client: clientInfo[0].id,
          },
        });
        errors.push();
      } else {
        errors.push("user not found", 400);
      }
      /** check the client's booking level for possible discount */
      let totalBooking = await BookingMdl.find({
        "created_by.client": clientInfo[0]._id,
      });
      price_query = {
        number_of_booking: {
          $gte: totalBooking.length,
          $lte: totalBooking.length,
        },
      };
    }
    // console.log(price_query);
    let discountPrice = await ServiceModel.find(price_query);
    if (discountPrice.length > 0) {
      serviceCharge = discountPrice[0].amount;

      if (errors.length > 0) {
        res.status(errors[1]).json({
          msg: errors[0],
        });
      } else {
        let roomDetail = [];
        for (let i = 0; i < req.body.room.length; i++) {
          let room_doc = await RoomMdl.findOne({
            $and: [{_id: req.body.room[i]}],
          }).populate([
            {path: "subRoomType", model: SubRoom, select: "price_info"},
          ]);
          room_doc === null ? roomDetail.push() : roomDetail.push(room_doc);
        }

        if (body.currency_type === "USD") {
          var amount = 0;
          console.log(roomDetail);
          await StripePayment.directPay(
            "user",
            userId,
            req.body.stripeToken,
            amount,
            0,
            full_name,
            email,
            phone,
            "added",
            "booking",
            roomDetail,
            serviceCharge,
            req.body
          )
            .then((data) => {
              data[2] === 201
                ? output_response.push(data[0], data[2], data[3])
                : output_response.push(data[1], data[2]);
            })
            .catch((err) => console.log(err));
          // console.log(output_response);
          if (output_response[0] === "ok") {
            // console.log(output_response[2]);
            let addedTransactiondocument = Object.assign(create_query, {
              // transaction: output_response[2].id,
              is_paid: true,
            });
            console.log(addedTransactiondocument);
            let book_create_doc = await BookingMdl.create(
              addedTransactiondocument
            );

            let user_doc = await UserModel.find({
              $or: [
                {
                  assigned_accommodation: roomDetail[0].accommodation,
                },
              ],
            });
            user_doc.map((item) => {
              item.account_status === "active"
                ? email_lists.push(item.username)
                : email_lists.push();
            });

            let checkInformattedDate = config.DATE_READABLE(
              book_create_doc.checkIn
            );
            let checkOutformattedDate = config.DATE_READABLE(
              book_create_doc.checkOut
            );
            /** you need a notification alert */
            let howmanyRooms = roomDetail.length;
            let room_numbers = [];
            roomDetail.forEach((item) => {
              room_numbers.push(item.room_number);
            });
            message = {
              notification: {
                title: "Room Booking Request",
                body: `${full_name} has requested for ${howmanyRooms} Room[s], Room number: ${room_numbers} to be booked on ${checkInformattedDate}. Checkout date on ${checkOutformattedDate}`,
              },
            };

            /** update or enter the room */
            for (let i = 0; i < req.body.room.length; i++) {
              await RoomMdl.updateOne(
                {_id: req.body.room[i]},
                {
                  $push: {booking_calendar: book_create_doc.id},
                  updated_at: new Date(),
                }
              );
            }

            SendMessage(
              message,
              null,
              roomDetail[0].accommodation,
              "bcc",
              email_lists
            );
            res.status(200).json({
              msg: "book request sent",
              status: 200,
            });
          } else {
            res.status(output_response[1]).json(output_response);
          }
        } else {
          res.status(400).json({msg: "invalid currency"});
        }
      }
    } else {
      res.status(400).json({msg: "discount settings not yet configured"});
    }
  } catch (err) {
    console.log(err);
    res.status(500).json(err);
  }
};
exports.localPay = async (req, res, next) => {
  try {
    var txtId = `gojo-booking-${uuidv4()}`; // Always generate a new UUID
    var price_query = {};
    const getConversionRate = await currencyConvert();
    if (getConversionRate.status === 200) {
      if (req.body.room.length === 0) {
        return res.status(400).json({msg: "room not selected"});
      }
      if (Date.parse(new Date()) > Date.parse(new Date(req.body.checkIn))) {
        return res.status(400).json({msg: "Invalid checkIn date"});
      }
      let roomDetail = [];
      for (let i = 0; i < req.body.room.length; i++) {
        let room_doc = await RoomMdl.findOne({
          _id: req.body.room[i],
        }).populate({path: "subRoomType", model: SubRoom});
        room_doc === null ? roomDetail.push() : roomDetail.push(room_doc);
      }

      let getAccommodation = await RoomMdl.findOne({
        _id: req.body.room[0],
      }).populate({path: "subRoomType", model: SubRoom});
      console.log(getAccommodation);
      let serviceCharge = 0;
      let userId = null;
      let query = {
        description: req.body.descrption,
        room: req.body.room,
        checkIn: req.body.checkIn,
        checkOut: req.body.checkOut,
        accommodation: getAccommodation.subRoomType.accommodation.toString(),
        guests: {
          adult: req.body.adult,
          children: req.body.children,
          children_age: req.body.children_age,
        },
        tx_ref: txtId,
      };
      let create_query = {};
      if (!req.headers.authorization) {
        price_query = {};
        serviceCharge = "20%";
        userId = null;
        let entry = {
          created_by: {
            has_account: false,
            guest: {
              name: req.body.full_name,
              phone: req.body.phone,
              email: req.body.email,
            },
          },
        };
        create_query = Object.assign(query, entry);
      } else {
        let decode = jwtDecode(req.headers.authorization.split(" ")[1]);
        let clientInfo = await Client.findOne({uuid: decode.user_id});
        create_query = Object.assign(query, {
          created_by: {
            has_account: true,
            client: clientInfo.id,
          },
        });
        userId = clientInfo.uuid;
        /** check the client's booking level for possible discount */
        let totalBooking = await BookingMdl.find({
          "created_by.client": clientInfo.id,
        });
        price_query = {
          number_of_booking: {
            $gte: totalBooking.length,
            $lte: totalBooking.length,
          },
        };

        let discountPrice = await ServiceModel.find(price_query);
        if (discountPrice.length > 0) {
          serviceCharge = discountPrice[0].amount;
        } else {
          serviceCharge = "20%";
        }
      }

      // console.log(price_query);
      const startRequest = await chapaDirectPay(
        req.body.payment_type,
        req.body.phone,
        roomDetail,
        userId,
        serviceCharge,
        txtId,
        req.body.email,
        req.body.first_name,
        req.body.last_name,
        req.body
      );

      if (startRequest.statusCode === 200 || startRequest.statusCode === 201) {
        // save booking
        const saveBooking = new BookingMdl(create_query);
        const bookingSaved = await saveBooking.save();
        if (bookingSaved) {
          return res.status(201).json({
            msg: "continue to checkout page",
            storeId: startRequest.storedId,
            checkOut_URL: startRequest.checkOut,
          });
        } else {
          return res.status(400).json({msg: "Booking request failed"});
        }
      } else {
        console.log(startRequest);
        return res.status(startRequest.status).json(startRequest);
      }
    } else {
      return res.status(getConversionRate.status).json(getConversionRate.error);
    }
  } catch (error) {
    console.log(error);
    return res
      .status(500)
      .json({error: error.response ? error.response.data : error.message});
  }
};
exports.walletPay = async (req, res, next) => {
  let error_msg = [];
  let room_doc = [];

  const hasDuplicates = req.body.room.length !== new Set(req.body.room).size;
  if (hasDuplicates) {
    error_msg.push("room cannot be the same", 400);
  } else {
    let userDetail = await Client.find({uuid: req.user.uuid});
    let numberofBooking = await BookingMdl.find({
      "created_by.client": userDetail[0].id,
    });
    let discountPrice = await ServiceModel.find({
      number_of_booking: {
        $gte: numberofBooking.length,
        $lte: numberofBooking.length,
      },
    });
    let serviceCharge = discountPrice[0].amount;
    if (userDetail.length > 0) {
      /** checkIf selected room is available or not */
      let roomdetail = await RoomMdl.findOne({_id: req.body.room[0]});
      /** loop room*/
      for (let i = 0; i < req.body.room.length; i++) {
        await RoomMdl.findOne({
          _id: req.body.room[i],
        }).then((data) =>
          data === null ? room_doc.push() : room_doc.push(data)
        );
      }
      let {totalPrice, currentRate} = 0;
      if (req.body.currency_type === "USD") {
        currentRate = 0;
        totalPrice = getTotalRoomPrice(room_doc);
      } else if (req.body.currency_type === "ETB") {
        const getConversionRate = await currencyConvert();
        if (getConversionRate.status === 200) {
          currentRate = getConversionRate.data[0].rate;
          totalPrice = getTotalRoomPrice(room_doc) * currentRate;
        } else {
          return res.status(400).json({msg: "Exhange Rate not available"});
        }
      }

      error_msg.length === 0
        ? await StripePayment.walletPay(
            userDetail[0],
            totalPrice,
            room_doc,
            "Room Booking",
            serviceCharge,
            req.body.currency_type,
            currentRate
          )
            .then((data) => {
              data[2] === 201
                ? BookingDal.create(
                    {
                      accommodation: roomdetail.accommodation,
                      description: req.body.descrption,
                      room: req.body.room,
                      checkIn: req.body.checkIn,
                      checkOut: req.body.checkOut,
                      guests: {
                        adult: req.body.adult,
                        children: req.body.children,
                        children_age: req.body.children_age,
                      },
                      transaction: data[3].id,
                      is_paid: true,
                      created_by: {
                        has_account: true,
                        client: userDetail[0].id,
                      },
                    },
                    async (err, created_doc) => {
                      if (err) {
                        return next(err);
                      }
                      if (created_doc) {
                        for (let i = 0; i < req.body.room.length; i++) {
                          await RoomMdl.updateOne(
                            {_id: req.body.room[i]},
                            {
                              $push: {booking_calendar: created_doc.id},
                              updated_at: new Date(),
                            }
                          );
                        }
                        res.status(201).json({msg: "successful", status: 201});
                      } else {
                        res.status(400).json({
                          msg: "Booking document not saved",
                          status: 400,
                        });
                      }
                    }
                  )
                : res.status(data[2]).json({msg: data[1]});
            })
            .catch((err) => {
              res.status(500).json(err);
            })
        : res.status(error_msg[1]).json({msg: error_msg[0]});
    } else {
      res.status(401).json({msg: "user not found"});
    }
  }
};
exports.rechargeWallet = async (req, res, next) => {
  let user_email = "";
  req.checkBody("stripeToken").notEmpty().withMessage("Stripe Token is a must");
  req
    .checkBody("payment_amount")
    .notEmpty()
    .withMessage("payment_amount is a must")
    .isNumeric()
    .withMessage("Only number allowed");
  var amount = Math.round(req.body.payment_amount * 100);
  await Client.findOne({uuid: req.user.uuid})
    .then(async (data) => {
      if (data === null) {
        res.status(400).json({msg: "user not found", status: 404});
      } else {
        if (data.email === null) {
          req
            .check("email")
            .notEmpty()
            .withMessage("Email is required")
            .isEmail()
            .withMessage("Should be valid email");
          var validationErrors = req.validationErrors();
          if (validationErrors) {
            res.status(400);
            res.json(validationErrors);
            return;
          }
          user_email = req.body.email;
        } else {
          user_email = data.email;
        }

        if (Object.keys(data).length > 0) {
          let userId = data.id;
          let stripePay = await StripePayment.directPay(
            "user",
            userId,
            req.body.stripeToken,
            amount,
            req.body.payment_amount,
            req.user.full_name,
            user_email,
            req.user.phone_number,
            "added",
            "recharge",
            null,
            null
          );
          console.log(stripePay);
          stripePay[2] === 201
            ? res.status(stripePay[2]).json({
                msg: `Payment ${stripePay[1]}`,
                status: stripePay[2],
              })
            : res.status(stripePay[2]).json({
                msg: stripePay[1],
                status: stripePay[2],
              });
        } else {
          res.status(401).json({
            msg: "unauthorzied access",
            status: 401,
          });
        }
      }
    })
    .catch((error) => {
      console.log(error);
      res.status(500).json(error);
    });
};
exports.clientChargeWallet = async (req, res, next) => {
  req.checkBody("stripeToken").notEmpty().withMessage("Token is empty");
  var validationErrors = req.validationErrors();
  if (validationErrors) {
    res.status(400);
    res.json(validationErrors);
    return;
  }
  var amount = Math.round(req.body.payment_amount * 100);
  req._user.role === "owner"
    ? await StripePayment.directPay(
        "client",
        req._user.assigned_accommodation,
        req.body.stripeToken,
        amount,
        req.body.payment_amount,
        req._user.internal.full_name + " " + req._user.internal.last_name,
        req._user.username,
        req._user.phone,
        "added",
        "recharge",
        null,
        null
      )
        .then((stripePay) => {
          stripePay[2] === 201
            ? res.status(stripePay[2]).json({
                msg: "Payment " + stripePay[1],
                status: stripePay[2],
              })
            : res.status(stripePay[2]).json({
                msg: "Payment " + stripePay[1],
                status: stripePay[2],
              });
        })
        .catch((err) => {
          res.status(500).json(err);
        })
    : res.status(401).json({msg: "unauthorized"});
};
exports.walletRechargeChapa = async (req, res) => {
  try {
    const {first_name, last_name, phone_number, email, amount} = req.body;
    if (!amount || !phone_number || !last_name || !first_name || !email) {
      return res.status(400).json({msg: "All fields are required."});
    }
    var txtId = `gojo-recharge-${uuidv4()}`; // Always generate a new UUID
    const input = {
      ...req.body,
      currency: "ETB",
      tx_ref: txtId,
    }; // Ensure tx_ref is included

    console.log("Sending to Chapa:", input);
    const saveCharge = await createPayment(
      input.amount,
      input.currency,
      input.email,
      input.first_name,
      input.last_name,
      input.phone_number,
      txtId,
      "GOJO Booking",
      `${input.first_name} making payment to GojoBooking`,
      "https://gojobooking.com/assets/icons/gojo_logo.png"
    );
    console.log(saveCharge);
    if (saveCharge.status === 200) {
      // save to chapa store
      const saveChapa = new Chapa({
        uuid: req.user.uuid,
        // transaction: startTransaction.transaction.id,
        tx_ref: input.tx_ref,
        payment_method: "chapaPay",
        chapa_ref: txtId,
        status: "pending",
        reason: "recharge",
        chargeInfo: {
          actual_price: amount,
        },
      });
      await saveChapa.save();
      if (saveChapa) {
        res.status(200).json({
          msg: "transaction saved",
          checkOutUrl: saveCharge.data.data.checkout_url,
          storeId: saveChapa.id,
        });
      }
    } else {
      return res.status(400).json({msg: saveCharge.message});
    }
  } catch (err) {
    return res.status(500).json({msg: `error ${err}`});
  }
};
exports.pendingPay = async (req, res) => {
  try {
    req
      .checkBody("stripeToken")
      .notEmpty()
      .withMessage("StripeToken is required");
    var validationErrors = req.validationErrors();
    if (validationErrors) {
      res.status(400);
      res.json(validationErrors);
      return;
    }
    let price_query = {};
    let serviceCharge = "20%";

    const getBooking = await BookingMdl.findOne({
      tx_ref: req.params.txtId,
      status: "accepted",
      is_paid: false,
    }).populate([
      {
        path: "accommodation",
        model: Accommodation,
      },
      {
        path: "room",
        model: RoomMdl,
        populate: [{path: "subRoomType", model: SubRoom}],
      },
      {
        path: "created_by",
        populate: [
          {
            path: "client",
            model: Client,
          },
        ],
      },
    ]);
    if (getBooking) {
      if (getBooking.created_by.has_account === false) {
        price_query = {};
        serviceCharge = "20%";
      } else {
        /** check the client's booking level for possible discount */
        let totalBooking = await BookingMdl.find({
          "created_by.client": getBooking.created_by.client.id,
        });
        price_query = {
          number_of_booking: {
            $gte: totalBooking.length,
            $lte: totalBooking.length,
          },
        };

        let discountPrice = await ServiceModel.find(price_query);
        if (discountPrice.length > 0) {
          serviceCharge = discountPrice[0].amount;
        } else {
          serviceCharge = "20%";
        }
      }
      const paywithStripe = await StripePayment.directPay(
        "user",
        getBooking.created_by.has_account === true
          ? getBooking.created_by.client.id
          : null,
        req.body.stripeToken,
        0,
        0,
        getBooking.created_by.has_account
          ? getBooking.created_by.client.full_name
          : getBooking.created_by.guest.name,
        getBooking.created_by.has_account
          ? getBooking.created_by.client.email
          : getBooking.created_by.guest.email,
        getBooking.created_by.has_account
          ? getBooking.created_by.client.phone
          : getBooking.created_by.guest.phone,
        "added",
        "booking",
        getBooking.room,
        serviceCharge,
        getBooking
      );
      //display output
      if (paywithStripe[0] === "ok") {
        //update booking

        const updateBooking = await BookingMdl.findByIdAndUpdate(
          getBooking.id,
          {
            status: "reserved",
            transaction: paywithStripe[1].transaction,
            is_paid: true,
            updated_at: new Date(),
          },
          {new: true}
        );
        for (let i = 0; i < updateBooking.room.length; i++) {
          await RoomMdl.findOneAndUpdate(
            {_id: updateBooking.room[i]},
            {
              $addToSet: {booking_calendar: updateBooking.id},
              status: "reserved",
              updated_at: new Date(),
            },
            (err, room_doc) => {
              if (err) {
                return next(err);
              }
            }
          );
        }
        // notify the client
        SendEmail(
          getBooking.created_by.has_account
            ? getBooking.created_by.client.full_name
            : getBooking.created_by.guest.name,
          getBooking.accommodation,
          getBooking,
          getBooking.created_by.has_account
            ? getBooking.created_by.client.email
            : getBooking.created_by.guest.email
        );
        return res.status(paywithStripe[2]).json({msg: paywithStripe[0]});
      } else {
        return res.status(paywithStripe[2]).json({msg: paywithStripe[1]});
      }
    } else {
      return res
        .status(404)
        .json({msg: "tx_ref either does not exist or payment is settled"});
    }
  } catch (error) {
    console.log(error);
    return res.status(500).json({msg: `error ${error}`});
  }
};
exports.chapaPay = async (req, res, next) => {
  const {amount, currency, email, first_name, last_name, phone_number} =
    req.body;
  const tx_ref = `gojo-book-${uuidv4()}`; // Unique transaction reference
  const saveChapa = await createPayment(
    amount,
    currency,
    email,
    first_name,
    last_name,
    phone_number,
    tx_ref,
    "GOJO BOOKING",
    `${first_name} making payment to GojoBooking`,
    "https://gojobooking.com/assets/icons/gojo_logo.png"
  );
  console.log(tx_ref);
  saveChapa.status === 200
    ? res.status(200).json({
        msg: saveChapa.data.status,
        redirect_url: saveChapa.data.data.checkout_url,
      })
    : res.json(saveChapa.status).json({msg: saveChapa.error});
};
exports.chapaCharge = async (req, res) => {
  try {
    // var tx_ref = `gojo-book-${uuidv4()}`;
    // const input = {...req.body, tx_ref}; // Properly append tx_ref
    const {amount, currency, mobile, payment_method} = req.body;

    if (!amount || !currency || !mobile || !payment_method) {
      return res.status(400).json({msg: "All fields are required."});
    }
    var txtId = `gojo-book-${uuidv4()}`; // Always generate a new UUID
    const input = {...req.body, tx_ref: txtId}; // Ensure tx_ref is included

    console.log("Sending to Chapa:", input);
    const saveCharge = await createCharge(input, req.body.payment_method);
    console.log(saveCharge);
    if (saveCharge.status === "success") {
    }
  } catch (err) {
    return res.status(500).json({msg: `error ${err}`});
  }
};
exports.chapaBank = async (req, res) => {
  try {
    let {account_name, account_number, amount, bank_code, reference} = req.body;
    let currency = "ETB";
    await transferChapa(
      account_name,
      account_number,
      amount,
      currency,
      bank_code,
      reference
    )
      .then((response) => {
        let output = JSON.parse(response);
        console.log(response);
        if (output.status === "success") {
          res.status(200).json(output);
        } else {
          res.status(400).json(output);
        }
        // console.log("Transfer Response:", response);
      })
      .catch((error) => {
        res.status(500).json({msg: error.message});
      });
  } catch (err) {
    return res.status(500).json({msg: `error occured ${err}`});
  }
};
exports.chapaSearch = async (req, res) => {
  try {
    const showLists = await bankLists();
    if (showLists.status === 200) {
      const bank = showLists.data.data.filter(
        (b) => b.swift === req.body.swiftcode
      );

      res.status(200).json(bank);
    } else {
      res.status(showLists.status).json(showLists.error);
    }
  } catch (err) {
    res.status(500).json({msg: `error ocurred: ${err}`});
  }
};

function getTotalRoomPrice(data) {
  let total = 0;
  for (const item of data) {
    total += item.subRoomType.price_info.original_price;
  }
  return total;
}
function isCheckInBetweenCalendarDates(checkIn, calendar) {
  const checkInDate = new Date(checkIn);
  const startDate = new Date(calendar[0]);
  const endDate = new Date(calendar[1]);

  return checkInDate >= startDate && checkInDate <= endDate;
}
