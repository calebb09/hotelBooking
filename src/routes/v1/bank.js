const express = require("express");
const BankController = require("../../controllers/bank");
const accessControl = require("../../controllers/auth").accessControl;
const isAuthenticated = require("../../lib/firebase-middleware");
const router = express.Router();
/**
 * @swagger
 * components:
 *   schemas:
 *     Bank:
 *       type: object
 *       required:
 *         - country
 *         - phone
 *         - wiseAccount_id
 *         - bank_name
 *         - bank_holder_name
 *         - bank_acct
 *         - bank_swift_code
 *         - bank_routing_number
 *         - has_full_ownership
 *       properties:
 *         _id:
 *           type: string
 *           description: The auto-generated id of the Bank
 *         country:
 *           type: string
 *           description: name of the country
 *           example: Ethiopia
 *         phone:
 *           type: string
 *           description: user phone number most probably hotel headquarters phone
 *           example: +25111294854934
 *         wiseAccount_id:
 *           type: string
 *           description: the wise id when attached on the receipient lists
 *           example: 2095245234523452
 *         bank_name:
 *           type: string
 *           description: the name of the bank
 *           example: CBE
 *         bank_holder_name:
 *           type: string
 *           description: the account holder name
 *           example: Abebe Kebede Belete
 *         bank_acct:
 *           type: Number
 *           description: the numeric number of the account number
 *           example: 100007584394539
 *         bank_swift_code:
 *           type: String
 *           description: if the bank is outside of the US use this
 *           example: CBETEAA
 *         bank_routing_number:
 *           type: Number
 *           description: if the bank happens to be within the United states
 *           example: 3420293423
 *         updated_at:
 *           type: date
 *           description: the date updated
 *     WiseCreateRecepients:
 *       example:
 *          accountHolderName: "Kron Bragga Saga"
 *          bank_name: "Comemrcial Bank of Ethiopia"
 *          country: "ET"
 *          details:
 *             address:
 *               country: "ET"
 *               countryCode: "ET"
 *               firstLine: "Bole Subcity"
 *               postCode: 12223
 *               city: "Addis Ababa"
 *               state: null
 *             email: "bankholdersname@gmail.com"
 *             legalType: "PRIVATE"
 *             accountHolderName: null
 *             accountNumber: 10000987543042
 *             BIC: "CBETETAA"
 *             bic: "CBETETAA"
 *     WithdrawMoney:
 *       type: object
 *       properties:
 *        currency:
 *          type: string
 *          description: the currency value either USD or ETB
 *          example: USD
 *        bankId:
 *          type: objectId
 *          description: provide the mongodbId of the saved bank account
 *          example: 6b1f945284935245234525
 *        sourceAmount:
 *          type: number
 *          description: provide the amount that is to be withdrawn or fund to bank accoun
 *          example: 45
 *     BankError:
 *       example:
 *         msg: Error
 *         status: 400
 *     BankSuccess:
 *       example:
 *         msg: successful
 *         status: 200
 */
/**
 * @swagger
 * tags:
 *   name: Bank
 *   description: The Bank managing API [v1]
 */
/**
 * @swagger
 * /banks:
 *   get:
 *     summary: Returns the list of all Bank super_admin, admin, only access this route
 *     tags: [Bank]
 *     security:
 *     -   bearerAuth: []
 *     responses:
 *       200:
 *         description: The list of Banks meaning mobile Bank
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 $ref: '#/components/schemas/Bank'
 */
router.get("/", accessControl(["super_admin"]), BankController.fetchAll);
/**
 * @swagger
 * /banks/myBank:
 *   get:
 *     summary: Returns the list of all Bank owner, receptionist access to this route
 *     tags: [Bank]
 *     security:
 *     -   bearerAuth: []
 *     responses:
 *       200:
 *         description: The list of Banks meaning mobile Bank
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 $ref: '#/components/schemas/Bank'
 */
router.get(
  "/myBank",
  accessControl(["owner", "receptionist"]),
  BankController.myBank
);
/**
 * @swagger
 * /banks/myAccount:
 *   get:
 *     summary: Returns the list of all Bank owner, receptionist access to this route
 *     tags: [Bank]
 *     security:
 *     -   bearerAuth: []
 *     responses:
 *       200:
 *         description: The list of Banks meaning mobile Bank
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 $ref: '#/components/schemas/Bank'
 */
router.get("/myAccount", isAuthenticated, BankController.myBanks);
/**
 * @swagger
 * /banks/{did}:
 *   get:
 *     summary: returns the specific bank detail
 *     tags: [Bank]
 *     security:
 *     -   bearerAuth: []
 *     parameters:
 *      - name: did
 *        in: path
 *        required: true
 *        type: string
 *        description: Bank ID the mongodb ID created by default
 *     responses:
 *       200:
 *         description: The specific Bank detail
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 $ref: '#/components/schemas/Bank'
 */
