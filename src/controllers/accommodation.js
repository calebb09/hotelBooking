// Load Module Dependencies
const async = require("async");
const fs = require("fs");
const path = require("path");
const _ = require("lodash");
const axios = require("axios");
const ExcelJS = require("exceljs");
const csv = require("csvtojson");
const lodgingType = require("../models/accommodation_type");
const AccommodationDal = require("../dal/accommodation");
const City = require("../models/city");
const amadeusAccessToken = require("../services/amadeus");

const roomType = require("../models/room_type");
const facilities = require("../models/facilities");

const subRoomType = require("../models/subRoomType");
const Property = require("../models/accommodation");
const config = require("../../config");

const RoomDal = require("../dal/rooms");
const RoomMdl = require("../models/rooms");
const BookDal = require("../dal/booking");
const BookMdl = require("../models/booking");
const UserDal = require("../dal/user");
const User = require("../models/user");
const RatingDal = require("../dal/rate");
const sendMessage = require("../functions/sendMessage");
const post2telegram = require("../services/telegram");
const jwt = require("jsonwebtoken");
const findAvailableAccommodations = require("../utils/searchHotels");
const mongoose = require("mongoose");

exports.validateAccommodation = function validateAccommodation(
  req,
  res,
  next,
  id
) {
  // Manually validate if id is a valid MongoDB ObjectId
  if (!mongoose.Types.ObjectId.isValid(id)) {
    return res.status(400).json({
      error: true,
      message: "Invalid param: ID must be a valid MongoDB ObjectId",
      status: 400,
    });
  }

  // Proceed with DAL lookup
  AccommodationDal.get({_id: id}, function (err, doc) {
    if (err) {
      return next(err);
    }
    if (doc && doc._id) {
      req.doc = doc;
      return next();
    } else {
      return res.status(404).json({
        error: true,
        status: 404,
        msg: "Accommodation _id " + id + " not found",
      });
    }
  });
};
exports.fetchAll = async function fetchAll(req, res, next) {
  let page = req.query.page * 1 || 1;
  let limit = req.query.limit * 1 || 20;
  let query = {is_verified: true};
  let queryOpts = {
    page: page,
    limit: limit,
    sort: {_id: -1},
  };
  try {
    AccommodationDal.getCollectionByPagination(query, queryOpts, (err, doc) => {
      if (err) {
        return next(err);
      }

      res.status(200).json({
        data: _.shuffle(doc.docs),
        limit: limit,
        skip: page,
        total: doc.total,
      });
    });
  } catch (e) {
    res.status(500).json({
      msg: "Error Occured" + e,
      status: 500,
    });
  }
};
exports.sortyBy = async function (req, res) {
  try {
    let page = req.query.page * 1 || 1;
    let limit = req.query.limit * 1 || 20;
    let query = {is_verified: true};
    // Get sortBy and order from query params
    let {sortBy, order} = req.query;
    const allowedSortFields = ["name", "rate_average", "star", "_id"];

    if (!allowedSortFields.includes(sortBy)) {
      sortBy = "_id"; // default sort field
    }
    order = order === "asc" ? 1 : -1; // default descending
    let queryOpts = {
      page: page,
      limit: limit,
      sort: {[sortBy]: order}, // dynamic sorting
    };
    try {
      AccommodationDal.getCollectionByPagination(
        query,
        queryOpts,
        (err, doc) => {
          if (err) {
            return next(err);
          }
          res.status(200).json({
            data: doc.docs,
            limit: limit,
            skip: page,
            total: doc.total,
          });
        }
      );
    } catch (e) {
      res.status(500).json({
        msg: "Error Occured" + e,
        status: 500,
      });
    }
  } catch (err) {
    res.status(500).json({error: err.message});
  }
};
exports.fetchunOwned = async (req, res, next) => {
  let page = req.query.page * 1 || 1;
  let limit = req.query.limit * 1 || 20;
  let query = {created_by: null};
  let queryOpts = {
    page: page,
    limit: limit,
    sort: {_id: -1},
  };
  try {
    AccommodationDal.getCollectionByPagination(query, queryOpts, (err, doc) => {
      if (err) {
        return next(err);
      }
      res.status(200).json({
        data: _.shuffle(doc.docs),
        limit: limit,
        skip: page,
        total: doc.total,
      });
    });
  } catch (e) {
    res.status(500).json({
      msg: "Error Occured" + e,
      status: 500,
    });
  }
};
exports.internationHotel = async (req, res, next) => {
  try {
    const accessToken = await amadeusAccessToken();
    // Step 2: Fetch hotel offers
    const hotelsRes = await axios.get(
      `${config.AMADEUS_URL}/v1/reference-data/locations/hotels/by-city?cityCode=${req.query.cityCode}`,
      {
        headers: {
          Authorization: `Bearer ${accessToken.token}`,
          "Content-Type": "application/json",
        },
      }
    );
    res.json(hotelsRes.data);
  } catch (error) {
    console.error("Error Response:", error.response?.data || error.message);
    res.status(500).json({error: error.response?.data || error.message});
  }
};
exports.searchRooms = async (req, res) => {
  try {
    const {
      hotelIds,
      adults,
      checkInDate,
      checkOutDate,
      countryOfResidence,
      roomQuantity,
      priceRange,
      currency,
      paymentPolicy,
      boardType,
      includeClosed,
      bestRateOnly,
      lang,
    } = req.query;
    const accessToken = await amadeusAccessToken();
    // Step 2: Fetch hotel offers
    const hotelsRes = await axios.get(
      `${config.AMADEUS_URL}/v3/shopping/hotel-offers?hotelIds=${hotelIds}&adults=${adults}&checkInDate=${checkInDate}&checkOutDate=${checkOutDate}&countryOfResidence=${countryOfResidence}&roomQuantity=${roomQuantity}&priceRange=${priceRange}&currency=${currency}&paymentPolicy=${paymentPolicy}&boardType=${boardType}&includeClosed=${includeClosed}&bestRateOnly=${bestRateOnly}&lang=${lang}`,
      {
        headers: {
          Authorization: `Bearer ${accessToken.token}`,
          "Content-Type": "application/json",
        },
      }
    );
    res.json(hotelsRes.data);
  } catch (error) {
    console.error("Error Response:", error.response?.data || error.message);
    res.status(500).json({error: error.response?.data || error.message});
  }
};
exports.clearRooms = async (req, res, next) => {
  AccommodationDal.getCollection({}, {}, (err, doc) => {
    if (err) {
      return next(err);
    }
    doc.forEach((data) => {
      AccommodationDal.update({_id: data.id}, {room: []}, (err, doc) => {
        if (err) {
          return next(err);
        }
        RoomDal.delete({accommodation: data.id}, (err, remove_room) => {
          if (err) {
            return next(err);
          }
        });
      });
    });
    res.status(200).json({msg: "room cleared"});
  });
};
exports.all = async function fetchAll(req, res, next) {
  let page = req.query.page * 1 || 1;
  let limit = req.query.limit * 1 || 20;
  let query = {};
  let queryOpts = {
    page: page,
    limit: limit,
    sort: {_id: -1},
  };
  try {
    AccommodationDal.getCollectionByPagination(query, queryOpts, (err, doc) => {
      if (err) {
        return next(err);
      }
      res.status(200).json({
        data: doc.docs,
        limit: limit,
        skip: page,
        total: doc.total,
      });
    });
  } catch (e) {
    res.status(500).json({
      msg: "Error Occured" + e,
      status: 500,
    });
  }
};
exports.myProperties = (req, res, next) => {
  try {
    let query = {_id: req._user.assigned_accommodation};
    AccommodationDal.get(query, (err, doc) => {
      if (err) {
        return next(err);
      }
      doc !== null
        ? res.status(200).json(doc)
        : res.status(400).json({msg: "no property found"});
    });
  } catch (e) {
    res.status(500).json({
      msg: "Error Occured" + e,
      status: 500,
    });
  }
};
exports.TopUnique = (req, res, next) => {
  let page = req.query.page * 1 || 1;
  let limit = req.query.limit * 1 || 20;
  let query = {is_verified: true};
  let queryOpts = {
    page: page,
    limit: limit,
    // sort: {"packageInfo.package_level": -1},
  };
  try {
    AccommodationDal.getCollectionByPagination(query, queryOpts, (err, doc) => {
      if (err) {
        return next(err);
      }
      res.status(200).json({
        data: doc.docs,
        limit: limit,
        skip: page,
        total: doc.total,
      });
    });
  } catch (e) {
    res.status(500).json({
      msg: "Error Occured" + e,
      status: 500,
    });
  }
};
exports.trending = (req, res, next) => {
  let page = req.query.page * 1 || 1;
  let limit = req.query.limit * 1 || 20;
  let query = {$and: [{total_review: {$gte: 4}}, {rate_average: {$gte: 4}}]};
  let queryOpts = {
    page: page,
    limit: limit,
    // sort: {"packageInfo.package_level": -1},
  };
  try {
    AccommodationDal.getCollectionByPagination(
      query,
      queryOpts,
      async (err, doc) => {
        if (err) {
          return next(err);
        }
        // ✅ Use Promise.all with map to get counts
        const accommodationsWithCounts = await Promise.all(
          doc.docs.map(async (accommodation) => {
            const bookingCount = await BookMdl.countDocuments({
              accommodation: accommodation._id,
              status: "completed",
            });

            // attach bookingCount to the accommodation object
            return {
              ...accommodation.toObject(), // convert mongoose doc to plain object
              bookingCount,
            };
          })
        );

        // ✅ Only include accommodations where bookingCount > 0
        const filtered = accommodationsWithCounts.filter(
          (acc) => acc.bookingCount > 0
        );

        res.status(200).json({
          data: filtered.length > 4 ? filtered : [],
          limit: limit,
          skip: page,
          total: doc.total,
        });
      }
    );
  } catch (e) {
    res.status(500).json({
      msg: "Error Occured" + e,
      status: 500,
    });
  }
};
exports.rooms = (req, res, next) => {
  try {
    let limit = 20;
    let page = parseInt(req.query.page) || 1;

    // Log input parameters for debugging
    console.log("Request parameters:", {page, accommodationId: req.doc?._id});

    // Validate req.doc._id
    if (!req.doc || !req.doc._id) {
      console.error("Missing accommodation ID");
      return res.status(400).json({error: "Missing accommodation ID"});
    }

    // Convert req.doc._id to ObjectId and validate
    let accommodationId;
    try {
      accommodationId = mongoose.Types.ObjectId(req.doc._id);
    } catch (err) {
      console.error("Invalid accommodation ID:", req.doc._id);
      return res.status(400).json({error: "Invalid accommodation ID"});
    }

    // Run two aggregations: one for data, one for total count
    Promise.all([
      RoomMdl.aggregate([
        {
          $lookup: {
            from: "subroomtypes", // Verify this matches the exact collection name
            localField: "subRoomType",
            foreignField: "_id",
            as: "subRoomType",
          },
        },
        {$unwind: {path: "$subRoomType", preserveNullAndEmptyArrays: true}}, // Preserve documents if lookup fails
        // NEW lookup for facilities
        {
          $lookup: {
            from: "facilities", // 👈 make sure this matches your actual collection name
            localField: "subRoomType.facilities",
            foreignField: "_id",
            as: "subRoomType.facilities",
          },
        },
        {
          $match: {
            "subRoomType.accommodation": accommodationId,
            is_hidden: false,
          },
        },
        {$sort: {room_number: 1}},
        {$skip: (page - 1) * limit},
        {$limit: limit},
      ]).exec(),
      RoomMdl.aggregate([
        {
          $lookup: {
            from: "subroomtypes",
            localField: "subRoomType",
            foreignField: "_id",
            as: "subRoomType",
          },
        },
        {$unwind: {path: "$subRoomType", preserveNullAndEmptyArrays: true}},
        {
          $match: {
            "subRoomType.accommodation": accommodationId,
            is_hidden: false,
          },
        },
        {$count: "total"},
      ]).exec(),
    ])
      .then(([rooms, countResult]) => {
        const total = countResult.length > 0 ? countResult[0].total : 0;
        console.log("Aggregation result:", {rooms, total}); // Debug log
        res.status(200).json({
          data: rooms,
          limit,
          page,
          total,
        });
      })
      .catch((err) => {
        console.error("Aggregation error:", err);
        next(err);
      });
  } catch (err) {
    console.error("Server error:", err);
    res.status(500).json({error: "Internal server error"});
  }
};
exports.subRoomType = async (req, res, next) => {
  try {
    // Pagination params
    const page = parseInt(req.query.page, 10) || 1;
    const limit = parseInt(req.query.limit, 10) || 10;

    // Build query
    const query = {
      accommodation: req.doc._id,
      is_verified: true,
    };

    // Paginate subRoomTypes
    const options = {
      page,
      limit,
      populate: [
        {
          path: "facilities",
          model: facilities,
        },
        {
          path: "roomType",
          model: roomType,
        },
      ], // Uncommented: populate related fields if needed
      lean: true, // returns plain JS objects
    };

    const result = await subRoomType.paginate(query, options);

    // Add room details and counts for each subRoomType
    const subRoomTypesWithRooms = await Promise.all(
      result.docs.map(async (sub) => {
        // Fetch actual room details (not just count)
        const rooms = await RoomMdl.find({
          subRoomType: sub._id,
          is_hidden: false,
        })
          // .populate("subRoomType") // Optional: populate back if needed for room details
          .lean()
          .exec();

        return {
          ...sub,
          rooms, // Attach full room details
          number_of_rooms: rooms.length, // Derived count
        };
      })
    );

    // Respond
    res.status(200).json({
      meta: {
        page: result.page,
        limit: result.limit,
        totalPages: result.totalPages,
        totalDocs: result.totalDocs,
      },
      data: subRoomTypesWithRooms,
    });
  } catch (error) {
    res.status(500).json({msg: error.message});
  }
};
exports.fetchOne = function fetchOne(req, res, next) {
  res.json(req.doc);
};
exports.create = (req, res, next) => {
  try {
    let create = {};
    var body = req.body;
    let response = [];
    if (checkDuplicates(body.address.phoneAddress)) {
      response.push("duplicates phone");
    }
    if (checkDuplicates(body.address.emailAddress)) {
      response.push("duplicate email");
    }
    if (response.length === 0) {
      body.created_by = req._user._id;
      req._user.role === "owner"
        ? (create = Object.assign(body, {is_verified: false}))
        : (create = body);

      AccommodationDal.getCollection(
        {
          $or: [
            {
              name: body.name,
            },
            {
              "address.phoneAddress": {$in: [body.address.phoneAddress]},
            },
            {
              "address.emailAddress": {$in: [body.address.emailAddress]},
            },
          ],
        },
        {},
        (err, accommodation_doc) => {
          if (err) {
            return next(err);
          }
          accommodation_doc.length > 0
            ? res.status(400).json({
                msg: "data already exists",
                status: 400,
              })
            : AccommodationDal.create(create, (err, create_doc) => {
                if (err) {
                  return next(err);
                }
                if (create_doc) {
                  UserDal.update(
                    {_id: req._user._id},
                    {
                      assigned_accommodation: create_doc.id,
                      updated_at: new Date(),
                    },
                    (err, updated_user) => {
                      if (err) {
                        return next(err);
                      }
                      if (updated_user) {
                        let new_claim = {
                          userDetail: updated_user,
                          userid: updated_user.id,
                          username: updated_user.username,
                          phone: updated_user.phone,
                          role: updated_user.role,
                          assigned_accommodation:
                            updated_user.assigned_accommodation,
                          iat: Math.floor(Date.now() / 1000),
                          exp: Date.now() + 3600 * 24 * 7 * 4,
                        };
                        let token = jwt.sign(
                          new_claim,
                          "this.IsAn/.ExampleS3cr3t",
                          {
                            algorithm: "HS256",
                          }
                        );

                        res.status(200).json({
                          msg: "created successfully",
                          status: 200,
                          data: create_doc,
                          token,
                        });
                      } else {
                        res.status(400).json({
                          msg: "property created but not assigned",
                          status: 400,
                          data: updated_user,
                        });
                      }
                    }
                  );
                } else {
                  res
                    .status(400)
                    .json({msg: "something went wrong", status: 400});
                }
              });
        }
      );
    } else {
      res.status(400).json({msg: response[0]});
    }
  } catch (err) {
    res.status(500).json(err);
  }
};
exports.uploadSpreadSheet = async (req, res) => {
  try {
    // 1) Validate file presence
    if (!req.files || !Array.isArray(req.files) || req.files.length === 0) {
      return res.status(400).json({message: "No file uploaded."});
    }

    // 2) Find spreadsheet file (.csv, .xls, .xlsx)
    const sheetFile = req.files.find((f) => {
      const ext = path.extname(f.originalname).toLowerCase();
      return [".csv", ".xls", ".xlsx"].includes(ext);
    });

    if (!sheetFile) {
      return res.status(400).json({
        message: "Please upload a valid CSV, XLS, or XLSX file.",
      });
    }

    const ext = path.extname(sheetFile.originalname).toLowerCase();
    let rawJson = [];

    // 3) Parse file content
    if (ext === ".csv") {
      rawJson = await csv().fromFile(sheetFile.path);
    } else if (ext === ".xlsx") {
      const workbook = new ExcelJS.Workbook();
      await workbook.xlsx.readFile(sheetFile.path);
      const worksheet = workbook.worksheets[0];
      if (!worksheet) {
        return res.status(400).json({message: "No worksheet found in file."});
      }
      const rows = [];
      let headers = [];
      worksheet.eachRow((row, rowNumber) => {
        const values = row.values;
        // ExcelJS rows.values is 1-indexed; normalize to 0-indexed array
        const cells = Array.isArray(values) ? values.slice(1) : [];
        if (rowNumber === 1) {
          headers = cells.map((h) => String(h || "").trim());
        } else {
          const obj = {};
          headers.forEach((h, i) => {
            obj[h] = cells[i];
          });
          rows.push(obj);
        }
      });
      rawJson = rows;
    } else if (ext === ".xls") {
      return res.status(400).json({
        message: "Legacy .xls is not supported. Please upload .csv or .xlsx.",
      });
    } else {
      return res.status(400).json({message: "Unsupported file format."});
    }

    // 4) Transform rows into valid documents
    const accommodationsToInsert = [];
    const userType = await User.findOne({role: "super_admin"});
    for (const row of rawJson) {
      const cityDoc = await City.findOne({name: row.city?.trim()});
      const lodgingDoc = await lodgingType.findOne({
        name: row.lodging_type?.trim(),
      });

      if (!cityDoc || !lodgingDoc) {
        console.warn(
          `Skipping row due to missing city/lodging_type or userType:`,
          row
        );
        continue;
      }

      accommodationsToInsert.push({
        name: row.name?.trim(),
        address: {
          street_address: row.street_address?.trim(),
          phoneAddress: row.phoneAddress?.split(",").map((p) => p.trim()),
          emailAddress: row.emailAddress
            ?.split(",")
            .map((e) => e.trim().toLowerCase()),
          city: cityDoc._id,
          country: row.country?.trim(),
          location: {
            type: "Point",
            coordinates: [
              parseFloat(row.lat) || 8.98112892180133,
              parseFloat(row.lng) || 38.76020386634213,
            ],
          },
        },
        description: row.description?.trim(),
        star: parseInt(row.star),
        lodging_type: lodgingDoc._id,
        stuff_language: row.stuff_language
          ?.split(",")
          .map((lang) => lang.trim()),
        is_verified: false,
        carParking_available:
          row.carParking_available === "true" ||
          row.carParking_available === true,
        checkIn_checkOut_times: {
          checkIn: row.checkIn?.split(",").map((t) => t.trim()),
          checkOut: row.checkOut?.split(",").map((t) => t.trim()),
        },
        petsAllowed: row.petsAllowed === "true" || row.petsAllowed === true,
        created_by: userType.id,
      });
    }

    if (accommodationsToInsert.length === 0) {
      return res.status(400).json({message: "No valid rows to insert."});
    }

    // 5) Insert into DB
    const inserted = await Property.insertMany(accommodationsToInsert);

    // 6) Delete uploaded file
    fs.unlink(sheetFile.path, (err) => {
      if (err) console.warn("Failed to delete temp file:", err);
    });

    return res.status(200).json({
      message: "Imported successfully",
      count: inserted.length,
    });
  } catch (err) {
    console.error("Error in uploadSpreadSheet:", err);
    return res.status(500).json({
      message: "Import failed",
      error: err.message,
    });
  }
};
exports.filter = async (req, res, next) => {
  let page = req.query.page * 1 || 1;
  let limit = req.query.limit * 1 || 20;
  // const searchParams = {
  //   searchTerm: "hotel in Addis Ababa",
  //   facilities: ["facility_id_1", "facility_id_2"],
  //   minPrice: 100,
  //   maxPrice: 200,
  //   lodgingType: "lodging_type_id",
  //   minRate: 4,
  //   maxRate: 5,
  // };
  const {
    searchTerm,
    facilities,
    cityId,
    minPrice,
    maxPrice,
    lodgingType,
    minRate,
    maxRate,
  } = req.body;
  let query = {
    $and: [
      searchTerm ? {name: {$regex: searchTerm, $options: "i"}} : {},
      facilities && facilities.length > 0
        ? {facilities: {$in: facilities}}
        : {},
      minPrice && maxPrice
        ? {
            min_max_price: {
              $elemMatch: {
                $gte: minPrice,
                $lte: maxPrice,
              },
            },
          }
        : {},
      lodgingType ? {lodging_type: lodgingType} : {},
      cityId ? {"address.city": cityId} : {},
      minRate && maxRate
        ? {
            rate_average: {
              $gte: minRate,
              $lte: maxRate,
            },
          }
        : {},
    ],
  };
  let queryOpts = {
    page: page,
    limit: limit,
    sort: {"packageInfo.package_level": -1, _id: -1},
  };

  AccommodationDal.getCollectionByPagination(query, queryOpts, (err, doc) => {
    if (err) {
      return next(err);
    }
    res.status(200).json({
      data: doc.docs,
      limit: limit,
      skip: page,
      total: doc.total,
    });
  });
};
exports.nearBy = async (req, res, next) => {
  try {
    // Assuming user is authenticated and their ID is in req.user (e.g., via middleware)
    // const user = await Client.findOne({uuid: req.user.uuid});
    let lng, lat;
    let page = req.query.page * 1 || 1;
    let limit = req.query.limit * 1 || 20;
    let queryOpts = {
      page: page,
      limit: limit,
      sort: {_id: -1},
    };
    // Option 1: Get coordinates from query params (e.g., real-time GPS)
    if (req.body.lng && req.body.lat) {
      lng = parseFloat(req.body.lng);
      lat = parseFloat(req.body.lat);
    }
    // Option 2: Get coordinates from user's stored location
    // else if (user) {
    //   const usersLocation = await Location.findOne({user: user.id});
    //   if (!usersLocation || !usersLocation.location.coordinates) {
    //     return res.status(400).json({error: "User location not found"});
    //   }
    //   [lng, lat] = usersLocation.location.coordinates; // [longitude, latitude]
    // }
    else {
      return res.status(400).json({error: "Coordinates required"});
    }

    const maxDistance = parseFloat(req.body.maxDistance) || 10000; // Default 10km in meters

    // Find nearby accommodations
    AccommodationDal.getCollectionByPagination(
      {
        "address.location": {
          $near: {
            $geometry: {
              type: "Point",
              coordinates: [lng, lat],
            },
            $maxDistance: maxDistance,
          },
        },
        lodging_type: req.body.lodging_type
          ? req.body.lodging_type
          : {$exists: true},
      },
      queryOpts,
      (err, accommodations) => {
        if (err) {
          return next(err);
        }
        res.status(200).json({
          data: _.shuffle(accommodations.docs.docs),
          limit: limit,
          skip: page,
          total: accommodations.docs.total,
        });
      }
    );
  } catch (error) {
    console.error(error);
    res.status(500).json({error: "Server error"});
  }
};
exports.where_to = async (req, res, next) => {
  // Extract request body parameters
  const {city, checkIn, checkOut, guests} = req.body;
  const totalGuests = (guests?.adult || 0) + (guests?.children || 0);
  const checkInDate = new Date(checkIn);
  const checkOutDate = new Date(checkOut);

  // Extract query parameters for pagination
  const page = parseInt(req.query.page) || 1;
  const limit = parseInt(req.query.limit) || 20;

  // Validate input
  if (!city || !checkIn || !checkOut || !guests || totalGuests <= 0) {
    return res.status(400).json({
      msg: "Missing fields checkin, checkout, city, or guests",
    });
  }

  // Validate dates
  if (
    isNaN(checkInDate) ||
    isNaN(checkOutDate) ||
    checkInDate >= checkOutDate
  ) {
    return res.status(400).json({msg: "Invalid check-in or check-out dates"});
  }

  // Validate pagination parameters
  if (page < 1 || limit < 1) {
    return res.status(400).json({msg: "Invalid page or limit parameters"});
  }

  try {
    // Find available accommodations
    const availableAccommodations = await findAvailableAccommodations(
      city,
      checkInDate,
      checkOutDate,
      totalGuests
    );

    // Pagination logic
    const total = availableAccommodations.length;
    const start = (page - 1) * limit;
    const end = start + limit;
    const paginatedData = availableAccommodations.slice(start, end);

    // Log final response
    console.log(`Final response: ${paginatedData.length} accommodations`, {
      page,
      limit,
      total,
      data: paginatedData.map((acc) => ({
        _id: acc._id,
        name: acc.name,
        options: acc.options?.length,
      })),
    });

    // Return response
    res.json({
      data: paginatedData,
      limit,
      page,
      total,
    });
  } catch (err) {
    console.error("Server error:", err);
    res.status(500).json({
      msg: "Error occurred: " + err.message,
      status: 500,
    });
  }
};
exports.uploadHouseRUle = (req, res, next) => {
  const accommodationId = req._user.assigned_accommodation;
  if (!req.files || !Array.isArray(req.files) || req.files.length === 0) {
    return res.status(400).json({message: "No file uploaded."});
  }

  // 2) Find pdf file (.pdf)
  const pdfFile = req.files.find((f) => {
    const ext = path.extname(f.originalname).toLowerCase();
    return [".pdf"].includes(ext);
  });

  if (!pdfFile) {
    return res.status(400).json({
      message: "Please upload a valid PDF.",
    });
  }
  AccommodationDal.update(
    {_id: accommodationId},
    {
      $set: {
        houseRule: req.files[0].filename,
      },
    },
    (err, accomodation_doc) => {
      if (err) {
        return next(err);
      }
      if (accomodation_doc.houseRule) {
        return res.status(200).json({
          msg: "updated successfully",
          status: 200,
        });
      } else {
        return res.status(400).json({
          msg: "File not saved",
          status: 400,
        });
      }
    }
  );
};
exports.uploadPicture = (req, res, next) => {
  if (!req.files[0]) {
    return res.status(400).json({
      msg: "file not passed",
      status: 400,
    });
  }
  if (req.files.length === 0) {
    return res.status(400).json({
      msg: "file not passed",
      status: 400,
    });
  }
  async.eachSeries(
    req.files,
    function (data, callback) {
      AccommodationDal.update(
        {_id: req.doc._id},
        {$push: {picture: data.filename}},
        (err, image_doc) => {
          if (err) return next(err);
        }
      );
      callback(null);
    },
    function done(err) {
      if (err) {
        return next(err);
      } else {
        return res.status(200).json({msg: "successfully updated", status: 200});
      }
    }
  );
};
exports.removePicture = (req, res, next) => {
  console.log(req.query.picture);
  removePicture(req.doc, req.query.picture, (err) => {
    if (err) {
      console.error("Error removing picture:", err);
    } else {
      AccommodationDal.update(
        {_id: req.doc.id},
        {$pull: {picture: req.query.picture}},
        (err, update_doc) => {
          if (err) {
            return next(err);
          }
          // Using the includes() method
          if (update_doc.picture.includes(req.query.picture)) {
            res.status(400).json({msg: "not removed"});
          } else {
            res.status(200).json({msg: "success"});
          }

          // Using a for loop
          for (let i = 0; i < update_doc.picture.length; i++) {
            if (update_doc.picture[i] === req.query.picture) {
              console.log("The search term exists in the array at index " + i);
              break; // Exit the loop once the search term is found
            }
          }
        }
      );
    }
  });
};
exports.reviewAccommodation = async (req, res, next) => {
  let body = req.body;
  let update_query = {};
  let message = {};
  if (body.is_verified === true && req.doc.is_verified === true) {
    return res.status(200).json({msg: "property already verified"});
  }
  if (body.is_verified === true) {
    update_query = Object.assign({is_verified: true}, {updated_at: new Date()});
    message = {
      notification: {
        title: "Property Verified",
        body: `Dear 
         ${req.doc.created_by.internal.first_name}! The license you sent us is approved and verified. You property is now listed on our web. Start adding rooms`,
      },
    };
    // please post newly created accommodation on telegram
    await post2telegram(
      req.doc.name,
      req.doc.description,
      config.TELEGRAM_CHANNEL,
      false,
      req.doc.picture[0]
    )
      .then((data) => {
        data[0] === 201 ? console.log(data[2]) : console.error(data[2]);
      })
      .catch((error) => console.error(error.message));
  } else {
    update_query = Object.assign(
      {is_verified: false},
      {updated_at: new Date()}
    );
    message = {
      notification: {
        title: "License document rejected",
        body:
          "Dear " +
          req.doc.created_by.internal.first_name +
          "! The licence you uploaded is not accepted by Triplaye. Therefore we have rejected your and restricted to further progress",
      },
    };
  }
  AccommodationDal.update({_id: req.doc.id}, update_query, (err, document) => {
    if (err) {
      return next(err);
    }
    sendMessage(message, null, req.doc.id, "to", req.doc.created_by.username);
    document
      ? res.status(200).json({msg: "successful"})
      : res.status(400).json({msg: "error occured"});
  });
};
exports.addressUpdate = (req, res, next) => {
  AccommodationDal.update(
    {_id: req.doc._id},
    {
      $set: {
        "address.street_address": req.body.street_address,
        "address.location.coordinates": req.body.coordinates,
        "address.location.type": "Point",
      },
    },
    (err, accomodation_doc) => {
      if (err) {
        return next(err);
      }
      console.log(accomodation_doc.address);
      res.status(200).json({
        msg: "updated successfully",
        status: 200,
      });
    }
  );
};
exports.update = (req, res, next) => {
  var body = req.body;
  req._user.assigned_accommodation === req.doc.id ||
  req._user.role === "super_admin"
    ? AccommodationDal.update(
        {_id: req.doc._id},
        body,
        (err, accomodation_doc) => {
          if (err) {
            return next(err);
          }
          res.status(200).json({
            msg: "updated successfully",
            status: 200,
          });
        }
      )
    : res.status(401).json({
        msg: "unauthorized to access",
        status: 401,
      });
};

