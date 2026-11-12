"use strict"; // Fixed: "user strict" → "use strict"
const _ = require("lodash");
const debug = require("debug")("api:dal-profit"); // Fixed: Updated debug name to match model (was "BankAccount")
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
  const ProfitModel = new Profit(ProfitData);
  ProfitModel.save()
    .then((data) => {
      // Fetch the populated doc after save
      return exports.get({_id: data._id}, cb); // Reuse the updated `get` method
    })
    .catch((err) => cb(err));
};

exports.delete = function deleteItem(query, cb) {
  Profit.findOne(query)
    .populate(population)
    .exec() // 👈 Now Promise-based
    .then((doc) => {
      if (!doc) {
        return cb(null, {});
      }
      return Profit.deleteOne(query)
        .exec()
        .then(() => doc);
    })
    .then((doc) => cb(null, doc))
    .catch((err) => cb(err));
};

exports.update = function update(query, updates, cb) {
  const opts = {new: true};

  Profit.findOneAndUpdate(query, updates, opts)
    .populate(population) // Chain populate after findOneAndUpdate
    .exec() // 👈 Promise-based
    .then((doc) => cb(null, doc || {}))
    .catch((err) => cb(err));
};

exports.get = function get(query, cb) {
  Profit.findOne(query)
    .populate(population)
    .exec() // 👈 Promise-based (fixes the error here!)
    .then((doc) => cb(null, doc || {}))
    .catch((err) => cb(err));
};

exports.getCollection = function getCollection(query, opt, cb) {
  Profit.find(query, {}, opt)
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
  debug("fetching a collection of profits"); // Fixed: Minor capitalization for consistency

  const opts = {
    // columns: returnFields,  // Uncomment if needed
    sort: qs.sort || {},
    populate: population,
    page: qs.page,
    limit: qs.limit,
  };

  // 👈 Fixed: No callback; use .then() on the Promise
  Profit.paginate(query, opts)
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
