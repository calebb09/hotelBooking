// Load Module Dependencies
const async = require("async");

const AccommodationDal = require("../dal/accommodation");
const RoomDal = require("../dal/rooms");
const subRoomType = require("../models/subRoomType");

const BookDal = require("../dal/booking");
const RatingDal = require("../dal/rate");
const mongoose = require("mongoose");
exports.validateRoom = function validateRoom(req, res, next, id) {
  if (!mongoose.Types.ObjectId.isValid(id)) {
    return res.status(400).json({
      error: true,
      message: "Invalid param: ID must be a valid MongoDB ObjectId",
      status: 400,
    });
  }
  RoomDal.get(
    {
      _id: id,
    },
    function (err, doc) {
      if (err) {
        return next(err);
      }
      if (doc._id) {
        req.doc = doc;
        next();
      } else {
        res.status(404).json({
          error: true,
          status: 404,
          msg: "Room _id " + id + " not found",
        });
      }
    }
  );
};
exports.fetchAll = async function fetchAll(req, res, next) {
  let page = req.query.page * 1 || 1;
  let limit = req.query.limit * 1 || 20;
  let query = {};
  let queryOpts = {
    page: page,
    limit: limit,
    sort: {_id: -1},
  };
  try {
    RoomDal.getCollectionByPagination(query, queryOpts, (err, doc) => {
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
exports.viewAll = async (req, res, next) => {
  let page = req.query.page * 1 || 1;
  let limit = req.query.limit * 1 || 20;
  let query = {accommodation: req._user.assigned_accommodation};
  let queryOpts = {
    page: page,
    limit: limit,
    sort: {_id: -1},
  };

  try {
    const showRoomType = await subRoomType.find(query);
    // Map to array of ObjectIds
    const subRoomTypeIds = showRoomType.map((rt) => rt._id);
    RoomDal.getCollectionByPagination(
      {subRoomType: {$in: subRoomTypeIds}},
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
exports.fetchOne = function fetchOne(req, res, next) {
  res.json(req.doc);
};
exports.create = (req, res, next) => {
  try {
    var body = req.body;
    body.created_by = req._user._id;
    var validationErrors = req.validationErrors();
    if (validationErrors) {
      res.status(400);
      res.json(validationErrors);
      return;
    }

    RoomDal.getCollection(
      {
        $and: [
          {
            room_number: body.room_number,
          },
          {
            accommodation: req._user.assigned_accommodation,
          },
        ],
      },
      {},
      (err, room_doc) => {
        if (err) {
          return next(err);
        }
        room_doc.length > 0
          ? res.status(400).json({
              msg: "data already exists",
              status: 400,
            })
          : AccommodationDal.get(
              {
                $and: [
                  {_id: req._user.assigned_accommodation},
                  {is_verified: true},
                ],
              },
              (err, hotel_document) => {
                if (err) {
                  return next(err);
                }
                hotel_document === null
                  ? res.status(400).json({
                      msg: "your accommodation is not verified by GojoBooking",
                    })
                  : Object.keys(hotel_document).length === 0
                  ? res.status(400).json({
                      msg: "Your accommodation is not found or verified",
                    })
                  : RoomDal.create(body, (err, room_document) => {
                      if (err) {
                        return next(err);
                      }
                      AccommodationDal.update(
                        {_id: req._user.assigned_accommodation},
                        {$push: {room: room_document.id}},
                        async (err, updateAccommodation) => {
                          if (err) {
                            return next(err);
                          }
                          // pushit to subroomtype
                          const updatesubRoomType =
                            await subRoomType.findOneAndUpdate(
                              body.subRoomType,
                              {
                                $push: {rooms: room_document._id},
                              },
                              {
                                new: true,
                              }
                            );
                          if (updatesubRoomType) {
                            res.status(200).json({
                              msg: "created successfully",
                              status: 200,
                            });
                            return;
                          } else {
                            res.status(400).json({
                              msg: "Room was not pushed to subRoomType",
                              status: 400,
                            });
                            return;
                          }
                        }
                      );
                    });
              }
            );
      }
    );
  } catch (err) {
    res.status(500).json(err);
  }
};
exports.filterbyCategory = (req, res, next) => {
  let query = {
    roomType: req.body.roomType,
    accommodation: req.params.accommodationId,
  };
  let page = req.query.page * 1 || 1;
  let limit = req.query.limit * 1 || 20;
  let queryOpts = {
    page: page,
    limit: limit,
    sort: {_id: -1},
  };
  try {
    RoomDal.getCollectionByPagination(query, queryOpts, (err, doc) => {
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
// exports.uploadPicture = (req, res, next) => {
//   console.log(req.files);
//   if (!req.files[0]) {
//     res.status(400).json({
//       msg: "file not passed",
//       status: 400,
//     });
//   }
//   if (req.files.length === 0) {
//     res.status(400).json({
//       msg: "file not passed",
//       status: 400,
//     });
//   } else {
//     async.eachSeries(
//       req.files,
//       function (data, callback) {
//         AccommodationDal.update(
//           {_id: req.doc._id},
//           {$push: {picture: data.filename}},
//           (err, image_doc) => {
//             if (err) return next(err);
//           }
//         );
//         callback(null);
//       },
//       function done(err) {
//         if (err) {
//           return next(err);
//         } else {
//           res.status(200).json({msg: "successfully updated", status: 200});
//         }
//       }
//     );
//   }
// };

exports.upload_picture = (req, res, next) => {
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
        RoomDal.update(
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
};

exports.update = (req, res, next) => {
  var body = req.body;

  RoomDal.update({_id: req.doc._id}, body, (err, room_doc) => {
    if (err) {
      return next(err);
    }
    room_doc
      ? res.status(200).json({
          msg: "updated successfully",
          status: 200,
        })
      : res.status(400).json({msg: "error occured"});
  });
};

exports.deletePicture = (req, res, next) => {
  removePicture(req.doc, req.query.picture, (err) => {
    if (err) {
      res.status(400).json({msg: "error removing picture", err: err});
      // console.error("Error removing picture:", err);
    } else {
      RoomDal.update(
        {_id: req.doc.id},
        {$pull: {"subRoomType.picture": req.query.picture}},
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

exports.deleteRoom = (req, res, next) => {
  try {
    RoomDal.delete({_id: req.doc._id}, async (err, doc) => {
      if (err) {
        return next(err);
      }

      // remove from subroomType
      const updatesubRoomType = await subRoomType.findOneAndUpdate(
        {_id: doc.subRoomType},
        {$pull: {rooms: doc._id}},
        {new: true}
      );
      AccommodationDal.update(
        {_id: updatesubRoomType.accommodation},
        {$pull: {room: doc.id}},
        (err, room_doc) => {
          if (err) {
            return next(err);
          }
        }
      );
      BookDal.delete({room: req.doc._id}, (err, book_doc) => {
        if (err) {
          return next(err);
        }
      });
      RatingDal.delete({room: req.doc._id}, (err, rate_doc) => {
        if (err) {
          return next(err);
        }
      });
      res.status(200).json({
        msg: "operation successful",
        status: 200,
      });
    });
  } catch (err) {
    res.status(500).json(err);
  }
};

/** check if booked room calendar is over */
function turn2Available(req, res, next) {
  RoomDal.getCollection(
    {status: {$ne: "available"}},
    {},
    (err, room_document) => {
      if (err) {
        return next(err);
      }
      async.eachSeries(
        room_document,
        function (data, callback) {
          BookDal.get(
            {
              $and: [
                {
                  room: {$in: [data.id]},
                },
                {
                  status: {$ne: "completed"},
                },
              ],
            },
            (err, book_document) => {
              if (err) {
                return next(err);
              }
              Date.parse(new Date(book_document.checkOut)) <
              Date.parse(new Date())
                ? RoomDal.update(
                    {_id: data.id},
                    {status: "available", updated_at: new Date()},
                    (err, update_room) => {
                      if (err) {
                        return next(err);
                      }
                    }
                  )
                : console.log("no update");
              callback(null);
            }
          );
        },
        function done(err) {
          if (err) {
            return next(err);
          } else {
            //res.json(cats);
          }
        }
      );
    }
  );
}
setInterval(turn2Available, 21600000); //6hrs
