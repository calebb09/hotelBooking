"use strict";
const mongoose = require("mongoose");
const paginator = require("mongoose-paginate-v2");
const Schema = mongoose.Schema;
const subRoomTypeSchema = new Schema(
  {
    accommodation: {type: Schema.Types.ObjectId, ref: "Accommodation"},
    roomType: {type: Schema.Types.ObjectId, ref: "roomType"},
    facilities: [{type: Schema.Types.ObjectId, ref: "facilities"}],
    picture: [{type: String}],
    name: {type: String, required: true},
    description: {type: String, default: null},
    bed_info: [
      {
        amount: {type: Number, required: true},
        types: {
          type: String,
          enum: ["single", "double"],
          required: true,
        },
      },
    ],
    number_of_guests: {type: Number},
    price_info: {
      timelydiscount: {type: String, default: "0%"}, // the discount for timely booking
      discount: {type: String, default: "0%"}, // the discount
      original_price: {type: Number},
      room_price: {type: Number}, //the hotel room price
      commissioninPercent: {type: String}, // inpercent
      commissionAmount: {type: Number}, // in amount
      actual_price: {type: Number},
      discount_price: {type: Number},
      // timely_discount_price: {type: Number},
      refundable_price: {type: Number},
      breakfast_price: {type: Number},
      has_discount: {type: Boolean, default: false},
      discountInfo: {
        original_price: {type: Number},
        room_price: {type: Number},
        actual_price: {type: Number},
      },
    },
    rooms: [{type: Schema.Types.ObjectId, ref: "room"}],
    is_verified: {type: Boolean, default: true},
    has_breakfast: {type: Boolean, default: false}, // global configuration
    is_refundable: {type: Boolean, default: false}, // global configuration
    rates: [{type: Schema.Types.ObjectId, ref: "ratings"}],
    rate_average: {type: Number},
    smoking: {type: Boolean, default: false},
    created_at: {type: Date, default: new Date()},
    created_by: {type: Schema.Types.ObjectId, ref: "User"},
    updated_at: {type: Date},
  },
  {versionKey: false},
);
// add middleware to support pagination
subRoomTypeSchema.plugin(paginator);
// Expose the Category Model
module.exports = mongoose.model("subRoomType", subRoomTypeSchema);
