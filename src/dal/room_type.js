"use strict"; // Added: Strict mode for better error handling
const debug = require("debug")("api:dal-category"); // Already correct, kept as-is
const _ = require("lodash");
const Category = require("../models/room_type");
const User = require("../models/user");
const Internal = require("../models/internal");
// var returnFields = category.whitelist;
const population = [
  {
    path: "created_by",
    model: User,
    populate: [
      {
        path: "internal",
        model: Internal,
        select: "-_id -user -picture -created_at",
      },
    ],
    select: "-password -username -picture -role -status -created_at",
  },
];

exports.create = function create(categoryData, cb) {
  const categoryModel = new Category(categoryData);

  categoryModel
    .save()
    .then((data) => {
      // Fetch the populated doc after save
      return exports.get({_id: data._id}, cb); // Reuse the updated `get` method
    })
    .catch((err) => cb(err));
};

exports.delete = function deleteItem(query, cb) {
  Category.findOne(query)
    .populate(population)
    .exec() // 👈 Now Promise-based
    .then((doc) => {
      if (!doc) {
        return cb(null, {});
      }
      return Category.deleteOne(query)
        .exec()
        .then(() => doc);
    })
    .then((doc) => cb(null, doc))
    .catch((err) => cb(err));
};

exports.update = function update(query, updates, cb) {
  const opts = {new: true};

  // updates = mongoUpdate(updates);  // Uncomment if needed

  Category.findOneAndUpdate(query, updates, opts)
    .populate(population) // Chain populate after findOneAndUpdate
    .exec() // 👈 Promise-based
    .then((doc) => cb(null, doc || {}))
    .catch((err) => cb(err));
};

exports.get = function get(query, cb) {
  Category.findOne(query)
    .populate(population)
    .exec() // 👈 Promise-based (fixes the error here!)
    .then((doc) => cb(null, doc || {}))
    .catch((err) => cb(err));
};

exports.getCollection = function getCollection(query, opt, cb) {
  Category.find(query, {}, opt)
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
  debug("fetching a collection of room types"); // Fixed: Updated log message to match model

  const opts = {
    // columns: returnFields,  // Uncomment if needed
    sort: qs.sort || {},
    populate: population,
    page: qs.page,
    limit: qs.limit,
  };

  // 👈 Fixed: No callback; use .then() on the Promise
  Category.paginate(query, opts)
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
