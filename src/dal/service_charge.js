"user strict";

const _ = require("lodash");
const debug = require("debug")("api:dal-BankAccount");
const ServiceCharge = require("../models/service");
const User = require("../models/user");
const Internal = require("../models/internal");
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

exports.create = function create(ServiceChargeData, cb) {
  var ServiceChargeModel = new ServiceCharge(ServiceChargeData);
  ServiceChargeModel.save(function saveServiceCharge(err, data) {
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
  ServiceCharge.findOne(query)
    .populate(population)
    .exec(function deleteServiceCharge(err, doc) {
      if (err) {
        return cb(err);
      }
      if (!doc) {
        return cb(null, {});
      }
      ServiceCharge.deleteOne(query, function (err) {
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
  ServiceCharge.findOneAndUpdate(query, updates, opts)
    .populate(population)
    .exec(function updateServiceCharge(err, doc) {
      if (err) {
        return cb(err);
      }
      cb(null, doc || {});
    });
};

exports.get = function get(query, cb) {
  ServiceCharge.findOne(query)
    .populate(population)
    .exec(function (err, doc) {
      if (err) {
        return cb(err);
      }
      cb(null, doc || {});
    });
};

exports.getCollection = function getCollection(query, opt, cb) {
  ServiceCharge.find(query, {}, opt)
    .populate(population)
    .sort({_id: -1})
    .exec(function getServiceChargesCollection(err, doc) {
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
  debug("fetching a collection of ServiceCharges");
  var opts = {
    // columns:  returnFields,
    sort: qs.sort || {},
    populate: population,
    page: qs.page,
    limit: qs.limit,
  };

  ServiceCharge.paginate(
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
