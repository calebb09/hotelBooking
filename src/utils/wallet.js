const Wallet = require("../models/wallet");
const Transaction = require("../models/transaction");
const {generateUniqueAlphanumericString} = require("../functions/calculation");
const Client = require("../models/client");
const mongoose = require("mongoose");
const today = new Date();
const formatted = today.toISOString().split("T")[0];
const createTransaction = async (
  amount,
  transactionType,
  uid,
  status,
  reason,
  charge,
  paymentType
) => {
  const session = await mongoose.startSession();
  session.startTransaction();
  let inHandBalance = amount - charge;
  let isTransactionAllowed = false;
  let hasWallet = false;
  let message = "";
  let performBalance = 0;

  const saveQuery = {
    action_type: transactionType,
    status: status.toLowerCase(),
    createdAt: new Date(),
    currency_type: "ETB",
    amount,
    reason,
    transaction_status: "payment",
    uniqueId: `${formatted}-${generateUniqueAlphanumericString(10)}`,
    ...(reason === "recharge" && {
      wallet_recharge: {
        is_recharge: true, // or false if you want default
        fee: charge, // define this variable beforehand
        amount, // define this variable beforehand
      },
    }),
  };

  try {
    let ClientInfo = null;
    let existingWallet = null;

    if (uid !== null) {
      ClientInfo = await Client.findOne({uuid: uid});
      existingWallet = await Wallet.findOne({
        "user_information.user": ClientInfo.id,
      })
        .sort({_id: -1})
        .session(session);

      hasWallet = !!existingWallet;

      if (transactionType === "deducted") {
        if (paymentType !== "directPay") {
          if (!existingWallet || existingWallet.balance < amount) {
            message = !existingWallet
              ? "Wallet not found."
              : existingWallet.balance === 0
              ? "Insufficient balance."
              : "Balance is insufficient.";
            isTransactionAllowed = false;
          } else {
            isTransactionAllowed = true;
          }
        } else {
          isTransactionAllowed = true;
        }
      } else {
        isTransactionAllowed = true;
      }
    } else {
      isTransactionAllowed = true; // Allow transactions without wallet (e.g., admin etc.)
    }

    if (!isTransactionAllowed) {
      await session.abortTransaction();
      session.endSession();
      return {
        status: "error",
        statusCode: 400,
        message,
      };
    }

    // Prepare transaction payload
    const transactionPayload =
      uid === null
        ? saveQuery
        : {
            ...saveQuery,
            user_information: {
              user_type: "user",
              user: ClientInfo.id,
            },
          };

    // Save the transaction
    const transaction = new Transaction(transactionPayload);
    const savedTransaction = await transaction.save({session});

    // Determine new balance
    if (uid !== null) {
      if (transactionType === "deducted") {
        performBalance = existingWallet
          ? existingWallet.balance - inHandBalance
          : 0;
      } else {
        performBalance = existingWallet
          ? existingWallet.balance + inHandBalance
          : inHandBalance;
      }
      if (reason === "recharge") {
        const newWallet = new Wallet({
          balance: performBalance,
          user_information: {
            user_type: "user",
            user: ClientInfo.id,
          },
          currency_type: "ETB",
          transaction: savedTransaction.id,
          status: status.toLowerCase(),
        });

        await newWallet.save({session});
      }
    }

    await session.commitTransaction();
    session.endSession();

    return {
      status: "success",
      statusCode: 201,
      message: "Transaction created successfully.",
      transaction: savedTransaction,
    };
  } catch (error) {
    await session.abortTransaction();
    session.endSession();
    return {
      status: "error",
      statusCode: 500,
      message: error.response ? error.response.data : error.message,
      error,
    };
  }
};

module.exports = createTransaction;
