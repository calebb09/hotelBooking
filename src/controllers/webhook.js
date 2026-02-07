// const {verifyPayment} = require("../services/chapa");
const updateTransaction = require("../utils/updateTransaction");
exports.recieveWebhook = async (req, res) => {
  try {
    const eventData = req.body;
    const eventType = eventData.event;
    const txRef = eventData.tx_ref;
    const status = eventData.status;
    const runUpdate = await updateTransaction(
      txRef,
      eventData.reference,
      status,
      parseFloat(eventData.amount),
      parseFloat(eventData.charge),
    );
    console.log(runUpdate);
    return res.status(runUpdate.statusCode).json(runUpdate.message);

    // if (eventType === "charge.success" && status === "success" && txRef) {
    //   // Verify the event
    //   const verifyResponse = await verifyPayment(txRef);
    //   const paymentData = verifyResponse.data;
    //   if (paymentData.status === "success") {
    //     // console.log("payment status " + paymentData.data.status);
    //     console.log("✅ Payment verified via webhook:", paymentData);
    //     // TODO: Update your database, e.g. mark tx_ref as paid
    //     return res.status(200).send("Payment verified");
    //   } else {
    //     console.warn("⚠️ Verification failed for tx_ref:", txRef);
    //     return res.status(400).send("Verification failed");
    //   }
    // }
    // console.log("ℹ️ Unhandled or failed webhook event:", eventData);
    // return res.status(200).send("Webhook received");
  } catch (err) {
    console.error("❌ Error verifying payment:", err.message);
    return res.status(500).send("Verification error");
  }
};
