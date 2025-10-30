"use strict";

const mongoose = require("mongoose");
const paginator = require("mongoose-paginate"); // unnecessary fields
var Schema = mongoose.Schema;
const now = Date.now;
/**
 * jobid
 * created_by => employee
 */
var ratingSchema = new Schema(
  {
    subRoomType: {type: Schema.Types.ObjectId, ref: "subRoomTypes"},
    client: {type: Schema.Types.ObjectId, ref: "client"},
    booking: {type: Schema.Types.ObjectId, ref: "book"},
    rate: {type: Number},
    review: {type: String},
    rate_average: {type: Number},
    created_at: {
      type: Date,
      default: now,
    },
    updated_at: {type: Date},
    created_by: {type: Schema.Types.ObjectId, ref: "User"},
  },
  {versionKey: false}
);
ratingSchema.plugin(paginator);
module.exports = mongoose.model("rate", ratingSchema);
