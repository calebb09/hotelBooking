const bodyParser = require("body-parser");

// module.exports = {
//   json: bodyParser.json(),
//   urlencoded: bodyParser.urlencoded({extended: true}),
// };

module.exports = {
  json: bodyParser.json({
    verify: (req, res, buf) => {
      if (req.originalUrl === "/backend/v3/api/chapa/webhook") {
        req.rawBody = buf;
      }
    },
  }),

  urlencoded: bodyParser.urlencoded({
    extended: true,
    verify: (req, res, buf) => {
      if (req.originalUrl === "/backend/v3/api/chapa/webhook") {
        req.rawBody = buf;
      }
    },
  }),
};
