"use strict";

const mongoose = require("mongoose");
const paginator = require("mongoose-paginate"); // unnecessary fields
var Schema = mongoose.Schema;
const now = Date.now;
/**
 * jobid
 * created_by => employee
 */
var transactionSchema = new Schema(
  {
    user_information: {
      user_type: {
        type: String,
        enum: ["user", "client", "admin"],
      },
      user: {type: Schema.Types.ObjectId, ref: "Client"},
      client: {type: Schema.Types.ObjectId, ref: "Accommodation"},
    },
    transaction_status: {
      type: String,
      default: "pending",
      enum: [
        "pending",
        "recharge",
        "withdraw",
        "transfer",
        "requestBooking",
        "returnedBack",
        "payment",
        "refunded",
        "failed/cancelled",
      ],
    },
    wallet_recharge: {
      is_recharge: {type: Boolean, default: false},
      fee: {type: Number},
      amount: {type: Number},
      status: {
        type: String,
        enum: ["succeeded", "pending", "refunded", "failed"],
      },
      stripeId: {type: String},
    },
    receiptUrl: {type: String},
    withdraw_receipt_pdf: {type: String},
    reason: {type: String},
    amount: {type: Number},
    currency_type: {type: String, default: "USD", enum: ["ETB", "USD"]},

    // services: {
    //   package: {type: Schema.Types.ObjectId, ref: "package", defaul: null},
    //   booking: {type: Schema.Types.ObjectId, ref: "booking", defaul: null},
    //   transfer: {
    //     client: {type: Schema.Types.ObjectId, ref: "user", defaul: null},
    //     user: {type: Schema.Types.ObjectId, ref: "Client", defaul: null},
    //   },
    // },
    uniqueId: {type: String}, // this can be used by chapa=>UUID
    action_type: {
      type: String,
      enum: ["deducted", "added"],
      required: true,
    },
    created_at: {
      type: Date,
      default: now,
    },
    updated_at: {type: Date},
  },
  {versionKey: false}
);
transactionSchema.plugin(paginator);
module.exports = mongoose.model("transaction", transactionSchema);
