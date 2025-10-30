"use strict";
const _ = require("lodash");
const debug = require("debug")("api:dal-BankAccount");
const Room = require("../models/rooms");
const user = require("../models/user");
const RoomType = require("../models/room_type");
const SubRoomType = require("../models/subRoomType");
const Client = require("../models/client");
const Rate = require("../models/ratings");
const Accommodation = require("../models/accommodation");
const AccommodationT = require("../models/accommodation_type");
const Booking = require("../models/booking");
const Facility = require("../models/facilities");
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
  var RoomModel = new Room(RoomData);
  RoomModel.save(function saveRoom(err, data) {
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
  Room.findOne(query)
    .populate(population)
    .exec(function deleteRoom(err, doc) {
      if (err) {
        return cb(err);
      }
      if (!doc) {
        return cb(null, {});
      }
      Room.deleteOne(query, function (err) {
        if (err) {
          return cb(err);
        }
        cb(null, doc);
      });
    });
};

exports.update = function update(query, updates, cb) {
  var now = new Date();
  var opts = {
    new: true,
  };
  Room.findOneAndUpdate(query, updates, opts)
    .populate(population)
    .exec(function updateRoom(err, doc) {
      if (err) {
        return cb(err);
      }
      cb(null, doc || {});
    });
};

exports.get = function get(query, cb) {
  Room.findOne(query)
    .populate(population)
    .sort({_id: -1})
    .exec(function (err, doc) {
      if (err) {
        return cb(err);
      }
      cb(null, doc || {});
    });
};

exports.getCollection = function getCollection(query, opt, cb) {
  Room.find(query, {}, opt)
    .populate(population)
    .sort({_id: -1})
    .exec(function getRoomsCollection(err, doc) {
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
  debug("fetching a collection of accomoodations");
  var opts = {
    // columns:  returnFields,
    sort: qs.sort,
    populate: population,
    page: qs.page,
    limit: qs.limit,
  };

  Room.paginate(query, opts, function (err, docs, page, countDocuments) {
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
