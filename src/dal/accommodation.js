"use strict";
const _ = require("lodash");
const debug = require("debug")("api:dal-BankAccount"); // Note: This debug name seems mismatched (BankAccount?); consider renaming to "api:dal-Accommodation"
const Accommodation = require("../models/accommodation");
const AccommodationT = require("../models/accommodation_type");
const Facility = require("../models/facilities");
const City = require("../models/city");
const user = require("../models/user");
const Internal = require("../models/internal");

const population = [
  // 👈 This is fine; populate chains work with Promises
  {
    path: "address",
    populate: [
      {
        path: "city",
        model: City,
      },
    ],
  },
  {
    path: "lodging_type",
    model: AccommodationT,
  },
  {
    path: "facilities",
    model: Facility,
  },
  {
    path: "created_by",
    model: user,
    select: "-password -role -status -account_status -assigned_accommodation",
    populate: [
      {
        path: "internal",
        model: Internal,
        select: "-user -created_by",
      },
    ],
  },
];

exports.create = function create(AccommodationData, cb) {
  const AccommodationModel = new Accommodation(AccommodationData);
  AccommodationModel.save()
    .then((data) => {
      // Fetch the populated doc after save
      return exports.get({_id: data._id}, cb); // Reuse the updated `get` method
    })
    .catch((err) => cb(err));
};

exports.delete = function deleteItem(query, cb) {
  Accommodation.findOne(query)
    .populate(population)
    .exec() // 👈 Now Promise-based
    .then((doc) => {
      if (!doc) {
        return cb(null, {});
      }
      return Accommodation.deleteOne(query)
        .exec()
        .then(() => doc);
    })
    .then((doc) => cb(null, doc))
    .catch((err) => cb(err));
};

exports.update = function update(query, updates, cb) {
  const now = new Date();
  const opts = {new: true};

  Accommodation.findOneAndUpdate(query, updates, opts)
    .populate(population) // Chain populate after findOneAndUpdate
    .exec() // 👈 Promise-based
    .then((doc) => cb(null, doc || {}))
    .catch((err) => cb(err));
};

exports.get = function get(query, cb) {
  Accommodation.findOne(query)
    .populate(population)
    .sort({_id: -1})
    .exec() // 👈 Promise-based (fixes the error here!)
    .then((doc) => cb(null, doc || {}))
    .catch((err) => cb(err));
};

exports.getCollection = function getCollection(query, opt, cb) {
  Accommodation.find(query, {}, opt)
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
  debug("fetching a collection of accommodations");
  const opts = {
    sort: qs.sort,
    populate: population,
    page: qs.page,
    limit: qs.limit,
  };

  // 👈 Fixed: No callback; use .then() on the Promise
  Accommodation.paginate(query, opts)
    .then((result) => {
      // Structure matches your old callback (docs, page, totalDocs)
      const data = {
        docs: result.docs,
        total: result.totalDocs, // Renamed for clarity; adjust if needed
        page: result.page,
        totalPages: result.totalPages,
        limit: result.limit,
      };
      cb(null, data);
    })
    .catch((err) => cb(err));
};
