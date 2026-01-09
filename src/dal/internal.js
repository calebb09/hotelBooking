"use strict";
/**
 * Access Layer for Internal Data.
 */
/**
 * Load Module Dependencies.
 */
const debug = require("debug")("api:dal-internal");
const _ = require("lodash");
const Internal = require("../models/internal");
const User = require("../models/user");
// var returnFields = internal.whitelist;
const population = [
  {
    path: "user",
    model: User,
    select: "-password",
  },
];

/**
 * create a new Internal.
 *
 * @desc  creates a new Internal and saves them
 *        in the database
 *
 * @param {Object}  internalData  Data for the Internal to create
 * @param {Function} cb       Callback for once saving is complete
 */
exports.create = function create(internalData, cb) {
  debug("creating a new Internal");
  // Create Internal if is new.
  const internalModel = new Internal(internalData);
  internalModel
    .save()
    .then((data) => {
      exports.get({_id: data._id}, cb); // Reuse the updated `get` method
    })
    .catch((err) => cb(err));
};

/**
 * delete an Internal
 *
 * @desc  delete data of the Internal with the given
 *        id
 *
 * @param {Object}  query   Query Object
 * @param {Function} cb Callback for once delete is complete
 */
exports.delete = function deleteItem(query, cb) {
  debug("deleting Internal: ", query);

  Internal.findOne(query)
    .populate(population)
    .exec() // 👈 Now Promise-based
    .then((doc) => {
      if (!doc) {
        return cb(null, {});
      }
      return Internal.deleteOne(query)
        .exec()
        .then(() => doc);
    })
    .then((doc) => cb(null, doc))
    .catch((err) => cb(err));
};

/**
 * update a Internal
 *
 * @desc  update data of the Internal with the given
 *        id
 *
 * @param {Object} query Query object
 * @param {Object} updates  Update data
 * @param {Function} cb Callback for once update is complete
 */
exports.update = function update(query, updates, cb) {
  debug("updating Internal: ", query);

  const opts = {
    new: true,
  };

  // updates = mongoUpdate(updates);  // Uncomment if needed

  Internal.findOneAndUpdate(query, updates, opts)
    .populate(population) // Chain populate after findOneAndUpdate
    .exec() // 👈 Promise-based
    .then((doc) => cb(null, doc || {}))
    .catch((err) => cb(err));
};

/**
 * get a Internal.
 *
 * @desc get a Internal with the given id from db
 *
 * @param {Object} query Query Object
 * @param {Function} cb Callback for once fetch is complete
 */
exports.get = function get(query, cb) {
  debug("getting Internal ", query);

  Internal.findOne(query)
    .populate(population)
    .exec() // 👈 Promise-based (fixes the error here!)
    .then((doc) => cb(null, doc || {}))
    .catch((err) => cb(err));
};

/**
 * get a collection of Internal
 *
 * @desc get a collection of Internal from db
 *
 * @param {Object} query Query Object
 * @param {Function} cb Callback for once fetch is complete
 */
exports.getCollection = function getCollection(query, opt, cb) {
  debug("fetching a collection of Internal");

  Internal.find(query, {}, opt) // Added empty object for fields if opt is options
    .populate(population)
    .exec() // 👈 Promise-based
    .then((doc) => cb(null, doc))
    .catch((err) => cb(err));
};

/**
 * get a collection of Internal using pagination
 *
 * @desc get a collection of Internal from db
 *
 * @param {Object} query Query Object
 * @param {Function} cb Callback for once fetch is complete
 */
exports.getCollectionByPagination = function getCollectionByPagination(
  query,
  qs,
  cb
) {
  debug("fetching a collection of Internal");

  const opts = {
    // columns: returnFields,  // Uncomment if needed
    sort: qs.sort || {},
    populate: population,
    page: qs.page,
    limit: qs.limit,
  };

  // 👈 Fixed: No callback; use .then() on the Promise
  Internal.paginate(query, opts)
    .then((result) => {
      // Structure matches your old callback (docs, page, count)
      const data = {
        docs: result.docs,
        total_pages: result.totalPages,
        total_docs_count: result.totalDocs,
      };
      cb(null, data);
    })
    .catch((err) => cb(err));
};
