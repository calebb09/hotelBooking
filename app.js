const https = require("https");
// const http = require("http");
const express = require("express");
const morgan = require("morgan");
const socketEvents = require("./src/lib/socketEvents");
const routes = require("./src/routes");
const config = require("./config");
const ssl = require("./config/ssl");
const connectDB = require("./config/db");
const multerMiddleware = require("./src/middleware/multer");
const bodyParserMiddleware = require("./src/middleware/bodyParser");
const errorHandler = require("./src/middleware/errorHandler");
const basicAuth = require("express-basic-auth");
const swaggerUi = require("swagger-ui-express");
const swaggerJSDOC = require("swagger-jsdoc");
const {startCronJobs} = require("./src/jobs/");
const fireadmin = require("firebase-admin");
const serviceAccount = require(`./config/firebase/${config.SERVICE_ACCT}`);
// const ipWhitelist = require("./middleware/ipWhitelist.js");
const cors = require("cors");
// Firebase
fireadmin.initializeApp({
  credential: fireadmin.credential.cert(serviceAccount),
});

// DB Connection
connectDB();

// Express app
const app = express();
app.disable("x-powered-by");
app.set("port", config.PORT);

// =======================
// ENABLE CORS
// =======================
app.use(cors(config.CORS_OPTS));
// 👇 Serve uploaded files
app.use("/public", express.static("public"));
// Middlewares
app.use(morgan("dev"));
app.use(bodyParserMiddleware.json);
app.use(bodyParserMiddleware.urlencoded);
app.use(multerMiddleware.any());
// app.use(ipWhitelist); // IP Whitelist Middleware
app.use(express.static("public"));
const swaggerOptions = require("./config/swagger");
const specs = swaggerJSDOC(swaggerOptions);
app.use(
  "/api-docs",
  basicAuth({users: {CDIWORK: config.SWAGGER_PASS}, challenge: true}),
  swaggerUi.serve,
  swaggerUi.setup(specs),
);

// Routes
routes(app);

// 404 handler
app.use((req, res, next) =>
  next(Object.assign(new Error("Resource Requested Not Found"), {status: 404})),
);

// Error handler
if (config.ENV === "development") app.use(errorHandler.development);
else app.use(errorHandler.production);

// HTTPS server
const server = https.createServer(ssl, app);
// const server = http.createServer(app);

// Socket.io
const io = require("socket.io")(server, {cors: {origin: "*"}});
socketEvents(io);

// Start server
server.listen(config.PORT);
server.on("error", (err) => console.error(err));
server.on("listening", () =>
  console.log(`Server listening on port ${config.PORT}`),
);

// Start cron jobs
startCronJobs();

module.exports = app;
