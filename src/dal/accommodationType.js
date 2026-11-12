"use strict";
const _ = require("lodash");
const debug = require("debug")("api:dal-accommodation-type"); // Fixed: Updated debug name to match model (was "BankAccount")
const AccommoType = require("../models/accommodation_type");
const population = [];

exports.create = function create(AccommoTypeData, cb) {
  const AccommoTypeModel = new AccommoType(AccommoTypeData);
  AccommoTypeModel.save()
    .then((data) => {
      // Fetch the populated doc after save
      return exports.get({_id: data._id}, cb); // Reuse the updated `get` method
    })
    .catch((err) => cb(err));
};

exports.delete = function deleteItem(query, cb) {
  AccommoType.findOne(query)
    .populate(population)
    .exec() // 👈 Now Promise-based
    .then((doc) => {
      if (!doc) {
        return cb(null, {});
      }
      return AccommoType.deleteOne(query)
        .exec()
        .then(() => doc);
    })
    .then((doc) => cb(null, doc))
    .catch((err) => cb(err));
};

exports.update = function update(query, updates, cb) {
  const now = new Date();
  const opts = {new: true};

  AccommoType.findOneAndUpdate(query, updates, opts)
    .populate(population) // Chain populate after findOneAndUpdate
    .exec() // 👈 Promise-based
    .then((doc) => cb(null, doc || {}))
    .catch((err) => cb(err));
};

exports.get = function get(query, cb) {
  AccommoType.findOne(query)
    .populate(population)
    .sort({_id: -1})
    .exec() // 👈 Promise-based (fixes the error here!)
    .then((doc) => cb(null, doc || {}))
    .catch((err) => cb(err));
};

exports.getCollection = function getCollection(query, opt, cb) {
  AccommoType.find(query, {}, opt)
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
  debug("fetching a collection of accommodation types"); // Fixed: Corrected typo and updated log message

  const opts = {
    // columns: returnFields,  // Uncomment if needed
    sort: qs.sort,
    populate: population,
    page: qs.page,
    limit: qs.limit,
  };

  // 👈 Fixed: No callback; use .then() on the Promise
  AccommoType.paginate(query, opts)
    .then((result) => {
      // Structure matches your old callback (docs, page, total_docs_count)
      const data = {
        docs: result.docs,
        total: result.totalDocs, // Renamed for clarity; adjust if controller expects `countDocuments`
        page: result.page,
        totalPages: result.totalPages,
        limit: result.limit,
      };
      cb(null, data);
    })
    .catch((err) => cb(err));
};
