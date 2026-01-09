// Load Module Dependencies
const _ = require("lodash"),
  fs = require("fs"),
  async = require("async"),
  Property = require("../models/accommodation"),
  roomTypeDal = require("../dal/room_type"),
  Config = require("../../config"),
  subRoomTypeDal = require("../dal/subRoomType"),
  SettingsDal = require("../dal/settings"),
  {calculatePriceInfo} = require("../functions/calculation"),
  RoomDal = require("../dal/rooms");
const mongoose = require("mongoose");
exports.validatesubRoomType = function validatesubRoomType(req, res, next, id) {
  if (!mongoose.Types.ObjectId.isValid(id)) {
    return res.status(400).json({
      error: true,
      message: "Invalid param: ID must be a valid MongoDB ObjectId",
      status: 400,
    });
  }
  subRoomTypeDal.get(
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
};
exports.fetchAll = async (req, res, next) => {
  let query = {accommodation: req._user.assigned_accommodation};
  let page = req.query.page * 1 || 1;
  let limit = req.query.limit * 1 || 20;
  let queryOpts = {
    page: page,
    limit: limit,
  };
  try {
    subRoomTypeDal.getCollectionByPagination(query, queryOpts, (err, doc) => {
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
  } catch (err) {
    res.status(500).json({
      msg: "error " + err,
      status: 500,
    });
  }
};
exports.myrooms = (req, res, next) => {
  let query = {accommodation: req._user.assigned_accommodation};

  try {
    subRoomTypeDal.getCollection(query, {}, (err, doc) => {
      if (err) return next(err);
      res.status(200).json(doc);
    });
  } catch (err) {
    res.status(500).json({
      msg: "error " + err,
      status: 500,
    });
  }
};
exports.fetchRooms = function fetchEmployee(req, res, next) {
  let query = {subRoomType: req.doc._id};
  RoomDal.getCollection(query, {}, (err, doc) => {
    if (err) return next(err);
    let availableRoomsCount = doc.filter(
      (item) => item.status === "available"
    ).length;
    res.status(200).json({
      rooms: doc,
      availbleRooms: availableRoomsCount,
    });
  });
};
exports.fetchOne = function fetchOne(req, res, next) {
  res.json(req.doc);
};
exports.create = function create(req, res, next) {
  var body = req.body;
  var create_body = {};
  req
    .checkBody("name")
    .notEmpty()
    .withMessage("subRoomType name should not be empty");
  req
    .checkBody("roomType")
    .notEmpty()
    .withMessage("roomtype should not be empty");
  var validationErrors = req.validationErrors();
  if (validationErrors) {
    res.status(400);
    res.json(validationErrors);
    return;
  }
  if (req._user.role === "owner" || req._user.role === "receptionist") {
    if (!req._user.assigned_accommodation) {
      res.status(403).json({
        error: true,
        msg: "You are not allowed to create subRoomType",
        status: 403,
      });
      return;
    }

    // check roomType exists
    roomTypeDal.get({_id: req.body.roomType}, (err, roomType_doc) => {
      if (err) {
        return next(err);
      }
      if (!roomType_doc) {
        res.status(400).json({
          error: true,
          msg: "roomType not found",
          status: 400,
        });
        return;
      }

      // check settings exists
      SettingsDal.getCollection({}, {}, async (err, GojoSettings) => {
        if (err) {
          return next(err);
        }
        if (!GojoSettings || !GojoSettings.length) {
          res.status(400).json({
            error: true,
            msg: "Gojo Settings not found",
            status: 400,
          });
          return;
        }
        if (GojoSettings[0].commission === undefined || null) {
          res
            .status(403)
            .json({msg: "site setting not yet configured", status: 403});
          return;
        } else {
          const price_info = await calculatePriceInfo(
            body.room_price,
            GojoSettings[0].commission.user,
            body.discount,
            body.is_refundable,
            req._user.assigned_accommodation
          );

          console.log(
            await calculatePriceInfo(
              body.room_price,
              GojoSettings[0].commission.user,
              body.discount,
              body.is_refundable,
              req._user.assigned_accommodation
            )
          );
          /** do math calculation  */

          create_body = Object.assign(body, {
            accommodation: req._user.assigned_accommodation,
            price_info,
          });
          subRoomTypeDal.get(
            {
              $and: [
                {
                  roomType: body.roomType,
                },
                {
                  accommodation: req._user.assigned_accommodation,
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
                  msg: "subRoomType already exists",
                  status: 400,
                });
                return;
              }
              subRoomTypeDal.create(create_body, (err, doc) => {
                if (err) {
                  return next(err);
                }
                return res.status(200).json(doc);
              });
            }
          );
        }
      });
    });
  } else {
    res.status(403).json({
      error: true,
      msg: "You are not allowed to create subRoomType",
      status: 403,
    });
    return;
  }
};
exports.update = async function update(req, res, next) {
  var body = req.body;
  var update_body = {};
  const hotelInfo = await Property.findById(req.doc.accommodation);
  if (!hotelInfo) {
    return res.status(400).json({msg: "hotel not found"});
  }
  SettingsDal.getCollection({}, {}, async (err, GojoSettings) => {
    if (err) {
      return next(err);
    }
    const price_info = await calculatePriceInfo(
      body.room_price,
      GojoSettings[0].commission.user,
      body.discount,
      body.is_refundable ?? false,
      body.has_breakfast ?? false,
      req.doc.accommodation
    );

    body.updated_at = new Date();
    update_body = Object.assign(body, {price_info});
    console.log(update_body);
    subRoomTypeDal.update(
      {
        _id: req.doc._id,
      },
      update_body,
      function updateCategory(err, doc) {
        if (err) {
          return next(err);
        }
        res.json({
          msg: "successful",
          doc,
        });
      }
    );
  });
};
exports.upload_picture = (req, res, next) => {
  try {
    if (!req.files[0]) {
      res.status(400).json({
        msg: "file not passed",
        status: 400,
      });
    }
    if (req.files.length === 0) {
      res.status(400).json({
        msg: "file not passed",
        status: 400,
      });
    } else {
      async.eachSeries(
        req.files,
        function (data, callback) {
          subRoomTypeDal.update(
            {_id: req.doc._id},
            {$push: {picture: data.filename}},
            (err, image_doc) => {
              if (err) return next(err);
            }
          );
          callback(null);
        },
        function done(err) {
          if (err) {
            return next(err);
          } else {
            res.status(200).json({msg: "successfully updated", status: 200});
          }
        }
      );
    }
  } catch (error) {
    res.status(500).json({
      msg: "error ocurred",
      error,
    });
  }
};
exports.deletePicture = (req, res, next) => {
  removePicture(req.doc, req.query.picture, (err) => {
    if (err) {
      res.status(400).json({msg: "error removing picture", err: err});
      // console.error("Error removing picture:", err);
    } else {
      subRoomTypeDal.update(
        {_id: req.doc.id},
        {$pull: {picture: req.query.picture}},
        (err, update_doc) => {
          if (err) {
            return next(err);
          }
          // Using the includes() method
          if (update_doc.picture.includes(req.query.picture)) {
            res.status(400).json({msg: "not removed"});
          } else {
            res.status(200).json({msg: "success"});
          }

          // Using a for loop
          for (let i = 0; i < update_doc.picture.length; i++) {
            if (update_doc.picture[i] === req.query.picture) {
              console.log("The search term exists in the array at index " + i);
              break; // Exit the loop once the search term is found
            }
          }
        }
      );
    }
  });
};
exports.delete = (req, res, next) => {
  subRoomTypeDal.delete(
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
// Function to remove a picture from the accommodation model and the file system
function removePicture(room, picUrl, callback) {
  const pictureIndex = room.picture.indexOf(picUrl);
  if (pictureIndex !== -1) {
    room.picture.splice(pictureIndex, 1);
    // Remove the file from the uploads folder
    fs.unlink(Config.MEDIA.UPLOADES + picUrl, (err) => {
      if (err) {
        console.error("Error removing file:", err);
        callback(err);
      } else {
        console.log("File removed successfully");
        callback(null);
      }
    });
  } else {
    console.log("Picture not found in the room model");
    callback(new Error("Picture not found in the room model"));
  }
}

function calculateRoomRateAverage(req, res, next) {
  subRoomTypeDal.getCollection({}, {}, (err, eedoc) => {
    if (err) {
      return next(err);
    }
    eedoc.forEach(async (item) => {
      if (item.rates.length > 0) {
        var sum_rate = item.rates.reduce((accumulator, object) => {
          return accumulator + object.rate;
        }, 0);
        console.log(sum_rate);
        var average = sum_rate / item.rates.length;
        if (average === 0 || isNaN(average)) {
        } else {
          var rounded = Math.round(average * 10) / 10;
          subRoomTypeDal.update(
            {_id: item.id},
            {rate_average: rounded},
            (err, update_room) => {
              if (err) {
                console.log(err);
              }
            }
          );
        }
      }
    });
  });
}
setInterval(calculateRoomRateAverage, 300000); //every 5 minute
