const Wallet = require("../models/wallet");
const Transaction = require("../models/transaction");
const mongoose = require("mongoose");

const hotelTransaction = async (
  amount,
  transactionType,
  assigned_acommodation_id,
  status,
  uniqueId,
  reason,
  currency_type
) => {
  const session = await mongoose.startSession();
  session.startTransaction();
  let message = "";
  let performBalance = 0;
  const saveQuery = {
    action_type: transactionType,
    createdAt: new Date(),
    currency_type,
    amount,
    reason,
    transaction_status:
      status === "withdraw"
        ? "pending"
        : status === "transfer"
        ? "transfer"
        : status,
    uniqueId,
  };

  try {
    let isTransactionAllowed = false;
    let existingWallet = await Wallet.findOne({
      "user_information.client": assigned_acommodation_id,
    })
      .sort({_id: -1})
      .session(session);

    if (transactionType === "deducted") {
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
    const transactionPayload = {
      ...saveQuery,
      user_information: {
        user_type: "client",
        client: assigned_acommodation_id,
      },
    };

    // Save the transaction
    const transaction = new Transaction(transactionPayload);
    const savedTransaction = await transaction.save({session});

    // Determine new balance

    if (transactionType === "deducted") {
      performBalance = existingWallet ? existingWallet.balance - amount : 0;
    } else {
      performBalance = existingWallet
        ? existingWallet.balance + amount
        : amount;
    }

    const newWallet = new Wallet({
      balance: performBalance,
      user_information: {
        user_type: ["client"],
        client: assigned_acommodation_id,
      },
      uniqueId,
      currency_type,
      transaction: savedTransaction.id,
      status:
        status === "withdraw"
          ? "pending"
          : status === "transfer"
          ? "available"
          : status,
    });

    await newWallet.save({session});
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

module.exports = hotelTransaction;
