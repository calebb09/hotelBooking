const express = require("express");
const RoomController = require("../../controllers/room");
const accessControl = require("../../controllers/auth").accessControl;
const Authenticated = require("../../lib/firebase-middleware");
const router = express.Router();
/**
 * @swagger
 * components:
 *   schemas:
 *     room:
 *       type: object
 *       required:
 *         - subRoomType
 *         - room_number
 *         - status
 *       properties:
 *         subRoomType:
 *           type: objectId
 *           description: subRoomType id
 *           example: 039231493249132490123094
 *         room_number:
 *           type: string
 *           description: the name of the room
 *           example: 301
 *         is_hidden:
 *           type: boolean
 *           example: true
 *         booking_calendar:
 *           type: array
 *           example:
 *              - mongodbId
 *              - mongodbId
 *         status:
 *           type: string
 *           description: what is the status of the room
 *           example: available
 *         created_at:
 *           type: date
 *           description: The date applied
 *         updated_at:
 *           type: date
 *           description: the date updated
 *     createRooms:
 *       type: object
 *       required:
 *         - subRoomType
 *         - room_number
 *       properties:
 *        subRoomType:
 *          type: objectId
 *          example: 302842495243523452345
 *        room_number:
 *          type: string
 *          example: A101
 *     uploadPicture:
 *       type: object
 *       properties:
 *        picture:
 *          type: string
 *          description: upload as many picture as you want
 *          example:
 *            - /upload/8495524532514.png
 *            - /upload/8495524532514.png
 *            - /upload/8495524532514.png
 *     searchRoomByCatgory:
 *       type: object
 *       properties:
 *         roomType:
 *           type: objectId
 *           description: put the id of the roomtype
 *           example: 66bc63a527e53073ad060421
 *     roomError:
 *       example:
 *         msg: Error
 *         status: 400
 *     roomSuccess:
 *       example:
 *         msg: successful
 *         status: 200
 */
/**
 * @swagger
 * tags:
 *   name: Room
 *   description: The Room managing API [v1]
 */
/**
 * @swagger
 * /room?page=1:
 *   get:
 *     summary: Returns the list of all Room
 *     tags: [Room]
 *     security:
 *     -   bearerAuth: []
 *     responses:
 *       200:
 *         description: The list of Rooms meaning mobile Room
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 $ref: '#/components/schemas/room'
 */
router.get("/", RoomController.fetchAll);
/**
 * @swagger
 * /room/myRooms?page=1:
 *   get:
 *     summary: Returns the list of all Room
 *     tags: [Room]
 *     security:
 *     -   bearerAuth: []
 *     responses:
 *       200:
 *         description: The list of Rooms meaning mobile Room
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 $ref: '#/components/schemas/room'
 */
router.get(
  "/myRooms",
  accessControl(["owner", "receptionist"]),
  RoomController.viewAll
);
/**
 * @swagger
 * /room/{did}:
 *   get:
 *     summary: Returns the specific Roo
 *     tags: [Room]
 *     security:
 *     -   bearerAuth: []
 *     parameters:
 *      - name: did
 *        in: path
 *        required: true
 *        type: string
 *        description: Room ID the mongodb ID created by default
 *     responses:
 *       200:
 *         description: The specific Room detail
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 $ref: '#/components/schemas/room'
 */
router.get("/:id", RoomController.fetchOne);
/**
 * @swagger
 * /Room:
 *   post:
 *     summary: Create Room detail this is used by the owner and receptionist uses this route
 *     tags: [Room]
 *     operationId: CreateRoom
 *     security:
 *     -   bearerAuth: []
 *     requestBody:
 *        description:  Create Room
 *        content:
 *          application/json:
 *            schema:
 *              $ref: '#/components/schemas/createRooms'
 *     responses:
 *       200:
 *         description: Create Room ID and fcm token of the Room that uses the application
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 $ref: '#/components/schemas/roomSuccess'
 *       400:
 *         description: Error
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 $ref: '#/components/schemas/roomError'
 */
router.post(
  "/",
  accessControl(["super_admin", "owner", "receptionist"]),
  RoomController.create
);
/**
 * @swagger
 * /Room/filter_by_category/{accommodationId}:
 *   post:
 *     summary: search room based on roomType
 *     tags: [Room]
 *     operationId: filter out room
 *     security:
 *     -   bearerAuth: []
 *     parameters:
 *      - name: accommodationId
 *        in: path
 *        required: true
 *        type: string
 *        description: Hotel ID the mongodb ID of accommodation
 *     requestBody:
 *        description:  Create Room
 *        content:
 *          application/json:
 *            schema:
 *              $ref: '#/components/schemas/searchRoomByCatgory'
 *     responses:
 *       200:
 *         description: Create Room ID and fcm token of the Room that uses the application
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 $ref: '#/components/schemas/createRooms'
 *       400:
 *         description: Error
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 $ref: '#/components/schemas/roomError'
 */
