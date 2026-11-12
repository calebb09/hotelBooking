"use strict";

const mongoose = require("mongoose");
const paginator = require("mongoose-paginate-v2"); // unnecessary fields
var Schema = mongoose.Schema;
const now = Date.now;
/**
 * jobid
 * created_by => employee
 */
var subscriptionSchema = new Schema(
  {
    accommodation: {type: Schema.Types.ObjectId, ref: "accommodation"},
    package: {type: Schema.Types.ObjectId, ref: "package"},
    created_at: {
      type: Date,
      default: now,
    },
    updated_at: {type: Date},
    created_by: {type: Schema.Types.ObjectId, ref: "User"},
  },
  {versionKey: false}
);
subscriptionSchema.plugin(paginator);
module.exports = mongoose.model("subscription", subscriptionSchema);
