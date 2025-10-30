/** if both level and discount exists */
const Property = require("../models/accommodation");
// async function discountAndLevelLocalDirectPay(data, level, currency) {
//   let totalPrice = 0;
//   let additionalFee = 0;
//   data.forEach((item) => {
//     const priceInfo = item.subRoomType.price_info;
//     let price = priceInfo.original_price;
//     let levelAdjustedPrice = price;
//     let discountAdjustedPrice = price;

//     if (level !== "20%") {
//       const levelPercent = parseFloat(level) / 100;
//       const adjustedCommission = priceInfo.commissionAmount * levelPercent;
//       levelAdjustedPrice = priceInfo.commissionAmount - adjustedCommission;
//     }

//     if (priceInfo.has_discount === true) {
//       discountAdjustedPrice = priceInfo.discountInfo.original_price;
//     }

//     if (level !== "20%" && priceInfo.has_discount === true) {
//       // If both level and discount exist, add the additional fee after calculating the adjusted price
//       price = discountAdjustedPrice + levelAdjustedPrice;
//     } else if (level !== "20%") {
//       price = levelAdjustedPrice;
//     } else if (priceInfo.has_discount === true) {
//       price = discountAdjustedPrice;
//     }

//     if (level !== "20%" || priceInfo.has_discount === true) {
//       if (currency === "USD") {
//         additionalFee = priceInfo.discountInfo.actual_price;
//       } else if (currency === "ETB") {
//         // let toBirr = price * getConversionRate.data[0].rate;
//         additionalFee = price;
//       }
//       price += additionalFee;
//     }
//     totalPrice += price;
//   });

//   return totalPrice;
// }
/** if only discount appears but not level */
/** Calculate total price considering discounts, breakfast, and refundable options */
async function ifonlydiscountLocaldirectPay(data, booking) {
  let totalPrice = 0;

  data.forEach((item) => {
    const priceInfo = item.subRoomType.price_info;
    let price = priceInfo.original_price;

    // Check if discount exists
    if (priceInfo.has_discount === true) {
      price = priceInfo.discountInfo.original_price;
    }

    // Check if item.id matches any ID in withBreakFast
    if (booking.withBreakFast && booking.withBreakFast.length > 0) {
      const hasBreakfast = booking.withBreakFast.some(
        (roomId) => roomId.toString() === item.id.toString()
      );
      if (hasBreakfast && priceInfo.breakfast_price) {
        price += priceInfo.breakfast_price;
      }
    }

    // Check if item.id matches any ID in withRefundable
    if (booking.withRefundable && booking.withRefundable.length > 0) {
      const isRefundable = booking.withRefundable.some(
        (roomId) => roomId.toString() === item.id.toString()
      );
      if (isRefundable && priceInfo.refundable_price) {
        price += priceInfo.refundable_price;
      }
    }

    totalPrice += price;
  });

  return totalPrice;
}

/** display the total room price for the accommodation */
function totalRoomPrice(data, booking) {
  let totalPrice = 0;
  data.forEach((item) => {
    const priceInfo = item.subRoomType.price_info;
    let price = priceInfo.room_price;

    // Check if discount exists
    if (priceInfo.has_discount === true) {
      price = priceInfo.discountInfo.room_price;
    }

    // Check if item.id matches any ID in withBreakFast
    if (booking?.withBreakFast?.length > 0) {
      const hasBreakfast = booking.withBreakFast.some(
        (roomId) => roomId.toString() === item.id.toString()
      );
      if (hasBreakfast && priceInfo.breakfast_price) {
        price += priceInfo.breakfast_price;
      }
    }

    // Check if item.id matches any ID in withRefundable
    if (booking?.withRefundable?.length > 0) {
      const isRefundable = booking.withRefundable.some(
        (roomId) => roomId.toString() === item.id.toString()
      );
      if (isRefundable && priceInfo.refundable_price) {
        price += priceInfo.refundable_price;
      }
    }

    totalPrice += price;
  });
  return totalPrice;
}

async function calculatePriceInfo(
  basePrice,
  commissionPercentStr,
  discountStr = "0%",
  refundable,
  breakfast,
  accommodationId
) {
  const hotelInfo = await Property.findById(accommodationId);
  const commissionPercent = parseFloat(commissionPercentStr) / 100;
  const discountPercent = parseFloat(discountStr) / 100;

  const original_price = basePrice;
  const commissionAmount = original_price * commissionPercent;
  const room_price = original_price - commissionAmount;
  const actual_price = roundToTwo(original_price * 1.029 + 0.3); // Stripe fee

  let price_info = {
    discount: discountStr,
    original_price,
    room_price,
    commissioninPercent: commissionPercentStr,
    commissionAmount,
    actual_price,
    refundable_price:
      refundable === true
        ? hotelInfo.refundable.amount === undefined
          ? 0
          : hotelInfo.refundable.amount
        : 0,
    breakfast_price:
      breakfast === true
        ? hotelInfo.breakfast_price === undefined
          ? 0
          : hotelInfo.breakfast_price
        : 0,
    has_discount: false,
    discountInfo: null,
  };

  // If discount > 0
  if (discountPercent > 0) {
    const discounted_original = roundToTwo(
      original_price - original_price * discountPercent
    );
    const discounted_room_price = roundToTwo(
      discounted_original - commissionAmount
    );
    const discounted_actual_price = roundToTwo(
      discounted_original * 1.029 + 0.3
    );

    price_info.has_discount = true;
    price_info.discountInfo = {
      original_price: discounted_original,
      room_price: discounted_room_price,
      actual_price: discounted_actual_price,
    };
  }

  return price_info;
}

