// Load Module Dependencies
const FacilityDal = require("../dal/faility");
const _ = require("lodash");
const mongoose = require("mongoose");
exports.validateFacility = function validateFacility(req, res, next, id) {
  if (!mongoose.Types.ObjectId.isValid(id)) {
    return res.status(400).json({
      error: true,
      message: "Invalid param: ID must be a valid MongoDB ObjectId",
      status: 400,
    });
  }
  FacilityDal.get(
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
          msg: "Facility _id " + id + " not found",
        });
      }
    }
  );
};

exports.fetchAll = async (req, res, next) => {
  let query = {};

  try {
    FacilityDal.getCollection(query, {}, (err, doc) => {
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

exports.lists = (req, res, next) => {
  FacilityDal.getCollection({}, {}, (err, doc) => {
    if (err) {
      return next(err);
    }
    res.status(200).json(Document);
  });
};

exports.fetchOne = function fetchOne(req, res) {
  res.json(req.doc);
};

exports.create = (req, res, next) => {
  var body = req.body;
  req.checkBody("name").notEmpty().withMessage("Name is required");
  var validationErrors = req.validationErrors();
  if (validationErrors) {
    res.status(400);
    res.json(validationErrors);
    return;
  }
  let query = {
    name: req.body.name,
  };

  FacilityDal.get(query, (err, cat) => {
    if (err) {
      return next(err);
    }
    Object.keys(cat).length === 0
      ? FacilityDal.create(body, (err, ddoc) => {
          if (err) {
            return next(err);
          }
          res.status(200).json({
            msg: "success",
            status: 200,
          });
        })
      : res.status(400).json({msg: "already exists", status: 400});
  });
};

exports.update = function update(req, res, next) {
  var body = req.body;
  body.updated_at = new Date();
  FacilityDal.update(
    {
      _id: req.doc._id,
    },
    body,
    function updateFacility(err, doc) {
      if (err) {
        return next(err);
      }
      res.json(doc);
    }
  );
};

exports.deleteFacility = (req, res, next) => {
  FacilityDal.delete(
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
