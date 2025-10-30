const axios = require("axios");
const config = require("../../config");
const post2telegram = async function (
  title,
  description,
  channel,
  notification_status,
  hotelPicture
) {
  let telegramBody = `<b>Name:</b> ${title}\n\n<b>Description:</b> ${description}`;
  let telegram_url = `${config.TELEGRAM_URL}/${config.TELEGRAM_API}/sendMessage?chat_id=${channel}&text=${telegramBody}&parse_mode=html&disable_notification=${notification_status}`;
  let output = [];
  await axios
    .post(telegram_url)
    .then((data) => {
      data.data.ok === true
        ? output.push(201, "ok", "posted on telegram")
        : output.push(400, "bad", "unknown error occured");
    })
    .catch((error) => {
      output.push(500, "bad", error);
    });
  return output;
};

module.exports = post2telegram;
