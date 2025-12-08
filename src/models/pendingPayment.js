"use strict";

const mongoose = require("mongoose");
const paginator = require("mongoose-paginate-v2"); // unnecessary fields
var Schema = mongoose.Schema;
const now = Date.now;
/**
 * jobid
 * created_by => employee
 */
var pendingPaymentSchema = new Schema(
  {
    uuid: {type: String},
    transaction_status: {
      type: String,
      default: "onHold",
      enum: ["onHold", "reversedBack", "transfered"],
    },
    tx_ref: {type: String},
    reason: {type: String},
    money: {
      totalPayment: {type: Number},
      hotelPayment: {type: Number},
      gojoPayment: {type: Number},
    },
    currency_type: {type: String, default: "USD", enum: ["ETB", "USD"]},
    created_at: {
      type: Date,
      default: now,
    },
    updated_at: {type: Date},
  },
  {versionKey: false}
);
pendingPaymentSchema.plugin(paginator);
module.exports = mongoose.model("pendingPayment", pendingPaymentSchema);
