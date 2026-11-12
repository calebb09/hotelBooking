const whiteList = ["139.177.180.48"];

module.exports = (req, res, next) => {
  const requestIP = req.ip;
  const forwardedIP =
    req.headers["x-forwarded-for"] || req.connection.remoteAddress;

  if (whiteList.includes(requestIP) || whiteList.includes(forwardedIP)) {
    return next();
  }
  res.status(403).send("Access forbidden");
};
