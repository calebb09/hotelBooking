const fs = require("fs");
const config = require("./");

const privateKey = fs.readFileSync(config.SSL_KEY, "utf8");
const certificate = fs.readFileSync(config.SSL_CRT, "utf8");

module.exports = {key: privateKey, cert: certificate};
