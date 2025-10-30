var debug = require("debug")("api:dal-category");
var _ = require("lodash");
var Category = require("../models/room_type");
var User = require("../models/user");
var Internal = require("../models/internal");
// var returnFields = category.whitelist;
var population = [
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
  var categoryModel = new Category(categoryData);

  categoryModel.save(function saveCategory(err, data) {
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

exports.delete = function deleteItem(query, cb) {
  Category.findOne(query)
    .populate(population)
    .exec(function deleteCategory(err, doc) {
      if (err) {
        return cb(err);
      }

      if (!doc) {
        return cb(null, {});
      }

      Category.deleteOne(query, function (err) {
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

  Category.findOneAndUpdate(query, updates, opts)
    .populate(population)
    .exec(function updateCategory(err, doc) {
      if (err) {
        return cb(err);
      }

      cb(null, doc || {});
    });
};

exports.get = function get(query, cb) {
  Category.findOne(query)
    .populate(population)
    .exec(function (err, doc) {
      if (err) {
        return cb(err);
      }

      cb(null, doc || {});
    });
};

exports.getCollection = function getCollection(query, opt, cb) {
  Category.find(query, {}, opt)
    .populate(population)
    .exec(function getcategorysCollection(err, doc) {
      if (err) {
        return cb(err);
      }

      return cb(null, doc);
    });
};

exports.getCollectionByPagination = function getCollectionByPagination(
  query,
  qs,
  cb
) {
  debug("fetching a collection of Helpers");
  var opts = {
    // columns:  returnFields,
    sort: qs.sort || {},
    populate: population,
    page: qs.page,
    limit: qs.limit,
  };

  Category.paginate(query, opts, function (err, docs, page, countDocuments) {
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
