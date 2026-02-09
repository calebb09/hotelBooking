const cron = require("node-cron");
const subRoomTYpe = require("../models/subRoomType");
module.exports = () => {
  cron.schedule("0 0 7 * * *", async () => {
    // At 18:00 (6 PM) every day
    try {
      // feth all subroomtype and from that subroomtype if there is a discount change the original price
      const subRoomTypes = await subRoomTYpe.find({});
      for (const subRoom of subRoomTypes) {
        if (
          subRoom.price_info.timelydiscount &&
          subRoom.price_info.timelydiscount > "0%"
        ) {
          subRoom.price_info.discount_price = null;
          await subRoom.save();
          console.log(
            `Updated price for SubRoomType ${subRoom._id}: original Price = ${subRoom.price_info.original_price}`,
          );
        } else {
          // if no discount, set current price to original price
          console.log(
            `No discount for SubRoomType ${subRoom._id}: Price remains = ${subRoom.price_info.original_price}`,
          );
        }
      }
    } catch (error) {
      console.error(error);
    }
  });
};
