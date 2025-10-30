"use strict";
const _ = require("lodash");
const debug = require("debug")("api:dal-BankAccount");
const Accommodation = require("../models/accommodation");
const AccommodationT = require("../models/accommodation_type");
const Facility = require("../models/facilities");
const City = require("../models/city");
const user = require("../models/user");
const Internal = require("../models/internal");
const population = [
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
  var AccommodationModel = new Accommodation(AccommodationData);
  AccommodationModel.save(function saveAccommodation(err, data) {
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
  Accommodation.findOne(query)
    .populate(population)
    .exec(function deleteAccommodation(err, doc) {
      if (err) {
        return cb(err);
      }
      if (!doc) {
        return cb(null, {});
      }
      Accommodation.deleteOne(query, function (err) {
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
  Accommodation.findOneAndUpdate(query, updates, opts)
    .populate(population)
    .exec(function updateAccommodation(err, doc) {
      if (err) {
        return cb(err);
      }
      cb(null, doc || {});
    });
};

exports.get = function get(query, cb) {
  Accommodation.findOne(query)
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
  Accommodation.find(query, {}, opt)
    .populate(population)
    .sort({_id: -1})
    .exec(function getAccommodationsCollection(err, doc) {
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
  debug("fetching a collection of accomoodations");
  var opts = {
    // columns:  returnFields,
    sort: qs.sort,
    populate: population,
    page: qs.page,
    limit: qs.limit,
  };

  Accommodation.paginate(
    query,
    opts,
    function (err, docs, page, countDocuments) {
      if (err) {
        return cb(err);
      }
      var data = {
        total_pages: page,
        total_docs_count: countDocuments,
        docs: docs,
      };
      cb(null, data);
    }
  );
};
