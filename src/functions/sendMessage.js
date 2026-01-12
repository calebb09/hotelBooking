const fs = require("fs");
const path = require("path");
const handlebars = require("handlebars");
const axios = require("axios");
const Config = require("../../config");
const DeviceDal = require("../dal/device");
const NotifiDal = require("../dal/notification");
const Client = require("../models/client");
const fireadmin = require("firebase-admin");

exports = module.exports = async function (
  message,
  getUUID,
  accommodation,
  emailType,
  emailAddress
) {
  // ---------------- Handlebars helpers ----------------
  handlebars.registerHelper("newlineToBr", function (text) {
    const escapedText = handlebars.escapeExpression(text);
    return new handlebars.SafeString(escapedText.replace(/\n/g, "<br>"));
  });
  handlebars.registerHelper("eq", function (a, b) {
    return a === b;
  });

  // ---------------- Determine status ----------------
  let status = null;
  if (/successfully/i.test(message.notification.body)) {
    status = "success";
  } else if (/failed|cancelled/i.test(message.notification.body)) {
    status = "failed";
  }

  // ---------------- Skip if no email ----------------
  if (!emailAddress || emailAddress.length === 0) return;

  // ---------------- Render Handlebars template ----------------
  let htmlBody = "";
  try {
    const templatePath = path.resolve(
      __dirname,
      "../templates/views/email.handlebars"
    );
    const source = fs.readFileSync(templatePath, "utf8");
    const template = handlebars.compile(source);
    htmlBody = template({
      title: message.notification.title,
      body: message.notification.body,
      copyRightYear: new Date().getFullYear(),
      ...(status && {status}),
    });
  } catch (err) {
    console.error("🚨 Error rendering Handlebars template:", err.message);
  }

  // ---------------- Send email via PHP ----------------
  try {
    const payload = {
      token: process.env.GOJO_EMAIL_SECRET,
      subject: message.notification.title,
      message: htmlBody,
    };

    if (emailType === "bcc") {
      payload.to = "noreply@gojobooking.com"; // required To
      payload.bcc = emailAddress;
    } else {
      payload.to = emailAddress;
    }

    const phpMailerUrl = `${process.env.GOJO_LIVE_URL}/sendEmail.php`;
    const res = await axios.post(phpMailerUrl, payload);

    if (res.data.success) {
      console.log("✅ Email sent successfully via cPanel PHP");
    } else {
      console.error("❌ PHP mailer failed:", res.data.error);
    }
  } catch (err) {
    console.error("🚨 Error sending email via PHP:", err.message);
  }

  // ---------------- Save notification to DB ----------------
  if (Object.keys(message).length > 0) {
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
      message.notification.title !== "Reset Request for forgotten password" &&
      message.notification.title !== "Registered Successfully on GojoBooking"
    ) {
      NotifiDal.create(combination, function saveNotification(err) {
        if (err) console.error(err);
      });

      // ---------------- Firebase push notifications ----------------
      if (getUUID !== null) {
        DeviceDal.getCollection({uuid: getUUID}, {}, (err, devDOC) => {
          if (err) return console.error(err);
          if (devDOC.length > 0) {
            devDOC.forEach((data) => {
              fireadmin
                .messaging()
                .sendToDevice(
                  data.fcm_token,
                  message,
                  Config.FIREBASE_NOTE_OPTS
                )
                .then(() => console.log("Notification sent successfully"))
                .catch((error) => console.error(error));
            });
          }
        });
      }
    }
  }
};
