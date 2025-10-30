"use strict";
const mongoose = require("mongoose");
const paginator = require("mongoose-paginate");
var Schema = mongoose.Schema;
// New Category Schema Instance
var LocationSchema = new Schema(
  {
    location: {
      type: {
        type: String,
        default: "Point",
        enum: ["Point"],
      },
      coordinates: {
        type: [Number], // [longitude, latitude]
        default: [8.98112892180133, 38.76020386634213],
      },
    },
    user: {type: Schema.Types.ObjectId, ref: "client"},
    created_at: {
      type: Date,
      default: Date.now,
    },
    updated_at: {
      type: Date,
    },
  },
  {
    versionKey: false,
  }
);
// Create a 2dsphere index on location.coordinates for geospatial queries
LocationSchema.index({location: "2dsphere"});
// add middleware to support pagination
LocationSchema.plugin(paginator);
// Expose the Category Model
module.exports = mongoose.model("location", LocationSchema);
