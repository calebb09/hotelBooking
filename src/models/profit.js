"use strict";
const mongoose = require("mongoose");
const paginator = require("mongoose-paginate-v2");
var Schema = mongoose.Schema;
// New Category Schema Instance
var ProfitSchema = new Schema(
  {
    user_information: {
      user_type: [
        {
          type: String,
          enum: ["user", "client", "admin"],
        },
      ],
      user: {type: mongoose.Schema.Types.ObjectId, ref: "client"}, // a booker who wants a hotel
      client: {type: mongoose.Schema.Types.ObjectId, ref: "Accommodation"},
    },
    currency_type: {type: String, default: "USD", enum: ["ETB", "USD"]},
    amount: {
      type: Number,
      require: true,
    },
    transaction: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "transaction",
      require: true,
    },
    reason: {
      type: String,
      enum: ["Package subscription", "Booking a room", "refund to client"],
    },
    status: {
      type: String,
      enum: ["pending", "available", "refunded", "failed"],
      default: "pending",
    },
    uniqueId: {type: String},
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
// add middleware to support pagination
ProfitSchema.plugin(paginator);
// Expose the Category Model
module.exports = mongoose.model("profit", ProfitSchema);
