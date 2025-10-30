"use strict";
const mongoose = require("mongoose");
const paginator = require("mongoose-paginate");
const Schema = mongoose.Schema;
//
// New Admin Schema Instance
const accommodationTypeRouter = new Schema(
  {
    name: {type: String},
    icon: {type: String},
    created_at: {type: Date, default: Date.now},
    updated_at: {type: Date},
  },
  {versionKey: false}
);
// add middleware to support pagination
accommodationTypeRouter.plugin(paginator);
// Expose the Admin Model
module.exports = mongoose.model("accommodation_type", accommodationTypeRouter);
