"use strict"; // Fixed: "user strict" → "use strict"
const _ = require("lodash");
const debug = require("debug")("api:dal-booking"); // Fixed: Updated debug name to match model (was "BankAccount")
const Booking = require("../models/booking");
const SubRoom = require("../models/subRoomType");
const Rating = require("../models/ratings");
const Room = require("../models/rooms");
const User = require("../models/user");
const Transaction = require("../models/transaction");
const Internal = require("../models/internal");
const Client = require("../models/client");
const Accommodation = require("../models/accommodation"); // Moved up for consistency
const population = [
  {
    path: "room",
    model: Room,
    populate: [
      {
        path: "subRoomType",
        model: SubRoom,
        select: "price_info name rates",
        populate: [
          {
            path: "rates",
            model: Rating,
          },
        ],
      },
    ],
  },
  {
    path: "transaction",
    model: Transaction,
  },
  {
    path: "accommodation",
    model: Accommodation,
  },
  {
    path: "booking_checked_by",
    model: User,
    select: "-password",
    populate: [
      {
        path: "internal",
        model: Internal,
      },
    ],
  },
  {
    path: "created_by", // Added model: User for completeness (assuming based on populate structure)
    model: User,
    populate: [
      {
        path: "client",
        model: Client,
      },
    ],
  },
];

exports.create = function create(BookingData, cb) {
  const BookingModel = new Booking(BookingData);
  BookingModel.save()
    .then((data) => {
      // Fetch the populated doc after save
      return exports.get({_id: data._id}, cb); // Reuse the updated `get` method
    })
    .catch((err) => cb(err));
};

exports.delete = function deleteItem(query, cb) {
  Booking.findOne(query)
    .populate(population)
    .exec() // 👈 Now Promise-based
    .then((doc) => {
      if (!doc) {
        return cb(null, {});
      }
      return Booking.deleteOne(query)
        .exec()
        .then(() => doc);
    })
    .then((doc) => cb(null, doc))
    .catch((err) => cb(err));
};

exports.update = function update(query, updates, cb) {
  const opts = {new: true};

  Booking.findOneAndUpdate(query, updates, opts)
    .populate(population) // Chain populate after findOneAndUpdate
    .exec() // 👈 Promise-based
    .then((doc) => cb(null, doc || {}))
    .catch((err) => cb(err));
};

exports.get = function get(query, cb) {
  Booking.findOne(query)
    .populate(population)
    .exec() // 👈 Promise-based (fixes the error here!)
    .then((doc) => cb(null, doc || {}))
    .catch((err) => cb(err));
};

exports.getCollection = function getCollection(query, opt, cb) {
  Booking.find(query, {}, opt)
    .populate(population)
    .sort({_id: -1})
    .exec() // 👈 Promise-based
    .then((doc) => cb(null, doc))
    .catch((err) => cb(err));
};

exports.getCollectionByPagination = function getCollectionByPagination(
  query,
  qs,
  cb
) {
  debug("fetching a collection of bookings"); // Fixed: Minor capitalization for consistency

  const opts = {
    // columns: returnFields,  // Uncomment if needed
    sort: qs.sort || {},
    populate: population,
    page: qs.page,
    limit: qs.limit,
  };

  // 👈 Fixed: No callback; use .then() on the Promise
  Booking.paginate(query, opts)
    .then((result) => {
      // Structure matches your old callback (docs, page, total_docs_count)
      const data = {
        docs: result.docs,
        total_pages: result.totalPages,
        total_docs_count: result.totalDocs,
      };
      cb(null, data);
    })
    .catch((err) => cb(err));
};
