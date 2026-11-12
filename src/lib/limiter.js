// middleware/rateLimiter.js
const {rateLimit, ipKeyGenerator} = require("express-rate-limit");

// Define a general rate limiter
const generalLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 2, // Limit each IP to 2 requests per windowMs
  standardHeaders: true, // Return rate limit info in the `RateLimit-*` headers
  legacyHeaders: false, // Disable the `X-RateLimit-*` headers
  message: {
    status: 429,
    error: "Too many requests",
    details:
      "You have exceeded the maximum number of requests. Please wait 10 minutes and try again.",
  },
  handler: (req, res) => {
    res.status(429).json({
      status: 429,
      msg: "Too many requests, try again later.",
    });
  },
});

// Define a login rate limiter (more strict)
const loginLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 5, // Limit each IP to 5 requests per windowMs
  standardHeaders: true, // Return rate limit info in the `RateLimit-*` headers
  legacyHeaders: false, // Disable the `X-RateLimit-*` headers
  message: {
    status: 429,
    error: "Too many requests",
    details:
      "You have exceeded the maximum number of requests. Please wait 10 minutes and try again.",
  },
  handler: (req, res) => {
    res.status(429).json({
      status: 429,
      msg: "Too many requests, try again later.",
    });
  },
});

const walletRechargeLimiter = rateLimit({
  windowMs: 45 * 60 * 1000, // 45 minutes
  max: 1,
  message: "You have reached limit, please come back after 45 minutes",
  keyGenerator: (req) => {
    // Use user ID if logged in, otherwise fall back to safe IP key generator
    return req.user?.uid || ipKeyGenerator(req);
  },
});

module.exports = {
  generalLimiter,
  loginLimiter,
  walletRechargeLimiter,
};
