"use strict";
const mongoose = require("mongoose");
const paginator = require("mongoose-paginate-v2");
const Schema = mongoose.Schema;
const ChapaSchema = new Schema(
  {
    uuid: {type: String},
    transaction: {type: Schema.Types.ObjectId, ref: "transaction"},
    payment_method: {type: String},
    tx_ref: {type: String},
    chapa_ref: {type: String},
    status: {type: String, default: "pending"},
    requestId: {type: String},
    reason: {type: String, enum: ["recharge", "booking"]},
    chargeInfo: {
      actual_price: {type: Number},
      fee: {type: Number},
      total: {type: Number},
      hotelShare: {type: Number},
      gojoShare: {type: Number},
    },
    created_at: {type: Date, default: new Date()},
    updated_at: {type: Date},
  },
  {versionKey: false}
);
// add middleware to support pagination
ChapaSchema.plugin(paginator);
// Expose the Category Model
module.exports = mongoose.model("chapa_store", ChapaSchema);
