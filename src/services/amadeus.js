const axios = require("axios");
const config = require("../../config");

// Step 1: Get token
const amadeusAccessToken = async () => {
  try {
    const tokenRes = await axios.post(
      `${config.AMADEUS_URL}/v1/security/oauth2/token`,
      new URLSearchParams({
        grant_type: "client_credentials",
        client_id: config.AMADEUS_API,
        client_secret: config.AMADEUS_SEC,
      }),
      {
        headers: {
          "Content-Type": "application/x-www-form-urlencoded",
        },
      }
    );
    return {
      status: 200,
      token: tokenRes.data.access_token,
      message: "successful",
    };
  } catch (error) {
    return {
      status: 500,
      message: error.response?.data || error.message,
    };
  }
};

module.exports = amadeusAccessToken;
