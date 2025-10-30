// Load Module Dependencies
const ServiceDal = require("../dal/service_charge");
const ServiceModl = require("../models/service");
let error_response = [];
exports.validateService = function validateService(req, res, next, id) {
  //Validate the id is mongoid or not
  req.checkParams("id", "Invalid param").isMongoId(id);
  var validationErrors = req.validationErrors();
  if (validationErrors) {
    res.status(404).json({
      error: true,
      message: "Not Found",
      status: 404,
    });
  } else {
    ServiceDal.get(
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
            msg: "Service _id " + id + " not found",
          });
        }
      }
    );
  }
};
exports.showSerivce = async function fetchAll(req, res, next) {
  let page = req.query.page * 1 || 1;
  let limit = req.query.limit * 1 || 20;
  let query = {};
  let queryOpts = {
    page: page,
    limit: limit,
    sort: {_id: -1},
  };
  try {
    ServiceDal.getCollectionByPagination(query, queryOpts, (err, doc) => {
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
exports.createService = async (req, res, next) => {
  try {
    var body = req.body;
    body.created_by = req._user._id;
    var validationErrors = req.validationErrors();
    if (validationErrors) {
      res.status(400);
      res.json(validationErrors);
      return;
    }
    /** service model check overlap */
    await ServiceModl.find()
      .sort({_id: -1})
      .then((data) => {
        if (data.length > 0) {
          const course_vol = data[0].number_of_booking;
          const value = body.number_of_booking;

          if (isInRange(course_vol, value)) {
            error_response.push(
              "Both values in the range are within booking",
              400
            );
            // console.log("Both values in the range are within booking.");
          } else {
            // Check if all elements are outside (both out of range)
            const allOutside = value.every(
              (element) => element < course_vol[0] || element > course_vol[1]
            );
            if (allOutside) {
              error_response.push();
              // console.log("Both values in the range are outside booking.");
            } else {
              error_response.push(
                "At least one value in the range is outside booking",
                400
              );
              // console.log(
              //   "At least one value in the range is outside booking."
              // );
            }
          }
        } else {
          error_response.push();
        }
      })
      .catch((err) => {
        error_response.push(err, 500);
      });
    ServiceDal.getCollection({name: body.name}, {}, (err, service_doc) => {
      if (err) {
        return next(err);
      }
      body.number_of_booking.length > 2
        ? error_response.push("wrong format", 400)
        : body.number_of_booking[0] >= body.number_of_booking[1]
        ? error_response.push("wrong format", 400)
        : error_response.push();

      if (error_response.length > 0) {
        res.status(error_response[1]).json({msg: error_response[0]});
      } else {
        service_doc.length > 0
          ? ServiceDal.update(
              {_id: service_doc[0]._id},
              body,
              (err, update_doc) => {
                if (err) {
                  return next(err);
                }
                res.status(200).json({
                  msg: "update successful",
                  status: 200,
                });
              }
            )
          : ServiceDal.create(body, (err, create_doc) => {
              if (err) {
                return next(err);
              }
              res.status(201).json({
                msg: "created successfully",
                status: 201,
              });
            });
      }
    });
  } catch (err) {
    res.status(500).json(err);
  }
};
exports.updateService = (req, res, next) => {
  var body = req.body;
  body.updated_at = new Date();
  body.number_of_booking.length > 2
    ? error_response.push("wrong format", 400)
    : body.number_of_booking[0] >= body.number_of_booking[1]
    ? error_response.push("wrong format", 400)
    : error_response.push();
  ServiceDal.update({_id: req.doc._id}, body, (err, update_doc) => {
    if (err) {
      return next(err);
    }
    res.status(200).json({msg: "update successful", status: 200});
  });
};
exports.deleteService = (req, res, next) => {
  ServiceDal.delete({_id: req.doc._id}, (err, remove_doc) => {
    if (err) {
      return next();
    }
    res.status(200).json({
      msg: "removed",
      status: 200,
    });
  });
};

function isInRange(course_vol, value) {
  // Check if all elements in value are within course_vol range
  return value.every(
    (element) => element >= course_vol[0] && element <= course_vol[1]
  );
}
