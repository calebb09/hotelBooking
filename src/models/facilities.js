"use strict";
const mongoose = require("mongoose");
const paginator = require("mongoose-paginate");
const Schema = mongoose.Schema;
//
// New Admin Schema Instance
const failityRouter = new Schema(
  {
    name: {type: String, required: true, unique: true},
    icon: {type: String},
    created_at: {type: Date, default: Date.now},
    updated_at: {type: Date},
  },
  {versionKey: false}
);
// add middleware to support pagination
failityRouter.plugin(paginator);
// Expose the Admin Model
module.exports = mongoose.model("facility", failityRouter);
