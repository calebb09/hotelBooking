const axios = require("axios");
const config = require("../../config");
var https = require("follow-redirects").https;
const forge = require("node-forge");
const ssl = require("https");

const agent = new ssl.Agent({
  rejectUnauthorized: false, // 👈 disables SSL cert check
});

const currencyConvert = async () => {
  try {
    const response = await axios.get(
      `${config.CDIWORK_RATE_CONVERTER}?source=USD&target=ETB`,
      {
        httpsAgent: agent,
      }
    );
    return {
      status: response.data.status,
      data: response.data.data,
    };
  } catch (error) {
    return {
      status: 500,
      error: error.response ? error.response.data : error.message,
      log: error,
    };
  }
};

const createPayment = async (
  amount,
  currency,
  email,
  first_name,
  last_name,
  phone_number,
  tx_ref,
  title,
  description,
  logo
) => {
  try {
    const response = await axios.post(
      `${config.CHAPA_URL}/transaction/initialize`,
      {
        amount,
        currency,
        email,
        first_name,
        last_name,
        phone_number,
        tx_ref,
        callback_url: process.env.CHAPA_CALLBACK_URL,
        customization: {
          title: title,
          description: description,
          logo: logo,
        },
      },
      {
        headers: {
          Authorization: `Bearer ${config.CHAPA_SEC}`,
          "Content-Type": "application/json",
        },
      }
    );

    return {
      status: 200,
      data: response.data,
    };
  } catch (error) {
    console.error(
      "Chapa Payment Error:",
      error.response ? error.response.data : error.message
    );
    return {
      status: 500,
      error: error.response ? error.response.data : error.message,
    };
  }
};

const verifyPayment = async (tx_ref) => {
  try {
    const response = await axios.get(
      `${config.CHAPA_URL}/transaction/verify/${tx_ref}`,
      {
        headers: {
          Authorization: `Bearer ${config.CHAPA_SEC}`,
        },
      }
    );

    return {
      status: 200,
      data: response.data,
    };
  } catch (error) {
    console.error(
      "Chapa Verification Error:",
      error.response ? error.response.data : error.message
    );
    return {
      status: 500,
      error: error.response ? error.response.data : error.message,
    };
  }
};

const createCharge = async (inputs, payment_method) => {
  try {
    const postData = JSON.stringify(inputs); // Convert incoming object to JSON string

    const options = {
      method: "POST",
      hostname: "api.chapa.co",
      path: `/v1/charges?type=${payment_method}`, //telebirr, mpsea, cbebirr
      headers: {
        Authorization: `Bearer ${config.CHAPA_SEC}`,
        "Content-Type": "application/json",
        "Content-Length": Buffer.byteLength(postData),
      },
      timeout: 10000, // 10s timeout
    };

    return new Promise((resolve, reject) => {
      const attemptRequest = (retries) => {
        const req = https.request(options, (res) => {
          let responseData = "";

          res.on("data", (chunk) => {
            responseData += chunk;
          });

          res.on("end", () => {
            try {
              console.log("Raw response from Chapa:", responseData);
              const responseJson = JSON.parse(responseData);
              if (responseJson.status === "failed" && retries > 0) {
                // Retry logic if the transaction fails (for example, invalid tx_ref)
                console.log(`Retrying request (${3 - retries} / 3)...`);
                attemptRequest(retries - 1);
              } else {
                resolve(responseJson); // Resolve if the response is successful or retries exhausted
              }
            } catch (error) {
              reject({status: 500, error: "Invalid JSON response"});
            }
          });
        });

        req.on("error", (error) => {
          console.error("Request Error:", error);
          if (retries > 0) {
            // Retry on error if retries are available
            console.log(`Retrying request (${3 - retries} / 3)...`);
            setTimeout(() => attemptRequest(retries - 1), 3000);
          } else {
            reject({
              status: 500,
              error: "Request failed after 3 attempts. Please try again.",
            });
          }
        });

        req.write(postData);
        req.end();
      };

      attemptRequest(3); // Retry up to 3 times
    });
  } catch (error) {
    return {
      status: 500,
      error: error.response ? error.response.data : error.message,
    };
  }
};

const transferChapa = async (
  account_name,
  account_number,
  amount,
  currency,
  bank_code,
  reference
) => {
  try {
    const response = await axios.post(
      `${config.CHAPA_URL}/transfers`,
      {
        account_name: account_name,
        account_number: account_number,
        amount: amount,
        currency: currency,
        bank_code: bank_code,
        reference: reference,
      },
      {
        headers: {
          Authorization: `Bearer ${config.CHAPA_SEC}`,
          "Content-Type": "application/json",
        },
      }
    );
    return response.data;
  } catch (error) {
    return {
      status: 500,
      error: error.response ? error.response.data : error.message,
    };
  }
};

const tranferLists = async () => {
  try {
    const response = await axios.get(`${config.CHAPA_URL}/transfers`, {
      headers: {
        Authorization: `Bearer ${config.CHAPA_SEC}`,
      },
    });

    return {
      status: 200,
      data: response.data,
    };
  } catch (error) {
    console.error(
      "Chapa Verification Error:",
      error.response ? error.response.data : error.message
    );
    return {
      status: 500,
      error: error.response ? error.response.data : error.message,
    };
  }
};

const bankLists = async () => {
  try {
    const response = await axios.get(`${config.CHAPA_URL}/banks`, {
      headers: {
        Authorization: `Bearer ${config.CHAPA_SEC}`,
      },
    });

    return {
      status: 200,
      data: response.data,
    };
  } catch (error) {
    console.error(
      "Chapa Verification Error:",
      error.response ? error.response.data : error.message
    );
    return {
      status: 500,
      error: error.response ? error.response.data : error.message,
    };
  }
};

const validate = async (client, reference, payment_type) => {
  try {
    const response = await axios.post(
      `${config.CHAPA_URL}/validate?type=${payment_type}`,
      {
        reference: reference,
        client: client,
      },
      {
        headers: {
          Authorization: `Bearer ${config.CHAPA_SEC}`,
          "Content-Type": "application/json",
        },
      }
    );
    return {
      status: "ok",
      statusCode: 200,
      data: response.data,
    };
  } catch (error) {
    return {
      status: 500,
      error: error.response ? error.response.data : error.message,
    };
  }
};

const reverseChapaPayment = async (refId, reason) => {
  try {
    const response = await axios.post(
      `${config.CHAPA_URL}/transaction/refund/${refId}`, // Example only
      {reason: reason},
      {
        headers: {
          Authorization: `Bearer ${config.CHAPA_SEC}`,
        },
      }
    );
    return response.data;
  } catch (err) {
    console.error("Refund failed:", err.response?.data || err.message);
    return {
      status: 500,
      error: err.response?.data || err.message,
    };
  }
};

function encrypt(encryptionKey, payload) {
  const text = JSON.stringify(payload);

  if (![16, 24].includes(encryptionKey.length)) {
    throw new Error(
      `3DES key must be 16 or 24 characters long. Current: ${encryptionKey.length}`
    );
  }

  const cipher = forge.cipher.createCipher(
    "3DES-ECB",
    forge.util.createBuffer(encryptionKey, "raw") // Correct usage
  );
  cipher.start({iv: ""}); // ECB mode doesn't actually use IV
  cipher.update(forge.util.createBuffer(text, "utf8"));
  cipher.finish();
  return forge.util.encode64(cipher.output.getBytes());
}

module.exports = {
  currencyConvert,
  encrypt,
  createPayment,
  verifyPayment,
  createCharge,
  transferChapa,
  bankLists,
  validate,
  reverseChapaPayment,
  tranferLists,
};
