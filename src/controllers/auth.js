"use strict";
const debug = require("debug")("api:user-controller");
const _ = require("lodash");
const UserModel = require("../models/user");
const ClientDal = require("../dal/client");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const jwtDecode = require("jwt-decode");
const firebase = require("firebase-admin");
const CustomError = require("../lib/custom-error");
/**
 * Login a user
 *
 * @desc login a user using thei email and password.
 * Return profile and user data with an authentication token.
 */
exports.customerslogin = (req, res, next) => {
  let query = {
    phone: req.body.phone ? req.body.phone : undefined,
    email: req.body.email ? req.body.email : undefined,
  };
  if (query.phone === undefined) {
    delete query.phone;
  }
  if (query.email === undefined) {
    delete query.email;
  }
  ClientDal.get(query, function (err, result) {
    if (err) return next(err);
    if (result === null) {
      res.status(400).json({
        msg: "user not found",
        status: 400,
        type: "Unknown",
      });
    } else {
      if (Object.keys(result).length > 0) {
        res.status(200).json({
          status: 200,
          msg: "Successful",
          type: "client",
          user: result,
        });
      } else {
        res.status(400).json({
          msg: "user not found",
          status: 400,
          type: "Unknown",
        });
      }
    }
  });
};
exports.login = async function login(req, res, next) {
  debug("Login User");
  const {username, password} = req.body;

  let userQry = {$and: [{username: username}, {account_status: "active"}]};
  const users = await UserModel.findOne(userQry).populate("internal");

  if (users != null) {
    // match password here
    let has_match = await bcrypt.compare(password, users.password);
    var user = users.toObject();
    delete users.password;
    if (has_match) {
      let claims = {
        userDetail: user,
        userid: users._id,
        email: users.email,
        username: users.username,
        phone: users.phone,
        role: users.role,
        assigned_accommodation: users.assigned_accommodation,
        iat: Math.floor(Date.now() / 1000),
        exp: Date.now() + 3600 * 24 * 7 * 4,
      };
      let token = jwt.sign(claims, "this.IsAn/.ExampleS3cr3t", {
        algorithm: "HS256",
      });
      res.status(200).json({
        token,
        user,
      });
    } else {
      res.status(400).json({
        msg: "Invalid Credentials",
        status: 400,
      });
    }
  } else {
    res.status(400).json({
      msg: "User not found",
      status: 400,
    });
  }
};
/**
 * Log out a user.
 */
exports.logout = function logout(req, res, next) {
  res
    .cookie("jwt", "", {
      maxAge: 1,
    })
    .status(200)
    .json({
      msg: "logged out",
      status: 200,
    });
};
exports.custLogut = async (req, res, next) => {
  try {
    const user = firebase.auth().currentUser;
    if (user) {
      firebase
        .auth()
        .signOut()
        .then(() => {
          // console.log("User successfully logged out"); // Just for the example.
        })
        .catch((error) => console.log("Something went wrong! ", error));
    } else {
      res.status(403).json({
        status: "failure",
        message: "user already logged out.",
      });
    }
  } catch (error) {
    console.log(error);
  }
};
exports.accessControl = function accessControl(roles, action) {
  action = action || "ALLOW";
  return function (req, res, next) {
    if (
      req.headers.authorization &&
      req.headers.authorization.split(" ")[0] === "Bearer"
    ) {
      let token = req.headers.authorization.split(" ")[1];
      let {role} = jwtDecode(token);
      req._user = jwtDecode(token).userDetail;
      let has_access = [...roles].includes(role);
      if (has_access) {
        next();
      } else {
        res.status(401).json({
          name: "Access Denied !!!",
          msg: "You don't have the correct access for this resource",
          status: 401,
        });
      }
    } else {
      res.status(403).json({
        name: "CREDENTIALS_FORMAT_ERROR",
        msg: "Format is Authorization: Bearer [token]",
        status: 403,
      });
    }
  };
};