exports.deleteAccommodation = (req, res, next) => {
  try {
    AccommodationDal.delete({_id: req.doc._id}, (err, doc) => {
      if (err) {
        return next(err);
      }

      RoomDal.delete({accommodation: req.doc._id}, (err, room_doc) => {
        if (err) {
          return next(err);
        }
        if (room_doc) {
          BookDal.delete({room: room_doc._id}, (err, book_doc) => {
            if (err) {
              return next(err);
            }
          });
          RatingDal.delete({room: room_doc._id}, (err, rate_doc) => {
            if (err) {
              return next(err);
            }
          });
        }
      });

      res.status(200).json({
        msg: "operation successful",
        status: 200,
      });
    });
  } catch (err) {
    res.status(500).json(err);
  }
};
async function checkMaxMinRoom(next) {
  try {
    const hotel = await Property.find();
    if (hotel.length === 0) {
      console.log("no hotel found");
      return;
    }

    // Step 1: Aggregate min and max prices grouped by accommodation
    const results = await subRoomType.aggregate([
      {
        $group: {
          _id: "$accommodation", // group by accommodation ID
          minPrice: {$min: "$price_info.original_price"},
          maxPrice: {$max: "$price_info.original_price"},
        },
      },
    ]);

    // Step 2: Loop through results and update accommodations
    for (const r of results) {
      await Property.findOneAndUpdate(
        {_id: r._id},
        {$set: {min_max_price: [r.minPrice, r.maxPrice]}}
      );
    }

    console.log("success");
    // res.status(200).json({success: true});
  } catch (err) {
    console.error("Error in checkMaxMinRoom:", err);
    next(err);
  }
}
setInterval(checkMaxMinRoom, 21600000); //every 6hrs

