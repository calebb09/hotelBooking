//load dependencies
const Axios = require("axios");
const TransferWise = require("@fightmegg/transferwise");
const Transaction = require("../models/transaction");
const Wallet = require("../models/wallet");
const BankDal = require("../models/bank");
const config = require("../../config");
const tw = new TransferWise({token: config.WISE_SANDBOX, sandbox: true});

async function getAccountBalances() {
  try {
    const profiles = await tw.profiles();

    console.log("profileId " + profiles[1].id);
    await Axios.get(
      `${config.WISE_TEST_URL}/v3/profiles/${profiles[1].id}/balances?types=STANDARD`,
      config.WISE_HEADER
    )
      .then(async (balance_document) => {
        console.log(balance_document);
        // console.log(balance_document.response);
      })
      .catch((error) => console.log(error.response));
    // return profiles;
  } catch (error) {
    console.error("Error fetching balances:", error.message);
    throw error;
  }
}

// setInterval(getAccountBalances, 2000);

exports = module.exports.saveRecepient = async function (
  uid,
  wire_type,
  country,
  bank_name,
  accountNumber,
  accountHolderName,
  BIC,
  abartn,
  hotelId,
  body
) {
  let response = [];
  await Axios.get(`${config.WISE_TEST_URL}/v2/profiles`, config.WISE_HEADER)
    .then(async (profile_data) => {
      console.log(profile_data.data);
      let static_data = {
        profile: profile_data.data[1].id,
        currency: "USD",
        type: wire_type,
      };
      const returnedTarget = Object.assign(body, static_data);
      await tw.recipientAccounts
        .create(returnedTarget)
        .then(async (data) =>
          data.details === undefined
            ? response.push("error occurred", 400, data.errors)
            : await BankDal.create({
                uuid: uid,
                country: country,
                wiseAccount_id: data.id,
                bank_name: bank_name,
                bank_acct: accountNumber,
                bank_holder_name: accountHolderName,
                bank_swift_code: BIC,
                bank_routing_number: abartn,
                created_by: hotelId,
              })
                .then((data) => {
                  if (Object.keys(data).length > 0) {
                    response.push("Successfully created", 201);
                  } else {
                    response.push(
                      "Something went wrong data was not saved",
                      400
                    );
                  }
                })
                .catch((error) => response.push(error, error.response.status))
        )
        .catch((error) => response.push(error, error.response.status));
    })
    .catch((error) => response.push(error.response, error.response.status));
  return response;
};
exports = module.exports.withdraw = async function (
  sourceAmount,
  bankInfo,
  balance,
  userType
) {
  let response = [];
  try {
    // Get Wise profile
    const profileRes = await Axios.get(
      `${config.WISE_TEST_URL}/v2/profiles`,
      config.WISE_HEADER
    );

    const profileId = profileRes.data[1]?.id;
    if (!profileId) {
      response.push("Profile not found", 400);
      return response;
    }

    // Get balance
    const balanceRes = await Axios.get(
      `${config.WISE_TEST_URL}/v3/profiles/${profileId}/balances?types=STANDARD`,
      config.WISE_HEADER
    );

    const availableBalance = balanceRes.data[0]?.amount?.value ?? 0;

    if (availableBalance === 0) {
      response.push("The amount is currently unavailable", 400);
      return response;
    }
    if (availableBalance <= 30) {
      response.push("We will deposit enough money for withdrawal shortly", 400);
      return response;
    }
    if (sourceAmount > availableBalance) {
      response.push("We will deposit money for withdrawal very soon!", 400);
      return response;
    }

    // Verify recipient account
    const recipient = await tw.recipientAccounts.get(bankInfo.wiseAccount_id);
    if (!recipient?.id) {
      response.push("account not found", 400);
      return response;
    }

    // Create a quote
    const quoteRes = await Axios.post(
      `${config.WISE_TEST_URL}/v3/profiles/${profileId}/quotes`,
      {
        sourceCurrency: "USD",
        targetCurrency: "USD",
        sourceAmount,
        targetAmount: null,
        preferredPayIn: null,
        rateType: "FIXED",
      },
      {
        headers: {
          Authorization: `Bearer ${config.WISE_SANDBOX}`,
          "Content-Type": "application/json",
        },
      }
    );

    if (quoteRes.status !== 200) {
      response.push("Bad Request", quoteRes.status, quoteRes.data);
      return response;
    }

    // Create a transfer
    const transferRes = await Axios.post(
      `${config.WISE_TEST_URL}/v1/transfers`,
      {
        sourceAccount: null,
        targetAccount: bankInfo.wiseAccount_id,
        quoteUuid: quoteRes.data.id,
        customerTransactionId: quoteRes.data.id,
        details: {
          reference: "payment",
          transferPurpose: "verification.transfers.purpose.pay.bills",
          transferPurposeSubTransferPurpose:
            "verification.sub.transfers.purpose.pay.interpretation.service",
          sourceOfFunds: "verification.source.of.funds.other",
        },
      },
      {
        headers: {
          Authorization: `Bearer ${config.WISE_SANDBOX}`,
          "Content-Type": "application/json",
        },
      }
    );

    if (transferRes.status !== 200) {
      response.push(
        transferRes.statusText,
        transferRes.status,
        transferRes.data
      );
      return response;
    }

    // Fund the transfer
    const payoutRes = await Axios.post(
      `${config.WISE_TEST_URL}/v3/profiles/${profileId}/transfers/${transferRes.data.id}/payments`,
      {type: "BALANCE"},
      {
        headers: {
          Authorization: `Bearer ${config.WISE_SANDBOX}`,
          "Content-Type": "application/json",
        },
      }
    );

    if (![200, 201].includes(payoutRes.status)) {
      response.push(payoutRes.response, payoutRes.status);
      return response;
    }

    // Record the transaction
    const transaction = await Transaction.create({
      userType,
      action_type: "deducted",
      transaction_status: "withdraw",
      reason: `Authorize a transfer to the local bank account held by ${
        bankInfo.bank_holder_name
      } ${new Date().toDateString()}`,
      withdraw_receipt_pdf: `${config.WISE_TEST_URL}/v1/transfers/${transferRes.data.id}/receipt.pdf`,
      amount: sourceAmount,
    });

    if (!transaction) {
      response.push("transaction not created", 400);
      return response;
    }

    // Update wallet
    const wallet = await Wallet.create({
      userType,
      balance: balance - sourceAmount,
      transaction: transaction.id,
    });

    if (!wallet) {
      response.push("wallet not updated", 400);
      return response;
    }

    response.push("funds on the way", 200);
    return response;
  } catch (error) {
    console.error("Withdraw error:", error.response?.data || error.message);
    response.push(
      error.response?.statusText || error.message,
      error.response?.status || 500,
      error.config || {}
    );
    return response;
  }
};
exports = module.exports.remove = async function (accountId) {
  let response = [];
  await Axios.delete(
    `${config.WISE_TEST_URL}/v2/accounts/${accountId}`,
    config.WISE_HEADER
  )
    .then((data) =>
      data.status === 200
        ? response.push(data.status, "successfully removed")
        : response.push(data.status, "something went wrong")
    )
    .catch((error) =>
      response.push(error.response.status, error.response.statusText, error)
    );
  return response;
};
