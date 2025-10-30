"use strict";
const _ = require("lodash");
const debug = require("debug")("api:dal-BankAccount");
const Wallet = require("../models/wallet");
const Client = require("../models/client");
const Transaction = require("../models/transaction");
const population = [
  {
    path: "user_information",
    populate: [
      {
        path: "uuid",
        model: Client,
      },
    ],
  },
  {
    path: "transaction",
    model: Transaction,
  },
];

exports.create = function create(WalletData, cb) {
  var WalletModel = new Wallet(WalletData);
  WalletModel.save(function saveWallet(err, data) {
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
  Wallet.findOne(query)
    .populate(population)
    .exec(function deleteWallet(err, doc) {
      if (err) {
        return cb(err);
      }
      if (!doc) {
        return cb(null, {});
      }
      Wallet.deleteOne(query, function (err) {
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
  Wallet.findOneAndUpdate(query, updates, opts)
    .populate(population)
    .exec(function updateWallet(err, doc) {
      if (err) {
        return cb(err);
      }
      cb(null, doc || {});
    });
};

exports.get = function get(query, cb) {
  Wallet.findOne(query)
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
  Wallet.find(query, {}, opt)
    .populate(population)
    .sort({_id: -1})
    .exec(function getWalletsCollection(err, doc) {
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

  Wallet.paginate(query, opts, function (err, docs, page, countDocuments) {
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
