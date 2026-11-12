const Booking = require("../models/booking");
const Client = require("../models/client");

const searchBookings = async (searchTerm, status, checkIn, checkOut) => {
  const query = {};

  // ✅ Filter by status if provided
  if (status) {
    query.status = status;
  }

  // ✅ Filter by date range if provided
  if (checkIn && checkOut) {
    query.checkIn = {$gte: new Date(checkIn)};
    query.checkOut = {$lte: new Date(checkOut)};
  } else if (checkIn) {
    query.checkIn = {$gte: new Date(checkIn)};
  } else if (checkOut) {
    query.checkOut = {$lte: new Date(checkOut)};
  }

  // ✅ Get bookings (don't filter by searchTerm yet, so client is always populated)
  let bookings = await Booking.find(query).populate({
    path: "created_by",
    populate: [
      {
        path: "client",
        model: Client,
        select: "full_name phone email",
      },
    ],
  });

  // ✅ If searchTerm provided, apply regex filter
  if (searchTerm) {
    const regex = new RegExp(searchTerm, "i");

    bookings = bookings.filter((b) => {
      if (b.created_by.has_account) {
        return (
          (b.created_by.client?.full_name &&
            regex.test(b.created_by.client.full_name)) ||
          (b.created_by.client?.phone &&
            regex.test(b.created_by.client.phone)) ||
          (b.created_by.client?.email && regex.test(b.created_by.client.email))
        );
      } else {
        return (
          (b.created_by.guest?.name && regex.test(b.created_by.guest.name)) ||
          (b.created_by.guest?.phone && regex.test(b.created_by.guest.phone)) ||
          (b.created_by.guest?.email && regex.test(b.created_by.guest.email))
        );
      }
    });
  }

  return bookings;
};

module.exports = searchBookings;
