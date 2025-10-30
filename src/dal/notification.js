const _ = require("lodash");
var debug = require("debug")("api:dal-user");
const NotiticationRequest = require("../models/notification");
const population = [];
exports.create = function create(NotificationData, cb) {
  const NotificationModel = new NotiticationRequest(NotificationData);
  NotificationModel.save(function saveNotiticationRequest(err, data) {
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
  NotiticationRequest.findOne(query)
    .populate(population)
    .exec(function deleteNotiticationRequest(err, doc) {
      if (err) {
        return cb(err);
      }

      if (!doc) {
        return cb(null, {});
      }

      NotiticationRequest.deleteOne(query, function (err) {
        if (err) {
          return cb(err);
        }

        cb(null, doc);
      });
    });
};

exports.update = function update(query, updates, cb) {
  const opts = {
    new: true,
  };

  // updates = mongoUpdate(updates);

  NotiticationRequest.updateMany(query, updates, opts)
    .populate(population)
    .exec(function updateNotiticationRequest(err, doc) {
      if (err) {
        return cb(err);
      }

      cb(null, doc || {});
    });
};

exports.get = function get(query, cb) {
  NotiticationRequest.findOne(query)
    .populate(population)
    .exec(function (err, doc) {
      if (err) {
        return cb(err);
      }

      cb(null, doc || {});
    });
};

exports.getCollection = function getCollection(query, opt, cb) {
  NotiticationRequest.find(query, {}, opt)
    .populate(population)
    .sort({_id: -1})
    .exec(function getNotiticationRequestsCollection(err, doc) {
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
  debug("fetching a collection of Notification");
  var opts = {
    // columns:  returnFields,
    sort: qs.sort,
    populate: population,
    page: qs.page,
    limit: qs.limit,
  };

  NotiticationRequest.paginate(
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
