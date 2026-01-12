const cron = require("node-cron");
const sendEmail = require("../functions/bookEmailNotif");
const sendMessage = require("../functions/sendMessage");
const BookingDal = require("../dal/booking");
const RoomDal = require("../models/rooms");

module.exports = () => {
  cron.schedule("0 0 12 * * *", async () => {
    try {
      const today = new Date();

      const sameDay = (a, b) =>
        a.getFullYear() === b.getFullYear() &&
        a.getMonth() === b.getMonth() &&
        a.getDate() === b.getDate();
      BookingDal.getCollection(
        {
          status: {$in: ["pending", "reserved", "checkedIn"]},
        },
        {},
        async (err, bookings) => {
          if (err) {
            console.error("Error fetching bookings:", err);
            return;
          }

          if (bookings.length === 0) return;

          for (const data of bookings) {
            const checkInDate = new Date(data.checkIn);
            const checkOutDate = new Date(data.checkOut);

            /** ============ CHECK-IN ============ */
            if (sameDay(today, checkInDate) && data.status === "reserved") {
              for (const room of data.room) {
                await RoomDal.updateOne(
                  {_id: room.id},
                  {status: "occupied", updated_at: new Date()}
                );
              }

              BookingDal.update(
                {_id: data._id},
                {status: "checkedIn", updated_at: new Date()},
                (err, document) => {
                  if (err) {
                    console.error("Error updating booking status:", err);
                  } else {
                    console.log(
                      "Booking status updated to checkedIn:",
                      document
                    );
                    const createdBy = data.created_by;
                    const name = createdBy.has_account
                      ? createdBy.client.full_name
                      : createdBy.guest.name;
                    const email = createdBy.has_account
                      ? createdBy.client.email
                      : createdBy.guest.email;

                    if (email) {
                      sendEmail(name, data.accommodation, data, email);
                    }
                  }
                }
              );
            }

            /** ============ CHECK-OUT ============ */
            if (sameDay(today, checkOutDate) && data.status === "checkedIn") {
              for (const room of data.room) {
                await RoomDal.updateOne(
                  {_id: room.id},
                  {status: "available", updated_at: new Date()}
                );
              }

              BookingDal.update(
                {_id: data._id},
                {status: "completed", updated_at: new Date()},
                (err, document) => {
                  if (err) {
                    console.error("Error updating booking status:", err);
                  } else {
                    console.log(
                      "Booking status updated to completed:",
                      document
                    );
                    const createdBy = data.created_by;
                    const name = createdBy.has_account
                      ? createdBy.client.full_name
                      : createdBy.guest.name;
                    const email = createdBy.has_account
                      ? createdBy.client.email
                      : createdBy.guest.email;
                    const userId = createdBy.has_account
                      ? createdBy.client.uuid
                      : null;

                    const message = {
                      notification: {
                        title: "Booking Completed",
                        body: `Dear ${name}!

                          Thank you for choosing ${data.accommodation.name} for your recent stay. We hope you had a comfortable experience.

                          We look forward to welcoming you back!

                           Sincerely,
                           ${data.accommodation.name}
                           Triplaye`,
                      },
                    };

                    sendMessage(message, userId, null, "to", email);
                  }
                }
              );
            }
          }

          console.log("✅ Daily booking cron executed successfully");
        }
      );
    } catch (err) {
      console.error("❌ Cron job failed:", err);
    }
  });
};
