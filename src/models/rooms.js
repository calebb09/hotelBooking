"use strict";

const mongoose = require("mongoose");
const paginator = require("mongoose-paginate"); // unnecessary fields
var Schema = mongoose.Schema;
const now = Date.now;
var roomSchema = new Schema(
  {
    subRoomType: {
      type: Schema.Types.ObjectId,
      ref: "subRoomType",
    },
    room_number: {type: String, required: true},
    status: {
      type: String,
      default: "available",
      enum: ["available", "reserved", "booked", "occupied"],
    },
    booking_calendar: [{type: Schema.Types.ObjectId, ref: "booking"}],
    is_hidden: {type: Boolean, default: false},
    created_at: {
      type: Date,
      default: now,
    },
    updated_at: {type: Date},
    created_by: {type: Schema.Types.ObjectId, ref: "User"},
  },
  {versionKey: false}
);
roomSchema.plugin(paginator);
module.exports = mongoose.model("room", roomSchema);
