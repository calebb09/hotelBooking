"use strict";
const _ = require("lodash");
const debug = require("debug")("api:dal-BankAccount");
const Transaction = require("../models/transaction");
const Client = require("../models/client");
const Booking = require("../models/booking");
const Package = require("../models/package");
const user = require("../models/user");
const population = [
  {
    path: "user_information",
    populate: [
      {
        path: "user",
        model: Client,
      },
    ],
  },
  // {
  //   path: "services",
  //   populate: [
  //     {
  //       path: "package",
  //       model: Package,
  //     },
  //     {
  //       path: "booking",
  //       model: Booking,
  //       populate: [
  //         {
  //           path: "transfer",
  //           populate: [
  //             {
  //               path: "client",
  //               model: user,
  //             },
  //             {
  //               path: "user",
  //               model: Client,
  //             },
  //           ],
  //         },
  //       ],
  //     },
  //   ],
  // },
];

exports.create = function create(TransactionData, cb) {
  var TransactionModel = new Transaction(TransactionData);
  TransactionModel.save(function saveTransaction(err, data) {
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
  Transaction.findOne(query)
    .populate(population)
    .exec(function deleteTransaction(err, doc) {
      if (err) {
        return cb(err);
      }
      if (!doc) {
        return cb(null, {});
      }
      Transaction.deleteOne(query, function (err) {
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
  Transaction.findOneAndUpdate(query, updates, opts)
    .populate(population)
    .exec(function updateTransaction(err, doc) {
      if (err) {
        return cb(err);
      }
      cb(null, doc || {});
    });
};

exports.get = function get(query, cb) {
  Transaction.findOne(query)
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
  Transaction.find(query, {}, opt)
    .populate(population)
    .sort({_id: -1})
    .exec(function getTransactionsCollection(err, doc) {
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

  Transaction.paginate(query, opts, function (err, docs, page, countDocuments) {
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
