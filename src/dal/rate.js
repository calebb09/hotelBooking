const _ = require("lodash");
const debug = require("debug")("api:dal-user");
const Rate = require("../models/ratings");
const Room = require("../models/rooms");
const Client = require("../models/client");
const User = require("../models/user");
const Internal = require("../models/internal");
// var returnFields = category.whitelist;
const population = [
  {
    path: "room",
    model: Room,
  },
  {
    path: "client",
    model: Client,
  },
  {
    path: "created_by",
    model: User,
    select: "-password",
    populate: [
      {
        path: "internal",
        model: Internal,
      },
    ],
  },
];

exports.create = function create(RateData, cb) {
  var RateModel = new Rate(RateData);
  RateModel.save(function saveRate(err, data) {
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
  Rate.findOne(query)
    .populate(population)
    .exec(function deleteRate(err, doc) {
      if (err) {
        return cb(err);
      }
      if (!doc) {
        return cb(null, {});
      }
      Rate.deleteOne(query, function (err) {
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

  Rate.findOneAndUpdate(query, updates, opts)
    .populate(population)
    .exec(function updateCategory(err, doc) {
      if (err) {
        return cb(err);
      }

      cb(null, doc || {});
    });
};

exports.get = function get(query, cb) {
  Rate.findOne(query)
    .sort({
      _id: 1,
    })
    .populate(population)
    .exec(function (err, doc) {
      if (err) {
        return cb(err);
      }

      cb(null, doc || {});
    });
};

exports.getCollection = function getCollection(query, opt, cb) {
  Rate.find(query, {}, opt)
    .populate(population)
    .exec(function getcoursesCollection(err, doc) {
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
  debug("fetching a collection of Rate");
  var opts = {
    // columns:  returnFields,
    sort: qs.sort,
    populate: population,
    page: qs.page,
    limit: qs.limit,
  };

  Rate.paginate(query, opts, function (err, docs, page, countDocuments) {
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