function checkDuplicates(phoneAddress) {
  // Use a Set to efficiently store unique values
  const uniquePhones = new Set(phoneAddress);

  // Check if the size of the set is less than the original array length
  return uniquePhones.size !== phoneAddress.length;
}
// Function to remove a picture from the accommodation model and the file system
function removePicture(accommodation, picUrl, callback) {
  const pictureIndex = accommodation.picture.indexOf(picUrl);
  if (pictureIndex !== -1) {
    accommodation.picture.splice(pictureIndex, 1);
    // Remove the file from the uploads folder
    fs.unlink(config.MEDIA.UPLOADES + picUrl, (err) => {
      if (err) {
        console.error("Error removing file:", err);
        callback(err);
      } else {
        console.log("File removed successfully");
        callback(null);
      }
    });
  } else {
    console.log("Picture not found in the accommodation model");
    callback(new Error("Picture not found in the accommodation model"));
  }
}

async function calculateRateAverage(next) {
  await Property.find()
    .then((data) => {
      data.map(async (items) => {
        await calculateAccommodationRateAverage(items.id).then((show) =>
          console.log("show " + show)
        );
      });
    })
    .catch((err) => {
      console.log(err);
    });
  // const accommodationId = "your_accommodation_id";
  // const averageRate = await calculateAccommodationRateAverage(accommodationId);
  // console.log("Accommodation rate average:", averageRate);
}
setInterval(calculateRateAverage, 21600000); //every 6hours

