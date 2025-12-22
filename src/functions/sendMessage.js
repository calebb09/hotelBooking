const hbsModule = require("nodemailer-express-handlebars");
const hbs = hbsModule.default;
const handlebars = require("handlebars");
const path = require("path");
const Config = require("../../config");
const DeviceDal = require("../dal/device");
const NotifiDal = require("../dal/notification");
const Notification = require("../models/notification");
const Client = require("../models/client");
const fireadmin = require("firebase-admin");
let mailOpts = {};
exports = module.exports = async function (
  message,
  getUUID,
  accommodation,
  emailType,
  emailAddress
) {
  handlebars.registerHelper("newlineToBr", function (text) {
    const escapedText = handlebars.escapeExpression(text);
    return new handlebars.SafeString(escapedText.replace(/\n/g, "<br>"));
  });
  handlebars.registerHelper("eq", function (a, b) {
    return a === b;
  });
  let status = null;
  // // Check if title contains 'withdrawal status' (case-insensitive)
  // if (/withdrawal status/i.test(message.notification.title)) {
  // Check if body contains 'successfully'
  if (/successfully/i.test(message.notification.body)) {
    status = "success";
  }
  // Check if body contains 'failed' or 'cancelled'
  else if (/failed|cancelled/i.test(message.notification.body)) {
    status = "failed";
  }

  let mailOptions = {
    from: `"Gojo Booking" <${Config.GOJO_EMAIL_USER}>`,
    // bcc: email_lists, //receiver email address
    subject: message.notification.title,
    template: "email", // the name of the template file i.e email.handlebars
    context: {
      title: message.notification.title,
      body: message.notification.body, // replace {{company}} with My Company
      copyRightYear: new Date().getFullYear(),
      ...(status && {status}), // only add status if it's set
    },
  };
  if (emailType === "bcc") {
    mailOpts = Object.assign(mailOptions, {bcc: emailAddress});
  } else {
    mailOpts = Object.assign(mailOptions, {to: emailAddress});
  }
  if (emailAddress.length === 0 || emailAddress === "") {
  } else {
    // point to the template folder
    const handlebarOptions = {
      viewEngine: {
        extName: ".handlebars",
        partialsDir: path.resolve(__dirname, "../../templates/views"),
        defaultLayout: false,
      },
      viewPath: path.resolve(__dirname, "../../templates/views"),
    };
    // use a template file with nodemailer
    Config.MAILER.use("compile", hbs(handlebarOptions));
    Config.MAILER.sendMail(mailOpts, function (error, info) {
      if (error) {
        console.log(error);
      } else {
        console.log("Email sent: " + info.response);
      }
    });
  }
  if (Object.keys(message).length === 0) {
  } else {
    let query_create = {
      title: message.notification.title,
      message: message.notification.body,
    };
    let combination = {};
    if (getUUID !== null) {
      let clientId = await Client.findOne({uuid: getUUID});
      combination = Object.assign(query_create, {
        "user_information.user": clientId,
        "user_information.user_type": ["user"],
      });
    }
    if (accommodation !== null) {
      combination = Object.assign(query_create, {
        "user_information.client": accommodation,
        "user_information.user_type": ["client"],
      });
    }
    if (
      message.notification.title !== "Reset Request for forgotten password" ||
      message.notification.title !== "Registered Successfully on GojoBooking"
    ) {
      const createNotifi = await Notification.create(combination);

      if (getUUID !== null) {
        DeviceDal.getCollection(
          {
            uuid: getUUID,
          },
          {},
          (err, devDOC) => {
            if (err) {
              return next(err);
            }
            if (devDOC.length > 0) {
              var registrationToken = "";
              devDOC.forEach((data) => {
                registrationToken = data.fcm_token;
                fireadmin
                  .messaging()
                  .sendToDevice(
                    registrationToken,
                    message,
                    Config.FIREBASE_NOTE_OPTS
                  )
                  .then((response) => {
                    //res.status(200).send("Notification sent successfully")
                    console.log("Notification sent successfully");
                  })
                  .catch((error) => {
                    console.log(error);
                  });
              });
            }
          }
        );
      }
    }
  }
};
