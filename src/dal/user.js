"use strict"; // Fixed: "user strict" → "use strict"
const _ = require("lodash");
const debug = require("debug")("api:dal-user");
const User = require("../models/user");
const Internal_USER = require("../models/internal");
const returnFields = User.whitelist;
const population = [
  {
    path: "internal",
    model: Internal_USER,
  },
];

exports.create = async function create(userData, cb) {
  try {
    const searchQuery = {username: userData.username};
    // Make sure user does not exist
    const isPresent = await User.findOne(searchQuery, returnFields).exec();
    if (isPresent) {
      return cb(new Error("User already exists"));
    }
    // Create user if is new.
    const userModel = new User(userData);
    const data = await userModel.save();
    // Fetch populated doc
    const user = await exports.getPopulated({_id: data._id});
    cb(null, user);
  } catch (err) {
    cb(err);
  }
};

// Helper for populated get (to avoid recursion in create)
async function getPopulated(query) {
  return User.findOne(query).select(returnFields).populate(population).exec();
}

exports.delete = function deleteItem(query, cb) {
  User.findOne(query, returnFields)
    .populate(population)
    .exec() // 👈 Now Promise-based
    .then((user) => {
      if (!user) {
        return cb(null, {});
      }
      return User.deleteOne(query)
        .exec()
        .then(() => user);
    })
    .then((user) => cb(null, user))
    .catch((err) => cb(err));
};

exports.update = function update(query, updates, cb) {
  const opts = {
    new: true,
    safe: true,
    upsert: true, // Note: Keep if intended; consider false if not upserting
    select: returnFields,
  };

  // updates = mongoUpdate(updates);  // Uncomment if needed

  User.findOneAndUpdate(query, updates, opts)
    .populate(population) // Chain populate after findOneAndUpdate
    .exec() // 👈 Promise-based
    .then((user) => cb(null, user || {}))
    .catch((err) => cb(err));
};

exports.get = function get(query, cb) {
  User.findOne(query)
    .populate(population)
    .exec() // 👈 Promise-based (fixes the error here!)
    .then((user) => cb(null, user || {}))
    .catch((err) => cb(err));
};

exports.getCollection = function getCollection(query, opt, cb) {
  User.find(query, opt || {}, returnFields) // Fixed: Use opt for projection if provided, fallback to returnFields
    .populate(population)
    .exec() // 👈 Promise-based
    .then((user) => cb(null, user || []))
    .catch((err) => cb(err));
};

exports.getCollectionByPagination = function getCollectionByPagination(
  query,
  qs,
  cb
) {
  debug("fetching a collection of users"); // Fixed: Updated log message

  const opts = {
    // columns: returnFields,  // Uncomment if needed for select
    sort: qs.sort,
    populate: population,
    page: qs.page,
    limit: qs.limit,
  };

  // 👈 Fixed: No callback; use .then() on the Promise
  User.paginate(query, opts)
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
