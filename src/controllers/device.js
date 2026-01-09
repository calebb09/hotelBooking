// Load Module Dependencies
const DeviceDal = require("../dal/device");
const _ = require("lodash");
const mongoose = require("mongoose");
exports.validateDevice = function validateDevice(req, res, next, id) {
  if (!mongoose.Types.ObjectId.isValid(id)) {
    return res.status(400).json({
      error: true,
      message: "Invalid param: ID must be a valid MongoDB ObjectId",
      status: 400,
    });
  }
  DeviceDal.get(
    {
      _id: id,
    },
    function (err, doc) {
      if (doc._id) {
        req.doc = doc;
        next();
      } else {
        res.status(404).json({
          error: true,
          status: 404,
          msg: "Device _id " + id + " not found",
        });
      }
    }
  );
};

exports.fetchAll = async (req, res, next) => {
  let query = {};
  let page = req.query.page * 1 || 1;
  let limit = req.query.limit * 1 || 20;
  let queryOpts = {
    page: page,
    limit: limit,
    sort: {created_at: -1},
  };
  try {
    DeviceDal.getCollectionByPagination(query, queryOpts, (err, doc) => {
      if (err) {
        return next(err);
      }
      res.status(200).json({
        data: doc.docs,
        limit: limit,
        skip: page,
        total: doc.total,
      });
    });
  } catch (e) {
    res.status(500).json({
      msg: "Error Occured" + e,
      status: 500,
    });
  }
};

exports.fetchOne = function fetchOne(req, res) {
  res.json(req.doc);
};

exports.create = (req, res, next) => {
  req.checkBody("fcm_token").notEmpty().withMessage("FCM token is required");
  req.checkBody("device_id").notEmpty().withMessage("Device ID is required");
  var validationErrors = req.validationErrors();
  if (validationErrors) {
    res.status(400);
    res.json(validationErrors);
    return;
  }
  let query = {
    $and: [
      {
        uuid: req.user.uuid,
      },
      {
        device_id: req.body.device_id,
      },
    ],
  };

  DeviceDal.get(query, (err, cat) => {
    if (err) {
      return next(err);
    }
    Object.keys(cat).length === 0
      ? DeviceDal.create(
          {
            fcm_token: req.body.fcm_token,
            device_id: req.body.device_id,
            uuid: req.user.uuid,
          },
          (err, ddoc) => {
            if (err) {
              return next(err);
            }
            res.status(200).json({
              msg: "success",
              status: 200,
            });
          }
        )
      : DeviceDal.update(
          {_id: cat._id},
          {
            device_id: req.body.device_id,
            fcm_token: req.body.fcm_token,
            updated_at: new Date(),
          },
          (err, ddoc) => {
            if (err) {
              return next(err);
            }
            res.status(200).json({
              msg: "success",
              status: 200,
            });
          }
        );
  });
};

exports.update = function update(req, res, next) {
  var body = req.body;
  body.updated_at = new Date();
  DeviceDal.update(
    {
      _id: req.doc._id,
    },
    body,
    function updateDevice(err, doc) {
      if (err) {
        return next(err);
      }
      res.json(doc);
    }
  );
};

exports.deleteToken = (req, res, next) => {
  var query_del = {
    $and: [
      {
        uuid: req.user.uuid,
      },
      {
        fcm_token: req.body.fcm_token,
      },
    ],
  };
  DeviceDal.getCollection(query_del, {}, (err, cat) => {
    if (err) {
      return next(err);
    }
    cat.length === 0
      ? res.status(400).json({
          error: true,
          msg: "Unknown device id",
          status: 400,
        })
      : DeviceDal.delete(query_del, (err, doc) => {
          if (err) {
            return next(err);
          }
          res.status(200).json({
            msg: "Device is removed",
            status: 200,
          });
        });
  });
};

exports.removeDeviceID = (req, res, next) => {
  var query_del = {
    $and: [
      {
        uuid: req.user.uuid,
      },
      {
        device_id: req.body.device_id,
      },
    ],
  };
  DeviceDal.getCollection(query_del, {}, (err, cat) => {
    if (err) {
      return next(err);
    }
    cat.length === 0
      ? res.status(400).json({
          error: true,
          msg: "Unknown device id",
          status: 400,
        })
      : DeviceDal.delete(query_del, (err, doc) => {
          if (err) {
            return next(err);
          }
          res.status(200).json({
            msg: "Device is removed",
            status: 200,
          });
        });
  });
};

exports.deleteDevice = (req, res, next) => {
  DeviceDal.delete(
    {
      _id: req.doc._id,
    },
    (err, doc) => {
      if (err) {
        return next(err);
      }
      res.json(doc);
    }
  );
};
