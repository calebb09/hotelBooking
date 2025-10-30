// Load Module Dependencies
const SettingsDal = require("../dal/settings");
const _ = require("lodash");

exports.validateSetting = function validateSetting(req, res, next, id) {
  req.checkParams("id", "Invalid param").isMongoId(id);
  var validationErrors = req.validationErrors();
  if (validationErrors) {
    res.status(404).json({
      error: true,
      message: "Not Found",
      status: 404,
    });
  } else {
    SettingsDal.get(
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
            msg: "Settings _id " + id + " not found",
          });
        }
      }
    );
  }
};

exports.fetch = async (req, res, next) => {
  let query = {};
  try {
    SettingsDal.get(query, (err, doc) => {
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

exports.createSetting = (req, res, next) => {
  var validationErrors = req.validationErrors();
  if (validationErrors) {
    res.status(400);
    res.json(validationErrors);
    return;
  }
  var body = req.body;
  body.updated_at = new Date();
  body.created_by = req._user._id;
  SettingsDal.getCollection({}, {}, (err, cat) => {
    if (err) {
      return next(err);
    }
    cat.length === 0
      ? SettingsDal.create(body, (err, ddoc) => {
          if (err) {
            return next(err);
          }
          res.status(200).json({
            msg: "success",
            status: 200,
          });
        })
      : SettingsDal.update({_id: cat[0]._id}, body, (err, ddoc) => {
          if (err) {
            return next(err);
          }

          res.status(200).json({
            msg: "update successful",
            status: 200,
          });
        });
  });
};

exports.updateSetting = function update(req, res, next) {
  var body = req.body;
  body.updated_at = new Date();
  SettingsDal.update(
    {
      _id: req.doc._id,
    },
    body,
    function updateSettings(err, doc) {
      if (err) {
        return next(err);
      }
      res.json(doc);
    }
  );
};

exports.deleteSetting = (req, res, next) => {
  SettingsDal.delete(
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
