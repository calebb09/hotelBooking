"use strict";
const mongoose = require("mongoose");
const paginator = require("mongoose-paginate-v2");
const Schema = mongoose.Schema;
//
// New Admin Schema Instance
const deviceRouter = new Schema(
  {
    uuid: {type: String},
    fcm_token: {type: String},
    device_id: {type: String, unique: true},
    created_at: {type: Date, default: Date.now},
    updated_at: {type: Date},
  },
  {versionKey: false},
);
// add middleware to support pagination
deviceRouter.plugin(paginator);
// Expose the Admin Model
module.exports = mongoose.model("device", deviceRouter);
