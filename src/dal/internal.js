"use strict";
// Access Layer for Internal Data.
/**
 * Load Module Dependencies.
 */
const debug = require("debug")("api:dal-internal");

const _ = require("lodash");
const Internal = require("../models/internal");
const User = require("../models/user");
// var returnFields = internal.whitelist;
var population = [
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
 *6
 * @param {Object}  internalData  Data for the Internal to create
 * @param {Function} cb       Callback for once saving is complete
 */
exports.create = function create(internalData, cb) {
  debug("creating a new Internal");
  // Create Internal if is new.
  var internalModel = new Internal(internalData);
  internalModel.save(function saveinternal(err, data) {
    if (err) {
      return cb(err);
    }
    exports.get({_id: data._id}, function (err, doc) {
      if (err) {
        return cb(err);
      }
      cb(null, doc);
    });
  });
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
    .exec(function deleteinternal(err, doc) {
      if (err) {
        return cb(err);
      }

      if (!doc) {
        return cb(null, {});
      }

      Internal.deleteOne(query, function (err) {
        if (err) {
          return cb(err);
        }

        cb(null, doc);
      });
    });
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

  var opts = {
    new: true,
  };

  // updates = mongoUpdate(updates);

  Internal.findOneAndUpdate(query, updates, opts)
    .populate(population)
    .exec(function updateinternal(err, doc) {
      if (err) {
        return cb(err);
      }

      cb(null, doc || {});
    });
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
    .exec(function (err, doc) {
      if (err) {
        return cb(err);
      }

      cb(null, doc || {});
    });
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

  Internal.find(query, opt)
    .populate(population)
    .exec(function getinternalsCollection(err, doc) {
      if (err) {
        return cb(err);
      }

      return cb(null, doc);
    });
};

/**
 * get a collection of Internal using pagination
 *
 * @desc get a collection of Internal from db
 *
 * @param {Object} query Query Object
 * @param {Function} cb Callback for once fetch is complete
 */
exports.getCollectionByPagination = function getCollection(query, qs, cb) {
  debug("fetching a collection of Internal");

  var opts = {
    // columns:  returnFields,
    sort: qs.sort || {},
    populate: population,
    page: qs.page,
    limit: qs.limit,
  };
  Internal.paginate(query, opts, function (err, docs, page, count) {
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
