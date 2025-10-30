"use strict";

const mongoose = require("mongoose");
const paginator = require("mongoose-paginate"); // unnecessary fields
var Schema = mongoose.Schema;
const now = Date.now;
/**
 * jobid
 * created_by => employee
 */
var bookingSchema = new Schema(
  {
    accommodation: {
      type: Schema.Types.ObjectId,
      ref: "accommodation",
      required: true,
    },
    room: [{type: Schema.Types.ObjectId, ref: "room", required: true}],
    status: {
      type: String,
      default: "pending",
      enum: [
        "pending",
        "accepted",
        "reserved",
        "booked",
        "checkedIn",
        "cancelled",
        "occupied",
        "completed",
      ],
      required: true,
    },
    // description: [{type: String, required: true}],
    checkIn: {type: Date, required: true},
    checkOut: {type: Date, required: true},
    guests: {
      adult: {type: Number},
      children: {type: Number},
      children_age: [{type: Number}],
    },
    currency_type: {type: String, default: "ETB"},
    transaction: {
      type: Schema.Types.ObjectId,
      ref: "transaction",
    },
    is_paid: {type: Boolean, default: false},
    tx_ref: {type: String}, // use this for chapa
    withBreakFast: [{type: Schema.Types.ObjectId, ref: "room"}],
    withRefundable: [{type: Schema.Types.ObjectId, ref: "room"}],
    // has_breakfast: {type: Boolean, default: false},
    // is_refundable: {type: Boolean, default: false},
    is_paid_via_wallet: {type: Boolean, default: false},
    created_at: {type: Date, default: now},
    updated_at: {type: Date},
    created_by: {
      has_account: {type: Boolean},
      client: {type: Schema.Types.ObjectId, ref: "Client"},
      guest: {
        name: {type: String},
        phone: {type: String},
        email: {type: String},
      },
    },

    booking_checked_by: [{type: Schema.Types.ObjectId, ref: "user"}], // receptionist or owner
  },
  {versionKey: false}
);
bookingSchema.plugin(paginator);
module.exports = mongoose.model("booking", bookingSchema);
