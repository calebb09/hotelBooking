// Load Module Dependencies
const CityDal = require("../dal/city"),
  AccommodationDal = require("../dal/accommodation"),
  _ = require("lodash");
const mongoose = require("mongoose");

exports.validateCity = function validateCity(req, res, next, id) {
  if (!mongoose.Types.ObjectId.isValid(id)) {
    return res.status(400).json({
      error: true,
      message: "Invalid param: ID must be a valid MongoDB ObjectId",
      status: 400,
    });
  }

  CityDal.get(
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
          msg: "City _id " + id + " not found",
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
    sort: {name: 1},
  };
  try {
    CityDal.getCollection(query, queryOpts, (err, doc) => {
      if (err) {
        return next(err);
      }
      res.status(200).json(doc);
    });
  } catch (e) {
    res.status(500).json({
      msg: "Error Occured" + e,
      status: 500,
    });
  }
};

exports.trending = (req, res, next) => {
  CityDal.getCollection({is_trending: true}, {}, (err, trending_city) => {
    if (err) {
      return next(err);
    }
    res.status(200).json(_.shuffle(trending_city));
  });
};

exports.hotels = (req, res, next) => {
  let query = {"address.city": req.doc._id};
  let page = req.query.page * 1 || 1;
  let limit = req.query.limit * 1 || 20;
  let queryOpts = {
    page: page,
    limit: limit,
  };
  AccommodationDal.getCollectionByPagination(query, queryOpts, (err, doc) => {
    if (err) {
      return next(err);
    }
    res.status(200).json({
      data: _.shuffle(doc.docs.docs),
      limit: limit,
      skip: page,
      total: doc.docs.total,
    });
  });
};

exports.fetchOne = function fetchOne(req, res) {
  res.json(req.doc);
};

exports.create = (req, res, next) => {
  var body = req.body;
  req.checkBody("name").notEmpty().withMessage("FCM token is required");
  req.checkBody("picture").notEmpty().withMessage("City ID is required");
  var validationErrors = req.validationErrors();
  if (validationErrors) {
    res.status(400);
    res.json(validationErrors);
    return;
  }
  let query = {name: req.body.name};

  CityDal.get(query, (err, cat) => {
    if (err) {
      return next(err);
    }
    Object.keys(cat).length === 0
      ? CityDal.create(body, (err, ddoc) => {
          if (err) {
            return next(err);
          }
          res.status(200).json({
            msg: "success",
            status: 200,
          });
        })
      : CityDal.update(
          {_id: cat._id},
          {
            name: req.body.name,
            pitcure: req.body.picture,
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
  CityDal.update(
    {
      _id: req.doc._id,
    },
    body,
    function updateCity(err, doc) {
      if (err) {
        return next(err);
      }
      res.json(doc);
    }
  );
};

exports.deleteCity = (req, res, next) => {
  CityDal.delete(query_del, (err, doc) => {
    if (err) {
      return next(err);
    }
    res.status(200).json({
      msg: "City is removed",
      status: 200,
    });
  });
};