async function calculateAccommodationRateAverage(accommodationId) {
  // Find all rooms associated with the accommodation
  const rooms = await subRoomType.find({accommodation: accommodationId});

  // Calculate the total rate average for all rooms
  let totalRateAverage = 0;
  let roomCount = 0;

  for (const room of rooms) {
    if (room.rate_average) {
      totalRateAverage += room.rate_average;
      roomCount++;
    }
  }

  // Calculate the average rate for the accommodation
  const accommodationRateAverage =
    roomCount > 0 ? totalRateAverage / roomCount : 0;

  // Update the accommodation's rate_average in the database
  await Property.findByIdAndUpdate(accommodationId, {
    rate_average: accommodationRateAverage,
  });

  return accommodationRateAverage;
}

async function calculateTotalReview(req, res) {
  await Property.find()
    .then((property_data) => {
      property_data.map(async (item) => {
        await subRoomType.find({accommodation: item.id}).then(async (data) => {
          if (data.rates === undefined) return;
          if (data.rates.length === 0) return;
          let total = data.rates.length;
          console.log("total review " + total);
          await Property.findByIdAndUpdate(item.id, {total_review: total});
        });
      });
    })
    .catch((err) => {
      console.log(err);
    });
}
setInterval(calculateTotalReview, 300000); //every 5 minute
