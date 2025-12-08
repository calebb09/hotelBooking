"use strict";
const mongoose = require("mongoose");
const paginator = require("mongoose-paginate-v2");
var Schema = mongoose.Schema;
// New Category Schema Instance
var NotifiSchema = new Schema(
  {
    user_information: {
      user_type: [
        {
          type: String,
          enum: ["user", "client", "admin"],
        },
      ],
      client: {type: Schema.Types.ObjectId, ref: "accommodation"},
      user: {type: Schema.Types.ObjectId, ref: "client"},
    },
    title: {
      type: String,
      require: true,
    },
    message: {
      type: String,
      require: true,
    },
    is_read: {
      type: Boolean,
      default: false,
    },
    broadcast: {
      type: Boolean,
      default: false,
    },
    broadCastType: {
      type: String,
      default: null, //all, country_name, city_name, client, user
    },
    created_at: {
      type: Date,
      default: Date.now,
    },
    updated_at: {
      type: Date,
    },
  },
  {
    versionKey: false,
  }
);
// add middleware to support pagination
NotifiSchema.plugin(paginator);
// Expose the Category Model
module.exports = mongoose.model("notification", NotifiSchema);