router.post(
  "/filter_by_category/:accommodationId",
  RoomController.filterbyCategory
);
/**
 * @swagger
 * /Room/uploadCSV:
 *   post:
 *     summary: upload csv format
 *     tags: [Room]
 *     operationId: upload CSV format to create Multiple Rooms
 *     security:
 *     -   bearerAuth: []
 *     requestBody:
 *        description:  Create Room
 *        content:
 *          application/json:
 *            schema:
 *              $ref: '#/components/schemas/createRooms'
 *     responses:
 *       200:
 *         description: Create Room ID and fcm token of the Room that uses the application
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 $ref: '#/components/schemas/roomSuccess'
 *       400:
 *         description: Error
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 $ref: '#/components/schemas/roomError'
 */
// router.post(
//   "/uploadCSV",
//   accessControl(["super_admin", "owner", "receptionist"]),
//   RoomController.uploadCSV
// );
router.param("id", RoomController.validateRoom);
/**
 * @swagger
 * /room/{did}/upload_picture:
 *   put:
 *     summary: Update Room detail this is used by the owner and receptionist
 *     tags: [Room]
 *     security:
 *     -   bearerAuth: []
 *     operationID: update Room
 *     parameters:
 *      - name: did
 *        in: path
 *        required: true
 *        type: string
 *        description: Room ID of mongodb
 *     requestBody:
 *        description:  Update Room
 *        content:
 *          application/json:
 *            schema:
 *              $ref: '#/components/schemas/uploadPicture'
 *     responses:
 *       200:
 *         description: Update Room ID and fcm token of the Room that uses the application
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 $ref: '#/components/schemas/roomSuccess'
 *       400:
 *         description: Error
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 $ref: '#/components/schemas/roomError'
 */
router.put(
  "/:id/upload_picture",
  accessControl(["owner", "super_admin", "receptionist"]),
  RoomController.upload_picture
);
/**
 * @swagger
 * /room/{did}:
 *   put:
 *     summary: Update Room detail this is used by the owner and receptionist
 *     tags: [Room]
 *     security:
 *     -   bearerAuth: []
 *     operationID: update Room
 *     parameters:
 *      - name: did
 *        in: path
 *        required: true
 *        type: string
 *        description: Room ID of mongodb
 *     requestBody:
 *        description:  Update Room
 *        content:
 *          application/json:
 *            schema:
 *              $ref: '#/components/schemas/room'
 *     responses:
 *       200:
 *         description: Update Room ID and fcm token of the Room that uses the application
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 $ref: '#/components/schemas/roomSuccess'
 *       400:
 *         description: Error
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 $ref: '#/components/schemas/roomError'
 */
router.put(
  "/:id",
  accessControl(["owner", "super_admin", "receptionist"]),
  RoomController.update
);
/**
 * @swagger
 * /room/{did}/remove_pictures?picture={picture}:
 *   delete:
 *     summary: remove specific rooms uploaded picture
 *     tags: [Room]
 *     security:
 *     -   bearerAuth: []
 *     parameters:
 *      - name: did
 *        in: query
 *        required: true
 *        type: string
 *        description: the Room id of the mongodb
 *      - name: picture
 *        in: query
 *        required: true
 *        type: string
 *        description: the room picture name example 38252479524o352435.png
 *     responses:
 *       200:
 *         description: remove Room by Room id generated by the mongodb _id
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 $ref: '#/components/schemas/roomSuccess'
 *       400:
 *         description: Error
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 $ref: '#/components/schemas/roomError'
 */
router.delete(
  "/:id/remove_pictures",
  accessControl(["receptionist", "owner"]),
  RoomController.deletePicture
);
/**
 * @swagger
 * /room/{did}:
 *   delete:
 *     summary: remove Room is performed by the owner and receptionist
 *     tags: [Room]
 *     security:
 *     -   bearerAuth: []
 *     parameters:
 *      - name: did
 *        in: path
 *        required: true
 *        type: string
 *        description: the Room id of the mongodb
 *     responses:
 *       200:
 *         description: remove Room by Room id generated by the mongodb _id
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 $ref: '#/components/schemas/roomSuccess'
 *       400:
 *         description: Error
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 $ref: '#/components/schemas/roomError'
 */
router.delete(
  "/:id",
  accessControl(["receptionist", "super_admin", "owner"]),
  RoomController.deleteRoom
);

// Expose User Router
module.exports = router;
