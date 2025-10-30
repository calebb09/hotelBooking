var _ = require("lodash");
const debug = require("debug")("api:dal-internal");
var Device = require("../models/device");
// var returnFields = category.whitelist;
var population = [];

exports.create = function create(deviceData, cb) {
  var deviceModel = new Device(deviceData);
  deviceModel.save(function saveDevice(err, data) {
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
  Device.findOne(query)
    .populate(population)
    .exec(function deleteDevice(err, doc) {
      if (err) {
        return cb(err);
      }
      if (!doc) {
        return cb(null, {});
      }
      Device.deleteOne(query, function (err) {
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

  Device.findOneAndUpdate(query, updates, opts)
    .populate(population)
    .exec(function updateCategory(err, doc) {
      if (err) {
        return cb(err);
      }

      cb(null, doc || {});
    });
};

exports.get = function get(query, cb) {
  Device.findOne(query)
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
  Device.find(query, {}, opt)
    .populate(population)
    .exec(function getcoursesCollection(err, doc) {
      if (err) {
        return cb(err);
      }

      return cb(null, doc);
    });
};
exports.getCollectionByPagination = function getCollection(query, qs, cb) {
  debug("fetching a collection of Internal");

  var opts = {
    // columns:  returnFields,
    sort: qs.sort,
    populate: population,
    page: qs.page,
    limit: qs.limit,
  };
  Device.paginate(query, opts, function (err, docs, page, count) {
    if (err) {
      return cb(err);
    }
    var data = {
      total_pages: page,
      total_docs_count: count,
      docs: docs,
    };

    cb(null, data);
  });
};
