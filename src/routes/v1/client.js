const express = require("express");
const ClientController = require("../../controllers/client");
const accessControl = require("../../controllers/auth").accessControl;
const firebaseAuth = require("../../lib/firebase-middleware");
const router = express.Router();
/**
 * @swagger
 * components:
 *   schemas:
 *     Client:
 *       type: object
 *       required:
 *          - uuid
 *       properties:
 *        uuid:
 *          type: string
 *          description: the firebase uniqueid that is created
 *          example: rtiuewtyuiwetg50429845
 *        full_name:
 *          type: string
 *          example: Zeleke Kebede
 *        sex:
 *          type: string
 *          example: female
 *        email:
 *          type: string
 *          example: example@domain.com
 *        phone:
 *          type: number
 *          example: +251713231p42134
 *        is_email_verified:
 *          type: boolean
 *          description: if the user used email authentication to login this object must be true
 *        account_created_with_email:
 *          type: boolean
 *          description: if the user used email authentication to login
 *        city:
 *          type: string
 *          example: Addis Ababa
 *        country:
 *          type: string
 *          example: Ethiopia
 *     CreateClient:
 *       type: object
 *       required:
 *        - full_name
 *        - uuid
 *       properties:
 *        full_name:
 *          type: string
 *          example: Zeleke Kebede
 *        uuid:
 *          type: string
 *          example: 43858923454235234
 *        picrure:
 *          type: string
 *          description: get image from an external url or upload it on your server and fetch from it [recommended]
 *          example: uploads/default_picture.png
 *        phone:
 *          type: number
 *          example: +25194324854545
 *        email:
 *          type: string
 *          example: example@domain.com
 *        sex:
 *          type: string
 *          example: male
 *          description: male or femail nothing else...
 *        city:
 *          type: string
 *          example: Addis Ababa
 *        country:
 *          type: string
 *          example: Ethiopia
 *     saveLocation:
 *       type: object
 *       required:
 *        - location
 *        - user
 *       properties:
 *        location:
 *          type: object
 *          properties:
 *            type:
 *              type: string
 *              example: Point
 *            coordinates:
 *              type: number
 *              example:
 *                 - 8.98112892180133
 *                 - 38.76020386634213
 *        user:
 *          tyoe: objectId
 *          example:   438589a3454235234
 *        created_at:
 *          type: date
 *          example: 2025-02-12
 *     ClientError:
 *       example:
 *         msg: Error
 *         status: 400
 *     ClientSuccess:
 *       example:
 *         msg: successful
 *         status: 200
 */
/**
 * @swagger
 * tags:
 *   name: Client
 *   description: The Client managing API [v1]
 */
/**
 * @swagger
 * /client/admin/show:
 *   get:
 *     summary: View all clients registered in the system [admin authentication required]
 *     tags: [Client]
 *     responses:
 *       200:
 *         description: The list of Clients meaning mobile Client
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 $ref: '#/components/schemas/Client'
 */
router.get(
  "/admin/show",
  accessControl(["super_admin", "sales"]),
  ClientController.fetch
);
/**
 * @swagger
 * /client/profile:
 *   get:
 *     summary: view own profile firebase auth required
 *     tags: [Client]
 *     responses:
 *       200:
 *         description: The list of Clients meaning mobile Client
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 $ref: '#/components/schemas/Client'
 */
router.get("/profile", firebaseAuth, ClientController.viewProfile);
/**
 * @swagger
 * /client/booking_history:
 *   get:
 *     summary: view own profile firebase auth required
 *     tags: [Client]
 *     responses:
 *       200:
 *         description: The list of Clients meaning mobile Client
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 $ref: '#/components/schemas/Client'
 */
router.get("/booking_history", firebaseAuth, ClientController.bookingHistory);
/**
 * @swagger
 * /client/verify/?email={emailid}:
 *   get:
 *     summary: Create or register new account as a client
 *     tags: [Client]
 *     parameters:
 *      - name: emailid
 *        in: path
 *        required: true
 *        type: string
 *        description: enter the emailId for verification
 *     responses:
 *       200:
 *         description: The list of Clients meaning mobile Client
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 $ref: '#/components/schemas/CreateClient'
 */
