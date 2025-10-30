"use strict";

const mongoose = require("mongoose");
const paginator = require("mongoose-paginate"); // unnecessary fields
var Schema = mongoose.Schema;
const now = Date.now;
/**
 * jobid
 * created_by => employee
 */
var ServiceSchema = new Schema(
  {
    name: {type: String, required: true, unique: true},
    number_of_booking: [{type: Number}], //two values
    amount: {type: String, required: true, unique: true}, //decimal or percentage
    created_at: {
      type: Date,
      default: now,
    },
    updated_at: {type: Date},
    created_by: {type: Schema.Types.ObjectId, ref: "User"},
  },
  {versionKey: false}
);
ServiceSchema.plugin(paginator);
module.exports = mongoose.model("service", ServiceSchema);
