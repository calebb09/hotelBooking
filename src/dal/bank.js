var _ = require("lodash");
const debug = require("debug")("api:dal-internal");
var Bank = require("../models/bank");
var Accommodation = require("../models/accommodation");
// var returnFields = category.whitelist;
var population = [
  //   {
  //     path: "created_by",
  //     model: Accommodation,
  //   },
];

exports.create = function create(BankData, cb) {
  var BankModel = new Bank(BankData);
  BankModel.save(function saveBank(err, data) {
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
  Bank.findOne(query)
    .populate(population)
    .exec(function deleteBank(err, doc) {
      if (err) {
        return cb(err);
      }
      if (!doc) {
        return cb(null, {});
      }
      Bank.deleteOne(query, function (err) {
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

  Bank.findOneAndUpdate(query, updates, opts)
    .populate(population)
    .exec(function updateCategory(err, doc) {
      if (err) {
        return cb(err);
      }

      cb(null, doc || {});
    });
};

exports.get = function get(query, cb) {
  Bank.findOne(query)
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
  Bank.find(query, {}, opt)
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
  Bank.paginate(query, opts, function (err, docs, page, count) {
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
