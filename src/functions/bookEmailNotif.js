/// the new code

const fs = require("fs");
const path = require("path");
const handlebars = require("handlebars");
const axios = require("axios");
const Config = require("../../config"); // Assuming this is still needed for any config, but adjust if not

exports = module.exports = async function (
  name,
  accommodationInfo,
  bookingDetail,
  email
) {
  // Skip if no email
  if (!email || email.length === 0) return;

  // Calculate date difference
  const dateDifference = getDateDifference(
    new Date(Config.DATE_READABLE(bookingDetail.checkIn)),
    new Date(Config.DATE_READABLE(bookingDetail.checkOut))
  );

  // ---------------- Render Handlebars template ----------------
  let htmlBody = "";
  try {
    const templatePath = path.resolve(
      __dirname,
      "../templates/views/booking.handlebars" // Assuming booking-specific template; adjust path if needed
    );
    const source = fs.readFileSync(templatePath, "utf8");
    const template = handlebars.compile(source);

    // Register helpers similar to sendMessage if needed, plus booking-specific ones
    handlebars.registerHelper("newlineToBr", function (text) {
      const escapedText = handlebars.escapeExpression(text);
      return new handlebars.SafeString(escapedText.replace(/\n/g, "<br>"));
    });
    handlebars.registerHelper("eq", function (a, b) {
      return a === b;
    });
    handlebars.registerHelper("uppercase", function (str) {
      return (str || "").toUpperCase();
    });
    handlebars.registerHelper("formatAmount", function (amount) {
      if (typeof amount === "number") {
        return amount.toLocaleString("en-US", {
          minimumFractionDigits: 2,
          maximumFractionDigits: 2,
        });
      }
      return amount;
    });

    htmlBody = template({
      reservation_info: dateDifference + " night[s] ",
      user_name: name,
      hotel_name: accommodationInfo.name,
      hotel_address: accommodationInfo.address.street_address,
      hotel_phone: accommodationInfo.address.phoneAddress,
      hote_email: accommodationInfo.address.emailAddress, // Note: typo in original 'hote_email'
      checkIn: Config.DATE_READABLE(bookingDetail.checkIn),
      checkOut: Config.DATE_READABLE(bookingDetail.checkOut),
      guests: bookingDetail.guests,
      payment_status: bookingDetail.is_paid,
      payment_detail: bookingDetail.transaction?.toObject?.() || null,
      total_room_booked: bookingDetail.room.length,
      copyRightYear: new Date().getFullYear(),
    });
  } catch (err) {
    console.error(
      "🚨 Error rendering Handlebars template for booking:",
      err.message
    );
    return; // Exit early on template error
  }

  // ---------------- Send email via PHP ----------------
  try {
    const payload = {
      token: process.env.GOJO_EMAIL_SECRET,
      subject: "Booking detail from GojoBooking",
      message: htmlBody,
      to: email, // Direct to recipient
    };

    const phpMailerUrl = `${process.env.GOJO_LIVE_URL}/sendEmail.php`;
    const res = await axios.post(phpMailerUrl, payload);

    if (res.data.success) {
      console.log("✅ Booking email sent successfully via cPanel PHP");
    } else {
      console.error("❌ PHP mailer failed for booking email:", res.data.error);
    }
  } catch (err) {
    console.error("🚨 Error sending booking email via PHP:", err);
  }
};

// Function to calculate the difference in days (unchanged)
function getDateDifference(date1, date2) {
  // Ensure dates are valid
  if (isNaN(date1.getTime()) || isNaN(date2.getTime())) {
    console.error("Invalid date format. Please provide valid dates.");
    return;
  }
  // Get the difference in milliseconds
  const diffInMs = Math.abs(date2 - date1);
  // Convert milliseconds to days and round down to exclude partial days
  const days = Math.floor(diffInMs / (1000 * 60 * 60 * 24));
  return days;
}
