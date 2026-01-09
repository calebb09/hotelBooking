"use strict"; // Added: Strict mode for better error handling
const _ = require("lodash");
const debug = require("debug")("api:dal-rooms"); // Fixed: Updated debug name to match model (was "BankAccount")
const Room = require("../models/rooms");
const user = require("../models/user");
const SubRoomType = require("../models/subRoomType");
const Client = require("../models/client");
const Booking = require("../models/booking");
const Internal = require("../models/internal");
const population = [
  {
    path: "created_by",
    model: user,
    select: "-password",
    populate: [
      {
        path: "internal",
        model: Internal,
      },
    ],
  },
  {
    path: "subRoomType",
    model: SubRoomType,
    populate: [
      {
        path: "created_by",
        model: user,
        select: "-password -username -picture -role -status -created_at",
      },
    ],
  },
  {
    path: "booking_calendar",
    model: Booking,
    populate: [
      {
        path: "created_by",
        model: user, // Added: Model for created_by to fix potential populate issue
        populate: [
          {
            path: "client",
            model: Client,
          },
        ],
      },
    ],
  },
];

exports.create = function create(RoomData, cb) {
  const RoomModel = new Room(RoomData);
  RoomModel.save()
    .then((data) => {
      // Fetch the populated doc after save
      return exports.get({_id: data._id}, cb); // Reuse the updated `get` method
    })
    .catch((err) => cb(err));
};

exports.delete = function deleteItem(query, cb) {
  Room.findOne(query)
    .populate(population)
    .exec() // 👈 Now Promise-based
    .then((doc) => {
      if (!doc) {
        return cb(null, {});
      }
      return Room.deleteOne(query)
        .exec()
        .then(() => doc);
    })
    .then((doc) => cb(null, doc))
    .catch((err) => cb(err));
};

exports.update = function update(query, updates, cb) {
  const now = new Date();
  const opts = {new: true};

  Room.findOneAndUpdate(query, updates, opts)
    .populate(population) // Chain populate after findOneAndUpdate
    .exec() // 👈 Promise-based
    .then((doc) => cb(null, doc || {}))
    .catch((err) => cb(err));
};

exports.get = function get(query, cb) {
  Room.findOne(query)
    .populate(population)
    .sort({_id: -1})
    .exec() // 👈 Promise-based (fixes the error here!)
    .then((doc) => cb(null, doc || {}))
    .catch((err) => cb(err));
};

exports.getCollection = function getCollection(query, opt, cb) {
  Room.find(query, {}, opt)
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
  debug("fetching a collection of rooms"); // Fixed: Updated log message and typo

  const opts = {
    // columns: returnFields,  // Uncomment if needed
    sort: qs.sort,
    populate: population,
    page: qs.page,
    limit: qs.limit,
  };

  // 👈 Fixed: No callback; use .then() on the Promise
  Room.paginate(query, opts)
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
