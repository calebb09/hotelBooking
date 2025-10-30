"use strict";
var mongoose = require("mongoose");
var bcrypt = require("bcryptjs");
var config = require("../../config");
var paginate = require("mongoose-paginate");
var now = new Date();
var Schema = mongoose.Schema;
var validateEmail = function (email) {
  var re = /^\w+([\.-]?\w+)*@\w+([\.-]?\w+)*(\.\w{2,3})+$/;
  return re.test(email);
};
var UserSchema = new Schema(
  {
    internal: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Internal",
    },
    username: {
      type: String,
      trim: true,
      lowercase: true,
      unique: true,
      validate: [validateEmail, "Please fill a valid email address"],
      match: [
        /^\w+([\.-]?\w+)*@\w+([\.-]?\w+)*(\.\w{2,3})+$/,
        "Please fill a valid email address",
      ],
    },
    password: {type: String},
    phone: {type: String},
    assigned_accommodation: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "accommodation",
      default: null,
    },
    is_registered: {
      type: Boolean,
      default: false,
    },
    last_login: {type: Date},
    role: {
      type: String,
      enum: ["super_admin", "sales", "owner", "receptionist", "call_center"],
    },
    account_status: {
      type: String,
      enum: ["active", "pending", "deactivate"],
      default: "active",
    },
    created_at: {type: Date, defaut: Date.now},
    updated_at: {type: Date},
    reset_password_token: {type: String},
    reset_password_expires: {type: Date},
    password_changed: {type: Boolean},
  },
  {versionKey: false}
);
UserSchema.plugin(paginate);
UserSchema.pre("save", function preSaveHook(next) {
  let model = this;
  bcrypt.genSalt(config.SALT_LENGTH, function genSalt(err, salt) {
    if (err) {
      return next(err);
    }
    bcrypt.hash(model.password, salt, function hashPasswd(err, hash) {
      if (err) {
        return next(err);
      }

      model.password = hash;
      model.date_created = now;
      model.last_modified = now;
      next();
    });
  });
});
UserSchema.methods.checkPassword = function checkPassword(password, cb) {
  bcrypt.compare(password, this.password, function done(err, res) {
    if (err) {
      return cb(err);
    }
    cb(null, res);
    console.log(res);
  });
};
module.exports = mongoose.model("User", UserSchema);
