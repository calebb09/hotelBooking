"user strict";

const _ = require("lodash");
const debug = require("debug")("api:dal-BankAccount");
const Client = require("../models/client");
const population = [];

exports.create = function create(ClientData, cb) {
  var ClientModel = new Client(ClientData);
  ClientModel.save(function saveClient(err, data) {
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
  Client.findOne(query)
    .populate(population)
    .exec(function deleteClient(err, doc) {
      if (err) {
        return cb(err);
      }
      if (!doc) {
        return cb(null, {});
      }
      Client.deleteOne(query, function (err) {
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
  Client.findOneAndUpdate(query, updates, opts)
    .populate(population)
    .exec(function updateClient(err, doc) {
      if (err) {
        return cb(err);
      }
      cb(null, doc || {});
    });
};

exports.get = function get(query, cb) {
  Client.findOne(query)
    .populate(population)
    .exec(function (err, doc) {
      if (err) {
        return cb(err);
      }
      cb(null, doc || {});
    });
};

exports.getCollection = function getCollection(query, opt, cb) {
  Client.find(query, {}, opt)
    .populate(population)
    .sort({_id: -1})
    .exec(function getClientsCollection(err, doc) {
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
  debug("fetching a collection of Clients");
  var opts = {
    // columns:  returnFields,
    sort: qs.sort,
    populate: population,
    page: qs.page,
    limit: qs.limit,
  };

  Client.paginate(query, opts, function (err, docs, page, countDocuments) {
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
