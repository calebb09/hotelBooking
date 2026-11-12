const express = require("express");
const WalletController = require("../../controllers/wallet");
const accessControl = require("../../controllers/auth").accessControl;
const Authenticated = require("../../lib/firebase-middleware");
const router = express.Router();
/**
 * @swagger
 * components:
 *   schemas:
 *     transaction:
 *        type: object
 *        properties:
 *          data:
 *            type: array
 *            items:
 *              type: object
 *              properties:
 *                user_information:
 *                   type: object
 *                   properties:
 *                     user_type:
 *                       type: string
 *                       example: client
 *                     client:
 *                       type: string
 *                       description: MongoDB ObjectId for client
 *                       example: 67d4198841f74cf09ebe6c22
 *                     wallet_recharge:
 *                       type: object
 *                       properties:
 *                         is_recharge:
 *                            type: boolean
 *                            example: false
 *                     transaction_status:
 *                       type: string
 *                       description: Transaction status (withdraw, recharge, etc.)
 *                       example: withdraw
 *                     amount:
 *                       type: number
 *                       example: 45
 *                     currency_type:
 *                       type: string
 *                       example: ETB
 *                     uniqueId:
 *                       type: string
 *                       example: transfering from gojobooking
 *                     action_type:
 *                       type: string
 *                       example: deducted
 *                     created_at:
 *                       type: string
 *                       format: date-time
 *                       example: 2025-04-14T07:20:28.071Z
 *                     updated_at:
 *                       type: string
 *                       format: date-time
 *                       example: 2025-04-17T06:24:42.428Z
 *          limit:
 *            type: number
 *            description: set the the limit of the total display per page
 *            example: 20
 *          skip:
 *            type: number
 *            descriotion: skip or page is the page number
 *            example: 1
 *          wallet:
 *            type: number
 *            descriotion: this object property is deprecated
 *            deprecated: true
 *            example: 867
 *          balance:
 *            type: object
 *            properties:
 *               USD:
 *                type: number
 *                description: this is the total $ currency
 *                example: 0
 *               ETB:
 *                type: number
 *                description: this is Ethiopian currency
 *                example: 45
 *          total:
 *            type: number
 *            description: total number of records
 *            example: 1
 *     paymentError:
 *       example:
 *         msg: Error
 *         status: 400
 *     paymentSuccess:
 *       example:
 *         msg: successful
 *         status: 200
 */
/**
 * @swagger
 * tags:
 *   name: Wallet
 *   description: The Wallet managing API [v2]
 */
/**
 * @swagger
 * /wallet/user/view/{currency}:
 *   get:
 *     summary: lists out the transactions for the user meaning the customer **there are changes**
 *     tags: [Wallet]
 *     security:
 *      -   bearerAuth: []
 *     parameters:
 *      - name: currency
 *        in: path
 *        required: true
 *        type: string
 *        description: select the type of currency to view transaction history
 *        default: USD
 *        schema:
 *         type: string
 *         enum: [USD, ETB]
 *     responses:
 *       200:
 *         description: The list of payments meaning mobile payment
 *         content:
 *           application/json:
 *             schema:
 *                 $ref: '#/components/schemas/transaction'
 *       400:
 *         description: error status
 *         content:
 *           application/json:
 *             schema:
 *                 $ref: '#/components/schemas/paymentError'
 */
router.get("/user/view/:currency", Authenticated, WalletController.showWallets);
/**
 * @swagger
 * /wallet/client/view/{currency}:
 *   get:
 *     summary: lists out the transactions for the hotel
 *     tags: [Wallet]
 *     security:
 *     -   bearerAuth: []
 *     parameters:
 *      - name: currency
 *        in: path
 *        required: true
 *        type: string
 *        description: select the type of currency to view transaction history
 *        default: USD
 *        schema:
 *         type: string
 *         enum: [USD, ETB]
 *     responses:
 *       200:
 *         description: The list of payments meaning mobile payment
 *         content:
 *           application/json:
 *             schema:
 *                 $ref: '#/components/schemas/transaction'
 *       400:
 *         description: error status
 *         content:
 *           application/json:
 *             schema:
 *                 $ref: '#/components/schemas/paymentError'
 */
router.get(
  "/client/view/:currency",
  accessControl(["owner", "receptionist"]),
  WalletController.viewWallet
);
/**
 * @swagger
 * /wallet/all_users?role={role}:
 *   get:
 *     summary: Returns all users
 *     tags: [Wallet]
 *     security:
 *     -   bearerAuth: []
 *     parameters:
 *      - name: role
 *        in: query
 *        required: true
 *        type: string
 *        description: give a number to a role
 *        schema:
 *          type: number
 *          default: 1
 *          enum:
 *            - 1
 *            - 2
 *     responses:
 *       200:
 *         description: The list of payments meaning mobile payment
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 $ref: '#/components/schemas/transaction'
 *       400:
 *         description: error status
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 $ref: '#/components/schemas/paymentError'
 */
router.get(
  "/all_users",
  accessControl(["super_admin"]),
  WalletController.allBalance
);
/**
 * @swagger
 * /wallet/show_history/{currency}?userId={userId}&userType={userType}:
 *   get:
 *     summary: return lists of transaction for that specific user
 *     tags: [Wallet]
 *     security:
 *     -   bearerAuth: []
 *     parameters:
 *      - name: currency
 *        in: query
 *        required: true
 *        type: string
 *        description: user type pass user for client and client for hotel
 *        schema:
 *          type: string
 *          default: user
 *          enum:
 *            - USD
 *            - ETB
 *      - name: userId
 *        in: query
 *        required: true
 *        type: string
 *        description: user mongodb id either client's or hotel's
 *      - name: userType
 *        in: query
 *        required: true
 *        type: string
 *        description: user type pass user for client and client for hotel
 *        schema:
 *          type: string
 *          default: user
 *          enum:
 *            - user
 *            - client
 *     responses:
 *       200:
 *         description: The list of payments meaning mobile payment
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 $ref: '#/components/schemas/transaction'
 *       400:
 *         description: error status
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 $ref: '#/components/schemas/paymentError'
 */
router.get(
  "/show_history/:currency",
  accessControl(["super_admin"]),
  WalletController.showHistory
);
/**
 * @swagger
 * /wallet/user/{id}:
 *   get:
 *     summary: Returns the speicific transation for the user
 *     tags: [Wallet]
 *     security:
 *     -   bearerAuth: []
 *     parameters:
 *      - name: id
 *        in: path
 *        required: true
 *        type: string
 *        description: walletID
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
router.get("/user/:id", Authenticated, WalletController.fetchOne);
// router.post(
//   "/create_bank_info",
//   accessControl(["owner", "receptionist"]),
//   WalletController.createBank
// );
router.param("id", WalletController.validateWallet);
// Expose User Router
module.exports = router;
