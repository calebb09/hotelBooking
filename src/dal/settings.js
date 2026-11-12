"use strict"; // Added: Strict mode for better error handling
const _ = require("lodash");
const debug = require("debug")("api:dal-settings"); // Fixed: Updated debug name to match model (was missing, assumed "BankAccount" pattern)
const Setting = require("../models/settings");
const User = require("../models/user");
const Internal = require("../models/internal");
// var returnFields = category.whitelist;
const population = [
  {
    path: "created_by",
    model: User,
    select: "-password",
    populate: [
      {
        path: "internal",
        model: Internal,
      },
    ],
  },
];

exports.create = function create(SettingData, cb) {
  const SettingModel = new Setting(SettingData);
  SettingModel.save()
    .then((data) => {
      // Fetch the populated doc after save
      return exports.get({_id: data._id}, cb); // Reuse the updated `get` method
    })
    .catch((err) => cb(err));
};

exports.delete = function deleteItem(query, cb) {
  Setting.findOne(query)
    .populate(population)
    .exec() // 👈 Now Promise-based
    .then((doc) => {
      if (!doc) {
        return cb(null, {});
      }
      return Setting.deleteOne(query)
        .exec()
        .then(() => doc);
    })
    .then((doc) => cb(null, doc))
    .catch((err) => cb(err));
};

exports.update = function update(query, updates, cb) {
  const opts = {new: true};

  // updates = mongoUpdate(updates);  // Uncomment if needed

  Setting.findOneAndUpdate(query, updates, opts)
    .populate(population) // Chain populate after findOneAndUpdate
    .exec() // 👈 Promise-based
    .then((doc) => cb(null, doc || {}))
    .catch((err) => cb(err));
};

exports.get = function get(query, cb) {
  Setting.findOne(query)
    .sort({_id: 1})
    .populate(population)
    .exec() // 👈 Promise-based (fixes the error here!)
    .then((doc) => cb(null, doc || {}))
    .catch((err) => cb(err));
};

exports.getCollection = function getCollection(query, opt, cb) {
  Setting.find(query, {}, opt)
    .populate(population)
    .exec() // 👈 Promise-based
    .then((doc) => cb(null, doc))
    .catch((err) => cb(err));
};
