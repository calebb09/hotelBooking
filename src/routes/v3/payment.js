const express = require("express");
const PaymentController = require("../../controllers/payment");
const accessControl = require("../../controllers/auth").accessControl;
const {walletRechargeLimiter} = require("../../lib/limiter");
const Authenticated = require("../../lib/firebase-middleware");
const router = express.Router();
/**
 * @swagger
 * components:
 *   schemas:
 *     SearchBanks:
 *       type: object
 *       properties:
 *        swiftcode:
 *          type: string
 *          example: CBETETAA
 *          description: the bank swiftcode
 *     RechargeWallet:
 *       type: object
 *       properties:
 *        payment_amount:
 *          type: number
 *          example: 200
 *        stripeToken:
 *          type: string
 *          example: 418033280532
 *     VerifyPayment:
 *       type: object
 *       properties:
 *        otp:
 *          type: number
 *          example: 1234
 *          description: enter the incoming sms otp code to verify your request
 *     RechargeWalletLocal:
 *       type: object
 *       properties:
 *        amount:
 *          type: number
 *          example: 200
 *        first_name:
 *          type: string
 *          example: Abebe
 *        last_name:
 *          type: string
 *          example: Kebede
 *        phone_number:
 *          type: number
 *          example: 0920222843
 *        email:
 *          type: string
 *          example: abe.kebe@gmail.com
 *     Transaction:
 *       type: object
 *       properties:
 *        data:
 *          type: array
 *          items:
 *            type: object
 *            properties:
 *                _id:
 *                  type: objectId
 *                  description: The auto-generated id of the payment
 *                  example: mongodbId
 *                user_information:
 *                  type: object
 *                  properties:
 *                      user_type:
 *                        type: array
 *                        description: type of user etiher client, user, admin
 *                        example:
 *                          - client
 *                      user:
 *                        type: object
 *                        properties:
 *                          full_name:
 *                            type: string
 *                            description: the full name of the user
 *                            example: Saron Fesseha
 *                          phone:
 *                            type: string
 *                            description: the phone number of the user
 *                            example: +2143949213421
 *                transaction_status:
 *                  type: string
 *                  description: it is either pending, recharge, withdraw, transfer
 *                  example: withdraw
 *                wallet_recharge:
 *                  type: object
 *                  properties:
 *                    is_recharge:
 *                      type: boolean
 *                      description: if the status is recharge then put this true. see example
 *                      example: true
 *                    status:
 *                      type: string
 *                      description: put either succeeded, pending, refunded, failed
 *                      example: succeeded
 *                amount:
 *                  type: number,
 *                  example: 400
 *                services:
 *                  type: object
 *                  properties:
 *                    package:
 *                      type: objcetId
 *                      example: mongodbId
 *                    payment:
 *                      type: objectId
 *                      example: mongodbId
 *                    transfer:
 *                      type: object
 *                      properties:
 *                        client:
 *                          type: objectId
 *                          example: mongodbId
 *                        user:
 *                          type: objectId
 *                          example: mongodbId
 *                action_type:
 *                  type: string
 *                  description: deducted added
 *                  status: deducted
 *                created_at:
 *                  type: date
 *                  description: The date applied
 *                updated_at:
 *                  type: date
 *                  description: the date updated
 *        limit:
 *          type: number
 *          example: 20
 *        page:
 *          type: number
 *          example: 1
 *        total:
 *          type: number
 *          example: 20
 *     StripePayment:
 *       type: object
 *       properties:
 *         stripeToken:
 *           type: string
 *           example: tok_1S2SvyI13hSwmQiuDNI7T6do
 *     BookingRequestLocal:
 *       type: object
 *       properties:
 *         Room:
 *           type: array
 *           description: multiselect or could either be 1 or more room
 *           example:
 *            - 48234582734502345-234
 *            - 48234582734502345-234
 *         adult:
 *           type: number
 *           example: 2
 *         children:
 *           type: number
 *           example: 2
 *           description: number of children
 *         children_age:
 *           type: array
 *           example:
 *              - 3
 *              - 5
 *         email:
 *           type: string
 *           example: yourId@domain_name.com
 *         phone:
 *           type: string
 *           description: your mobile number to initiate payment
 *           example: 0900123456
 *         first_name:
 *            type: string
 *            example: Abebe
 *         last_name:
 *            type: string
 *            example: Kebede
 *         checkIn:
 *           type: date
 *           description: the date of arrival
 *           example: 2024-06-23
 *         checkOut:
 *           type: date
 *           description: date of departure
 *           example:  2024-06-23
 *     BookingRequest:
 *       type: object
 *       required:
 *         - room
 *         - checkIn
 *         - checkOut
 *         - guests
 *         - currency_type
 *       properties:
 *         currency_type:
 *           type: string
 *           description: type of currency either "USD" or "ETB". not saved in the database
 *           example: "USD"
 *         Room:
 *           type: array
 *           description: multiselect or could either be 1 or more room
 *           example:
 *            - 48234582734502345-234
 *            - 48234582734502345-234
 *         is_paid_via_wallet:
 *           type: boolean
 *           description: true or false
 *           example: false
 *         guests:
 *           type: object
 *           properties:
 *             adult:
 *                type: number
 *                example: 2
 *             children:
 *                type: number
 *                example: 2
 *                description: number of children
 *             children_age:
 *                type: array
 *                example:
 *                  - 1
 *                  - 3
 *         guest:
 *           type: object
 *           properties:
 *             name:
 *                type: string
 *                example: Zoe Tyler
 *             phone:
 *                type: string
 *                example: 0932111111
 *             email:
 *                type: string
 *                example: tylermyname@outlook.com
 *         withBreakFast:
 *           type: array
 *           example:
 *              - 68a70056cf54dfec8f34147a
 *              - 68a70056cf54dfec8f34147a
 *           description: the lists of selected room for breakfast
 *         withRefundable:
 *           type: array
 *           example:
 *              - 68a70056cf54dfec8f34147a
 *           description: the lists of selected rooms for refundable
 *         checkIn:
 *           type: date
 *           description: the date of arrival
 *           example: 2024-06-23:T12:00:01Z
 *         checkOut:
 *           type: date
 *           description: date of departure
 *           example:  2024-06-23:T12:00:01Z
 *     BookingRequestviaWallet:
 *       type: object
 *       required:
 *         - room
 *         - checkIn
 *         - checkOut
 *         - guests
 *         - currency_type
 *       properties:
 *         currency_type:
 *           type: string
 *           description: type of currency either "USD" or "ETB". not saved in the database
 *           example: "ETB"
 *         Room:
 *           type: array
 *           description: multiselect or could either be 1 or more room
 *           example:
 *            - 48234582734502345-234
 *            - 48234582734502345-234
 *         status:
 *           type: string
 *           description: what is the status of the booking
 *           example: Pending
 *         checkIn:
 *           type: date
 *           description: the date of arrival
 *           example: 2024-06-23:T12:00:01Z
 *         checkOut:
 *           type: date
 *           description: date of departure
 *           example:  2024-06-23:T12:00:01Z
 *     paymentError:
 *       example:
 *         msg: Error
 *         status: 400
 *     paymentErrorInternal:
 *       example:
 *         msg: Internal server error message
 *         status: 500
 *     paymentSuccess:
 *       example:
 *         msg: successful
 *         status: 200
 *     paymentSuccessLocal:
 *       example:
 *         msg: transaction saved
 *         checkOutUrl: https://checkout.chapa.co/checkout/payment/6fBqNs0aV6cKqL5qdzoR84T5Y9Zxt4l7BZyKZqtTk2oGW
 *     paymentPending:
 *       example:
 *         msg: Successfully Booked please complete payment
 *         refId: 6814b12ec5ea3869b0468bc2
 *         checkOut_URL: https://checkout.chapa.co/checkout/payment/MuQdJtZU7JyeMJdk2SrLcYw9kooJL9d2ojknP0xKclJWI
 */
