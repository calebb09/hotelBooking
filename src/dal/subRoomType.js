var debug = require("debug")("api:dal-subRoomType");
var _ = require("lodash");
var subRoomType = require("../models/subRoomType");
var RoomType = require("../models/room_type");
var Room = require("../models/rooms");
var User = require("../models/user");
var Internal = require("../models/internal");
var Facility = require("../models/facilities");
const Rating = require("../models/ratings");
// var returnFields = subRoomType.whitelist;
var population = [
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
  var subRoomTypeModel = new subRoomType(subRoomTypeData);

  subRoomTypeModel.save(function savesubRoomType(err, data) {
    if (err) {
      return cb(err);
    }

    exports.get({_id: data._id}, function (err, doc) {
      if (err) {
        return cb(err);
      }

      cb(null, doc);
    });
  });
};

exports.delete = function deleteItem(query, cb) {
  subRoomType
    .findOne(query)
    .populate(population)
    .exec(function deletesubRoomType(err, doc) {
      if (err) {
        return cb(err);
      }

      if (!doc) {
        return cb(null, {});
      }

      subRoomType.deleteOne(query, function (err) {
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

  // updates = mongoUpdate(updates);

  subRoomType
    .findOneAndUpdate(query, updates, opts)
    .populate(population)
    .exec(function updatesubRoomType(err, doc) {
      if (err) {
        return cb(err);
      }

      cb(null, doc || {});
    });
};

exports.get = function get(query, cb) {
  subRoomType
    .findOne(query)
    .populate(population)
    .exec(function (err, doc) {
      if (err) {
        return cb(err);
      }

      cb(null, doc || {});
    });
};

exports.getCollection = async function getCollection(query, opt, cb) {
  try {
    const doc = await subRoomType.find(query, {}, opt).populate(population);

    if (doc) {
      return doc;
    }
  } catch (error) {
    return error;
  }
};

exports.getCollectionByPagination = function getCollectionByPagination(
  query,
  qs,
  cb
) {
  debug("fetching a collection of Helpers");
  var opts = {
    // columns:  returnFields,
    sort: qs.sort || {},
    populate: population,
    page: qs.page,
    limit: qs.limit,
  };

  subRoomType.paginate(query, opts, function (err, docs, page, countDocuments) {
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
