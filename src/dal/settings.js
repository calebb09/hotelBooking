var _ = require("lodash");
var Setting = require("../models/settings");
var User = require("../models/user");
var Internal = require("../models/internal");
// var returnFields = category.whitelist;
var population = [
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
  var SettingModel = new Setting(SettingData);
  SettingModel.save(function saveSetting(err, data) {
    if (err) {
      return cb(err);
    }
    exports.get(
      {
        _id: data._id,
      },
      function (err, doc) {
        if (err) {
          return cb(err);
        }
        cb(null, doc);
      }
    );
  });
};

exports.delete = function deleteItem(query, cb) {
  Setting.findOne(query)
    .populate(population)
    .exec(function deleteSetting(err, doc) {
      if (err) {
        return cb(err);
      }
      if (!doc) {
        return cb(null, {});
      }
      Setting.deleteOne(query, function (err) {
        if (err) {
          return cb(err);
        }
        cb(null, doc);
      });
    });
};

exports.update = function update(query, updates, cb) {
  var opts = {
    new: true,
  };

  // updates = mongoUpdate(updates);

  Setting.findOneAndUpdate(query, updates, opts)
    .populate(population)
    .exec(function updateCategory(err, doc) {
      if (err) {
        return cb(err);
      }

      cb(null, doc || {});
    });
};

exports.get = function get(query, cb) {
  Setting.findOne(query)
    .sort({
      _id: 1,
    })
    .populate(population)
    .exec(function (err, doc) {
      if (err) {
        return cb(err);
      }

      cb(null, doc || {});
    });
};

exports.getCollection = function getCollection(query, opt, cb) {
  Setting.find(query, {}, opt)
    .populate(population)
    .exec(function getcoursesCollection(err, doc) {
      if (err) {
        return cb(err);
      }

      return cb(null, doc);
    });
};
