var path = require("path");
const nodemailer = require("nodemailer");
const dotenv = require("dotenv").config();
const transporter = nodemailer.createTransport({
  host: dotenv.parsed.E_HOST,
  secure: true,
  port: dotenv.parsed.E_PORT,
  // service: dotenv.parsed.G_SERV,
  auth: {
    user: dotenv.parsed.E_USER,
    pass: dotenv.parsed.E_PASS,
  },
  rejectUnauthorized: false,
});

const notification_options = {
  priority: "high",
  timeToLive: 60 * 60 * 24,
};
const formatter = function formatDate(dateString) {
  // Parse the date string into a Date object
  const date = new Date(dateString);

  // Options for formatting (day, month, year)
  const options = {
    year: "numeric",
    month: "long",
    day: "numeric",
  };

  // Format the date according to the options
  return date.toLocaleDateString("en-US", options);
};

let axios_header = {
  headers: {
    Authorization: `Bearer ${dotenv.parsed.wise_sandbox_token}`,
    "Content-Type": "application/json",
  },
};
//calling function a() from outside

module.exports = {
  AMADEUS_URL: dotenv.parsed.amadeus_url,
  AMADEUS_API: dotenv.parsed.amadeus_api,
  AMADEUS_SEC: dotenv.parsed.amadeus_secret,
  CHAPA_SEC: dotenv.parsed.CHAPA_LIVE_SECRET,
  CHAPA_URL: dotenv.parsed.CHAPA_URL,
  CHAPA_HASH: dotenv.parsed.CHAPA_WEBHOOK_HASH,
  CHAPA_ENC: dotenv.parsed.CHAPA_LIVE_ENC_KEY,
  CDIWORK_RATE_CONVERTER: dotenv.parsed.CDIWORK_URL,
  GOJO_DEFAULT: dotenv.parsed.DEFAULT_PASSWORD,
  GOJO_RESETKEY: dotenv.parsed.resetKeyword,
  GOJO_FIREBASE_API: dotenv.parsed.apiKey,
  GOJO_FIREBASE_AUTH: dotenv.parsed.authDomain,
  GOJO_FIREBASE_PROJECT_ID: dotenv.parsed.projectId,
  GOJO_FIREBASE_STORAGE_BUCKET: dotenv.parsed.storageBucket,
  GOJO_FIREBASE_SENDER_ID: dotenv.parsed.messagingSenderId,
  GOJO_FIREBASE_APP_ID: dotenv.parsed.appId,
  GOJO_EMAIL_USER: dotenv.parsed.E_USER,
  GOJO_TOKEN: dotenv.parsed.TOKEN,
  DATE_READABLE: formatter,
  STR_SEC: dotenv.parsed.STRIPE_SECRET,
  STR_WEBHOOK: dotenv.parsed.STRIPE_WEBHOOK,
  STR_PUB: dotenv.parsed.STRIPE_PUBLIC,
  SWAGGER_PASS: dotenv.parsed.SWAGGER_PAS,
  SSL_KEY: dotenv.parsed.SSL_KEY,
  SSL_CRT: dotenv.parsed.SSL_CRT,
  SERVICE_ACCT: dotenv.parsed.FIREBASE,
  API_URL: dotenv.parsed.API_URL,
  WISE_HEADER: axios_header,
  WISE_SANDBOX: dotenv.parsed.wise_sandbox_token,
  WISE_TOKEN: dotenv.parsed.wise_live_token,
  WISE_TEST_URL: dotenv.parsed.wise_sandbox_url,
  WISE_LIVE_URL: dotenv.parsed.wise_live_url,
  WISE_REAL_URL: dotenv.parsed.wise_real_url,
  WISE_PROFILE_ID: dotenv.parsed.wise_profile_id,
  WISE_SOURCE_ACCT: dotenv.parsed.wise_source_account,
  TELEGRAM_URL: dotenv.parsed.telegram_endpoint,
  TELEGRAM_API: dotenv.parsed.telegram_api,
  TELEGRAM_BOT_NAME: dotenv.parsed.telegram_username,
  TELEGRAM_CHANNEL: dotenv.parsed.telegram_channel_name,
  FIREBASE_NOTE_OPTS: notification_options,
  MAILER: transporter,
  ENV: dotenv.parsed.NODE_ENV,
  PORT: dotenv.parsed.PORT,
  HOST: dotenv.parsed.HOST,
  MOODLE_TOKEN_LENGTH: 26,
  TOKEN_LENGTH: 64,
  TOKEN: {
    RANDOM_BYTE_LENGTH: 32,
  },
  MONGODB: {
    URL: dotenv.parsed.MONGODB_URI,
  },

  CORS_OPTS: {
    origin: "*",
    methods: "GET,POST,PUT,DELETE,OPTIONS,PATCH",
    allowedHeaders: "Origin,X-Requested-With,Content-Type,Accept,Authorization",
  },

  SALT_FACTOR: 12,

  TOKEN: {
    RANDOM_BYTE_LENGTH: 32,
  },
  errorResponse: {
    userNameEmpty: {
      code: 700,
      msg: "Username should not be empty",
    },
    userNameEmail: {
      code: 701,
      msg: "Username should be valid email",
    },
    passwordEmpty: {
      code: 702,
      msg: "Password should not be empty",
    },
    passwordLength: {
      code: 703,
      msg: "6 to 20 characters required",
    },
  },
  MEDIA: {
    FILE_LIMIT: 2621440, //2.5MB
    FILE_SIZE: 1 * 1024 * 1024, // 2MB,
    URL: dotenv.parsed.API_URL + "/media/",
    FILES_FOLDER: path.resolve(process.cwd(), "./media") + "/",
    UPLOADES: path.resolve(process.cwd(), "./public/uploads") + "/",
    UPLOADS: path.resolve(process.cwd(), "./public") + "/",
  },
  STRiPE: {
    percentage_charge_fee: 2.9, // 2.9 percent
    extra_charge_in_cent: 0.3, // 30 cent
  },
  Chapa: {
    fee: 0.025, //2.5%
  },
};
