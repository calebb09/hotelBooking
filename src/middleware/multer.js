const multer = require("multer");
const path = require("path");
const config = require("../../config");

const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, config.MEDIA.UPLOADS),
  filename: (req, file, cb) =>
    cb(null, Date.now() + path.extname(file.originalname)),
});

const allowedExtensions = [
  ".jpg",
  ".jpeg",
  ".png",
  ".csv",
  ".xlsx",
  ".xls",
  ".pdf",
];

const fileFilter = (req, file, cb) => {
  const ext = path.extname(file.originalname).toLowerCase();
  if (!allowedExtensions.includes(ext))
    return cb(new Error("Invalid file type"));
  cb(null, true);
};

module.exports = multer({
  storage,
  limits: {fileSize: config.MEDIA.FILE_LIMIT},
  fileFilter,
});
