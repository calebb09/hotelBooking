"use strict";

const mongoose = require("mongoose");
const paginator = require("mongoose-paginate"); // unnecessary fields
var Schema = mongoose.Schema;
const now = Date.now;
/**
 * jobid
 * created_by => employee
 */
var SettingSchema = new Schema(
  {
    commission: {
      client: {type: String, requried: true}, // percentage
      user: {type: String, required: true}, //  percentage
    },
    currency: {type: String, enum: ["ETB", "USD"]},
    created_at: {type: Date, default: now},
    updated_at: {type: Date},
    created_by: {type: Schema.Types.ObjectId, ref: "User"},
  },
  {versionKey: false}
);
SettingSchema.plugin(paginator);
module.exports = mongoose.model("setting", SettingSchema);
