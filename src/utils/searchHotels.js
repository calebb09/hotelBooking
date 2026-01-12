const Property = require("../models/accommodation");
const subRoomType = require("../models/subRoomType");
const BookMdl = require("../models/booking");
const RoomMdl = require("../models/rooms");
const mongoose = require("mongoose");
const Facility = require("../models/facilities");
const lodgingType = require("../models/accommodation_type");
const User = require("../models/user");
const City = require("../models/city");

async function checkRoomBookingOverlap(
  accommodation,
  roomId,
  checkIn,
  checkOut
) {
  const existingBookings = await BookMdl.find({
    accommodation,
    room: roomId,
    checkIn: {$lt: checkOut},
    checkOut: {$gt: checkIn},
    status: {$in: ["pending", "reserved"]},
  });
  console.log(`Bookings for room ${roomId}: ${existingBookings.length}`, {
    accommodation,
    roomId,
    checkIn,
    checkOut,
  });
  return existingBookings.length > 0;
}
function getRoomCombinations(rooms, totalGuests, maxRooms = 4) {
  const combinations = [];

  function combine(
    currentCombo,
    start,
    remainingGuests,
    usedRoomIds = new Set()
  ) {
    if (remainingGuests <= 0 && currentCombo.length >= 2) {
      combinations.push([...currentCombo]);
      return;
    }
    for (let i = start; i < rooms.length; i++) {
      const room = rooms[i];
      const guestCapacity = room.subRoomType?.number_of_guests || 0;
      if (
        guestCapacity <= remainingGuests &&
        currentCombo.length < maxRooms &&
        !usedRoomIds.has(room._id.toString())
      ) {
        currentCombo.push(room);
        usedRoomIds.add(room._id.toString());
        combine(
          currentCombo,
          i + 1,
          remainingGuests - guestCapacity,
          usedRoomIds
        );
        currentCombo.pop();
        usedRoomIds.delete(room._id.toString());
      }
    }
  }

  combine([], 0, totalGuests);
  return combinations;
}
async function findAvailableAccommodations(
  city,
  checkIn,
  checkOut,
  totalGuests
) {
  // Convert city to ObjectId if it's stored as a reference
  let cityQuery = city;
  if (mongoose.isValidObjectId(city)) {
    cityQuery = new mongoose.Types.ObjectId(city);
  }

  // Retrieve all accommodations for the specified city
  const allAccommodations = await Property.find({
    "address.city": cityQuery,
  }).populate([
    {path: "facilities", model: Facility},
    {path: "lodging_type", model: lodgingType},
    {path: "created_by", model: User},
  ]);

  console.log(
    `All accommodations found for city ${city}: ${allAccommodations.length}`,
    allAccommodations.map((acc) => ({
      _id: acc._id,
      name: acc.name,
      city: acc.address?.city,
    }))
  );

  // Process each accommodation to check for available rooms
  const results = await Promise.all(
    allAccommodations.map(async (accommodation) => {
      console.log(
        `Processing accommodation ${accommodation.id}: ${accommodation.name}`
      );
      // Find subRoomType IDs for the accommodation
      const subRoomTypeIds = await subRoomType
        .find({accommodation: accommodation.id})
        .distinct("_id");
      console.log("subRoomTypeIds", subRoomTypeIds);
      console.log(
        `SubRoomTypes for accommodation ${accommodation._id}: ${subRoomTypeIds.length}`,
        subRoomTypeIds
      );

      if (!subRoomTypeIds.length) {
        return null;
      }

      // Retrieve all rooms for the accommodation with status "available"
      const allRooms = await RoomMdl.find({
        subRoomType: {$in: subRoomTypeIds},
        status: "available",
        is_hidden: false,
      }).populate({path: "subRoomType", model: subRoomType});

      console.log(
        `Rooms for accommodation ${accommodation._id}: ${allRooms.length}`,
        allRooms.map((room) => ({
          _id: room._id,
          room_number: room.room_number,
          number_of_guests: room.subRoomType?.number_of_guests,
          status: room.status,
          is_hidden: room.is_hidden,
        }))
      );

      // Filter out rooms with overlapping bookings
      const availableRooms = await Promise.all(
        allRooms.map(async (room) => {
          if (!room.subRoomType) {
            console.log(`Room ${room._id} has no valid subRoomType`);
            return null;
          }
          const isOverlapping = await checkRoomBookingOverlap(
            accommodation._id,
            room._id,
            checkIn,
            checkOut
          );
          return !isOverlapping ? room : null;
        })
      ).then((rooms) => rooms.filter(Boolean));

      console.log(
        `Available rooms for accommodation ${accommodation._id}: ${availableRooms.length}`,
        availableRooms.map((room) => ({
          _id: room._id,
          room_number: room.room_number,
          number_of_guests: room.subRoomType?.number_of_guests,
        }))
      );

      // Include individual rooms that can accommodate totalGuests
      const individualRooms = availableRooms.filter(
        (room) => (room.subRoomType?.number_of_guests || 0) >= totalGuests
      );

      console.log(
        `Individual rooms for accommodation ${accommodation._id}: ${individualRooms.length}`,
        individualRooms.map((room) => ({
          _id: room._id,
          room_number: room.room_number,
          number_of_guests: room.subRoomType?.number_of_guests,
        }))
      );

      // Generate combinations of rooms that can collectively accommodate totalGuests
      const roomCombinations = getRoomCombinations(availableRooms, totalGuests);

      console.log(
        `Combinations for accommodation ${accommodation._id}: ${roomCombinations.length}`,
        roomCombinations.map((combo) => ({
          room_ids: combo.map((room) => room._id),
          total_guests: combo.reduce(
            (sum, room) => sum + (room.subRoomType?.number_of_guests || 0),
            0
          ),
          total_price: combo.reduce(
            (sum, room) =>
              sum + (room.subRoomType?.price_info?.room_price || 0),
            0
          ),
        }))
      );

      // If no suitable rooms or combinations, return null to exclude accommodation
      if (individualRooms.length === 0 && roomCombinations.length === 0) {
        return null;
      }

      // Prepare the accommodation result
      const result = {
        ...accommodation.toObject(),
        options: [],
      };

      // Add single room options
      individualRooms.forEach((room) => {
        result.options.push({
          type: "single",
          room: {
            _id: room._id,
            room_number: room.room_number,
            number_of_guests: room.subRoomType?.number_of_guests || 0,
            room_price: room.subRoomType?.price_info?.room_price || 0,
          },
          totalCapacity: room.subRoomType?.number_of_guests || 0,
          totalPrice: room.subRoomType?.price_info?.room_price || 0,
        });
      });

      // Add combination options
      roomCombinations.forEach((combo) => {
        result.options.push({
          type: "combination",
          rooms: combo.map((room) => ({
            _id: room._id,
            room_number: room.room_number,
            number_of_guests: room.subRoomType?.number_of_guests || 0,
            room_price: room.subRoomType?.price_info?.room_price || 0,
          })),
          totalCapacity: combo.reduce(
            (sum, room) => sum + (room.subRoomType?.number_of_guests || 0),
            0
          ),
          totalPrice: combo.reduce(
            (sum, room) =>
              sum + (room.subRoomType?.price_info?.room_price || 0),
            0
          ),
        });
      });

      return result;
    })
  );

  return results.filter(Boolean);
}
module.exports = findAvailableAccommodations;