router.get("/verify", ClientController.verifyEmail);
/**
 * @swagger
 * /client/{cid}:
 *   get:
 *     summary: View all clients registered in the system [admin authentication required]
 *     tags: [Client]
 *     parameters:
 *      - name: cid
 *        in: path
 *        required: true
 *        type: string
 *        description: enter the client id to view
 *     responses:
 *       200:
 *         description: The list of Clients meaning mobile Client
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 $ref: '#/components/schemas/Client'
 */
router.get(
  "/:id",
  accessControl(["super_admin", "sales", "owner", "receptionist"]),
  ClientController.fetchOne
);
/**
 * @swagger
 * /client/signIn:
 *   post:
 *     summary: display result what type of a user it is this route is for the firebase authentication
 *     tags: [Client]
 *     operationId: checkUUID
 *     requestBody:
 *        description: check if user exists type in the user UID firebase ID that is
 *        content:
 *          application/json:
 *            schema:
 *              $ref: '#/components/schemas/UserSearchUUID'
 *     responses:
 *       200:
 *         description: on success response
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 $ref: '#/components/schemas/UserSuccess'
 *       400:
 *         description: on error response
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 $ref: '#/components/schemas/UserError'
 */
router.post("/signIn", ClientController.checkClient);
/**
 * @swagger
 * /client/create:
 *   post:
 *     summary: Create or register new account as a client
 *     tags: [Client]
 *     requestBody:
 *        description:  Update City
 *        content:
 *          application/json:
 *            schema:
 *              $ref: '#/components/schemas/Client'
 *     responses:
 *       200:
 *         description: The list of Clients meaning mobile Client
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 $ref: '#/components/schemas/CreateClient'
 */
router.post("/create", ClientController.register);
/**
 * @swagger
 * /client/save_location:
 *   post:
 *     summary: Save GEO Location
 *     tags: [Client]
 *     requestBody:
 *        description:  save Location
 *        content:
 *          application/json:
 *            schema:
 *              $ref: '#/components/schemas/saveLocation'
 *     responses:
 *       200:
 *         description: The list of Clients meaning mobile Client
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 $ref: '#/components/schemas/CreateClient'
 */
router.post("/save_location", firebaseAuth, ClientController.saveLocation);
router.param("id", ClientController.validateClient);
/**
 * @swagger
 * /client/{did}:
 *   put:
 *     summary: update specific Client information [client]
 *     tags: [Client]
 *     security:
 *     -   bearerAuth: []
 *     operationID: update Client
 *     parameters:
 *      - name: did
 *        in: path
 *        required: true
 *        type: string
 *        description: Client ID of mongodb
 *     requestBody:
 *        description:  Update Client
 *        content:
 *          application/json:
 *            schema:
 *              $ref: '#/components/schemas/CreateClient'
 *     responses:
 *       200:
 *         description: Update Client ID and fcm token of the Client that uses the application
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 $ref: '#/components/schemas/clientuccess'
 *       400:
 *         description: Error
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 $ref: '#/components/schemas/clientError'
 */
router.put("/:id", firebaseAuth, ClientController.update);
/**
 * @swagger
 * /client/{did}:
 *   delete:
 *     summary: remove Client action performed by super_admin
 *     tags: [Client]
 *     security:
 *     -   bearerAuth: []
 *     parameters:
 *      - name: did
 *        in: path
 *        required: true
 *        type: string
 *        description: the Client id of the mongodb
 *     responses:
 *       200:
 *         description: remove Client by Client id generated by the mongodb _id
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 $ref: '#/components/schemas/clientuccess'
 *       400:
 *         description: Error
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 $ref: '#/components/schemas/clientError'
 */
router.delete(
  "/:id",
  accessControl(["super_admin"]),
  ClientController.deleteClient
);

// Expose User Router
module.exports = router;
