"use strict"; // Added: Strict mode for better error handling
const _ = require("lodash");
const debug = require("debug")("api:dal-wallet"); // Fixed: Updated debug name to match model (was "BankAccount")
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
  const WalletModel = new Wallet(WalletData);
  WalletModel.save()
    .then((data) => {
      // Fetch the populated doc after save
      return exports.get({_id: data._id}, cb); // Reuse the updated `get` method
    })
    .catch((err) => cb(err));
};

exports.delete = function deleteItem(query, cb) {
  Wallet.findOne(query)
    .populate(population)
    .exec() // 👈 Now Promise-based
    .then((doc) => {
      if (!doc) {
        return cb(null, {});
      }
      return Wallet.deleteOne(query)
        .exec()
        .then(() => doc);
    })
    .then((doc) => cb(null, doc))
    .catch((err) => cb(err));
};

exports.update = function update(query, updates, cb) {
  const now = new Date();
  const opts = {new: true};

  Wallet.findOneAndUpdate(query, updates, opts)
    .populate(population) // Chain populate after findOneAndUpdate
    .exec() // 👈 Promise-based
    .then((doc) => cb(null, doc || {}))
    .catch((err) => cb(err));
};

exports.get = function get(query, cb) {
  Wallet.findOne(query)
    .populate(population)
    .sort({_id: -1})
    .exec() // 👈 Promise-based (fixes the error here!)
    .then((doc) => cb(null, doc || {}))
    .catch((err) => cb(err));
};

exports.getCollection = function getCollection(query, opt, cb) {
  Wallet.find(query, {}, opt)
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
  debug("fetching a collection of wallets"); // Fixed: Updated log message

  const opts = {
    // columns: returnFields,  // Uncomment if needed
    sort: qs.sort,
    populate: population,
    page: qs.page,
    limit: qs.limit,
  };

  // 👈 Fixed: No callback; use .then() on the Promise
  Wallet.paginate(query, opts)
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
