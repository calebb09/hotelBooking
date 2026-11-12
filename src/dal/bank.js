"use strict";
var _ = require("lodash");
const debug = require("debug")("api:dal-bank"); // Fixed: Updated debug name to match model (was "internal")
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
  const BankModel = new Bank(BankData);
  BankModel.save()
    .then((data) => {
      // Fetch the populated doc after save
      return exports.get({_id: data._id}, cb); // Reuse the updated `get` method
    })
    .catch((err) => cb(err));
};

exports.delete = function deleteItem(query, cb) {
  Bank.findOne(query)
    .populate(population)
    .exec() // 👈 Now Promise-based
    .then((doc) => {
      if (!doc) {
        return cb(null, {});
      }
      return Bank.deleteOne(query)
        .exec()
        .then(() => doc);
    })
    .then((doc) => cb(null, doc))
    .catch((err) => cb(err));
};

exports.update = function update(query, updates, cb) {
  const opts = {new: true};

  // updates = mongoUpdate(updates);  // Uncomment if needed

  Bank.findOneAndUpdate(query, updates, opts)
    .populate(population) // Chain populate after findOneAndUpdate
    .exec() // 👈 Promise-based
    .then((doc) => cb(null, doc || {}))
    .catch((err) => cb(err));
};

exports.get = function get(query, cb) {
  Bank.findOne(query)
    .sort({_id: 1})
    .populate(population)
    .exec() // 👈 Promise-based (fixes the error here!)
    .then((doc) => cb(null, doc || {}))
    .catch((err) => cb(err));
};

exports.getCollection = function getCollection(query, opt, cb) {
  Bank.find(query, {}, opt)
    .populate(population)
    .exec() // 👈 Promise-based
    .then((doc) => cb(null, doc))
    .catch((err) => cb(err));
};

exports.getCollectionByPagination = function getCollectionByPagination(
  query,
  qs,
  cb
) {
  debug("fetching a collection of banks"); // Fixed: Updated log message

  const opts = {
    // columns: returnFields,  // Uncomment if needed
    sort: qs.sort,
    populate: population,
    page: qs.page,
    limit: qs.limit,
  };

  // 👈 Fixed: No callback; use .then() on the Promise
  Bank.paginate(query, opts)
    .then((result) => {
      // Structure matches your old callback (docs, page, count)
      const data = {
        docs: result.docs,
        total: result.totalDocs, // Renamed for clarity; adjust if controller expects `count`
        page: result.page,
        totalPages: result.totalPages,
        limit: result.limit,
      };
      cb(null, data);
    })
    .catch((err) => cb(err));
};
