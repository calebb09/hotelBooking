// Load Module Dependencies
const accommodationTDal = require("../dal/accommodationType"),
  AccommodationDal = require("../dal/accommodation"),
  _ = require("lodash");

exports.validateAccommodationType = function validateAccommodationType(
  req,
  res,
  next,
  id
) {
  var validationErrors = req.validationErrors();
  if (validationErrors) {
    res.status(404).json({
      error: true,
      message: "Not Found",
      status: 404,
    });
  } else {
    accommodationTDal.get(
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
            msg: "AccommodationType _id " + id + " not found",
          });
        }
      }
    );
  }
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
    accommodationTDal.getCollectionByPagination(
      query,
      queryOpts,
      (err, doc) => {
        if (err) {
          return next(err);
        }
        res.status(200).json({
          data: doc.docs,
          limit: limit,
          skip: page,
          total: doc.total,
        });
      }
    );
  } catch (e) {
    res.status(500).json({
      msg: "Error Occured" + e,
      status: 500,
    });
  }
};
exports.showHotels = (req, res, next) => {
  AccommodationDal.getCollection(
    {lodging_type: req.doc._id},
    {},
    (err, doc) => {
      if (err) {
        return next(err);
      }
      res.status(200).json(_.shuffle(doc));
    }
  );
};
exports.fetchOne = function fetchOne(req, res) {
  res.json(req.doc);
};
exports.create = (req, res, next) => {
  req.checkBody("name").notEmpty().withMessage("Name is required");
  req.checkBody("icon").notEmpty().withMessage("Icon is required");
  var validationErrors = req.validationErrors();
  if (validationErrors) {
    res.status(400);
    res.json(validationErrors);
    return;
  }
  let body = req.body;
  let query = {
    name: body.name,
  };

  accommodationTDal.get(query, (err, cat) => {
    if (err) {
      return next(err);
    }
    Object.keys(cat).length === 0
      ? accommodationTDal.create(body, (err, ddoc) => {
          if (err) {
            return next(err);
          }
          res.status(200).json({
            msg: "success",
            status: 200,
          });
        })
      : res.status(400).json({
          msg: "already exists",
          status: 400,
        });
  });
};
exports.update = function update(req, res, next) {
  var body = req.body;
  body.updated_at = new Date();
  accommodationTDal.update(
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
exports.deleteAccommodationType = (req, res, next) => {
  accommodationTDal.delete(
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
