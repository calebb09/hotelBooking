const {tranferLists} = require("../services/chapa");
const Wallet = require("../models/wallet");
const Transaction = require("../models/transaction");
const sendMessage = require("../functions/sendMessage");
const Hotel = require("../models/accommodation");
const CHECK_INTERVAL_MS = 21600 * 1000; // 6 hrs - adjust based on need

async function updateWalletAndTransaction(wallet, transfer) {
  const walletStatus =
    transfer.status === "success"
      ? "available"
      : transfer.status === "failed/cancelled"
      ? "failed"
      : null;
  const transactionStatus =
    transfer.status === "success"
      ? "withdraw"
      : transfer.status === "failed/cancelled"
      ? "failed"
      : null;

  // Update transaction
  const updatedTransaction = await Transaction.findByIdAndUpdate(
    wallet.transaction.id,
    {
      transaction_status: transactionStatus,
      updated_at: new Date(),
    },
    {new: true}
  );

  // Update wallet
  const updatedWallet = await Wallet.findByIdAndUpdate(
    wallet.id,
    {
      status: walletStatus,
      updated_at: new Date(),
    },
    {new: true}
  );

  console.log(`[Wallet ${wallet._id}] Status updated to '${walletStatus}'`);
  // get the hotel information
  const hotelInfo = await Hotel.findById(
    updatedTransaction.user_information.client
  );
  // Optional: Notify user if available
  if (walletStatus !== "pending") {
    let message = {
      notification: {
        title: "Money withdrawal status",
        body:
          walletStatus === "available"
            ? `Hi ${hotelInfo.name}
            You received this message because your funds have been successfully transferred.
            
            Transaction Summary:
            Bank Name: ${transfer.bank_name}
            Bank Reference: ${transfer.bank_reference}
            Account Holder name: ${transfer.account_name}
            Account Number: ${maskAccountNumber(transfer.account_number)}
            Amount: ${transfer.amount}
            Charge: ${transfer.charge}`
            : `Your withdrawal request has ${walletStatus}. Please contact the customer support`,
      },
    };

    const {emailType, email} = getEmailInfo(hotelInfo);
    if (emailType !== null) {
      await sendMessage(
        message,
        null,
        updatedTransaction.user_information.client,
        emailType,
        email
      );
      console.log(
        `[Notification] Sent message to user for Wallet ${wallet._id}`
      );
    }
  }
}

async function checkPending() {
  try {
    const pendingWallets = await Wallet.find({
      status: "pending",
      currency_type: "ETB",
    }).populate({path: "transaction", model: Transaction});

    if (pendingWallets.length === 0) {
      console.log(`[Check] No pending wallets to process.`);
      return;
    }

    const chapaTransfers = await tranferLists();

    if (chapaTransfers.data.status !== "success") {
      console.warn(
        `[Chapa] Failed to retrieve transfer list: ${chapaTransfers.status}`
      );
      return;
    }

    for (const wallet of pendingWallets) {
      const matchingTransfer = chapaTransfers.data.data.find(
        (transfer) =>
          transfer.reference === wallet.uniqueId &&
          transfer.status !== "pending"
      );
      if (matchingTransfer) {
        await updateWalletAndTransaction(wallet, matchingTransfer);
      } else {
        console.log(`[Wallet ${wallet._id}] No matching transfer found yet.`);
      }
    }
  } catch (err) {
    console.error("[Error] Failed to process pending wallets:", err);
  }
}

//get email information

function getEmailInfo(hotelInfo) {
  if (!hotelInfo || !hotelInfo.address || !hotelInfo.address.emailAddress) {
    return {emailType: null, email: ""};
  }

  const emailList = hotelInfo.address.emailAddress;
  if (emailList.length > 1) {
    return {emailType: "bcc", email: emailList};
  } else if (emailList.length === 1) {
    return {emailType: "to", email: emailList[0]};
  }
  return {emailType: null, email: ""};
}

//hide the account number of the user
function maskAccountNumber(accountNumber) {
  const visibleDigits = 4;
  const maskedSection = accountNumber
    .slice(0, -visibleDigits)
    .replace(/\d/g, "*");
  const visibleSection = accountNumber.slice(-visibleDigits);
  return maskedSection + visibleSection;
}
// Run the checker at interval
setInterval(() => {
  checkPending().catch((err) => {
    console.error("[Unhandled Error] in checkPending:", err);
  });
}, CHECK_INTERVAL_MS);
