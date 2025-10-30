const Room = require("../models/rooms");
const SubRoom = require("../models/subRoomType");
const {currencyConvert} = require("../services/chapa");
const {
  calculateTotalCost4Wallet,
  calculateTotalCommission4Wallet,
  calculateTotalRoomPrice4Wallet,
} = require("../functions/calculation");

async function showPrice(rooms, currency, level, booking) {
  const getConversionRate = await currencyConvert();

  const roomInfo = [];

  for (let i = 0; i < rooms.length; i++) {
    const getRoomdetail = await Room.findById(rooms[i]).populate({
      path: "subRoomType",
      model: SubRoom,
      select: "price_info",
    });
    roomInfo.push(getRoomdetail);
  }

  if (currency === "USD") {
    return {
      status: "ok",
      statusCode: 200,
      price: {
        totalPrice: calculateTotalCost4Wallet(roomInfo, booking),
        hotelShare: calculateTotalRoomPrice4Wallet(roomInfo, booking),
        gojoShare: calculateTotalCommission4Wallet(roomInfo, level),
      },
    };
  } else if (currency === "ETB") {
    if (getConversionRate.status !== 200) {
      return {
        status: "bad",
        statusCode: 400,
        message: "rate conversion not available",
      };
    }
    let currentRate = getConversionRate.data[0].rate;
    return {
      status: "ok",
      statusCode: 200,
      price: {
        totalPrice: calculateTotalCost4Wallet(roomInfo, booking) * currentRate,
        hotelShare:
          calculateTotalRoomPrice4Wallet(roomInfo, booking) * currentRate,
        gojoShare:
          calculateTotalCommission4Wallet(roomInfo, level) * currentRate,
      },
    };
  }
}
module.exports = showPrice;
