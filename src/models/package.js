"use strict";

const mongoose = require("mongoose");
const paginator = require("mongoose-paginate-v2"); // unnecessary fields
var Schema = mongoose.Schema;
const now = Date.now;
/**
 * jobid
 * created_by => employee
 */
var packageSchema = new Schema(
  {
    name: {type: String, required: true},
    period: {
      type: String,
      default: "annual",
      enum: ["daily", "weekly", "monthly", "annual"],
      required: true,
    },
    price: {type: Number, required: true},
    created_at: {
      type: Date,
      default: now,
    },
    updated_at: {type: Date},
    created_by: {type: Schema.Types.ObjectId, ref: "User"},
  },
  {versionKey: false}
);
packageSchema.plugin(paginator);
module.exports = mongoose.model("hotel_package", packageSchema);
