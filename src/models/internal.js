"use strict";
const mongoose = require("mongoose");
const paginator = require("mongoose-paginate");
var Schema = mongoose.Schema;

// New Internal Schema Instance
var InternalSchema = new Schema(
  {
    user: {type: Schema.Types.ObjectId, ref: "User"},
    picture: {type: String, default: null},
    first_name: {type: String, default: null},
    last_name: {type: String, default: null},
    licence: {type: String, default: null},
    created_at: {type: Date, default: Date.now},
    updated_at: {type: Date, default: null},
    created_by: {type: Schema.Types.ObjectId, ref: "User"},
  },
  {versionKey: false}
);
// add middleware to support pagination
InternalSchema.plugin(paginator);
// Expose the Internal Model
module.exports = mongoose.model("Internal", InternalSchema);
