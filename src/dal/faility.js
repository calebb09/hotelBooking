"use strict";
const _ = require("lodash");
const debug = require("debug")("api:dal-BankAccount");
const Facility = require("../models/facilities");
const population = [];

exports.create = function create(FacilityData, cb) {
  var FacilityModel = new Facility(FacilityData);
  FacilityModel.save(function saveFacility(err, data) {
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
  Facility.findOne(query)
    .populate(population)
    .exec(function deleteFacility(err, doc) {
      if (err) {
        return cb(err);
      }
      if (!doc) {
        return cb(null, {});
      }
      Facility.deleteOne(query, function (err) {
        if (err) {
          return cb(err);
        }
        cb(null, doc);
      });
    });
};

exports.update = function update(query, updates, cb) {
  var now = new Date();
  var opts = {
    new: true,
  };
  Facility.findOneAndUpdate(query, updates, opts)
    .populate(population)
    .exec(function updateFacility(err, doc) {
      if (err) {
        return cb(err);
      }
      cb(null, doc || {});
    });
};

exports.get = function get(query, cb) {
  Facility.findOne(query)
    .populate(population)
    .sort({_id: -1})
    .exec(function (err, doc) {
      if (err) {
        return cb(err);
      }
      cb(null, doc || {});
    });
};

exports.getCollection = function getCollection(query, opt, cb) {
  Facility.find(query, {}, opt)
    .populate(population)
    .sort({_id: -1})
    .exec(function getFacilitysCollection(err, doc) {
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
  debug("fetching a collection of facilities");
  var opts = {
    // columns:  returnFields,
    sort: qs.sort,
    populate: population,
    page: qs.page,
    limit: qs.limit,
  };

  Facility.paginate(query, opts, function (err, docs, page, countDocuments) {
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
