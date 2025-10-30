"user strict";

const _ = require("lodash");
const debug = require("debug")("api:dal-BankAccount");
const Profit = require("../models/profit");
const User = require("../models/user");
const Client = require("../models/client");
const Internal = require("../models/internal");
const Transaction = require("../models/transaction");
const population = [
  {
    path: "user_information",
    populate: [
      {
        path: "user",
        model: Client,
      },
      {
        path: "client",
        model: User,
        select: "-password",
        populate: [
          {
            path: "internal",
            model: Internal,
          },
        ],
      },
    ],
  },
  {
    path: "transaction",
    model: Transaction,
  },
];

exports.create = function create(ProfitData, cb) {
  var ProfitModel = new Profit(ProfitData);
  ProfitModel.save(function saveProfit(err, data) {
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
  Profit.findOne(query)
    .populate(population)
    .exec(function deleteProfit(err, doc) {
      if (err) {
        return cb(err);
      }
      if (!doc) {
        return cb(null, {});
      }
      Profit.deleteOne(query, function (err) {
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
  Profit.findOneAndUpdate(query, updates, opts)
    .populate(population)
    .exec(function updateProfit(err, doc) {
      if (err) {
        return cb(err);
      }
      cb(null, doc || {});
    });
};

exports.get = function get(query, cb) {
  Profit.findOne(query)
    .populate(population)
    .exec(function (err, doc) {
      if (err) {
        return cb(err);
      }
      cb(null, doc || {});
    });
};

exports.getCollection = function getCollection(query, opt, cb) {
  Profit.find(query, {}, opt)
    .populate(population)
    .sort({_id: -1})
    .exec(function getProfitsCollection(err, doc) {
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
  debug("fetching a collection of Profits");
  var opts = {
    // columns:  returnFields,
    sort: qs.sort || {},
    populate: population,
    page: qs.page,
    limit: qs.limit,
  };

  Profit.paginate(query, opts, function (err, docs, page, countDocuments) {
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
