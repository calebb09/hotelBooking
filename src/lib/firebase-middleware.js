const admin = require("firebase-admin");
var _ = require("lodash");

const getAuthToken = (req, res, next) => {
  if (
    req.headers.authorization &&
    req.headers.authorization.split(" ")[0] === "Bearer"
  ) {
    req.authToken = req.headers.authorization.split(" ")[1];
  } else {
    req.authToken = null;
  }
  next();
};

module.exports = function checkIfAuthenticated(req, res, next) {
  getAuthToken(req, res, async () => {
    try {
      const {authToken} = req;
      // const u = await admin.auth().getUser("edu9BEKFQxVhMg8PqT0OsdQW1IB2");
      // console.log(u);
      const userInfo = await admin.auth().verifyIdToken(authToken);
      req.user = {
        uuid: userInfo.user_id,
        phone_number: userInfo.phone_number,
        role: userInfo.role,
        picture: userInfo.picture,
      };
      next();
    } catch (e) {
      return res.status(401).send({
        error: "YOU ARE NOT AUTHORIZED TO MAKE THIS REQUEST FIREBASE!",
      });
    }
  });
};
