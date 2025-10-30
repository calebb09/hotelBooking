// const Booking = require("../models/booking");
// const chapaSore = require("../models/chapaStore");

const Room = require("../models/rooms");
// const Client = require("../models/client");
const SubRoom = require("../models/subRoomType");
const sendMessage = require("../functions/sendMessage");
const chapaDirectPay = require("../functions/chapaPayment");

async function acceptBooking(
  txtID,
  payment_type,
  phone,
  room,
  email,
  firstName,
  lastName,
  userUid,
  serviceCharge,
  bookingDetail
) {
  let roomDetail = [];
  for (let i = 0; i < room.length; i++) {
    let room_doc = await Room.findOne({
      $and: [{_id: room[i]}, {status: "available"}],
    }).populate([{path: "subRoomType", model: SubRoom, select: "price_info"}]);
    room_doc === null ? roomDetail.push() : roomDetail.push(room_doc);
  }
  if (roomDetail.includes(undefined)) {
    return {status: "failed", message: "One of the rooms is not available"};
  }

  if (payment_type === "chapaPay") {
    const startRequest = await chapaDirectPay(
      payment_type,
      phone,
      roomDetail,
      userUid,
      serviceCharge,
      txtID,
      email,
      firstName,
      lastName,
      bookingDetail
    );
    if (startRequest.status === "success") {
      // notify the user
      const message = {
        notification: {
          title: "Booking Request Accepted",
          body: `Dear ${firstName}!
          
          Your booking request has been accepted. Please complete your payment to confirm your booking ASAP before it expires.
          Please use this link to pay ${startRequest.checkOut}`,
        },
      };
      sendMessage(message, userUid, roomDetail[0].accommodation, "to", email);
      return {status: "good"};
    } else {
      console.log(startRequest);
      return {status: "failed", message: "Payment initiation failed"};
    }
  } else {
    // notify the user
    const message = {
      notification: {
        title: "Booking Request Accepted",
        body: `Dear ${firstName}!
          
          Your booking request has been accepted. Please complete your payment to confirm your booking ASAP before it expires.
          Please use this link to pay https://gojobooking.com/my-bookings?id=${txtID}`,
      },
    };
    sendMessage(message, userUid, roomDetail[0].accommodation, "to", email);
    return {status: "good"};
  }
}
module.exports = acceptBooking;
