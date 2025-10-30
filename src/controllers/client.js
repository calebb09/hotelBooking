const firebase = require("firebase-admin"),
  ClientDal = require("../dal/client"),
  BookingDal = require("../dal/booking"),
  Client = require("../models/client"),
  Location = require("../models/location"),
  sendMessage = require("../functions/sendMessage");
exports.validateClient = function Client(req, res, next, id) {
  //Validate the id in mongoid or not
  req.checkParams("id", "Invalid param").isMongoId(id);
  var validationErrors = req.validationErrors();
  if (validationErrors) {
    res.status(404).json({
      error: true,
      message: "Wrong ID is Passed",
      status: 404,
    });
  } else {
    ClientDal.get(
      {
        _id: id,
      },
      function (err, doc) {
        if (doc._id) {
          req.doc = doc;
          next();
        } else {
          res.status(404).json({
            error: true,
            status: 404,
            msg: "ClientDal _id " + id + " not found",
          });
        }
      }
    );
  }
};
exports.fetch = (req, res, next) => {
  let query = {};
  let page = req.query.page * 1 || 1;
  let limit = req.query.limit * 1 || 20;
  let queryOpts = {
    page: page,
    limit: limit,
    sort: {_id: -1},
  };
  try {
    ClientDal.getCollectionByPagination(query, queryOpts, (err, doc) => {
      if (err) {
        return next(err);
      }
      res.status(200).json({
        data: doc.docs.docs,
        limit: limit,
        skip: page,
        total: doc.docs.total,
      });
    });
  } catch (err) {
    res.status(500).json({msg: "error occured " + err});
  }
};
exports.viewProfile = (req, res, next) => {
  ClientDal.get({uuid: req.user.uuid}, async (err, client_doc) => {
    if (err) {
      return next(err);
    }
    await firebase.auth().setCustomUserClaims(req.user.uuid, {
      picture: client_doc.picture,
      name: client_doc.full_name,
      role: "client",
    });
    res.status(200).json(client_doc);
  });
};
exports.bookingHistory = async (req, res, next) => {
  let clientProfile = await Client.findOne({uuid: req.user.uuid});
  let page = req.query.page * 1 || 1;
  let limit = req.query.limit * 1 || 20;
  let query = {"created_by.client": clientProfile.id};
  let queryOpts = {
    page: page,
    limit: limit,
    sort: {_id: -1},
  };
  try {
    await firebase.auth().setCustomUserClaims(req.user.uuid, {
      picture: clientProfile.picture,
      name: clientProfile.full_name,
    });
    BookingDal.getCollectionByPagination(query, queryOpts, (err, doc) => {
      if (err) {
        return next(err);
      }
      res.status(200).json({
        data: doc.docs.docs,
        limit: limit,
        skip: page,
        total: doc.docs.total,
      });
    });
  } catch (e) {
    res.status(500).json({
      msg: "Error Occured" + e,
      status: 500,
    });
  }
};
exports.fetchOne = (req, res, next) => {
  res.status(200).json(req.doc);
};
exports.verifyEmail = (req, res, next) => {
  ClientDal.getCollection({email: req.query.email}, {}, (err, doc) => {
    if (err) return next(err);
    console.log(doc);
    doc.length > 0
      ? ClientDal.update(
          {_id: doc[0].id},
          {is_email_verified: true, updated_at: new Date()},
          (err, update_document) => {
            if (err) {
              return next(err);
            }

            res.status(200).json({
              msg: "Successful",
            });
          }
        )
      : res.status(400).json({msg: "unknown emailId"});
  });
};
exports.checkClient = (req, res, next) => {
  let arr = [];
  let query = {
    phone: req.body.phone ? req.body.phone : undefined,
    email: req.body.email ? req.body.email : undefined,
  };
  if (query.phone === undefined) {
    delete query.phone;
  }
  if (query.email === undefined) {
    delete query.email;
  }
  ClientDal.getCollection(query, {}, async function (err, result) {
    if (err) return next(err);
    if (result.length > 0) {
      if (result[0].account_created_with_email === undefined) {
        arr.push("success", 200, result[0]);
      } else {
        if (result[0].is_email_verified === undefined) {
          arr.push("email not verified", 400, result[0]);
        } else {
          arr.push("success", 200, result[0]);
        }
      }
      await firebase.auth().setCustomUserClaims(result[0].uuid, {
        picture: result[0].picture,
        name: result[0].full_name,
        role: "client",
      });
    } else {
      arr.push("user not found", 400, null);
    }
    res.status(arr[1]).json({msg: arr[0], status: arr[1], data: arr[2]});
  });
};
exports.register = (req, res, next) => {
  let body = req.body;
  let query = {uuid: req.body.uuid};
  ClientDal.getCollection(query, {}, (err, doc) => {
    if (err) {
      return next(err);
    }
    var profile_image = "";
    if (req.body.picture == undefined || req.body.picture == "") {
      profile_image = "uploads/default_profile.png";
    } else {
      profile_image = req.body.picture;
    }
    doc.length > 0
      ? res.status(400).json({msg: "client already exist"})
      : ClientDal.create(body, async (err, create_doc) => {
          if (err) {
            return next(err);
          }
          if (create_doc) {
            await firebase.auth().setCustomUserClaims(body.uuid, {
              picture: profile_image,
              name: body.full_name,
              role: "client",
            });
            if (body.email === undefined) {
              res.status(201).json({msg: "created successfully"});
            } else {
              await Client.updateOne(
                {_id: create_doc.id},
                {account_created_with_email: true, updated_at: new Date()}
              );
              /** send email */
              var reset_link_address =
                "https://gojobooking.com/auth/verify-email";
              let fName = body.full_name.split(" "),
                giveName = fName[0];
              let message = {
                notification: {
                  title: "Verify Email",
                  body:
                    "Dear " +
                    giveName +
                    ".\n\n Congratulations on your successful registration at GojoBooking website. Please click the following link to activate your account \n" +
                    reset_link_address +
                    "?email=" +
                    body.email +
                    "\n\nYou recieved this email because you registered on GojoBooking website",
                },
              };
              sendMessage(message, null, null, "to", body.email);
              res.status(201).json({msg: "created successfully"});
            }
          } else {
            res.status(400).json({msg: "account not created"});
          }
        });
  });
};
exports.saveLocation = async (req, res) => {
  try {
    var body = req.body;
    const getClient = await Client.find({uuid: req.user.uuid});
    const input = Object.assign(body, {user: getClient[0].id});
    if (getClient.length > 0) {
      const checkLocation = await Location.find({user: getClient[0].id});
      if (checkLocation.length > 0) {
        // const input = {...body, user: getClient.id};
        const updateLocation = await Location.findOneAndUpdate(
          {_id: checkLocation[0].id},
          {$set: {location: body.location}}, // Update the location field,
          {new: true}
        );
        console.log(updateLocation);
        updateLocation
          ? res.status(200).json({msg: "location updated"})
          : res.status(400).json({msg: "location not updated"});
      } else {
        const newLocation = new Location(input);
        await newLocation.save();

        newLocation
          ? res.status(200).json({msg: "location saved"})
          : res.status(400).json({msg: "location not saved"});
      }
    } else {
      return res.status(404).json({msg: "user does not exist"});
    }
  } catch (error) {
    console.error(`error saving location ${error}`);
  }
};
exports.update = (req, res, next) => {
  let body = req.body;
  ClientDal.update({uuid: req.user.uuid}, body, async (err, update_doc) => {
    if (err) {
      return next(err);
    }
    await firebase.auth().setCustomUserClaims(req.user.uuid, {
      picture: update_doc.picture,
      name: update_doc.full_name,
      role: "client",
    });
    res.status(200).json({msg: "updated", statuts: 200, doc: update_doc});
  });
};
exports.deleteClient = async (req, res, next) => {
  let client_doc = await Client.findOne({_id: req.doc._id});
  await firebase
    .auth()
    .deleteUser(client_doc.uuid)
    .then(() =>
      ClientDal.delete({_id: req.doc._id}, (err, removed_doc) => {
        if (err) return next(err);
        BookingDal.getCollection(
          {"created_by.client": req.doc._id},
          {},
          (err, doc) => {
            if (err) {
              return next(err);
            }
            if (doc.length > 0) {
              doc.map((item) => {
                BookingDal.delete({_id: item.id}, (err, remove_booked_docs) => {
                  if (err) return next(err);
                });
              });
            }
          }
        );
        removed_doc
          ? res.status(200).json({msg: "client removed"})
          : res.status(400).json({msg: "client not removed"});
      })
    )
    .catch((error) => console.log("error deleting user from firebase:", error));
};
