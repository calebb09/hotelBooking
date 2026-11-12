const express = require("express");
const NotiticationRequestController = require("../../controllers/notification");
const accessControl = require("../../controllers/auth").accessControl;
const checkIfAuthenticated = require("../../lib/firebase-middleware");
const router = express.Router();
/**
 * @swagger
 * components:
 *   schemas:
 *    Notification:
 *       type: object
 *       required:
 *         - title
 *         - message
 *       properties:
 *         _id:
 *           type: string
 *           description: The auto-generated id of theNotification
 *         user_information:
 *           type:  object
 *           properties:
 *            user_type:
 *              type: array
 *              example:
 *                - client
 *                - user
 *            user:
 *              type: ObjectId
 *              description: userId
 *              example: 483580395243535342
 *            client:
 *              type: objectId
 *              description: the hotelId
 *              example: 8232958352345235
 *         title:
 *           type:  string
 *           description: the profile ID will populatedW
 *         message:
 *           type:  string
 *           description: all rates rated by the employees will be stored here
 *         is_read:
 *           type: boolean
 *           description: list of applicants for this specific Notification
 *         broadcast:
 *           type: boolean
 *           description: the favorite employee list will be stored here it is an array
 *         broadCastType:
 *           type: string
 *           description: The title of theNotification
 *         created_at:
 *           type: date
 *           description: The date applied
 *         updated_at:
 *           type: date
 *           description: the date updated
 *       example:
 *          data:
 *          - _id: 62f612951a140f007ed6142e
 *            user_information:
 *              user_type: client
 *              client: 492305283454325234
 *            title: Application Accepted
 *            message: Caleb Bogale has accepted your application for the Notification UI/UX graphics Designer.
 *            is_read: false
 *            broadcast: false
 *            created_at: '2022-08-12T08:00:27.619Z'
 *            updated_at:
 *          limit: 30
 *          skip: 1
 *          total: 14
 *    NotificationError:
 *       example:
 *         msg: Error
 *         status: 400
 *    NotificationSuccess:
 *       example:
 *         msg: successful
 *         status: 200
 *    FilterNotification:
 *       type: object
 *       required:
 *          - is_read
 *       properties:
 *          is_read:
 *            type: boolean
 *       example:
 *          is_read: true
 *    CountNotification:
 *      properties:
 *        count_notification:
 *          type: number
 *          description: count the notification that are unread
 *          example: 20
 *        count_messages:
 *          type: number
 *          description: count the messages that are unread fetches the counts from the chat conversation
 *          example: 0
 *    CreateNotification:
 *       type: object
 *       required:
 *          - title
 *          - message
 *          - uuid
 *       properties:
 *          title:
 *            type: string
 *          uuid:
 *            type: string
 *          message:
 *            type: string
 *          broadcast:
 *            type: boolean
 *          broadCastType:
 *            type: string
 *       example:
 *          uuid: 467892035234252
 *          title: Congratulations
 *          message: you have successfully created a message
 *          broadcast: true
 *          broadCastType: Employer
 */
/**
 * @swagger
 * tags:
 *   name: Notification
 *   description: The Notification managing API [v1]
 */
/**
 * @swagger
 * /notification/?page=1:
 *   get:
 *     summary: Returns the list of all Notifications
 *     tags: [Notification]
 *     security:
 *     -   bearerAuth: []
 *     responses:
 *       200:
 *         description: The list of Notifications meaning
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 $ref: '#/components/schemas/Notification'
 */
router.get(
  "/",
  accessControl(["admin", "super_admin"]),
  NotiticationRequestController.fetchAll
);
/**
 * @swagger
 * /notification/user/show/?page=1:
 *   get:
 *     summary: Returns the list of all Notifications of the logger Firebase authentication required
 *     tags: [Notification]
 *     security:
 *     -   bearerAuth: []
 *     responses:
 *       200:
 *         description: The list of Notifications meaning
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 $ref: '#/components/schemas/Notification'
 */
router.get(
  "/user/show",
  checkIfAuthenticated,
  NotiticationRequestController.showall
);
/**
 * @swagger
 * /notification/client/show/?page=1:
 *   get:
 *     summary: Returns the list of all Notifications of the logger Firebase authentication required
 *     tags: [Notification]
 *     security:
 *     -   bearerAuth: []
 *     responses:
 *       200:
 *         description: The list of Notifications meaning
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 $ref: '#/components/schemas/Notification'
 */
router.get(
  "/client/show",
  accessControl(["owner", "receptionist"]),
  NotiticationRequestController.viewAll
);
/**
 * @swagger
 * /notification/counts_for_notification_and_messages:
 *   get:
 *     summary: Returns the counts of message and notifications that are unread
 *     tags: [Notification]
 *     security:
 *     -   bearerAuth: []
 *     responses:
 *       200:
 *         description: The list of Notifications meaning
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 $ref: '#/components/schemas/CountNotification'
 */
router.get(
  "/counts_for_notification_and_messages",
  NotiticationRequestController.count_it
);
/**
 * @swagger
 * /notification/admin/{nid}:
 *   get:
 *     summary: returns specific notification for the admin
 *     tags: [Notification]
 *     security:
 *     -   bearerAuth: []
 *     parameters:
 *      - name: nid
 *        in: path
 *        required: true
 *        type: string
 *        description: enter the notification id to view specific detail
 *     responses:
 *       200:
 *         description: The list of Notifications meaning
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 $ref: '#/components/schemas/Notification'
 */
