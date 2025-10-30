"user strict";

var debug = require("debug")("api:dal-user");
var _ = require("lodash");
var User = require("../models/user");
const Internal_USER = require("../models/internal");
var returnFields = User.whitelist;
var population = [
  {
    path: "internal",
    model: Internal_USER,
  },
];

exports.create = async function create(userData, cb) {
  var searchQuery = {username: userData.username};
  // Make sure user does not exist
  await User.findOne(searchQuery, function userExists(err, isPresent) {
    if (err) {
      return cb(err);
    }
    if (isPresent) {
      return cb(new Error("User already exists"));
    }
    // Create user if is new.
    var userModel = new User(userData);
    userModel.save(function saveUser(err, data) {
      if (err) {
        return cb(err);
      }
      exports.get({_id: data._id}, function (err, user) {
        if (err) {
          return cb(err);
        }
        cb(null, user);
      });
    });
  });
};

exports.delete = function deleteItem(query, cb) {
  User.findOne(query, returnFields)
    .populate(population)
    .exec(function deleteUser(err, user) {
      if (err) {
        return cb(err);
      }

      if (!user) {
        return cb(null, {});
      }

      user.deleteOne(function (err) {
        if (err) {
          return cb(err);
        }

        cb(null, user);
      });
    });
};

exports.update = function update(query, updates, cb) {
  var opts = {
    new: true,
    safe: true,
    upsert: true,
    select: returnFields,
  };

  // updates = mongoUpdate(updates);

  User.findOneAndUpdate(query, updates, opts)
    .populate(population)
    .exec(function updateUser(err, user) {
      if (err) {
        return cb(err);
      }

      cb(null, user || {});
    });
};

exports.get = function get(query, cb) {
  User.findOne(query)
    .populate(population)
    .exec(function (err, user) {
      if (err) {
        return cb(err);
      }

      cb(null, user || {});
    });
};

exports.getCollection = function getCollection(query, qs, cb) {
  User.find(query, {}, qs)
    .populate(population)
    .exec(function (err, user) {
      if (err) {
        return cb(err);
      }

      cb(null, user || {});
    });
};

exports.getCollectionByPagination = function getCollectionByPagination(
  query,
  qs,
  cb
) {
  debug("fetching a collection of accomoodations");
  var opts = {
    // columns:  returnFields,
    sort: qs.sort,
    populate: population,
    page: qs.page,
    limit: qs.limit,
  };

  User.paginate(query, opts, function (err, docs, page, countDocuments) {
    if (err) {
      return cb(err);
    }
    var data = {
      total_pages: page,
      total_docs_count: countDocuments,
      docs: docs,
    };
    cb(null, data);
  });
};
