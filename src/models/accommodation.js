"use strict";

// const {stubFalse} = require("lodash");
const mongoose = require("mongoose");
const paginator = require("mongoose-paginate-v2"); // unnecessary fields
var Schema = mongoose.Schema;
var validateEmail = function (emailAddress) {
  var re = /^\w+([\.-]?\w+)*@\w+([\.-]?\w+)*(\.\w{2,3})+$/;
  return re.test(emailAddress);
};
const now = Date.now;
/**
 * accommodation
 * created_by => owner, or sales
 */
var accommodationSchema = new Schema(
  {
    picture: [{type: String}],
    houseRule: {
      checkIn_checkOut_times: {
        checkIn: [{type: String}], // from and to ["10:00PM" "04:00AM"]
        checkOut: [{type: String}], // from and to ["10:00PM" "04:00AM"]
      },
      summary: {type: String},
      minimum_check_in_age: {type: Number, default: 18},
      childrens_bed_policy: {
        type: String,
      },
      pet_policy: {
        type: String,
      },
      additional_rules: {
        type: String,
      },
    },
    name: {
      en: {type: String, required: true, trim: true},
      am: {type: String, trim: true},
    },
    address: {
      street_address: {type: String, required: true},
      phoneAddress: [
        {
          type: String,
        },
      ],
      emailAddress: [
        {
          type: String,
          trim: true,
          lowercase: true,
          validate: [validateEmail, "Please fill a valid email address"],
          match: [
            /^\w+([\.-]?\w+)*@\w+([\.-]?\w+)*(\.\w{2,3})+$/,
            "Please fill a valid email address",
          ],
        },
      ],
      city: {type: Schema.Types.ObjectId, ref: "City", required: true},
      country: {type: String, required: true},
      location: {
        type: {
          type: String,
          default: "Point",
          enum: ["Point"],
        },
        coordinates: {
          type: [Number],
          default: [8.98112892180133, 38.76020386634213], //lat , lng
        },
      },
    },
    room: [{type: Schema.Types.ObjectId, ref: "Room"}],
    star: {type: Number, required: true, enum: [1, 2, 3, 4, 5]},
    description: {type: String, required: true},
    min_max_price: [{type: Number}],
    facilities: [
      {type: Schema.Types.ObjectId, ref: "failities", required: true},
    ],
    packageInfo: {
      package_subscription: {type: Schema.Types.ObjectId, ref: "Package"},
      expiresOn: {type: Date, default: null},
      hasExpired: {type: Boolean, default: true},
      package_level: {type: Number, enum: [0, 1, 2, 3, 4], default: 0},
    },
    lodging_type: {
      type: Schema.Types.ObjectId,
      ref: "accommodation_type",
      required: true,
    },
    is_verified: {type: Boolean, default: true},
    stuff_language: [
      {
        type: String,
        enum: [
          "Amharic",
          "English",
          "French",
          "Oromiffa",
          "Tigrigna",
          "Chinese",
        ],
        required: true,
      },
    ],
    carParking_available: {
      type: Boolean,
      required: true,
    },

    petsAllowed: {type: Boolean, default: false},
    rate_average: {type: Number},
    total_review: {type: Number, default: 0},
    created_at: {
      type: Date,
      default: now,
    },
    /**
     * global configuration
     * breakfast and refunable
     */
    has_breakfast: {type: Boolean, default: false},
    breakfast_price: {
      type: Number,
      default: 0,
      validate: {
        validator: function (value) {
          // If has_breakfast is true, breakfast_price must be greater than 0
          if (
            this.has_breakfast &&
            (value === 0 || value === null || value === undefined)
          ) {
            return false;
          }
          return true;
        },
        message:
          "breakfast_price is required and must be greater than 0 when property has breakfast",
      },
    },
    refundable: {
      is_refundable: {type: Boolean, default: false},
      amount: {type: Number, default: 0},
    },
    updated_at: {type: Date},
    created_by: {type: Schema.Types.ObjectId, ref: "User"},
  },
  {versionKey: false}
);
// ✅ Create a text index on name (and summary if needed)
accommodationSchema.index({
  name: "text",
  "houseRule.summary": "text",
});
accommodationSchema.index({"address.location": "2dsphere"});
accommodationSchema.plugin(paginator);
module.exports = mongoose.model("accommodation", accommodationSchema);
