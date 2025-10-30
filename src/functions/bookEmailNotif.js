const hbs = require("nodemailer-express-handlebars");
const path = require("path");
const Config = require("../../config");
// const DeviceDal = require("../dal/device");
// const NotifiDal = require("../dal/notification");

exports = module.exports = function (
  name,
  accommodationInfo,
  bookingDetail,
  email
) {
  if (email !== "") {
    const dateDifference = getDateDifference(
      new Date(Config.DATE_READABLE(bookingDetail.checkIn)),
      new Date(Config.DATE_READABLE(bookingDetail.checkOut))
    );
    let mailOpts = {
      from: `"Gojo Booking" <${Config.GOJO_EMAIL_USER}>`,
      to: email, //receiver email address
      subject: "Booking detail from GojoBooking",
      template: "booking", // the name of the template file i.e email.handlebars
      context: {
        reservation_info: dateDifference + " night[s] ",
        user_name: name,
        hotel_name: accommodationInfo.name,
        hotel_address: accommodationInfo.address.street_address,
        hotel_phone: accommodationInfo.address.phoneAddress,
        hote_email: accommodationInfo.address.emailAddress,
        checkIn: Config.DATE_READABLE(bookingDetail.checkIn),
        checkOut: Config.DATE_READABLE(bookingDetail.checkOut),
        guests: bookingDetail.guests,
        payment_status: bookingDetail.is_paid,
        payment_detail: bookingDetail.transaction?.toObject?.() || null,
        total_room_booked: bookingDetail.room.length,
        copyRightYear: new Date().getFullYear(),
      },
    };
    // point to the template folder
    const handlebarOptions = {
      viewEngine: {
        extName: ".handlebars",
        partialsDir: path.resolve(__dirname, "../../templates/views"),
        defaultLayout: false,
        helpers: {
          uppercase: function (str) {
            return (str || "").toUpperCase();
          },
          formatAmount: function (amount) {
            if (typeof amount === "number") {
              return amount.toLocaleString("en-US", {
                minimumFractionDigits: 2,
                maximumFractionDigits: 2,
              });
            }
            return amount;
          },
        },
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
};

// Function to calculate the difference in days
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