router.get("/:id", BankController.fetchOne);
/**
 * @swagger
 * /banks:
 *   post:
 *     summary: Create Bank detail this is used by the 'owner' to create bank for its hotel aka accommodation
 *     tags: [Bank]
 *     operationId: CreateBank
 *     security:
 *     -   bearerAuth: []
 *     requestBody:
 *        description:  Create Bank
 *        content:
 *          application/json:
 *            schema:
 *              $ref: '#/components/schemas/WiseCreateRecepients'
 *     responses:
 *       200:
 *         description: Create Bank ID and fcm token of the Bank that uses the application
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 $ref: '#/components/schemas/BankSuccess'
 *       400:
 *         description: Error
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 $ref: '#/components/schemas/BankError'
 */
router.post("/", accessControl(["owner"]), BankController.create);
/**
 * @swagger
 * /banks/create:
 *   post:
 *     summary: Create Bank detail this is used by the 'owner' to create bank for its hotel aka accommodation
 *     tags: [Bank]
 *     operationId: CreateBank
 *     security:
 *     -   bearerAuth: []
 *     requestBody:
 *        description:  Create Bank
 *        content:
 *          application/json:
 *            schema:
 *              $ref: '#/components/schemas/WiseCreateRecepients'
 *     responses:
 *       200:
 *         description: Create Bank ID and fcm token of the Bank that uses the application
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 $ref: '#/components/schemas/BankSuccess'
 *       400:
 *         description: Error
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 $ref: '#/components/schemas/BankError'
 */
router.post("/create", isAuthenticated, BankController.createBanks);
/**
 * @swagger
 * /banks/withdraw_money:
 *   post:
 *     summary: owner uses this route to perform a money withdraw
 *     tags: [Bank]
 *     operationId: withDraw
 *     security:
 *     -   bearerAuth: []
 *     requestBody:
 *        description:  Create Bank
 *        content:
 *          application/json:
 *            schema:
 *              $ref: '#/components/schemas/WithdrawMoney'
 *     responses:
 *       200:
 *         description: Create Bank ID and fcm token of the Bank that uses the application
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 $ref: '#/components/schemas/BankSuccess'
 *       400:
 *         description: Error
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 $ref: '#/components/schemas/BankError'
 */
router.post(
  "/withdraw_money",
  accessControl(["owner"]),
  BankController.withdrawMoney
);
/**
 * @swagger
 * /banks/users/withdraw_money:
 *   post:
 *     summary: owner uses this route to perform a money withdraw
 *     tags: [Bank]
 *     operationId: withDraw
 *     security:
 *     -   bearerAuth: []
 *     requestBody:
 *        description:  Create Bank
 *        content:
 *          application/json:
 *            schema:
 *              $ref: '#/components/schemas/WithdrawMoney'
 *     responses:
 *       200:
 *         description: Create Bank ID and fcm token of the Bank that uses the application
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 $ref: '#/components/schemas/BankSuccess'
 *       400:
 *         description: Error
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 $ref: '#/components/schemas/BankError'
 */
router.post(
  "/users/withdraw_money",
  isAuthenticated,
  BankController.withDrawNow
);
router.param("id", BankController.validateBank);
/**
 * @swagger
 * /banks/{did}:
 *   put:
 *     summary: update specific bank information [owner]
 *     tags: [Bank]
 *     security:
 *     -   bearerAuth: []
 *     operationID: update Bank
 *     parameters:
 *      - name: did
 *        in: path
 *        required: true
 *        type: string
 *        description: Bank ID of mongodb
 *     requestBody:
 *        description:  Update Bank
 *        content:
 *          application/json:
 *            schema:
 *              $ref: '#/components/schemas/CreateBank'
 *     responses:
 *       200:
 *         description: Update Bank ID and fcm token of the Bank that uses the application
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 $ref: '#/components/schemas/BankSuccess'
 *       400:
 *         description: Error
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 $ref: '#/components/schemas/BankError'
 */
router.put("/:id", accessControl(["owner"]), BankController.update);
/**
 * @swagger
 * /banks/user/{did}:
 *   delete:
 *     summary: remove Bank action performed by [owner]
 *     tags: [Bank]
 *     security:
 *     -   bearerAuth: []
 *     parameters:
 *      - name: did
 *        in: path
 *        required: true
 *        type: string
 *        description: the Bank id of the mongodb
 *     responses:
 *       200:
 *         description: remove Bank by Bank id generated by the mongodb _id
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 $ref: '#/components/schemas/BankSuccess'
 *       400:
 *         description: Error
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 $ref: '#/components/schemas/BankError'
 */
router.delete("/user/:id", isAuthenticated, BankController.deleteBanks);
/**
 * @swagger
 * /banks/{did}:
 *   delete:
 *     summary: remove Bank action performed by [owner]
 *     tags: [Bank]
 *     security:
 *     -   bearerAuth: []
 *     parameters:
 *      - name: did
 *        in: path
 *        required: true
 *        type: string
 *        description: the Bank id of the mongodb
 *     responses:
 *       200:
 *         description: remove Bank by Bank id generated by the mongodb _id
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 $ref: '#/components/schemas/BankSuccess'
 *       400:
 *         description: Error
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 $ref: '#/components/schemas/BankError'
 */
router.delete("/:id", accessControl(["owner"]), BankController.deleteBank);

// Expose User Router
module.exports = router;
