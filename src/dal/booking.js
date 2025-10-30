"user strict";

const _ = require("lodash");
const debug = require("debug")("api:dal-BankAccount");
const Accommodation = require("../models/accommodation");
const Booking = require("../models/booking");
const SubRoom = require("../models/subRoomType");
const Rating = require("../models/ratings");
const Room = require("../models/rooms");
const User = require("../models/user");
const Transaction = require("../models/transaction");
const Internal = require("../models/internal");
const Client = require("../models/client");
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
    path: "created_by",
    populate: [
      {
        path: "client",
        model: Client,
      },
    ],
  },
];

exports.create = function create(BookingData, cb) {
  var BookingModel = new Booking(BookingData);
  BookingModel.save(function saveBooking(err, data) {
    if (err) {
      return cb(err);
    }
    exports.get(
      {
        _id: data._id,
      },
      function (err, doc) {
        if (err) {
          return cb(err);
        }
        cb(null, doc);
      }
    );
  });
};

exports.delete = function deleteItem(query, cb) {
  Booking.findOne(query)
    .populate(population)
    .exec(function deleteBooking(err, doc) {
      if (err) {
        return cb(err);
      }
      if (!doc) {
        return cb(null, {});
      }
      Booking.deleteOne(query, function (err) {
        if (err) {
          return cb(err);
        }
        cb(null, doc);
      });
    });
};

exports.update = function update(query, updates, cb) {
  var opts = {
    new: true,
  };
  Booking.findOneAndUpdate(query, updates, opts)
    .populate(population)
    .exec(function updateBooking(err, doc) {
      if (err) {
        return cb(err);
      }
      cb(null, doc || {});
    });
};

exports.get = function get(query, cb) {
  Booking.findOne(query)
    .populate(population)
    .exec(function (err, doc) {
      if (err) {
        return cb(err);
      }
      cb(null, doc || {});
    });
};

exports.getCollection = function getCollection(query, opt, cb) {
  Booking.find(query, {}, opt)
    .populate(population)
    .sort({_id: -1})
    .exec(function getBookingsCollection(err, doc) {
      if (err) {
        return cb(err);
      }
      return cb(null, doc);
    });
};

exports.getCollectionByPagination = function getCollectionByPagination(
  query,
  qs,
  cb
) {
  debug("fetching a collection of Bookings");
  var opts = {
    // columns:  returnFields,
    sort: qs.sort || {},
    populate: population,
    page: qs.page,
    limit: qs.limit,
  };

  Booking.paginate(query, opts, function (err, docs, page, countDocuments) {
    if (err) {
      return cb(err);
    }
    var data = {
      total_pages: page,
      total_docs_count: countDocuments,
      docs: docs,
    };
    cb(null, data);
  });
};