/**
 * @swagger
 * tags:
 *   name: Payment
 *   description: The payment managing API [V3]
 */
/**
 * @swagger
 * /payment/verify_payment/{chapaId}:
 *   get:
 *     summary: Once you make a direct payment for localpayment use this route to verify
 *     tags: [Payment]
 *     security:
 *     -   bearerAuth: []
 *     parameters:
 *      - name: chapaId
 *        in: path
 *        required: true
 *        type: string
 *        description: the chapaId stored in the local dataabase
 *     responses:
 *       200:
 *         description: The list of payments meaning mobile payment
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 $ref: '#/components/schemas/paymentSuccess'
 *       400:
 *         description: error status
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 $ref: '#/components/schemas/paymentError'
 */
router.get("/verify_payment/:chapaId", PaymentController.verifyPayment);
router.get("/user/verify/chapa/:txtnID", PaymentController.chapaVerify);
/**
 * @swagger
 * /payment/chapa/bank_lists:
 *   get:
 *     summary: Returns the list of all banks collaborating with chapa
 *     tags: [Payment]
 *     responses:
 *       200:
 *         description: The list of banks
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 $ref: '#/components/schemas/paymentSuccess'
 *       400:
 *         description: error status
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 $ref: '#/components/schemas/paymentError'
 */
