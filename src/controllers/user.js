// Load Module Dependencies
const events = require("events");
const debug = require("debug")("api-user");
const bcrypt = require("bcrypt");
const crypto = require("crypto");
const config = require("../../config");
const jwt = require("jsonwebtoken");
const UserModel = require("../models/user");
const UserDal = require("../dal/user");
const InternalDal = require("../dal/internal");
const ClientDal = require("../dal/client");
const sendMessage = require("../functions/sendMessage");
const mongoose = require("mongoose");
exports.validateUser = function validateUser(req, res, next, id) {
  if (!mongoose.Types.ObjectId.isValid(id)) {
    return res.status(400).json({
      error: true,
      message: "Invalid param: ID must be a valid MongoDB ObjectId",
      status: 400,
    });
  }
  UserDal.get(
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
          msg: "User _id " + id + " not found",
        });
      }
    }
  );
};
exports.getUserInfo = function (req, res, next) {
  UserDal.get({_id: req._user._id}, (err, docs) => {
    if (err) return next(err);
    res.json(docs);
  });
};
exports.allUsers = function allUsers(req, res, next) {
  let query = {
    $and: [
      {
        role: "owner",
      },
      {
        role: {
          $ne: "super_admin",
        },
      },
    ],
  };
  let page = req.query.page * 1 || 1;
  let limit = req.query.limit * 1 || 20;
  let queryOpts = {
    page: page,
    limit: limit,
    sort: {created_at: -1},
  };
  UserDal.getCollectionByPagination(
    query,
    queryOpts,
    function chekuser(err, doc) {
      if (err) {
        return next(err);
      }

      res.status(200).json({
        data: doc.docs.docs,
        limit: limit,
        skip: page,
        total: doc.docs.total,
      });
    }
  );
};
exports.profile = (req, res, next) => {
  UserDal.get({_id: req._user._id}, (err, doc) => {
    if (err) {
      return next(err);
    }
    if (doc) {
      res.status(200).json(doc);
    } else {
      res.status(400).json({msg: "unknown user detail"});
    }
  });
};
exports.myReceptionists = (req, res, next) => {
  UserDal.getCollection(
    {
      $and: [
        {
          role: "receptionist",
        },
        {
          assigned_accommodation: req._user.assigned_accommodation,
        },
      ],
    },
    {},
    (err, users_doc) => {
      if (err) {
        return next(err);
      }
      res.status(200).json(users_doc);
    }
  );
};
exports.firebase_token = function generateToken(req, res, next) {
  var body = req.body;
  var FirebaseTokenGenerator = require("firebase-token-generator");
  var tokenGenerator = new FirebaseTokenGenerator(
    "MIIEvgIBADANBgkqhkiG9w0BAQEFAASCBKgwggSkAgEAAoIBAQCsMUXevHPxBCkT\nc8TSwVLVCoDCFrF/cGyH+IzDvGzyQOflGj7i41QlkVnoE/OCZ4jdJpYjLWW/WfN0\nCXt8Cmb8OBaKhNIWKuZ8suXJZ5jiV3Ui78iyKnEgjcsn/t2sI7gC0fLfApmdXgZv\nZ/LvLrf6q3zvBCttlVFsrWvrAG9Tg9SvonELcskWJAXZa2z7OPd0g1ZHTRjGHF0r\nJtSxSjUqevJ69hUXQxmRNdn28onrUwSFnqfxZ0Lij/qyCS8EunK0bjFDCR499U4G\n3+EKymmNKhZubcMayrJOrEPPaAAn1LxNfhKdrhX1Y6oWUH40LwelOEtB9qSL4CGe\nmaT+CW+9AgMBAAECggEACtTOSWiPHiKYnIZho68w8RaIIGKnN3YLLFIPCrNEIsiV\n6FRKZIu6Vo2fez4hXmXPAbg5uqHnqU3KHFW0sd9WozgPpOweFJ0ODVspzKLgBqF2\njGQgZU1O+zuoGI6LLkGQmNl7fpnY2gGuLnJPtp9jR8ON6DFZ3lAFmewzt7R54ZB0\noi7kgSMG+6dk37zpMmz59V4DMdWI7Zyl7h/aYzqaFcCRFo+qpAnwdTzmtJgwOhvF\nPfXnH6ljoF+9YjlkU9oz8KbLu5tk7AmnOJNca6fUeVUKbqZeW6TV4wJ+9PklEz8j\nmpV3bScocz1f0qbdC32f+ZlUsUpqAUnnIcpO9me88QKBgQDtjcWXZCcU5clTRHQi\nyZ9j87Z/ciZafBuNiXIPOHIJpmR30VKzipSzNgjIgwgoIq6BjjetQb7Qs18Efe9U\n77pwL1E0fWfhUB11P37QNVk4Cozz5+xKeR3c/Bj4NihSWaLFWydzauwx683b3juB\nYij8TYmWPX1Cnve3byd7sws2zQKBgQC5kDY9uu1zOLgvyCTmmKdSqQbjVaGckKrr\nb3CQjuVDisELmvON8sHrgylN6CwivqO7+ZUP65FTvpJf6iThtdSmwvB4H4bIJRTG\ntY0wDE6Z4lwm6t7zf/LBY0w6zCYDZ+9fSSt3njHS6iiAWZAPzlgRzBxA0l+6N+Nt\nBlWoTzK8sQKBgQCk6DENumni+O18j12rtJmgclPzPxPe5p7d71ctt7p6dnbyMm6d\n0osNqWoJf+TOr9zCdS6zaJuFF6/TV3UoWk7rh/1wWcoeQFZiyVRIR3CLFc/plcuT\nm2aevKa80CPHnw/+vxuw5L3YneBHTIu0cqcPFuh3UnI9KEvAnDolhhI31QKBgAyo\nD2sKcuOm/LkVl566zr7OlI+w6YL6Qw4n3a+eb3i54AzglrgZ1KwxmAGeUlRUWGqb\nzVT2pkTl/KnaGIXklwqAxVIMJG9GSDJ9c5HRZRMN42csIeTN10rlcO+ZuQYGcsc3\nAGX6Pj+6hOSsNy08z7j3CP5K2wiigzqOcg02yakhAoGBAJHpyvawfam+iRFkbXKO\nKQEK1zzP/hIOgkIgc4oX4lS5bz+re7t1DkOdEsJF1bPS5dFtaiZYooUB9/57Z+Eb\nIFNWTRqjQ1zijPlyIQKl7+SzO1HoTb/lPXKwtxkFD+Ek14aS8NhCDsWDdneRv1fI\nt6JQfGHLUleKpPJWiBOsZlzj"
  );
  var token = tokenGenerator.createToken(body);
  res.status(200).json({
    token: token,
    status: 200,
  });
};
exports.getUser = function getUser(req, res, next) {
  res.json(req.doc);
};
exports.resetPass = function resetPass(req, res, next) {
  UserDal.get(
    {
      _id: req.doc._id,
    },
    function getByPaginationCb(err, doc) {
      if (err) {
        return next(err);
      }
      switch (Object.keys(doc).length) {
        case 0:
          res.status(404).json({
            error: true,
            msg: "There is no user id",
            status: 404,
          });
          break;
        default:
          const resetPassword = "123456789";
          bcrypt.genSalt(config.SALT_LENGTH, function genSalt(err, salt) {
            if (err) {
              return next(err);
            }
            bcrypt.hash(resetPassword, salt, function hashPasswd(err, hash) {
              if (err) {
                return next(err);
              }
              UserDal.update(
                {
                  _id: req.doc._id,
                },
                {
                  password: hash,
                  updated_at: new Date(),
                  logged_in_before: true,
                },
                function updatepass(err, user) {
                  if (err) {
                    return next(err);
                  }
                  res.status(200).json({
                    msg: "password reset successful",
                    status: 200,
                  });
                }
              );
            });
          });
      }
    }
  );
};
exports.createAdmin = function createAdmin(req, res, next) {
  var body = req.body;
  req
    .checkBody("username", "Username  should not be empty!")
    .isEmail()
    .withMessage("Username should be email")
    .notEmpty()
    .withMessage("Username should not be empty");
  req
    .checkBody("phone", "Phone  should not be empty!")
    .notEmpty()
    .withMessage("Phone number is requied");
  req
    .checkBody("password")
    .notEmpty()
    .withMessage("password should not be empty")
    .len(6, 20)
    .withMessage("6 to 20 characters required");
  req
    .checkBody("role", "Role Type is Invalid!")
    .notEmpty()
    .withMessage("Role Type should not be Empty")
    .isIn(["sales", "owner", "receptionist", "call_center"])
    .withMessage("Unknown User Type Detected!");
  if (body.role === "owner") {
    req
      .checkBody("assigned_accommodation", "Assign Accommodation!")
      .notEmpty()
      .withMessage("Accommodation should not be Empty");
  }
  var validationErrors = req.validationErrors();
  if (validationErrors) {
    res.status(400);
    res.json(validationErrors);
    return;
  }
  var username = body.username;
  // Query DB for a user with the given ID
  UserDal.get(
    {
      username: username,
    },
    function cb(err, user) {
      if (err) {
        return next(err);
      }
      // If user find return it
      if (user._id) {
        res.status(400);
        res.json({
          error: true,
          msg: "User already exists",
          status: 400,
        });
      } //automated crawler blocking
      else {
        UserDal.create(body, function callback(err, users) {
          if (err) {
            return next(err);
          } else {
            body.user = users._id;
            body.created_by = req._user._id;
            InternalDal.create(body, function createInternal(err, doc) {
              if (err) {
                return next(err);
              }
              UserDal.update(
                {
                  _id: users._id,
                },
                {
                  internal: doc._id,
                  updated_at: new Date(),
                },
                function updateUser(err, udoc) {
                  if (err) {
                    return next(err);
                  }
                  InternalDal.update(
                    {_id: doc.id},
                    {user: udoc.id},
                    (err, internal_document) => {
                      if (err) {
                        return next(err);
                      }
                      res.status(200).json({
                        msg: "You Have successfully created Admin",
                        status: 200,
                      });
                    }
                  );
                }
              );
            });
          }
        });
      }
    }
  );
};
exports.register = function register(req, res, next) {
  var body = req.body;
  console.log(body.email);
  req
    .checkBody("email")
    .notEmpty()
    .withMessage("Email should not be Empty")
    .isEmail()
    .withMessage("Should be valid email");
  req.checkBody("phone").notEmpty().withMessage("Phone number is required");
  crypto.randomBytes(16, async function genToken(err, buff) {
    if (err) {
      return next(err);
    }
    var password = config.GOJO_DEFAULT;
    var reset_token = buff.toString("hex");
    var token_expires = Date.now() + 21600000; //6hr
    var reset_link_address = "https://gojobooking.com/auth/verify-owner";
    if (!req.files) {
      res.status(400).json({msg: "must upload business licence"});
    } else {
      let checkEmail = await UserModel.find({
        $or: [{username: body.email}, {phone: body.phone}],
      });
      checkEmail.length === 0
        ? bcrypt.genSalt(config.SALT_LENGTH, function genSalt(err, salt) {
            if (err) {
              return next(err);
            }
            bcrypt.hash(password, salt, function hashPasswd(err, hash) {
              if (err) {
                return next(err);
              }
              body.username = body.email;
              body.account_status = "pending";
              body.role = "owner";
              body.reset_password_token = reset_token;
              body.reset_password_expires = token_expires;
              body.password = hash;
              UserDal.create(body, function updateUser(err, usr) {
                if (err) {
                  return next(err);
                }
                InternalDal.create(
                  {
                    user: usr.id,
                    first_name: body.first_name,
                    last_name: body.last_name,
                    created_by: usr.id,
                    licence: "uploads/" + req.files[0].filename,
                  },
                  (err, internal_doc) => {
                    if (err) {
                      return next(err);
                    }

                    UserDal.update(
                      {_id: usr.id},
                      {internal: internal_doc.id},
                      (err, internal_document) => {
                        if (err) {
                          return next(err);
                        }
                      }
                    );
                    let message = {
                      notification: {
                        title: "Registered Successfully on GojoBooking",
                        body:
                          "Dear " +
                          body.first_name +
                          "\n\n. Congratulations on your successful registration at GojoBooking website. Please click the following link to activate your account \n" +
                          reset_link_address +
                          "?email=" +
                          body.email +
                          "&token=" +
                          reset_token +
                          "\n\nPlease keep in mind that the Gojo team will review your property. We will send you an email once the review is over!",
                      },
                    };
                    sendMessage(message, null, null, "to", body.email);
                    res
                      .status(200)
                      .json({msg: "successful", data: usr, status: 200});
                  }
                );
                /** send message */
              });
            });
          })
        : res.status(400).json({msg: "user already exists"});
    }
  });
};
exports.signup = function signup(req, res, next) {
  var workflow = new events.EventEmitter();
  var body = req.body;
  workflow.on("validateUser", function validateUser() {
    req
      .checkBody("username", "Username  should not be empty!")
      .isEmail()
      .withMessage("Username should be email")
      .notEmpty();

    req
      .checkBody("password")
      .notEmpty()
      .withMessage("password should not be empty")
      .len(6, 20)
      .withMessage("6 to 20 characters required");
    req
      .checkBody("user_type", "User Type is Invalid!")
      .notEmpty()
      .withMessage("User Type should not be Empty")
      .isIn(["super_admin"])
      .withMessage("Invalid User type");
    var validationErrors = req.validationErrors();
    if (validationErrors) {
      res.status(400);
      res.json(validationErrors);
    } else {
      workflow.emit("checkUserExist");
    }
  });
  /**
   * Check for user exist or not
   */
  workflow.on("checkUserExist", function checkUserExist() {
    debug("checkUserExist");
    // Query DB for a user with the given ID
    UserDal.get(
      {
        role: "super_admin",
      },
      function cb(err, user) {
        if (err) {
          return next(err);
        }
        // If user find return it
        if (user._id) {
          res.status(400);
          res.json({
            error: true,
            msg: "User already exists",
            status: 400,
          });
        } //automated crawler blocking
        else {
          workflow.emit("createUser");
        }
      }
    );
  });
  workflow.on("createUser", function createUser() {
    debug("Creating user");
    // Create User
    UserDal.create(
      {
        password: body.password,
        username: body.username,
        role: body.user_type,
      },
      function callback(err, user) {
        if (err) {
          return next(err);
        }
        workflow.emit("createUserType", user);
      }
    );
  });
  workflow.on("createUserType", function respond(user) {
    if (body.user_type === "super_admin") {
      body.user = user._id;
      body.role = body.role;
      InternalDal.create(body, function createInternal(err, doc) {
        if (err) {
          return next(err);
        }
        UserDal.update(
          {
            _id: user._id,
          },
          {
            internal: doc._id,
            realm: "internal",
            account_status: "active",
          },
          function updateUser(err, udoc) {
            if (err) {
              return next(err);
            }
            workflow.emit("respond", udoc, doc);
          }
        );
      });
    }
  });
  workflow.on("respond", function respond(user, doc) {
    res.status(201);
    res.json(user);
  });
  workflow.emit("validateUser");
};
exports.checkPhone = function checkPhone(req, res, next) {
  let query = {
    phone: req.body.phone,
  };
  ClientDal.get(query, (err, prDOC) => {
    if (err) {
      return next(err);
    }
    if (prDOC) {
      if (prDOC._id) {
        res.status(200).json({
          status: 200,
          exists: true,
          user_type: "client",
          data: emDOC,
        });
      } else {
        res.status(400).json({
          status: 400,
          exists: false,
          user_type: "unknown",
          data: null,
        });
      }
    }
  });
};
exports.create_reception = (req, res, next) => {
  var body = req.body;
  body.role = "receptionist";
  body.assigned_accommodation = req._user.assigned_accommodation;
  UserDal.getCollection({username: body.username}, {}, (err, doc) => {
    if (err) {
      return next(err);
    }
    doc.length > 0
      ? res.status(400).json({
          msg: "user exists",
          status: 400,
        })
      : UserDal.create(body, (err, user_doc) => {
          if (err) {
            return next(err);
          }
          InternalDal.create(body, (err, internal_doc) => {
            if (err) {
              return next(err);
            }
            UserDal.update(
              {_id: user_doc.id},
              {internal: internal_doc.id},
              (err, users_doc) => {
                if (err) {
                  return next(err);
                }
                InternalDal.update(
                  {_id: internal_doc.id},
                  {user: users_doc.id},
                  (err, internal_doc) => {
                    if (err) {
                      return next(err);
                    }
                    res.status(200).json({
                      msg: "successfully created",
                      status: 200,
                    });
                  }
                );
              }
            );
          });
        });
  });
};
exports.forgotPassword = function forgotPassword(req, res, next) {
  var body = req.body;
  var reset_link_address = "https://gojo.com";

  req
    .checkBody("username")
    .notEmpty()
    .withMessage("Email should not be Empty")
    .isEmail()
    .withMessage("Should be valid email");
  UserDal.get(
    {
      username: body.username,
    },
    function getUserByEmail(err, usr) {
      if (err) {
        return next(err);
      }
      if (!usr._id) {
        res.status(404);
        res.json({
          error: true,
          msg: "Email is not registered",
          status: 404,
        });
        return;
      } else {
        crypto.randomBytes(16, function genToken(err, buff) {
          if (err) {
            return next(err);
          }
          var reset_token = buff.toString("hex");
          var token_expires = Date.now() + 3600000; //1hr
          UserDal.update(
            {
              _id: usr._id,
            },
            {
              reset_password_token: reset_token,
              reset_password_expires: token_expires,
              updated_at: new Date(),
            },
            function updateUser(err, usr) {
              if (err) {
                return next(err);
              }
              /** send message */
              let message = {
                notification: {
                  title: "Reset Request for forgotten password",
                  body:
                    "password recovery" +
                    "please click on (or copy and paste) the link below to reset your password" +
                    reset_link_address +
                    "?email=" +
                    body.username +
                    "&token=" +
                    reset_token +
                    "you recieved this email because you requested to reset your forgotten password" +
                    "If you have not sent this you can just ignore this and continue with your now password! Thank you!",
                },
              };
              sendMessage(message, null, null, "to", body.username);
              res.status(200).json({msg: "successful", data: usr, status: 200});
            }
          );
        });
      }
    }
  );
};
exports.changeRole = function changeRole(req, res, next) {
  console.log(req._user._id);
  var body = req.body;
  body.updated_at = new Date();
  var logger = req._user._id;
  UserDal.update(
    {
      _id: logger,
    },
    body,
    function update(err, doc) {
      if (err) {
        return next(err);
      }
      res.status(200);
      res.json(doc);
    }
  );
};
exports.activateAccount = function activateAccount(req, res, next) {
  req
    .checkBody("email", "email  should not be empty!")
    .isEmail()
    .withMessage("must be a valid email address")
    .notEmpty()
    .withMessage("Email should not be empty");
  req
    .checkBody("account_status", "Account status is Invalid!")
    .notEmpty()
    .withMessage("Account Status should not be Empty")
    .isIn(["active", "rejected"])
    .withMessage("Unknown string passed");
  if (req.body.account_status === "rejected") {
    req
      .checkBody("reason", "reason should not be empty")
      .notEmpty()
      .withMessage("reason Status should not be Empty");
  }
  var validationErrors = req.validationErrors();
  if (validationErrors) {
    res.status(400);
    res.json(validationErrors);
    return;
  }
  UserDal.get(
    {
      username: req.body.email,
    },
    function getUser(err, usr) {
      if (err) {
        return next(err);
      }
      if (!usr._id) {
        res.json({
          error: true,
          msg: "User does not exist!!",
          status: 404,
        });
        return;
      } else {
        UserDal.update(
          {
            _id: usr._id,
          },
          {
            account_status: req.body.account_status,
            updated_at: new Date(),
          },
          function verifyAccount(err, user) {
            if (err) {
              return next(err);
            } else {
              let msg_title = "";
              let body_message = "";
              if (req.body.account_status === "active") {
                msg_title = "Account Activated";
                body_message =
                  "Dear " +
                  user.internal.first_name +
                  "\n\n. Gojo reviewed and approved your account information. You can now login to your Gojo Account and list your property \n";
              } else {
                msg_title = "Account Rejected";
                body_message =
                  "Dear " +
                  user.internal.first_name +
                  "\n\n. Gojo has reviewed and rejected your account! Reason of rejection is because " +
                  req.body.reason +
                  " \n";
              }
              let message = {
                notification: {
                  title: msg_title,
                  body: body_message,
                },
              };
              sendMessage(message, null, null, "to", user.username);
              res.json({
                error: false,
                msg: "Account " + req.body.account_status,
                status: 200,
              });
            }
          }
        );
      }
    }
  );
};
exports.passwordChange = function passwordChange(req, res, next) {
  var body = req.body;
  req
    .checkBody("new_password")
    .notEmpty()
    .withMessage("Password should not be Empty")
    .len(6, 20)
    .withMessage("6 to 20 characters required")
    .matches(/^(?=.*[A-Z])(?=.*\d)(?=.*[!@#$%^&*])/)
    .withMessage(
      "Password must contain at least one uppercase letter, one number, and one special character (!@#$%^&*)"
    );
  req
    .checkBody("confirm_password")
    .notEmpty()
    .withMessage("Confirm Password should not be Empty")
    .len(6, 20)
    .withMessage("6 to 20 characters required");

  UserDal.getCollection(
    {
      // username: req.query.email,
      $and: [
        {username: req.query.email},
        {reset_password_token: req.query.token},
      ],
    },
    {},
    (err, user_doc) => {
      if (err) {
        return next(err);
      }
      if (user_doc.length > 0) {
        if (body.new_password === body.confirm_password) {
          var thisDay = user_doc[0].reset_password_expires;
          // Create a Date object from thisDay string
          var thisDayDate = new Date(thisDay);
          // Get today's date without time (set hours to 0)
          var today = new Date();
          today.setHours(0, 0, 0, 0);

          // Check if thisDay is greater than today
          if (thisDayDate > today) {
            bcrypt.genSalt(config.SALT_LENGTH, function genSalt(err, salt) {
              if (err) {
                return next(err);
              }
              bcrypt.hash(
                body.new_password,
                salt,
                function hashPasswd(err, hash) {
                  if (err) {
                    return next(err);
                  }
                  UserDal.update(
                    {
                      _id: user_doc[0]._id,
                    },
                    {
                      password: hash,
                      account_status: "active",
                      updated_at: new Date(),
                      logged_in_before: true,
                      reset_password_token: null,
                      password_changed: true,
                    },
                    function updatepass(err, user) {
                      if (err) {
                        return next(err);
                      } else {
                        let claims = {
                          userDetail: user,
                          userid: user._id,
                          email: user.email,
                          username: user.username,
                          phone: user.phone,
                          role: user.role,
                          assigned_accommodation: user.assigned_accommodation,
                          iat: Math.floor(Date.now() / 1000),
                          exp: Date.now() + 3600 * 24 * 7 * 4,
                        };
                        let token = jwt.sign(
                          claims,
                          "this.IsAn/.ExampleS3cr3t",
                          {
                            algorithm: "HS256",
                          }
                        );
                        res.status(200).json({
                          msg: "password successfully changed",
                          token: token,
                          status: 200,
                        });
                      }
                    }
                  ); // end of update
                }
              ); // end of hash
            }); // end of gensalt
          } else {
            res.status(400).json({msg: "password reset expired", status: 400});
          }
        } else {
          res.status(400).json({ms: "password does not match"});
        }
      } else {
        res.status(400).json({msg: "request does not exist", status: 400});
      }
    }
  );
};
exports.updateUser = function updateUser(req, res, next) {
  var body = req.body;
  UserDal.get(
    {
      username: body.username,
    },
    function chekuser(err, doc) {
      if (err) return next(err);
      if (doc._id) {
        res.status(409);
        res.json({
          error: true,
          msg: "Username already exists",
          status: 409,
        });
        return;
      } else {
        body.updated_at = new Date();
        UserDal.update(
          {
            _id: req.doc._id,
          },
          body,
          function update(err, doc) {
            if (err) {
              return next(err);
            }
            res.json(doc);
          }
        );
      }
    }
  );
};
exports.updateUserPass = function updateUserPass(req, res, next) {
  var body = req.body;
  var userId = req.doc._id;
  bcrypt.genSalt(config.SALT_LENGTH, function genSalt(err, salt) {
    if (err) {
      return next(err);
    }
    bcrypt.hash(body.password, salt, function hashPasswd(err, hash) {
      if (err) {
        return next(err);
      }
      UserDal.update(
        {
          _id: userId,
        },
        {
          password: hash,
          updated_at: new Date(),
          logged_in_before: true,
        },
        function updatepass(err, user) {
          if (err) {
            return next(err);
          }
        }
      ); // end of update
    }); // end of hash
  }); // end of gensalt
};
exports.removeReceptionist = (req, res, next) => {
  try {
    console.log(req._user.assigned_accommodation);
    req._user.role === "owner"
      ? UserDal.delete(
          {
            $and: [
              {
                _id: req.doc._id,
              },
              {
                assigned_accommodation: req._user.assigned_accommodation,
              },
            ],
          },
          (err, remove_document) => {
            if (err) {
              return next(err);
            }
            InternalDal.delete(
              {_id: remove_document.internal.id},
              (err, remove_internal_model) => {
                if (err) {
                  return next(err);
                }
              }
            );
            remove_document
              ? res.status(200).json({msg: "removed successfully"})
              : res.status(400).json({msg: "not removed"});
          }
        )
      : res.status(401).json({msg: "unauthorized role"});
  } catch (err) {
    res.status(500).json(err);
  }
};
exports.removeUser = function removeUser(req, res, next) {
  UserDal.delete(
    {
      _id: req.doc._id,
    },
    (err, doc) => {
      if (err) {
        return next(err);
      }
      if (doc.internal) {
        InternalDal.delete(
          {
            _id: doc.internal._id,
          },
          (err, idoc) => {
            if (err) {
              return next(err);
            }
          }
        );
      }
      res.status(200).json(doc);
    }
  );
};
