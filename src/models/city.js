"use strict";
const mongoose = require("mongoose");
const paginator = require("mongoose-paginate-v2");
const Schema = mongoose.Schema;
const CitySchema = new Schema(
  {
    name: {type: String, required: true},
    picture: {type: String, default: null},
    created_at: {type: Date, default: new Date()},
    is_trending: {type: Boolean, default: false},
    updated_at: {type: Date},
  },
  {versionKey: false}
);
// add middleware to support pagination
CitySchema.plugin(paginator);
// Expose the Category Model
module.exports = mongoose.model("city", CitySchema);
