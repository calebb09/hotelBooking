// Load Module Dependencies
const async = require("async");
const hbs = require("nodemailer-express-handlebars");
const path = require("path");
const jwtDecode = require("jwt-decode");
const NotifiDal = require("../dal/notification");
const Device = require("../models/device");
const Client = require("../models/client");
const User = require("../models/user");
const config = require("../../config");
const now = Date.now;

exports.validateNotifi = function validateNotifi(req, res, next, id) {
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
    NotifiDal.get(
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
            msg: "Notifi _id " + id + " not found",
          });
        }
      }
    );
  }
};
exports.fetchAll = function fetchAll(req, res, next) {
  let page = parseInt(req.query.page);
  let query = {};
  let limit = 30;
  let queryOpts = {
    page: page,
    limit: limit,
    sort: {_id: -1},
  };
  try {
    NotifiDal.getCollectionByPagination(
      query,
      queryOpts,
      (err, notification_doc) => {
        if (err) {
          return next(err);
        }
        res.status(200).json({
          data: notification_doc.docs.docs,
          limit: limit,
          skip: page,
          total: notification_doc.docs.total,
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
exports.showall = async function broadCastedMessages(req, res, next) {
  let client = await Client.findOne({uuid: req.user.uuid});
  let query = {
    $or: [
      {
        "user_information.user": client.id,
      },
      {
        broadcast: true,
      },
    ],
  };
  let page = parseInt(req.query.page);
  let limit = 30;
  let queryOpts = {
    page: page,
    limit: limit,
    sort: {_id: -1},
  };
  let list_message = [];
  NotifiDal.getCollectionByPagination(query, queryOpts, (err, doc) => {
    if (err) {
      return next(err);
    }
    async.eachSeries(
      doc.docs.docs,
      async function (data, callback) {
        if (data.broadCastType === null) {
          list_message.push(data);
        } else {
          if (
            data.broadCastType === "user" ||
            data.broadCastType === client.country ||
            data.broadCastType === client.city
          ) {
            list_message.push(data);
          }
        }
      },
      function done(err) {
        if (err) {
          return next(err);
        } else {
          res.json({
            data: list_message,
            limit: limit,
            skip: page,
            total: doc.docs.total,
          });
        }
      }
    );
  });
};
exports.viewAll = async (req, res, next) => {
  let user = await User.findOne({_id: req._user.userid});
  let query = {
    $or: [
      {
        "user_information.client": req._user.assigned_accommodation,
      },
      {
        broadcast: true,
      },
    ],
  };
  let page = parseInt(req.query.page);
  let limit = 30;
  let queryOpts = {
    page: page,
    limit: limit,
    sort: {_id: -1},
  };
  let list_message = [];
  NotifiDal.getCollectionByPagination(query, queryOpts, (err, doc) => {
    if (err) {
      return next(err);
    }

    async.eachSeries(
      doc.docs.docs,
      async function (data, callback) {
        if (data.broadCastType === null) {
          list_message.push(data);
        } else {
          if (
            data.broadCastType === "user" ||
            data.broadCastType === user.country ||
            data.broadCastType === user.city
          ) {
            list_message.push(data);
          }
        }
      },
      function done(err) {
        if (err) {
          return next(err);
        } else {
          res.json({
            data: list_message,
            limit: limit,
            skip: page,
            total: doc.docs.total,
          });
        }
      }
    );
  });
};
exports.count_it = async (req, res, next) => {
  if (req.headers.authorization !== undefined) {
    // res.status(401).json({msg: "unauthorized"});
    let token = req.headers.authorization.split(" ")[1];
    let decoded = jwtDecode(token);
    let query = {};
    if (decoded.role === "client") {
      let client = await Client.findOne({uuid: decoded.user_id});
      query = {
        $and: [
          {
            "user_information.user": client.id,
          },
          {
            is_read: false,
          },
        ],
      };
    } else if (decoded.role === "owner" || decoded.role === "receptionist") {
      query = {
        $and: [
          {
            "user_information.client": decoded.assigned_accommodation,
          },
          {
            is_read: false,
          },
        ],
      };
    }
    NotifiDal.getCollection(query, {}, (err, doc) => {
      if (err) {
        return next(err);
      }
      res.status(200).json({unread: doc.length});
    });
  }
};
exports.fetchOne = function fetchOne(req, res, next) {
  if (req.doc.is_read === false) {
    NotifiDal.update(
      {
        $and: [
          {
            _id: req.doc._id,
          },
          {
            broadcast: {$ne: true},
          },
        ],
      },
      {
        is_read: true,
        updated_at: new Date(),
      },
      (err, idoc) => {
        if (err) {
          return next(err);
        }
      }
    );
  }
  res.json(req.doc);
};
exports.fetchOneAdmin = (req, res, next) => {
  try {
    res.status(200).json(req.doc);
  } catch (e) {
    res.status(404).json({
      msg: "message does not exist",
      status: 400,
    });
  }
};
exports.create = async function create(req, res, next) {
  var body = req.body;
  req.checkBody("title").notEmpty().withMessage("Please enter the title");
  req.checkBody("message").notEmpty().withMessage("Please enter the message");
  //training_date
  var validationErrors = req.validationErrors();
  if (validationErrors) {
    res.status(400);
    res.json(validationErrors);
    return;
  }
  body.created_at = now;
  body.created_by = req._user._id;
  let mailOptions = {};
  let create_not = {};
  let list_emails = [];
  if (req.body.broadcast === false) {
    create_not = {
      title: req.body.title,
      message: req.body.message,
      uuid: req.body.uuid,
    };
    req.checkBody("uuid").notEmpty().withMessage("user id (uuid) is expected");
    let profile_info = await Client.findOne({uuid: req.body.uuid});
    if (Object.keys(profile_info).length > 0) {
      if (profile_info.email === null) {
        mailOptions = {};
      } else {
        mailOptions = {
          from: `"Gojo Booking <'${config.GOJO_EMAIL_USER}'>`, //sender email address
          to: profile_info.email, //receiver email address
          subject: req.body.title,
          template: "email",
          context: {
            title: req.body.title,
            body: req.body.message,
            copyRightYear: new Date().getFullYear(),
            email: profile_info.email,
          },
        };
      }
    }
  } else {
    if (req.body.broadCastType !== undefined) {
      if (req.body.broadCastType === "freelancer") {
        let freelancers_email = await Client.find({
          $and: [
            {role: "Client"},
            {
              "email_notification.news_update": true,
            },
          ],
        });
        freelancers_email.forEach((element) => {
          list_emails.push(element.email);
        });
      } else if (req.body.broadCastType === "client") {
        let clients_email = await Client.find({
          $and: [
            {role: "employer"},
            {
              "email_notification.news_update": true,
            },
          ],
        });
        clients_email.forEach((element) => {
          list_emails.push(element.email);
        });
      } else if (req.body.broadCastType === "country") {
        let country_email = await Client.find({
          $and: [
            {
              country: req.body.country,
            },
            {
              "email_notification.news_update": true,
            },
          ],
        });
        country_email.forEach((element) => {
          list_emails.push(element.email);
        });
      } else if (req.body.broadCastType === "city") {
        let city_email = await Client.find({
          city: req.body.city,
          "email_notification.news_update": true,
        });
        city_email.forEach((element) => {
          list_emails.push(element.email);
        });
      } else if (req.body.broadCastType === "badge") {
        let badge_email = await Client.find({badge: req.body.badge}).populate([
          {path: "profile", model: Profile},
        ]);
        badge_email.forEach((element) => {
          if (element.Client.email_notification.news_update === true) {
            list_emails.push(element.Client.email);
          }
        });
      }
      create_not = {
        title: req.body.title,
        message: req.body.message,
        broadcast: true,
        broadCastType: req.body.broadcastType,
      };
    } else {
      let all_emails = await Client.find();
      all_emails.forEach((element) => {
        list_emails.push(element.email);
      });
      create_not = {
        title: req.body.title,
        message: req.body.message,
        broadcast: true,
      };
    }
    mailOptions = {
      from: '"CDIWORK" <' + config.CDI_EMAIL_USER + ">", //sender email address
      // to: "caleb.bogale@outlook.com",
      bcc: list_emails, //receiver email address
      subject: req.body.title,
      template: "email",
      context: {
        title: req.body.title,
        body: req.body.message,
        copyRightYear: new Date().getFullYear(),
      },
    };
  }
  NotifiDal.create(create_not, (err, save) => {
    if (err) {
      // if there exist a query error like Client but said Clients
      return next(err);
    }
    /** send email */
    const handlebarOptions = {
      viewEngine: {
        extName: ".handlebars",
        partialsDir: path.resolve(__dirname, "../../templates/views"),
        defaultLayout: false,
      },
      viewPath: path.resolve(__dirname, "../../templates/views"),
    };
    // use a template file with nodemailer

    config.MAILER.use("compile", hbs(handlebarOptions));
    config.MAILER.sendMail(mailOptions, async function (error, info) {
      if (error) {
        console.log(error);
      } else {
        console.log("Email sent: " + info.response);
        /** email sending is over */
        /** push notification on mobile device */
        let ddoc = await Device.find();
        if (ddoc.length > 0) {
          let message = {
            notification: {
              title: req.body.title,
              body: req.body.message,
            },
          };
          let registrationToken = [];
          ddoc.forEach(async (data) => {
            if (save.broadcast === false) {
              if (data.uuid === save.uuid) {
                registrationToken.push(data.fcm_token);
              }
            } else {
              if (save.broadCastType === undefined) {
                registrationToken.push(data.fcm_token);
              } else {
                if (save.broadCastType === "freelancer") {
                  const Client_info = await Client.find();
                  if (Client_info.length > 0) {
                    for (let i = 0; i < Client_info.length; i++) {
                      if (Client_info[i].uuid == data.uuid) {
                        registrationToken.push(data.fcm_token);
                      }
                    }
                  }
                }
              }
            }
            if (registrationToken.length > 0) {
              for (let n = 0; n < registrationToken.length; n++) {
                fireadmin
                  .messaging()
                  .sendToDevice(
                    registrationToken[n],
                    message,
                    config.FIREBASE_NOTE_OPTS
                  )
                  .then((response) => {
                    //res.status(200).send("Notification sent successfully")
                    console.log("Notification sent successfully");
                  })
                  .catch((error) => {
                    console.log(error);
                  });
              }
            }
          });
        }
      }
    });

    res.status(200).json({
      msg: "successfully saved",
      status: 200,
    });
  });
};
exports.readAll = async (req, res, next) => {
  if (req.headers.authorization === undefined) {
    res.status(401).json({msg: "unauthorized"});
  } else {
    let token = req.headers.authorization.split(" ")[1];
    let decoded = jwtDecode(token);
    let query = {};
    if (decoded.role === "owner" || decoded.role === "receptionist") {
      query = {
        "user_information.client": decoded.assigned_accommodation,
      };
    }
    if (decoded.role === "client") {
      let client = await Client.findOne({uuid: decoded.user_id});
      query = {"user_information.user": client.id};
    }
    NotifiDal.update(
      query,
      {
        is_read: true,
        updated_at: new Date(),
      },
      function updateNotifi(err, doc) {
        if (err) {
          return next(err);
        }
        res.status(200).json({
          status: 200,
          msg: "successful",
        });
      }
    );
  }
};
exports.markRead = async function MarkAsRead(req, res, next) {
  if (req.headers.authorization === undefined) {
    res.status(401).json({msg: "unauthorized"});
  } else {
    let token = req.headers.authorization.split(" ")[1];
    let decoded = jwtDecode(token);
    let query = {};
    if (decoded.role === "owner" || decoded.role === "receptionist") {
      query = {
        $and: [
          {
            _id: req.doc._id,
          },
          {
            "user_information.client": decoded.assigned_accommodation,
          },
          {
            is_read: false,
          },
        ],
      };
    }
    if (decoded.role === "client") {
      let client = await Client.findOne({uuid: decoded.user_id});
      query = {
        $and: [
          {
            _id: req.doc._id,
          },
          {
            "user_information.user": client.id,
          },
          {
            is_read: false,
          },
        ],
      };
    }
    NotifiDal.update(
      query,
      {is_read: true, updated_at: new Date()},
      (err, doc) => {
        if (err) {
          return next(err);
        }
        if (doc.modifiedCount > 0) {
          res.status(200).json({
            msg: "marked as read",
            status: 200,
          });
        } else {
          res.status(400).json({
            msg: "An error occurred, and the message was not marked as read",
            status: 400,
          });
        }
      }
    );
  }
};
exports.markUnread = async function MarkAsUnread(req, res, next) {
  if (req.headers.authorization === undefined) {
    let token = req.headers.authorization.split(" ")[1];
    let decoded = jwtDecode(token);
    let query = {};
    if (decoded.role === "owner" || decoded.role === "receptionist") {
      query = {
        $and: [
          {
            _id: req.doc._id,
          },
          {
            "user_information.client": decoded.assigned_accommodation,
          },
          {
            is_read: true,
          },
        ],
      };
    }
    if (decoded.role === "client") {
      let client = await Client.findOne({uuid: decoded.user_id});
      query = {
        $and: [
          {
            _id: req.doc._id,
          },
          {
            "user_information.user": client.id,
          },
          {
            is_read: true,
          },
        ],
      };
    }
    NotifiDal.update(
      query,
      {is_read: false, updated_at: new Date()},
      (err, doc) => {
        if (err) {
          return next(err);
        }
        if (doc.modifiedCount == 1) {
          res.status(200).json({
            msg: "marked as unread",
            status: 200,
          });
        } else {
          res.status(400).json({
            msg: "error occured did not mark as unread",
            status: 400,
          });
        }
      }
    );
  }
};
exports.update = function update(req, res, next) {
  var body = req.body;
  body.updated_at = new Date();
  NotifiDal.update(
    {
      _id: req.doc._id,
    },
    body,
    function updateNotifi(err, doc) {
      if (err) {
        return next(err);
      }
      res.json(doc);
    }
  );
};
exports.deleteNotifi = (req, res, next) => {
  NotifiDal.delete(
    {
      _id: req.doc._id,
    },
    (err, doc) => {
      if (err) {
        return next(err);
      }
      res.status(200).json({
        status: 200,
        msg: "successful",
      });
    }
  );
};
function removeNotification(req, res, next) {
  var current = new Date();
  var oneDay = 24 * 60 * 60 * 1000;
  var options = {};
  NotifiDal.getCollection({}, options, function getAll(err, cats) {
    if (err) {
      return next(err);
    }
    async.eachSeries(
      cats,
      function (data, callback) {
        var diffDays = Math.round(
          Math.abs((current - data.created_at) / oneDay)
        );
        if (diffDays > 30) {
          NotifiDal.delete(
            {
              _id: data._id,
            },
            (err, doc) => {
              if (err) {
                return next(err);
              }
            }
          );
        }
        callback(null);
      },
      function done(err) {
        if (err) {
          return next(err);
        } else {
          //res.json(cats);
        }
      }
    );
  });
}
setInterval(removeNotification, 21600000); //6hrs