router.get("/chapa/bank_lists", PaymentController.chapaBankLists);
/**
 * @swagger
 * /payment/book_request/directPay:
 *   post:
 *     summary: request to book a room online with or without logging into the system without the use of wallet (USD)
 *     tags: [Payment]
 *     operationId: directPay
 *     security:
 *     -   bearerAuth: []
 *     requestBody:
 *        description:  Create Booking
 *        content:
 *          application/json:
 *            schema:
 *              $ref: '#/components/schemas/BookingRequest'
 *     responses:
 *       200:
 *         description: Create book request
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 $ref: '#/components/schemas/paymentSuccess'
 *       400:
 *         description: Error
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 $ref: '#/components/schemas/paymentError'
 */
router.post(
  "/book_request/directPay",
  // walletRechargeLimiter,
  PaymentController.directPay
);
/**
 * @swagger
 * /payment/book_request/local/directPay:
 *   post:
 *     summary: request to book a room online with or without logging into the system without the use of wallet (ETB)
 *     tags: [Payment]
 *     operationId: directPayLocal
 *     security:
 *     -   bearerAuth: []
 *     requestBody:
 *        description:  Create Booking
 *        content:
 *          application/json:
 *            schema:
 *              $ref: '#/components/schemas/BookingRequestLocal'
 *     responses:
 *       200:
 *         description: Create book request
 *         content:
 *           application/json:
 *             schema:
 *                 $ref: '#/components/schemas/paymentPending'
 *       400:
 *         description: Error
 *         content:
 *           application/json:
 *             schema:
 *                 $ref: '#/components/schemas/paymentError'
 */
router.post(
  "/book_request/local/directPay",
  // walletRechargeLimiter,
  PaymentController.localPay
);
/**
 * @swagger
 * /payment/book_request/walletPay:
 *   post:
 *     summary: request to book a room via wallet payment
 *     tags: [Payment]
 *     operationId: walletPay
 *     security:
 *     -   bearerAuth: []
 *     requestBody:
 *        description:  Create Booking
 *        content:
 *          application/json:
 *            schema:
 *              $ref: '#/components/schemas/BookingRequestviaWallet'
 *     responses:
 *       200:
 *         description: Create book request
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 $ref: '#/components/schemas/paymentSuccess'
 *       400:
 *         description: Error
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 $ref: '#/components/schemas/paymentError'
 */
router.post(
  "/book_request/walletPay",
  Authenticated,
  // walletRechargeLimiter,
  PaymentController.walletPay
);
/**
 * @swagger
 * /payment/user/recharge_wallet:
 *   post:
 *     summary: Returns the list of all payment super_admin, admin, only access this route
 *     tags: [Payment]
 *     security:
 *     -   bearerAuth: []
 *     requestBody:
 *        description:  rechargeWallet
 *        content:
 *          application/json:
 *            schema:
 *              $ref: '#/components/schemas/RechargeWallet'
 *     responses:
 *       200:
 *         description: The list of payments meaning mobile payment
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 $ref: '#/components/schemas/paymentSuccess'
 *       400:
 *         description: error status
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 $ref: '#/components/schemas/paymentError'
 */
