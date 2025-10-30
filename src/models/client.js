"use strict";
const mongoose = require("mongoose");
const paginator = require("mongoose-paginate"); // unnecessary fields
var Schema = mongoose.Schema;
var validateEmail = function (email) {
  var re = /^\w+([\.-]?\w+)*@\w+([\.-]?\w+)*(\.\w{2,3})+$/;
  return re.test(email);
};
var ClientSchema = new Schema({
  /** personal information */
  uuid: {
    type: String,
    unique: true,
    required: [true, "UID is required"],
  },
  picture: {
    type: String,
    default: "uploads/default_profile.png",
  },
  full_name: {
    type: String,
    required: [true, "Full name is required"],
  },
  sex: {
    type: String,
    enum: ["male", "female"],
  },
  email: {
    type: String,
    trim: true,
    lowercase: true,
    default: null,
  },
  is_email_verified: {type: Boolean},
  account_created_with_email: {type: Boolean},
  phone: {
    type: String,
    default: null,
  },
  city: {type: String, default: null},
  country: {
    type: String,
    default: null,
  },
  country_code: {type: String, default: null},
  email_notification: {
    news_update: {type: Boolean, default: true},
  },
  created_at: {type: Date, default: Date.now},
  updated_at: {type: Date},
});
// Create indexes after model definitions (assuming you use Mongoose):
// Expose the  Model
ClientSchema.plugin(paginator);
module.exports = mongoose.model("client", ClientSchema);
