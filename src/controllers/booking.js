// Load Module Dependencies
const async = require("async");
const {jwtDecode} = require("jwt-decode");
const BookingDal = require("../dal/booking");
const BookMdl = require("../models/booking");
const Transaction = require("../models/transaction");
const Wallet = require("../models/wallet");
const Profit = require("../models/profit");
const RateDal = require("../models/ratings");
const Facility = require("../models/facilities");
const RoomType = require("../models/room_type");
const Accommodation = require("../models/accommodation");
const Client = require("../models/client");
const RoomDal = require("../dal/rooms");
const RoomMdl = require("../models/rooms");
const RatingDal = require("../dal/rate");
const Rate = require("../models/ratings");
const sendEmail = require("../functions/bookEmailNotif");
const sendMessage = require("../functions/sendMessage");
const Service = require("../models/service");
const acceptBooking = require("../utils/acceptBooking");
const User = require("../models/user");
const refundTransaction = require("../functions/walletRefund");
const subRoomType = require("../models/subRoomType");
const {v4: uuidv4} = require("uuid");
const showPrice = require("../utils/getRoomPrice");
const HoldPayment = require("../models/pendingPayment");

const Broker = require("../utils/broker");
const now = new Date();
const mongoose = require("mongoose");

exports.validateBooking = function validateBooking(req, res, next, id) {
  if (!mongoose.Types.ObjectId.isValid(id)) {
    return res.status(400).json({
      error: true,
      message: "Invalid param: ID must be a valid MongoDB ObjectId",
      status: 400,
    });
  }
  BookingDal.get(
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
          msg: "Booking _id " + id + " not found",
        });
      }
    },
  );
};
exports.fetchAll = async function fetchAll(req, res, next) {
  let page = req.query.page * 1 || 1;
  let limit = req.query.limit * 1 || 20;
  let query = {};
  let queryOpts = {
    page: page,
    limit: limit,
    sort: {_id: -1},
  };
  try {
    BookingDal.getCollectionByPagination(query, queryOpts, (err, doc) => {
      if (err) {
        return next(err);
      }
      res.status(200).json({
        data: doc.docs,
        limit: limit,
        skip: page,
        total: doc.total,
      });
    });
  } catch (e) {
    res.status(500).json({
      msg: "Error Occured" + e,
      status: 500,
    });
  }
};
exports.myHistory = async (req, res, next) => {
  let userId = await Client.findOne({uuid: req.user.uuid});
  let page = req.query.page * 1 || 1;
  let limit = req.query.limit * 1 || 20;
  let query = {
    $and: [
      {
        "created_by.has_account": true,
      },
      {
        "created_by.client": userId.id,
      },
    ],
  };
  let queryOpts = {
    page: page,
    limit: limit,
    sort: {_id: -1},
  };
  try {
    BookingDal.getCollectionByPagination(query, queryOpts, (err, doc) => {
      if (err) {
        return next(err);
      }
      res.status(200).json({
        data: doc.docs,
        limit: limit,
        skip: page,
        total: doc.total,
      });
    });
  } catch (e) {
    res.status(500).json(e);
  }
};
exports.byTxtId = (req, res, next) => {
  BookingDal.get({tx_ref: req.params.txtId}, (err, doc) => {
    if (err) {
      return next(err);
    }
    if (!doc) {
      res.status(404).json({msg: "booking does not exist"});
      return;
    }
    res.status(200).json(doc);
    return;
  });
};
exports.myBooking = async function myBookings(req, res, next) {
  let page = req.query.page * 1 || 1;
  let limit = req.query.limit * 1 || 20;
  let query = {
    accommodation: req._user.assigned_accommodation,
  };
  let queryOpts = {
    page: page,
    limit: limit,
    sort: {_id: -1},
  };
  try {
    BookingDal.getCollectionByPagination(query, queryOpts, (err, doc) => {
      if (err) {
        return next(err);
      }
      res.status(200).json({
        data: doc.docs,
        limit: limit,
        skip: page,
        total: doc.total,
      });
    });
  } catch (e) {
    res.status(500).json(e);
  }
};
exports.fetchOne = function fetchOne(req, res, next) {
  res.json(req.doc);
};
exports.bookingManually = async function manualCreateBooking(req, res, next) {
  var body = req.body;
  // req.checkBody("name").notEmpty().withMessage("Name is required");

  // req.checkBody("checkIn").notEmpty().withMessage("CheckIn is required");
  // req.checkBody("checkOut").notEmpty().withMessage("Checkout is required");
  // req.checkBody("room").notEmpty().withMessage("Room is required");
  // var validationErrors = req.validationErrors();
  // if (validationErrors) {
  //   res.status(400);
  //   res.json(validationErrors);
  //   return;
  // }
  if (body.room.length > 0) {
    await Accommodation.find({
      $and: [
        {
          _id: req._user.assigned_accommodation,
        },
        {
          room: {$in: req.body.room},
        },
      ],
    })
      .then((data) => {
        if (data.length > 0) {
          BookingDal.create(
            {
              accommodation: req._user.assigned_accommodation,
              status: "reserved",
              room: body.room,
              checkIn: body.checkIn,
              checkOut: body.checkOut,
              tx_ref: "manual-booked-" + uuidv4(),
              guests: {
                adult: body.adult,
                children: body.children,
                children_age: body.children_age,
              },
              is_paid: true,
              created_by: {
                has_account: false,
                guest: {
                  name: body.name,
                  phone: body.phone,
                  email: body.email,
                },
              },
            },
            (err, document) => {
              if (err) {
                return next(err);
              }
              if (document) {
                if (document.status === "reserved") {
                  for (let i = 0; i < document.room.length; i++) {
                    RoomDal.update(
                      {_id: document.room[i]},
                      {
                        $addToSet: {booking_calendar: document.id},
                        status: "reserved",
                        updated_at: new Date(),
                      },
                      (err, room_doc) => {
                        if (err) {
                          return next(err);
                        }
                      },
                    );
                  }
                  body.email === undefined ||
                  body.email === "" ||
                  body.email === null
                    ? console.log("no email")
                    : sendEmail(
                        body.name,
                        document.accommodation,
                        document,
                        body.email,
                      );
                  res.status(200).json({msg: "reserved"});
                }
              } else {
                res.status(400).json({msg: "reservation not created"});
              }
            },
          );
        } else {
          res.status(404).json({msg: "room does not exist"});
        }
      })
      .catch((err) => {
        res.stauts(500).json(err);
      });
  } else {
    res.status(400).json({msg: "room must be selected"});
  }
};
exports.sortOut = (req, res, next) => {
  let page = req.query.page * 1 || 1;
  let limit = req.query.limit * 1 || 20;
  let query = {
    accommodation: req._user.assigned_accommodation,
    status: req.body.status,
  };
  let queryOpts = {
    page: page,
    limit: limit,
  };
  try {
    BookingDal.getCollectionByPagination(query, queryOpts, (err, doc) => {
      if (err) {
        return next(err);
      }
      res.status(200).json({
        data: doc.docs,
        limit: limit,
        skip: page,
        total: doc.total,
      });
    });
  } catch (e) {
    res.status(500).json({
      msg: "Error Occured" + e,
      status: 500,
    });
  }
};
exports.requestBooking = async (req, res, next) => {
  try {
    let uuid,
      clientId = null;
    let email = "";
    if (req.headers.authorization) {
      let decode = jwtDecode(req.headers.authorization.split(" ")[1]);
      uuid = decode.user_id;
      const clientInfo = await Client.findOne({uuid: uuid});
      if (!clientInfo) {
        return res.status(400).json({msg: "Invalid client"});
      }
      clientId = clientInfo._id;
    } else {
      uuid = null;
      email = req.body.guest.email;
      clientId = null;
    }
    //check if booking exists and check if checkOut and checkIn overlaps
    const {room, checkIn, checkOut, guests, currency_type} = req.body;
    const roomData = await RoomMdl.findOne({_id: room[0]});
    const accomData = await subRoomType.findOne({_id: roomData.subRoomType});

    // Ensure required fields
    if (!room || !checkIn || !checkOut) {
      return res.status(400).json({message: "Missing required fields"});
    }

    // Check if booking overlaps
    const overlap = await BookMdl.findOne({
      accommodation: accomData.accommodation,
      room: {$in: room}, // check any of the rooms
      status: {$nin: ["cancelled", "completed"]}, // ignore cancelled/completed
      $and: [
        {checkIn: {$lt: new Date(checkOut)}},
        {checkOut: {$gt: new Date(checkIn)}},
      ],
    });

    if (overlap) {
      return res
        .status(400)
        .json({msg: "Room already booked in this date range"});
    }

    // Create booking
    const newBooking = await BookMdl.create({
      accommodation: accomData.accommodation,
      currency_type,
      room,
      checkIn: new Date(checkIn),
      checkOut: new Date(checkOut),
      tx_ref:
        req.body.currency_type === "ETB"
          ? `triplaye-${uuidv4()}`
          : `international-booking-${uuidv4()}`,
      guests,
      withBreakFast: req.body.withBreakFast,
      withRefundable: req.body.withRefundable,
      created_by: {
        has_account: !!uuid,
        client: uuid ? clientId : null,
        guest: !uuid ? req.body.guest : null,
      },
    });

    //send to accommodation email and owner and receptionists as well
    const accomInfo = await Accommodation.findOne({
      _id: accomData.accommodation,
    });
    let message = {
      notification: {
        title: "New Booking Request",
        body: `A new booking request has been made for ${accomInfo.name.en}.\n\n Please log into your Triplaye account to view and manage the booking details.`,
      },
    };

    let userMessage = {
      notification: {
        title: "Booking Request Received",
        body: `We have received your booking request for ${accomInfo.name.en}. Our team is currently reviewing your request and will get back to you shortly with confirmation and further details.
        
        Thank you for choosing us!`,
      },
    };
    sendMessage(userMessage, uuid, null, "to", email); // send to the guest
    const emailAddresses = accomInfo.address.emailAddress || [];
    //sendmessage to user
    const hotelManagers = await User.find({
      assigned_accommodation: accomData.accommodation,
    });
    let managerEmails = hotelManagers.map((manager) => manager.username);
    console.log(managerEmails);
    //merge two arrays and remove duplicates
    const allEmails = [...emailAddresses, ...managerEmails];
    console.log(allEmails);
    sendMessage(message, null, accomInfo._id, "bcc", allEmails); //send to the hotel management team

    return res.status(201).json({
      msg: "Booking request created successfully",
      booking: newBooking,
      status: 201,
    });
  } catch (error) {
    console.log(error);
    return res.status(500).json({msg: error.message, error});
  }
};
exports.requestBookingWallet = async (req, res, next) => {
  // first check currencyType
  try {
    // before all this please check the wallet balance first
    const {room, checkIn, checkOut, guests, currency_type} = req.body;

    const clientInfo = await Client.findOne({uuid: req.user.uuid});
    if (!clientInfo)
      return res.status(400).json({msg: "Unauthorized to make request"});
    // Ensure required fields
    if (!room || !checkIn || !checkOut) {
      return res.status(400).json({message: "Missing required fields"});
    }
    const Balance = await Wallet.findOne({
      "user_information.user": clientInfo.id,
      currency_type,
    }).sort({_id: -1});
    if (!Balance) {
      return res.status(400).json({msg: "Wallet does not exist"});
    }

    //check if booking exists and check if checkOut and checkIn overlaps

    const roomData = await RoomMdl.findOne({_id: room[0]});
    const accomData = await subRoomType.findOne({_id: roomData.subRoomType});
    const Property = await Accommodation.findById(accomData.accommodation);
    if (!Property) {
      return res.status(400).json({msg: "hotel does not exist"});
    }
    // Check if booking overlaps
    const overlap = await BookMdl.findOne({
      accommodation: accomData.accommodation,
      room: {$in: room}, // check any of the rooms
      status: {$nin: ["cancelled", "completed"]}, // ignore cancelled/completed
      $and: [
        {checkIn: {$lt: new Date(checkOut)}},
        {checkOut: {$gt: new Date(checkIn)}},
      ],
    });

    if (overlap) {
      return res
        .status(400)
        .json({msg: "Room already booked in this date range"});
    }

    const totalBooking = await BookMdl.find({uuid: req.user.uuid});

    //checkLevel
    let price_query = {
      number_of_booking: {
        $gte: totalBooking.length,
        $lte: totalBooking.length,
      },
    };
    let discountPrice = await Service.find(price_query);
    if (discountPrice.length > 0) {
      serviceCharge = discountPrice[0].amount;
    } else {
      serviceCharge = "20%";
    }

    //getRoom Price first
    const fetchRoomPrice = await showPrice(
      room,
      currency_type,
      serviceCharge,
      req.body,
    );
    if (fetchRoomPrice.status !== "ok") {
      return res
        .status(fetchRoomPrice.statusCode)
        .json({msg: fetchRoomPrice.message});
    }

    //how many nights to stay
    const msPerDay = 1000 * 60 * 60 * 24;
    const diffDays = Math.round(
      (new Date(checkOut) - new Date(checkIn)) / msPerDay,
    );

    const totalPaymentExpected = fetchRoomPrice.price.totalPrice * diffDays;

    //check if balance handles price
    if (Balance.balance < totalPaymentExpected) {
      return res
        .status(400)
        .json({msg: "Your Balance is insufficient to book"});
    }

    // Create booking
    const newBooking = await BookMdl.create({
      accommodation: accomData.accommodation,
      currency_type,
      room,
      checkIn: new Date(checkIn),
      checkOut: new Date(checkOut),
      is_paid_via_wallet: true,

      tx_ref:
        req.body.currency_type === "ETB"
          ? `triplay-booking-${uuidv4()}`
          : `international-booking-${uuidv4()}`,
      guests,
      created_by: {
        has_account: true,
        client: clientInfo.id,
      },
    });

    //move walletBalance to holdings
    const holdPayment = new HoldPayment({
      uuid: req.user.uuid,
      money: {
        totalPayment: fetchRoomPrice.price.totalPrice * diffDays,
        hotelPayment: fetchRoomPrice.price.hotelShare * diffDays,
        gojoPayment: fetchRoomPrice.price.gojoShare * diffDays,
      },
      tx_ref: newBooking.tx_ref,
    });
    await holdPayment.save();

    //transaction
    const startTransaction = new Transaction({
      "user_information.user_type": "user",
      "user_information.user": clientInfo.id,
      transaction_status: "requestBooking",
      amount: holdPayment.money.totalPayment,
      uniqueId: newBooking.tx_ref,
      reason: "request booking a room",
      action_type: "deducted",
    });
    const saveTransaction = await startTransaction.save();
    //update wallet
    const updateWallet = new Wallet({
      "user_information.user": clientInfo.id,
      "user_information.user_type": ["user"],
      currency_type,
      balance: Balance.balance - holdPayment.money.totalPayment,
      status: "available",
      transaction: saveTransaction.id,
      uniqueId: newBooking.tx_ref,
    });
    await updateWallet.save();

    //send to accommodation email and owner and receptionists as well
    const accomInfo = await Accommodation.findOne({
      _id: accomData.accommodation,
    });
    let message = {
      notification: {
        title: "New Booking Request",
        body: `A new booking request has been made for ${accomInfo.name.en}.\n\n Please log into your Triplaye account to view and manage the booking details.`,
      },
    };

    let userMessage = {
      notification: {
        title: "Booking Request Received",
        body: `We have received your booking request for ${accomInfo.name.en}. Our team is currently reviewing your request and will get back to you shortly with confirmation and further details.
        
        Thank you for choosing us!`,
      },
    };
    sendMessage(userMessage, req.user.uuid, null, "to", clientInfo.email); // send to the guest
    const emailAddresses = accomInfo.address.emailAddress || [];
    //sendmessage to user
    const hotelManagers = await User.find({
      assigned_accommodation: accomData.accommodation,
    });
    let managerEmails = hotelManagers.map((manager) => manager.username);
    console.log(managerEmails);
    //merge two arrays and remove duplicates
    const allEmails = [...emailAddresses, ...managerEmails];
    console.log(allEmails);
    sendMessage(message, null, accomInfo._id, "bcc", allEmails); //send to the hotel management team

    return res.status(201).json({
      msg: "Booking request created successfully",
      booking: newBooking,
      status: 201,
    });
  } catch (error) {
    console.log(error);
    return res.status(500).json({msg: error.message, error});
  }
};
exports.searchRooms = async (req, res, next) => {
  try {
    // Check for overlapping bookings for a specific room
    async function checkRoomBookingOverlap(
      accommodation,
      roomId,
      checkIn,
      checkOut,
    ) {
      const existingBookings = await BookMdl.find({
        // accommodation: accommodation,
        room: roomId,
        checkIn: {$lt: checkOut},
        checkOut: {$gt: checkIn},
        status: {$in: ["pending", "reserved"]},
      });
      return existingBookings.length > 0;
    }

    // Function to generate combinations of rooms
    function getRoomCombinations(rooms, totalGuests, maxRooms = 4) {
      const combinations = [];

      // Helper function to generate combinations recursively
      function combine(currentCombo, start, remainingGuests) {
        if (remainingGuests <= 0 && currentCombo.length >= 2) {
          // Require at least 2 rooms
          combinations.push([...currentCombo]);
          return;
        }
        for (let i = start; i < rooms.length; i++) {
          const room = rooms[i];
          if (
            room.subRoomType.number_of_guests <= remainingGuests &&
            currentCombo.length < maxRooms
          ) {
            currentCombo.push(room);
            combine(
              currentCombo,
              i + 1,
              remainingGuests - room.subRoomType.number_of_guests,
            );
            currentCombo.pop();
          }
        }
      }

      combine([], 0, totalGuests);
      return combinations;
    }

    // Function to find available rooms and combinations
    async function findAvailableRooms(
      accommodation,
      checkIn,
      checkOut,
      totalGuests,
      strictMatch = false,
    ) {
      // ✅ Get all available rooms, populate subRoomType + related models
      const allRooms = await RoomMdl.find({
        // status: "available",
        is_hidden: false,
      }).populate({
        path: "subRoomType",
        model: subRoomType,
        populate: [
          {path: "facilities", model: Facility},
          {path: "roomType", model: RoomType},
          {path: "accommodation", model: Accommodation},
          {
            path: "rates",
            model: Rate,
            populate: [{path: "client", model: Client}],
          },
        ],
      });

      // ✅ Filter by accommodation (after populate)
      const filteredRooms = allRooms.filter((room) => {
        if (!room.subRoomType?.accommodation?._id) return false;
        return (
          room.subRoomType.accommodation._id.toString() ===
          accommodation.toString()
        );
      });

      console.log(
        `Rooms for accommodation ${accommodation}: ${filteredRooms.length}`,
      );

      // ✅ Filter out rooms with overlapping bookings
      const availableRooms = await Promise.all(
        filteredRooms.map(async (room) => {
          const isOverlapping = await checkRoomBookingOverlap(
            accommodation,
            room._id,
            checkIn,
            checkOut,
          );
          return !isOverlapping ? room : null;
        }),
      ).then((rooms) => rooms.filter(Boolean));

      console.log(
        `Available rooms after overlap check: ${availableRooms.length}`,
        availableRooms.map((room) => ({
          _id: room._id,
          guests: room.subRoomType?.number_of_guests,
        })),
      );

      // ✅ Single rooms that fit guests
      const individualRooms = availableRooms.filter((room) =>
        strictMatch
          ? room.subRoomType.number_of_guests === totalGuests
          : room.subRoomType.number_of_guests >= totalGuests,
      );

      // ✅ Combinations of rooms
      const roomCombinations = getRoomCombinations(availableRooms, totalGuests);

      const formattedCombinations = roomCombinations.map((combo) => ({
        type: "combination",
        rooms: combo,
        totalCapacity: combo.reduce(
          (sum, room) => sum + room.subRoomType.number_of_guests,
          0,
        ),
        totalPrice: combo.reduce(
          (sum, room) =>
            sum + (room.subRoomType.price_info?.original_price || 0),
          0,
        ),
      }));

      // ✅ Final result
      return [
        ...individualRooms.map((room) => ({
          type: "single",
          ...room.toObject(),
          totalCapacity: room.subRoomType.number_of_guests,
          totalPrice: room.subRoomType.price_info?.room_price || 0,
        })),
        ...formattedCombinations,
      ];
    }

    // Extract request body parameters
    const {accommodation, checkIn, checkOut, guests} = req.body;
    const totalGuests = guests.adult + guests.children;
    const checkInDate = new Date(checkIn);
    const checkOutDate = new Date(checkOut);

    // Extract query parameters for pagination
    let page = parseInt(req.query.page) || 1;
    let limit = parseInt(req.query.limit) || 20;

    // Validate input
    if (!accommodation || !checkIn || !checkOut || !guests) {
      return res.status(400).json({msg: "Missing required parameters"});
    }

    // Validate pagination parameters
    if (page < 1 || limit < 1) {
      return res.status(400).json({msg: "Invalid page or limit parameters"});
    }

    // Find available rooms
    const availableRoomsOrCombinations = await findAvailableRooms(
      accommodation,
      checkInDate,
      checkOutDate,
      totalGuests,
      false,
    );

    // Pagination logic
    const total = availableRoomsOrCombinations.length;
    const start = (page - 1) * limit;
    const end = start + limit;
    const paginatedData = availableRoomsOrCombinations.slice(start, end);

    // Return response
    res.json({
      data: paginatedData,
      limit: limit,
      page: page,
      total: total,
    });
  } catch (error) {
    console.log(error);
    return res.status(500).json({msg: error.message, error});
  }
};
exports.searchNewRooms = async (req, res) => {
  try {
    // ===================================================
    // 1. CHECK ROOM BOOKING OVERLAP
    // ===================================================
    async function checkRoomBookingOverlap(roomId, checkIn, checkOut) {
      const existingBookings = await BookMdl.find({
        room: roomId,
        checkIn: {$lt: checkOut},
        checkOut: {$gt: checkIn},
        status: {$in: ["pending", "reserved"]},
      });

      return existingBookings.length > 0;
    }

    // ===================================================
    // 2. SUBROOMTYPE COMBINATIONS (CORE LOGIC)
    // ===================================================
    function getSubRoomTypeCombinations(
      subRoomGroups,
      totalGuests,
      maxRooms = 4,
    ) {
      const results = [];

      function combine(current, start, remainingGuests) {
        if (remainingGuests <= 0) {
          results.push([...current]);
          return;
        }

        if (current.length >= maxRooms) return;

        for (let i = start; i < subRoomGroups.length; i++) {
          const group = subRoomGroups[i];
          const capacity = group.subRoomType.number_of_guests;

          if (capacity <= remainingGuests && group.availableRooms > 0) {
            current.push(group);
            combine(
              current,
              i, // allow reuse of same subRoomType
              remainingGuests - capacity,
            );
            current.pop();
          }
        }
      }

      combine([], 0, totalGuests);
      return results;
    }

    // ===================================================
    // 3. FIND AVAILABLE ROOMS
    // ===================================================
    async function findAvailableRooms(
      accommodation,
      checkIn,
      checkOut,
      totalGuests,
    ) {
      // -----------------------------------------------
      // Fetch rooms
      // -----------------------------------------------
      const rooms = await RoomMdl.find({
        is_hidden: false,
      }).populate({
        path: "subRoomType",
        populate: [
          {path: "facilities", model: Facility},
          {path: "roomType", model: RoomType},
          {path: "accommodation", model: Accommodation},
          {
            path: "rates",
            model: Rate,
            populate: [{path: "client", model: Client}],
          },
        ],
      });

      // -----------------------------------------------
      // Filter by accommodation
      // -----------------------------------------------
      const accommodationRooms = rooms.filter(
        (room) =>
          room.subRoomType?.accommodation?._id.toString() ===
          accommodation.toString(),
      );

      // -----------------------------------------------
      // Remove overlapping bookings
      // -----------------------------------------------
      const availableRooms = [];

      for (const room of accommodationRooms) {
        const isOverlapping = await checkRoomBookingOverlap(
          room._id,
          checkIn,
          checkOut,
        );

        if (!isOverlapping) availableRooms.push(room);
      }

      // -----------------------------------------------
      // Group by subRoomType
      // -----------------------------------------------
      const groupedBySubRoomType = {};

      for (const room of availableRooms) {
        const srtId = room.subRoomType._id.toString();

        if (!groupedBySubRoomType[srtId]) {
          groupedBySubRoomType[srtId] = {
            subRoomType: room.subRoomType,
            rooms: [],
          };
        }

        groupedBySubRoomType[srtId].rooms.push(room);
      }

      const subRoomGroups = Object.values(groupedBySubRoomType).map((item) => ({
        subRoomType: item.subRoomType,
        availableRooms: item.rooms.length,
        rooms: item.rooms,
      }));

      // -----------------------------------------------
      // SINGLE OPTIONS
      // -----------------------------------------------
      const singleOptions = subRoomGroups
        .filter((g) => g.subRoomType.number_of_guests >= totalGuests)
        .map((g) => ({
          type: "single",
          subRoomTypes: {
            subRoomType: g.subRoomType,
            usedRooms: 1,
            rooms: g.rooms, // 👈 ACTUAL ROOMS
          },
          availableRooms: g.availableRooms,
          totalCapacity: g.subRoomType.number_of_guests,
          totalPrice: g.subRoomType.price_info?.room_price || 0,
        }));

      // -----------------------------------------------
      // COMBINATION OPTIONS
      // -----------------------------------------------
      const combinations = getSubRoomTypeCombinations(
        subRoomGroups,
        totalGuests,
      );

      const combinationOptions = combinations.map((combo) => ({
        type: "combination",
        subRoomTypes: combo.map((c) => ({
          subRoomType: c.subRoomType,
          usedRooms: 1,
          rooms: c.rooms, // 👈 ACTUAL ROOMS
        })),
        availableRooms: Math.min(...combo.map((c) => c.availableRooms)),
        totalCapacity: combo.reduce(
          (sum, c) => sum + c.subRoomType.number_of_guests,
          0,
        ),
        totalPrice: combo.reduce(
          (sum, c) => sum + (c.subRoomType.price_info?.room_price || 0),
          0,
        ),
      }));

      return [...singleOptions, ...combinationOptions];
    }

    // ===================================================
    // 4. CONTROLLER EXECUTION
    // ===================================================
    const {accommodation, checkIn, checkOut, guests} = req.body;

    if (!accommodation || !checkIn || !checkOut || !guests) {
      return res.status(400).json({msg: "Missing required parameters"});
    }

    const totalGuests = guests.adult + guests.children;
    const checkInDate = new Date(checkIn);
    const checkOutDate = new Date(checkOut);

    // Pagination
    const page = Math.max(parseInt(req.query.page) || 1, 1);
    const limit = Math.min(parseInt(req.query.limit) || 20, 100);
    const start = (page - 1) * limit;

    const results = await findAvailableRooms(
      accommodation,
      checkInDate,
      checkOutDate,
      totalGuests,
    );

    res.json({
      data: results.slice(start, start + limit),
      page,
      limit,
      total: results.length,
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({msg: "Internal Server Error", error});
  }
};

exports.searchBooking = async (req, res, next) => {
  try {
    const {
      searchTerm,
      status,
      checkIn,
      checkOut,
      tx_ref,
      page = 1,
      limit = 10,
    } = req.query;

    let query = {accommodation: req._user.assigned_accommodation};

    // ✅ Flexible filters
    if (status) {
      query.status = status;
    }

    if (checkIn) {
      query.checkIn = {$gte: new Date(checkIn)};
    }

    if (checkOut) {
      query.checkOut = {$lte: new Date(checkOut)};
    }

    if (tx_ref) {
      query.tx_ref = tx_ref;
    }

    if (searchTerm) {
      query.$or = [
        // Search inside created_by.client if it exists
        {"created_by.client.full_name": {$regex: searchTerm, $options: "i"}},
        {"created_by.client.email": {$regex: searchTerm, $options: "i"}},
        {"created_by.client.phone": {$regex: searchTerm, $options: "i"}},

        // Fallback: search inside guest object
        {"guest.full_name": {$regex: searchTerm, $options: "i"}},
        {"guest.email": {$regex: searchTerm, $options: "i"}},
        {"guest.phone": {$regex: searchTerm, $options: "i"}},
      ];
    }

    const skip = (page - 1) * limit;

    // ✅ Get results + total count
    const [bookings, total] = await Promise.all([
      BookMdl.find(query)
        .populate([
          {
            path: "created_by",
            populate: {
              path: "client",
              model: Client,
              select: "full_name phone email",
            },
          },
          {
            path: "room",
            model: RoomMdl,
          },
        ])
        .skip(skip)
        .limit(Number(limit)),
      BookMdl.countDocuments(query),
    ]);

    res.status(200).json({
      success: true,
      data: bookings,
      total,
      page: Number(page),
      pages: Math.ceil(total / limit),
      limit: Number(limit),
    });
  } catch (error) {
    next(error);
  }
};
exports.rateRoom = async (req, res, next) => {
  try {
    const book_doc = await BookMdl.findOne({
      _id: req.doc._id,
      status: "completed",
    });

    if (!book_doc) {
      return res.status(400).json({msg: "error book does not exist"});
    }

    if (!req.doc.created_by.has_account) {
      return res.status(401).json({msg: "unauthorized to rate"});
    }

    if (req.doc.created_by.client.uuid !== req.user.uuid) {
      return res
        .status(401)
        .json({msg: "User not recognized to this booking detail"});
    }

    let arr = [];

    // 🔹 Extract unique subRoomTypes from all rooms
    const rooms = await RoomMdl.find({
      _id: {$in: req.doc.room.map((r) => r.id)},
    });
    const uniqueSubRoomTypes = [
      ...new Set(rooms.map((r) => r.subRoomType.toString())),
    ];

    // 🔹 Iterate through unique subRoomTypes
    for (const sub_room_types of uniqueSubRoomTypes) {
      const existingRate = await RateDal.findOne({
        booking: req.doc._id,
        subRoomType: sub_room_types,
      });

      if (!existingRate) {
        const create_rate = await RateDal.create({
          subRoomType: sub_room_types,
          booking: req.doc._id,
          client: req.doc.created_by.client.id,
          rate: req.body.rate,
          review: req.body.review,
        });

        if (create_rate) {
          // Update subRoomType schema with new rate
          await subRoomType.updateOne(
            {_id: sub_room_types},
            {
              $addToSet: {rates: create_rate.id},
              updated_at: new Date(),
            },
          );

          arr.push("ok", 201);
        }
      } else {
        arr.push("already exist", 400);
      }
    }

    res.status(arr[1] || 200).json({msg: arr[0] || "done"});
  } catch (err) {
    console.error(err);
    res.status(500).json(err);
  }
};
exports.update = (req, res, next) => {
  try {
    var body = req.body;
    body.booking_checked_by = req._user.userid;
    body.updated_at = new Date();
    req.doc.status !== "cancelled" || req.doc.status !== "completed"
      ? req._user.assigned_accommodation === req.doc.accommodation.id
        ? BookingDal.update(
            {_id: req.doc._id},
            body,
            async (err, Booking_doc) => {
              if (err) {
                return next(err);
              }
              if (body.status === "cancelled") {
                let message = {
                  notification: {
                    title: "Booking Cancelled",
                    body: `A booking at ${req.doc.accommodation.name.en} has been ${body.status}.\n\n`,
                  },
                };
                //sendmessage to user
                let userEmail = "";
                if (req.doc.created_by.has_account === false) {
                  userEmail = req.doc.created_by.guest.email;
                } else {
                  userEmail = req.doc.created_by.client.email;
                }
                sendMessage(
                  message,
                  null,
                  req.doc.accommodation.id,
                  "to",
                  userEmail,
                );
              }
              let totalBooking = await BookMdl.find({
                status: "completed",
                "created_by.client": req.doc.created_by.client,
              });
              if (body.status === "accepted") {
                if (req.doc.status === "accepted") {
                  return res
                    .status(400)
                    .json({msg: "Booking has already been accepted"});
                }
                // send message to user with a payment link
                let price_query = {};
                let serviceCharge = "20%";
                if (req.doc.created_by.has_account === false) {
                  price_query = {};
                  serviceCharge = "20%";
                } else {
                  price_query = {
                    number_of_booking: {
                      $gte: totalBooking.length,
                      $lte: totalBooking.length,
                    },
                  };
                  let discountPrice = await Service.find(price_query);
                  if (discountPrice.length > 0) {
                    serviceCharge = discountPrice[0].amount;
                  } else {
                    serviceCharge = "20%";
                  }
                }
                if (req.doc.is_paid_via_wallet === false) {
                  const initiatePayment = await acceptBooking(
                    req.doc.tx_ref,
                    req.doc.currency_type === "ETB" ? "chapaPay" : "stripe",
                    req.doc.created_by.has_account
                      ? req.doc.created_by.client.phone
                      : req.doc.created_by.guest.phone,
                    req.doc.room,
                    req.doc.created_by.has_account
                      ? req.doc.created_by.client.email
                      : req.doc.created_by.guest.email,
                    req.doc.created_by.has_account
                      ? req.doc.created_by.client.full_name.split(" ")[0]
                      : req.doc.created_by.guest.name.split(" ")[0],
                    req.doc.created_by.has_account
                      ? req.doc.created_by.client.full_name.split(" ")[1]
                      : req.doc.created_by.guest.name.split(" ")[1],
                    req.doc.created_by.has_account
                      ? req.doc.created_by.client.uuid
                      : null,
                    serviceCharge,
                    req.doc,
                  );
                  if (initiatePayment.status === "failed") {
                    return res.status(400).json({msg: initiatePayment.message});
                  }
                  console.log(initiatePayment);
                } else {
                  // move heldMoney
                  const checkBrokerStatus = await Broker(
                    "accepted",
                    req.doc.tx_ref,
                    req.doc.currency_type,
                    req.doc.accommodation,
                    req.doc.created_by.client,
                    req.doc,
                    req._user.id,
                  );
                  if (checkBrokerStatus.status === "bad") {
                    return res
                      .status(checkBrokerStatus.status)
                      .json({msg: checkBrokerStatus.message});
                  }
                }
              }

              let status_update = "";
              if (body.status === "reserved" || body.status === "occupied") {
                status_update = body.status;
              } else {
                status_update = "available";
              }

              if (body.status === "reserved" || body.status === "booked") {
                let name = "";
                let email = "";
                if (req.doc.created_by.has_account === true) {
                  name = req.doc.created_by.client.full_name;
                  email = req.doc.created_by.client.email;
                } else {
                  name = req.doc.created_by.guest.name;
                  email = req.doc.created_by.guest.email;
                }
                //if the checkIn is today update
                // if (
                //   Date.parse(new Date(req.doc.checkIn)) === Date.parse(new Date())
                // ) {}
                req.doc.room.map((item) => {
                  RoomDal.update(
                    {_id: item.id},
                    {
                      $addToSet: {booking_calendar: req.doc.id},
                      status: status_update,
                      updated_at: new Date(),
                    },
                    (err, room_doc) => {
                      if (err) {
                        return next(err);
                      }
                      room_doc.status === status_update
                        ? console.log("room collection updated")
                        : console.log("room collection not updated");
                    },
                  );
                });
                email === undefined
                  ? console.log("no email")
                  : sendEmail(name, req.doc.accommodation, req.doc, email);
              }

              if (body.status === "completed") {
                req.doc.room.map((item) => {
                  RoomDal.update(
                    {_id: item.id},
                    {status: "available", updated_at: new Date()},
                    (err, room_doc) => {
                      if (err) {
                        return next(err);
                      }
                      room_doc.status === status_update
                        ? console.log("room collection updated")
                        : console.log("room collection not updated");
                    },
                  );
                });
                /** notification */
                let guest_name = "";
                let userId = "";
                let emailAddress = "";
                if (req.doc.created_by.has_account === true) {
                  userId = req.doc.created_by.client.uuid;
                  guest_name = req.doc.created_by.client.full_name;
                  if (
                    req.doc.created_by.client.email === undefined ||
                    req.doc.created_by.client.email === null
                  ) {
                    emailAddress = "";
                  } else {
                    emailAddress = req.doc.created_by.client.email;
                  }
                } else {
                  guest_name = req.doc.created_by.guest.name;
                  userId = null;
                  emailAddress = req.doc.created_by.guest.email;
                }
                let message = {
                  notification: {
                    title: "Booking Completed",
                    body: `Dear ${guest_name}!
                
                          Thank you for choosing ${data.accommodation.name.en} for your recent stay. We hope you had a comfortable experience.
                          
                          We look forward to welcoming you back!`,
                  },
                };
                sendMessage(message, userId, null, "to", emailAddress);
              }
              res.status(200).json({
                msg: "updated successfully",
                status: 200,
              });
            },
          )
        : res.status(401).json({
            msg: "unauthorized to access",
            status: 401,
          })
      : res.status(400).json({msg: "you cannot update a cancelled booking"});
  } catch (err) {
    res.status(500).json(err);
  }
};
exports.cancelBooking = (req, res, next) => {
  let array = ["pending", "reserved"];
  if (array.includes(req.doc.status)) {
    if (req.headers.authorization !== undefined) {
      let decode = jwtDecode(req.headers.authorization.split(" ")[1]);
      /** only allowed roles */
      let allowedRoles = ["super_admin", "owner", "receptionist", "client"];
      if (allowedRoles.includes(decode.role)) {
        let permission = false;
        if (decode.role === "owner" || decode.role === "receptionist") {
          if (req.doc.accommodation.id === decode.assigned_accommodation) {
            permission = true;
          } else {
            permission = false;
          }
        }
        if (decode.role === "super_admin") {
          permission = true;
        }
        if (decode.role === "client") {
          if (req.doc.created_by.has_account === true) {
            if (req.doc.created_by.client.uuid === decode.user_id) {
              permission = true;
            } else {
              permission = false;
            }
          } else {
            permission = false;
          }
        }
        if (permission === true) {
          if (decode.role === "client") {
            if (req.doc.checkIn <= new Date()) {
              return res.status(400).json({
                msg: "Check-in date must be greater than today",
                status: 400,
              });
            }

            const diffMs = req.doc.checkIn - new Date(); // difference in milliseconds
            const diffHours = diffMs / (1000 * 60 * 60);

            if (diffHours < 24) {
              return res.status(400).json({
                msg: "Check-in must be at least 24 hours from now",
                status: 400,
              });
            }
          }
          BookingDal.update(
            {_id: req.doc._id},
            {status: "cancelled", updated_at: new Date()},
            async (err, doc) => {
              if (err) {
                return next(err);
              }
              for (let i = 0; i < req.doc.room.length; i++) {
                RoomDal.update(
                  {_id: req.doc.room[i].id},
                  {status: "available", updated_at: new Date()},
                  (err, room_doc) => {
                    if (err) return next(err);
                  },
                );
              }
              // console.log(req.doc.transaction);
              // check transaction document

              if (req.doc.transaction.uniqueId !== undefined) {
                if (req.doc.created_by.has_account === true) {
                  let hotelTransaction = await Transaction.findOne({
                    uniqueId: req.doc.transaction.uniqueId,
                    "user_information.user_type": "client",
                    "user_information.client": req.doc.accommodation.id,
                  }).sort({_id: -1});
                  let hotelBalance = await Wallet.findOne({
                    uniqueId: req.doc.transaction.uniqueId,
                    "user_information.user_type": ["client"],
                    "user_information.client": req.doc.accommodation.id,
                  }).sort({_id: -1});
                  let gojoProfit = await Profit.findOne({
                    uniqueId: req.doc.transaction.uniqueId,
                  });
                  /** clients transaction */
                  let initialPayment = await Transaction.findOne({
                    uniqueId: req.doc.transaction.uniqueId,
                    "user_information.user_type": "user",
                    "user_information.user": req.doc.created_by.client.id,
                  });
                  let yourBalance = await Wallet.findOne({
                    uniqueId: req.doc.transaction.uniqueId,
                    "user_information.user_type": ["user"],
                    "user_information.user": req.doc.created_by.client.id,
                  });
                  let realBalance = 0;
                  if (yourBalance) {
                    realBalance = yourBalance.balance;
                  } else {
                    realBalance = 0;
                  }
                  /** calculation */
                  let yourRestoredBalance = initialPayment.amount + realBalance;
                  let hotelRestoredBalanace =
                    hotelBalance.balance - hotelTransaction.amount;
                  /**
                   *  create transaction
                   *  create profit refund
                   *  create hotel transaction plus wallet
                   *  create user transaction plus wallet
                   * */

                  await refundTransaction(
                    initialPayment,
                    yourRestoredBalance,
                    hotelRestoredBalanace,
                    gojoProfit,
                    hotelTransaction,
                    req.doc.accommodation.id,
                  )
                    .then((data) => {
                      res.status(data[0]).json({msg: data[1]});
                    })
                    .catch((err) => {
                      res.status(500).json(err);
                    });
                }
              } else {
                res.status(200).json({msg: "cancellation succesful"});
              }
            },
          );
        }
      } else {
        res.status(401).json({msg: "unauthorzied user"});
      }
    } else {
      res.status(401).json({msg: "unauthorzied use"});
    }
  } else {
    res.status(400).json({msg: "this booking is already " + req.doc.status});
  }
};
exports.deleteBooking = (req, res, next) => {
  try {
    BookingDal.delete({_id: req.doc._id}, (err, doc) => {
      if (err) {
        return next(err);
      }
      doc.room.map((item) => {
        RoomDal.update(
          {_id: item.id},
          {$pull: {booking_calendar: doc.id}},
          (err, Booking_doc) => {
            if (err) {
              return next(err);
            }
          },
        );
      });

      RatingDal.delete({booking: req.doc._id}, (err, rate_doc) => {
        if (err) {
          return next(err);
        }
      });
      res.status(200).json({
        msg: "operation successful",
        status: 200,
      });
    });
  } catch (err) {
    res.status(500).json(err);
  }
};

function checkUncheckedBooking(req, res, next) {
  BookingDal.getCollection({status: "pending"}, {}, (err, book_document) => {
    if (err) {
      return next(err);
    }
    book_document.length > 0
      ? async.eachSeries(
          book_document,
          function (data, callback) {
            /** check over 24hrs */
            const created_at_date = new Date(data.created_at);
            const differenceInMilliseconds =
              now.getTime() - created_at_date.getTime();
            const hoursRemaining = Math.floor(
              differenceInMilliseconds / (1000 * 60 * 60),
            );

            if (hoursRemaining > 24) {
              let canUpdate = false;
              if (data.hasOwnProperty("tx_ref") && obj.tx_ref) {
                if (data.is_paid === true) {
                  canUpdate = true;
                } else {
                  canUpdate = false;
                }
              } else {
                // that mean this is an international payment
                canUpdate = true;
              }
              if (canUpdate === true) {
                BookingDal.update(
                  {_id: data.id},
                  {$set: {status: "booked"}},
                  (err, document) => {
                    if (err) {
                      return next(err);
                    }
                    if (document) {
                      //send message
                      let r_name = "";
                      let r_email = "";
                      if (data.created_by.has_account === false) {
                        r_name = data.created_by.guest.name;
                        r_email = data.created_by.guest.email;
                      } else {
                        r_name = data.created_by.client.full_name;
                        r_email = data.created_by.client.email;
                      }
                      sendEmail(
                        r_name,
                        document.accommodation,
                        document,
                        r_email,
                      );
                    } else {
                      console.log(`Booking ${data._id} marked as expired.`);
                    }
                    callback(null); // continue to next
                  },
                );
              }

              console.log("Countdown already passed!");
            }
            callback(null);
          },
          function done(err) {
            if (err) {
              return next(err);
            } else {
              //res.json(cats);
            }
          },
        )
      : console.log("no pending booking");
  });
}
setInterval(checkUncheckedBooking, 21600000); //6hrs
