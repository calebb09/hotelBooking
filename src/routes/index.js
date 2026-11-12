"use strict";
const debug = require("debug")("api:routes");
const pkg = require("../../package.json");
const v1Router = require("./v1");
const v2Router = require("./v2");
const v3Router = require("./v3");
const config = require("../../config");

module.exports = function (app) {
  app.use("/v1", v1Router);
  app.use("/v2", v2Router);
  app.use("/v3", v3Router);
  app.get("/", function (req, res) {
    res.json({
      name: pkg.name,
      version: pkg.version,
      description: pkg.description,
      documentation: config.API_URL,
      uptime: process.uptime() + "s",
    });
  });

  debug("routes loaded");
};

// OPEN ENDPOINTS
module.exports.OPEN_ENDPOINTS = [
  /\/media\/.*/,
  /\/documentation\/.*/,
  /\/profilePicByAdmin\/.*/,
  /\/guaranteeDocbyAdmin\/.*/,
  /\/helperIDbyAdmin\/.*/,
  /\/otherDocbyAdmin\/.*/,
  "/",
];
