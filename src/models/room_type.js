"use strict";
const mongoose = require("mongoose");
const paginator = require("mongoose-paginate-v2");
const Schema = mongoose.Schema;
const RoomTypeSchema = new Schema(
  {
    name: {type: String, required: true},
    description: {type: String, default: null},
    // accommodation: {type: Schema.Types.ObjectId, ref: "Accommodation"},
    tags: [String],
    created_by: {type: Schema.Types.ObjectId, ref: "User"},
    created_at: {type: Date, default: new Date()},
    updated_at: {type: Date},
  },
  {versionKey: false}
);
// add middleware to support pagination
RoomTypeSchema.plugin(paginator);
// Expose the Category Model
module.exports = mongoose.model("room_type", RoomTypeSchema);