function getTotalRoomPrice(data) {
  let total = 0;
  for (const item of data) {
    total += item.price_info.original_price;
  }
  return total;
}
/** display the total Commission */
function totalCommission(data, level) {
  let totalPrice = 0;

  data.forEach((item) => {
    const priceInfo = item.subRoomType.price_info;
    let price = priceInfo.commissionAmount;
    if (level !== "20%") {
      const levelPercent = parseInt(level) / 100;
      const adjustedCommission =
        priceInfo.commissionAmount - priceInfo.commissionAmount * levelPercent;
      price = adjustedCommission;
    }
    totalPrice += price;
  });

  return totalPrice;
}
// Function to generate a unique alphanumeric string
function generateUniqueAlphanumericString(length) {
  const characters =
    "abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789";
  const uniqueStrings = new Set();

  while (true) {
    let string = "";
    for (let i = 0; i < length; i++) {
      string += characters.charAt(
        Math.floor(Math.random() * characters.length)
      );
    }

    if (!uniqueStrings.has(string)) {
      uniqueStrings.add(string);
      return string;
    }
  }
}

// the following is for wallet
function calculateTotalCost4Wallet(data, booking) {
  let totalPrice = 0;

  data.forEach((item) => {
    const priceInfo = item.subRoomType.price_info;
    let price = priceInfo.original_price;

    // Check if discount exists
    if (priceInfo.has_discount === true) {
      price = priceInfo.discountInfo.original_price;
    }

    // Check if item.id matches any ID in withBreakFast
    if (booking.withBreakFast && booking.withBreakFast.length > 0) {
      const hasBreakfast = booking.withBreakFast.some(
        (roomId) => roomId.toString() === item.id.toString()
      );
      if (hasBreakfast && priceInfo.breakfast_price) {
        price += priceInfo.breakfast_price;
      }
    }

    // Check if item.id matches any ID in withRefundable
    if (booking.withRefundable && booking.withRefundable.length > 0) {
      const isRefundable = booking.withRefundable.some(
        (roomId) => roomId.toString() === item.id.toString()
      );
      if (isRefundable && priceInfo.refundable_price) {
        price += priceInfo.refundable_price;
      }
    }

    totalPrice += price;
  });
  return totalPrice;
}

function calculateTotalCommission4Wallet(data, level) {
  let totalPrice = 0;
  data.forEach((item) => {
    const priceInfo = item.subRoomType.price_info;
    let price = priceInfo.commissionAmount;

    if (level !== "20%") {
      const discountPercent = parseFloat(level) / 100;
      price =
        priceInfo.commissionAmount -
        priceInfo.commissionAmount * discountPercent;
    }
    totalPrice += price;
  });

  return totalPrice;
}
function calculateTotalRoomPrice4Wallet(data, booking) {
  let totalPrice = 0;
  data.forEach((item) => {
    const priceInfo = item.subRoomType.price_info;
    let price = priceInfo.room_price;

    // Check if discount exists
    if (priceInfo.has_discount === true) {
      price = priceInfo.discountInfo.room_price;
    }

    // Check if item.id matches any ID in withBreakFast
    if (booking?.withBreakFast?.length > 0) {
      const hasBreakfast = booking.withBreakFast.some(
        (roomId) => roomId.toString() === item.id.toString()
      );
      if (hasBreakfast && priceInfo.breakfast_price) {
        price += priceInfo.breakfast_price;
      }
    }

    // Check if item.id matches any ID in withRefundable
    if (booking?.withRefundable?.length > 0) {
      const isRefundable = booking.withRefundable.some(
        (roomId) => roomId.toString() === item.id.toString()
      );
      if (isRefundable && priceInfo.refundable_price) {
        price += priceInfo.refundable_price;
      }
    }

    totalPrice += price;
  });
  return totalPrice;
}

function roundToTwo(num) {
  return Math.round(num * 100) / 100;
}
module.exports = {
  getTotalRoomPrice,
  ifonlydiscountLocaldirectPay,
  calculatePriceInfo,
  totalRoomPrice,
  totalCommission,
  generateUniqueAlphanumericString,
  calculateTotalCost4Wallet,
  calculateTotalCommission4Wallet,
  calculateTotalRoomPrice4Wallet,
};
