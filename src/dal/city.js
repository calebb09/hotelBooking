var _ = require("lodash");
const debug = require("debug")("api:dal-internal");
var City = require("../models/city");
// var returnFields = category.whitelist;
var population = [
  //   {
  //     path: "created_by",
  //     model: Accommodation,
  //   },
];

exports.create = function create(CityData, cb) {
  var CityModel = new City(CityData);
  CityModel.save(function saveCity(err, data) {
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
  City.findOne(query)
    .populate(population)
    .exec(function deleteCity(err, doc) {
      if (err) {
        return cb(err);
      }
      if (!doc) {
        return cb(null, {});
      }
      City.deleteOne(query, function (err) {
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

  City.findOneAndUpdate(query, updates, opts)
    .populate(population)
    .exec(function updateCategory(err, doc) {
      if (err) {
        return cb(err);
      }

      cb(null, doc || {});
    });
};

exports.get = function get(query, cb) {
  City.findOne(query)
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
  City.find(query, {}, opt)
    .populate(population)
    .exec(function getcoursesCollection(err, doc) {
      if (err) {
        return cb(err);
      }

      return cb(null, doc);
    });
};
exports.getCollectionByPagination = function getCollection(query, qs, cb) {
  debug("fetching a collection of Internal");

  var opts = {
    // columns:  returnFields,
    sort: qs.sort,
    populate: population,
    page: qs.page,
    limit: qs.limit,
  };
  City.paginate(query, opts, function (err, docs, page, count) {
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