router.get(
  "/admin/:id",
  accessControl(["admin", "super_admin"]),
  NotiticationRequestController.fetchOneAdmin
);
/**
 * @swagger
 * /notification/{nid}:
 *   get:
 *     summary: returns specific notification for the logged in user firebase authentication requied
 *     tags: [Notification]
 *     security:
 *     -   bearerAuth: []
 *     parameters:
 *      - name: nid
 *        in: path
 *        required: true
 *        type: string
 *        description: enter the notification id to view specific detail
 *     responses:
 *       200:
 *         description: The list of Notifications meaning
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 $ref: '#/components/schemas/Notification'
 */
router.get("/:id", NotiticationRequestController.fetchOne);
/**
 * @swagger
 * /notification:
 *   post:
 *     summary: create notification super_admin or admin access this endpoint
 *     tags: [Notification]
 *     security:
 *     -   bearerAuth: []
 *     operationId: CreateNotification
 *     requestBody:
 *        description:  admin authentication for the dashboard
 *        content:
 *          application/json:
 *            schema:
 *              $ref: '#/components/schemas/CreateNotification'
 *     responses:
 *       200:
 *         description: successful request response
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 $ref: '#/components/schemas/NotificationSuccess'
 *       400:
 *         description: Error request response
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 $ref: '#/components/schemas/NotificationError'
 */
router.post(
  "/",
  accessControl(["admin", "super_admin"]),
  NotiticationRequestController.create
);
/**
 * @swagger
 * /notification/mark_all_as_read:
 *   put:
 *     summary: enables the user to mark all notification to true firebase authentication required
 *     tags: [Notification]
 *     security:
 *     -   bearerAuth: []
 *     responses:
 *       200:
 *         description: successful request response
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 $ref: '#/components/schemas/NotificationSuccess'
 *       400:
 *         description: Error request response
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 $ref: '#/components/schemas/NotificationError'
 */
router.put("/mark_all_as_read", NotiticationRequestController.readAll);
/**
 * @swagger
 * /notification/{nid}/mark_as_read:
 *   put:
 *     summary: enables the user to mark specific notification to set to true
 *     tags: [Notification]
 *     security:
 *     -   bearerAuth: []
 *     parameters:
 *      - name: nid
 *        in: path
 *        required: true
 *        type: string
 *        description: notification id required to change the status to 'read'
 *     responses:
 *       200:
 *         description: successful request response
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 $ref: '#/components/schemas/NotificationSuccess'
 *       400:
 *         description: Error request response
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 $ref: '#/components/schemas/NotificationError'
 */
router.put("/:id/mark_as_read", NotiticationRequestController.markRead);
/**
 * @swagger
 * /notification/{nid}/mark_as_unread:
 *   put:
 *     summary: enables the user to mark specific notification to set to false all actors
 *     tags: [Notification]
 *     security:
 *     -   bearerAuth: []
 *     parameters:
 *      - name: nid
 *        in: path
 *        required: true
 *        type: string
 *        description: notification id required to change the status to 'unread'
 *     responses:
 *       200:
 *         description: successful request response
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 $ref: '#/components/schemas/NotificationSuccess'
 *       400:
 *         description: Error request response
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 $ref: '#/components/schemas/NotificationError'
 */
router.put("/:id/mark_as_unread", NotiticationRequestController.markUnread);
/**
 * @swagger
 * /notification/{nid}:
 *   put:
 *     summary: enables the admin to make a change on the notification [super_admin]
 *     tags: [Notification]
 *     security:
 *     -   bearerAuth: []
 *     parameters:
 *      - name: nid
 *        in: path
 *        required: true
 *        type: string
 *        description: notification id required to make an update on the target
 *      - name: title
 *        in: path
 *        required: false
 *        type: string
 *        description: title to change the notification
 *      - name: message
 *        in: path
 *        required: false
 *        type: string
 *        description: message to change the notification
 *     responses:
 *       200:
 *         description: successful request response
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 $ref: '#/components/schemas/NotificationSuccess'
 *       400:
 *         description: Error request response
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 $ref: '#/components/schemas/NotificationError'
 */
router.put(
  "/:id",
  accessControl(["admin", "super_admin"]),
  NotiticationRequestController.update
);
router.param("id", NotiticationRequestController.validateNotifi);
/**
 * @swagger
 * /notification/{nid}:
 *   delete:
 *     summary: removes the notification [super_admin]
 *     tags: [Notification]
 *     security:
 *     -   bearerAuth: []
 *     parameters:
 *      - name: nid
 *        in: path
 *        required: true
 *        type: string
 *        description: notification id to remove the targeted notification
 *     responses:
 *       200:
 *         description: successful request response
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 $ref: '#/components/schemas/NotificationSuccess'
 *       400:
 *         description: Error request response
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 $ref: '#/components/schemas/NotificationError'
 */
router.delete(
  "/:id",
  accessControl(["super_admin"]),
  NotiticationRequestController.deleteNotifi
);

// Expose User Router
module.exports = router;
