"use strict"; // Added: Strict mode for better error handling
const debug = require("debug")("api:dal-subRoomType");
const _ = require("lodash");
const subRoomType = require("../models/subRoomType");
const RoomType = require("../models/room_type");
const Room = require("../models/rooms");
const User = require("../models/user");
const Internal = require("../models/internal");
const Facility = require("../models/facilities");
const Rating = require("../models/ratings");
// var returnFields = subRoomType.whitelist;
const population = [
  {
    path: "rooms",
    model: Room,
  },
  {
    path: "roomType",
    model: RoomType,
  },
  {
    path: "rates",
    model: Rating,
  },
  {path: "facilities", model: Facility},
  {
    path: "created_by",
    model: User,
    populate: [
      {
        path: "internal",
        model: Internal,
        select: "-_id -user -picture -created_at",
      },
    ],
    select: "-password -username -picture -role -status -created_at",
  },
];

exports.create = function create(subRoomTypeData, cb) {
  const subRoomTypeModel = new subRoomType(subRoomTypeData);

  subRoomTypeModel
    .save()
    .then((data) => {
      // Fetch the populated doc after save
      return exports.get({_id: data._id}, cb); // Reuse the updated `get` method
    })
    .catch((err) => cb(err));
};

exports.delete = function deleteItem(query, cb) {
  subRoomType
    .findOne(query)
    .populate(population)
    .exec() // 👈 Now Promise-based
    .then((doc) => {
      if (!doc) {
        return cb(null, {});
      }
      return subRoomType
        .deleteOne(query)
        .exec()
        .then(() => doc);
    })
    .then((doc) => cb(null, doc))
    .catch((err) => cb(err));
};

exports.update = function update(query, updates, cb) {
  const opts = {new: true};

  // updates = mongoUpdate(updates);  // Uncomment if needed

  subRoomType
    .findOneAndUpdate(query, updates, opts)
    .populate(population) // Chain populate after findOneAndUpdate
    .exec() // 👈 Promise-based
    .then((doc) => cb(null, doc || {}))
    .catch((err) => cb(err));
};

exports.get = function get(query, cb) {
  subRoomType
    .findOne(query)
    .populate(population)
    .exec() // 👈 Promise-based (fixes the error here!)
    .then((doc) => cb(null, doc || {}))
    .catch((err) => cb(err));
};

exports.getCollection = function getCollection(query, opt, cb) {
  subRoomType
    .find(query, {}, opt)
    .populate(population)
    .exec() // 👈 Promise-based (fixed async to callback pattern)
    .then((doc) => cb(null, doc))
    .catch((err) => cb(err));
};

exports.getCollectionByPagination = function getCollectionByPagination(
  query,
  qs,
  cb
) {
  debug("fetching a collection of sub room types"); // Fixed: Updated log message

  const opts = {
    // columns: returnFields,  // Uncomment if needed
    sort: qs.sort || {},
    populate: population,
    page: qs.page,
    limit: qs.limit,
  };

  // 👈 Fixed: No callback; use .then() on the Promise
  subRoomType
    .paginate(query, opts)
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
