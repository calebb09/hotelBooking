"use strict";
const mongoose = require("mongoose");
const paginator = require("mongoose-paginate");
const Schema = mongoose.Schema;
const BankSchema = new Schema(
  {
    uuid: {type: String},
    country: {type: String},
    phone: {type: String},
    wiseAccount_id: {type: Number},
    bank_name: {type: String},
    bank_holder_name: {type: String},
    bank_acct: {type: Number},
    bank_swift_code: {type: String},
    bank_routing_number: {type: Number},
    has_full_ownership: {type: Boolean, default: true}, //terms of use that the user has a full authorization and access to the bank account
    updated_at: {type: Date},
    created_at: {type: Date, default: Date.now},
    created_by: {
      type: Schema.Types.ObjectId,
      ref: "accommodation",
    },
  },
  {versionKey: false}
);
// add middleware to support pagination
BankSchema.plugin(paginator);
module.exports = mongoose.model("bank", BankSchema);
