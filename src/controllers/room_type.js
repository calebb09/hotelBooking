// Load Module Dependencies
const _ = require("lodash"),
  RoomTypeDal = require("../dal/room_type"),
  subRoomTypeDal = require("../dal/subRoomType"),
  RoomDal = require("../dal/rooms");

exports.validateCategory = function validateCategory(req, res, next, id) {
  req.checkParams("id", "Invalid param").isMongoId(id);
  var validationErrors = req.validationErrors();
  if (validationErrors) {
    res.status(404).json({
      error: true,
      message: "Not Found",
      status: 404,
    });
  } else {
    RoomTypeDal.get(
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
            msg: "Catgeory _id " + id + " not found",
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
  };
  try {
    RoomTypeDal.getCollectionByPagination(query, queryOpts, (err, doc) => {
      if (err) {
        return next(err);
      }
      res.status(200).json({
        data: doc.docs.docs,
        limit: limit,
        skip: page,
        total: doc.docs.total,
      });
    });
  } catch (err) {
    res.status(500).json({
      msg: "error " + err,
      status: 500,
    });
  }
};
exports.myRoomTypes = (req, res, next) => {
  RoomTypeDal.getCollection(
    {accommodation: req._user.assigned_accommodation},
    {},
    (err, document) => {
      if (err) {
        return next(err);
      }
      res.status(200).json(document);
    }
  );
};
exports.fetchRooms = function fetchEmployee(req, res, next) {
  let query = {roomType: req.doc._id};
  RoomDal.getCollection(query, queryOpts, (err, doc) => {
    if (err) return next(err);
    res.status(200).json(doc);
  });
};
exports.fetchOne = function fetchOne(req, res, next) {
  res.json(req.doc);
};
exports.create = function create(req, res, next) {
  var body = req.body;
  req
    .checkBody("name")
    .notEmpty()
    .withMessage("Category name should not be empty");
  var validationErrors = req.validationErrors();
  if (validationErrors) {
    res.status(400);
    res.json(validationErrors);
    return;
  }
  body.created_by = req._user._id;

  RoomTypeDal.get(
    {
      $and: [
        {
          name: body.name,
        },
      ],
    },
    (err, cat) => {
      if (err) {
        return next(err);
      }
      if (cat._id) {
        res.status(400);
        res.json({
          error: true,
          msg: "RoomType already exists",
          status: 400,
        });
        return;
      }
      RoomTypeDal.create(body, (err, doc) => {
        if (err) {
          return next(err);
        }
        res.status(200).json(doc);
      });
    }
  );
};
exports.update = function update(req, res, next) {
  var body = req.body;
  RoomTypeDal.update(
    {
      _id: req.doc._id,
    },
    body,
    function updateCategory(err, doc) {
      if (err) {
        return next(err);
      }
      res.json(doc);
    }
  );
};
exports.deleteCategory = (req, res, next) => {
  RoomTypeDal.delete(
    {
      _id: req.doc._id,
    },
    (err, doc) => {
      if (err) {
        return next(err);
      }
      subRoomTypeDal.delete(
        {
          roomType: req.doc._id,
        },
        (err, subcat) => {
          if (err) {
            return next(err);
          }
        }
      );
      res.json(doc);
    }
  );
};