router.post(
  "/user/recharge_wallet",
  Authenticated,
  walletRechargeLimiter,
  PaymentController.rechargeWallet
);
/**
 * @swagger
 * /payment/user/local/recharge_wallet:
 *   post:
 *     summary: Recharge wallet for local currency
 *     tags: [Payment]
 *     security:
 *     -   bearerAuth: []
 *     requestBody:
 *        description:  rechargeWallet
 *        content:
 *          application/json:
 *            schema:
 *              $ref: '#/components/schemas/RechargeWalletLocal'
 *     responses:
 *       200:
 *         description: on successful response
 *         content:
 *           application/json:
 *             schema:
 *                 $ref: '#/components/schemas/paymentSuccessLocal'
 *       400:
 *         description: error status
 *         content:
 *           application/json:
 *             schema:
 *                 $ref: '#/components/schemas/paymentError'
 *       500:
 *         description: internal server error
 *         content:
 *           application/json:
 *             schema:
 *                 $ref: '#/components/schemas/paymentErrorInternal'
 */
router.post(
  "/user/local/recharge_wallet",
  Authenticated,
  // walletRechargeLimiter,
  PaymentController.walletRechargeChapa
);
/**
 * @swagger
 * /payment/client/recharge_wallet:
 *   post:
 *     summary: Recharge wallet for USD currency
 *     tags: [Payment]
 *     security:
 *     -   bearerAuth: []
 *     requestBody:
 *        description:  rechargeWallet
 *        content:
 *          application/json:
 *            schema:
 *              $ref: '#/components/schemas/RechargeWallet'
 *     responses:
 *       200:
 *         description: The list of payments meaning mobile payment
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 $ref: '#/components/schemas/paymentSuccess'
 *       400:
 *         description: error status
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 $ref: '#/components/schemas/paymentError'
 */
router.post(
  "/client/recharge_wallet",
  accessControl(["owner", "receptionist"]),
  PaymentController.clientChargeWallet
);
/**
 * @swagger
 * /payment/booking_request/{txtId}:
 *   post:
 *     summary: This is for credit card payment after user get the conirmation to pay message
 *     tags: [Payment]
 *     security:
 *     -   bearerAuth: []
 *     parameters:
 *      - name: txtId
 *        in: path
 *        required: true
 *        type: string
 *        description: this txtId is auto generated from booking requerst
 *     requestBody:
 *        description: An auto generated card token from frontend will be to put on the stripeToken property
 *        content:
 *          application/json:
 *            schema:
 *              $ref: '#/components/schemas/StripePayment'
 *     responses:
 *       200:
 *         description: The list of payments meaning mobile payment
 *         content:
 *           application/json:
 *             schema:
 *                 $ref: '#/components/schemas/paymentSuccess'
 *       400:
 *         description: error status
 *         content:
 *           application/json:
 *             schema:
 *                 $ref: '#/components/schemas/paymentError'
 */
router.post("/booking_request/:txtId", PaymentController.pendingPay);
router.post("/user/pay_with_chapa", PaymentController.chapaPay);
router.post("/user/chapa/directPay", PaymentController.chapaCharge);
router.post("/user/chapa/bankTransfer", PaymentController.chapaBank);
/**
 * @swagger
 * /payment/chapa/bank_lists/search:
 *   post:
 *     summary: search bank that work with chapa using swiftcode
 *     tags: [Payment]
 *     security:
 *     -   bearerAuth: []
 *     requestBody:
 *        description:  serachChapa
 *        content:
 *          application/json:
 *            schema:
 *              $ref: '#/components/schemas/SearchBanks'
 *     responses:
 *       200:
 *         description: The list of payments meaning mobile payment
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 $ref: '#/components/schemas/paymentSuccess'
 *       400:
 *         description: error status
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 $ref: '#/components/schemas/paymentError'
 */
router.post("/chapa/bank_lists/search", PaymentController.chapaSearch);
// router.post("/refund", PaymentController.refundMoney);
router.param("id", PaymentController.validateTransaction);
// Expose User Router
module.exports = router;
