"use strict";
const mongoose = require("mongoose");
const paginator = require("mongoose-paginate");
var Schema = mongoose.Schema;
// New Category Schema Instance
var WalletSchema = new Schema(
  {
    user_information: {
      user_type: [
        {
          type: String,
          enum: ["user", "client", "admin"],
        },
      ],
      user: {type: mongoose.Schema.Types.ObjectId, ref: "client"},
      client: {type: mongoose.Schema.Types.ObjectId, ref: "Accommodation"},
    },
    currency_type: {type: String, default: "USD", enum: ["ETB", "USD"]},
    balance: {
      type: Number,
      require: true,
    },
    transaction: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "transaction",
      require: true,
    },
    status: {
      type: String,
      enum: [
        "available",
        "pending",
        "failed",
        "uncaptured",
        "refunded",
        "onHold",
      ],
      default: "available",
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
WalletSchema.plugin(paginator);
// Expose the Category Model
module.exports = mongoose.model("wallet", WalletSchema);
